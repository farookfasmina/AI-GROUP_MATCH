"""Matching engine (proposal objectives 1 and 2).

Two steps, as a recommender system would do it:

1. Candidate retrieval with K-Nearest Neighbours (scikit-learn NearestNeighbors, cosine
   distance). Every student becomes a weighted vector: subjects, 168 weekly hours of
   availability, study type, collaboration tendency, learning style, communication
   preference and competency. KNN quickly finds the students who are most similar.

2. Compatibility re-ranking. Similar is not always best: the proposal asks for groups that
   are *balanced* (strong and weaker students together) and socially compatible (two
   "driven leaders" clash). So every KNN candidate gets a compatibility score from seven
   factors, combined with weights that are re-learned from students' feedback with
   logistic regression (`optimize_matching_weights`).

Fairness: no gender, ethnicity, religion or disability data is collected or used.
"""
from __future__ import annotations

import statistics
from datetime import datetime
from typing import Any, Dict, List, Optional

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
from sklearn.neighbors import NearestNeighbors
from sqlalchemy.orm import Session, selectinload

from models.all_models import GroupFeedback, MatchFeedback, Membership, ModelWeights, Preference, StudyGroup, User

FACTORS = [
    "subject_overlap", "availability_overlap", "study_type_match", "collab_tendency_match",
    "learning_style_match", "comm_pref_match", "competency_match",
]
FACTOR_LABELS = {
    "subject_overlap": "Shared subjects",
    "availability_overlap": "Shared free time",
    "study_type_match": "Study type (group / buddy)",
    "collab_tendency_match": "Collaboration style fit",
    "learning_style_match": "Learning style",
    "comm_pref_match": "Communication preference",
    "competency_match": "Competency balance",
}
# Starting weights. Competency and collaboration style were raised from the first version
# (0.02 / 0.10) because the proposal names them as key factors; feedback re-learns them.
DEFAULT_WEIGHTS = {
    "subject_overlap": 0.25,
    "availability_overlap": 0.25,
    "study_type_match": 0.10,
    "collab_tendency_match": 0.12,
    "learning_style_match": 0.08,
    "comm_pref_match": 0.08,
    "competency_match": 0.12,
}

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
DAY_INDEX = {d.lower(): i for i, d in enumerate(DAYS)}
LEVELS = {"beginner": 1, "intermediate": 2, "advanced": 3, "expert": 4}
LEARNING_STYLES = ["visual", "auditory", "reading/writing", "kinesthetic"]
COLLAB_TENDENCIES = ["collaborative peer", "driven leader", "focused learner"]
COMM_PREFS = ["text", "voice", "video", "in-person"]
STUDY_TYPES = ["group", "buddy", "either"]

_COLLAB = {
    ("driven leader", "driven leader"): 0.30, ("driven leader", "collaborative peer"): 1.00,
    ("driven leader", "focused learner"): 0.90, ("collaborative peer", "collaborative peer"): 0.85,
    ("collaborative peer", "focused learner"): 0.85, ("focused learner", "focused learner"): 0.60,
}


def _clean(value: Optional[str]) -> str:
    return (value or "").strip().lower()


def _pair(table: dict, a: str, b: str, default: float = 0.6) -> float:
    return table.get((a, b), table.get((b, a), default))


# --- per-student helpers -------------------------------------------------------------

def subjects_of(pref: Optional[Preference]) -> set[str]:
    if not pref or not pref.subjects_of_interest:
        return set()
    return {s.strip().lower() for s in pref.subjects_of_interest.split(",") if s.strip()}


def level_for(pref: Optional[Preference], subject: Optional[str] = None) -> int:
    """Level in one subject if the student rated it, otherwise their overall level (1-4)."""
    if not pref:
        return 0
    if subject and pref.subject_levels:
        for name, lvl in pref.subject_levels.items():
            if name.strip().lower() == subject.strip().lower():
                return LEVELS.get(_clean(lvl), 0)
    return LEVELS.get(_clean(pref.competency_level), 0)


def hour_set(user: User) -> set[int]:
    """Weekly availability as a set of hour indexes 0..167 (day * 24 + hour)."""
    hours = set()
    for a in user.availabilities:
        d = DAY_INDEX.get(_clean(a.day_of_week))
        if d is None:
            continue
        end = a.end_time.hour + (1 if a.end_time.minute else 0)
        if end == 0:
            end = 24
        for h in range(a.start_time.hour, min(end, 24)):
            hours.add(d * 24 + h)
    return hours


# --- factor scores (each 0..1) ----------------------------------------------------------

def calculate_subject_overlap(prefs1: Preference, prefs2: Preference) -> float:
    """Jaccard similarity of the two students' subjects."""
    s1, s2 = subjects_of(prefs1), subjects_of(prefs2)
    if not s1 or not s2:
        return 0.0
    return len(s1 & s2) / len(s1 | s2)


def calculate_availability_overlap(hours1: set[int], hours2: set[int]) -> float:
    """Shared free hours per week; 5 shared hours (300 minutes) or more scores 1.0."""
    return min(len(hours1 & hours2) / 5.0, 1.0)


def calculate_competency_score(level1: int, level2: int) -> float:
    """Complementary competency: one level apart is ideal for peer teaching (proposal:
    balanced knowledge distribution). Same level is fine, a very large gap is not."""
    if not level1 or not level2:
        return 0.5
    return {0: 0.6, 1: 1.0, 2: 0.6, 3: 0.2}[min(abs(level1 - level2), 3)]


def study_type_score(t1: str, t2: str) -> float:
    t1, t2 = _clean(t1) or "group", _clean(t2) or "group"
    if t1 == t2:
        return 1.0
    if "either" in (t1, t2):
        return 0.8
    return 0.2


def comm_score(c1: str, c2: str) -> float:
    c1, c2 = _clean(c1), _clean(c2)
    if not c1 or not c2:
        return 0.5
    if c1 == c2:
        return 1.0
    if "in-person" in (c1, c2):
        return 0.3
    return 0.6  # text / voice / video can work together online


def pair_features(u1: User, u2: User, subject: Optional[str] = None,
                  hours1: Optional[set] = None, hours2: Optional[set] = None) -> Dict[str, float]:
    p1, p2 = u1.preference, u2.preference
    hours1 = hour_set(u1) if hours1 is None else hours1
    hours2 = hour_set(u2) if hours2 is None else hours2
    return {
        "subject_overlap": 1.0 if subject else calculate_subject_overlap(p1, p2),
        "availability_overlap": calculate_availability_overlap(hours1, hours2),
        "study_type_match": study_type_score(p1.preferred_study_type, p2.preferred_study_type),
        "collab_tendency_match": _pair(_COLLAB, _clean(p1.collaboration_tendency) or "collaborative peer",
                                       _clean(p2.collaboration_tendency) or "collaborative peer"),
        "learning_style_match": 1.0 if _clean(p1.learning_style) and _clean(p1.learning_style) == _clean(p2.learning_style) else 0.5,
        "comm_pref_match": comm_score(p1.communication_preference, p2.communication_preference),
        "competency_match": calculate_competency_score(level_for(p1, subject), level_for(p2, subject)),
    }


def compatibility(features: Dict[str, float], weights: Dict[str, float]) -> float:
    total = sum(weights.values()) or 1.0
    score = sum(weights[k] * features[k] for k in FACTORS) / total
    if features["availability_overlap"] == 0:
        score *= 0.6  # students who can never meet are a poor match whatever else fits
    return max(0.0, min(1.0, score))


def generate_explanation(features: Dict[str, float], shared_subjects: List[str], other: Preference) -> str:
    parts = []
    if shared_subjects:
        parts.append(f"You both study {', '.join(shared_subjects[:3])}.")
    if features["availability_overlap"] >= 0.6:
        parts.append("You have several free hours in common.")
    elif features["availability_overlap"] > 0:
        parts.append("You share some free time.")
    else:
        parts.append("No shared free time yet - add more free slots to meet.")
    if features["competency_match"] >= 1.0:
        parts.append("Your levels are one step apart, so you can learn from each other.")
    elif features["competency_match"] >= 0.6:
        parts.append("Similar or nearby competency levels.")
    if features["collab_tendency_match"] >= 0.9:
        parts.append(f"Your collaboration styles fit ({other.collaboration_tendency}).")
    if features["learning_style_match"] == 1.0 and other.learning_style:
        parts.append(f"You both prefer {other.learning_style} learning.")
    if features["comm_pref_match"] == 1.0 and other.communication_preference:
        parts.append(f"You both like to communicate by {other.communication_preference.lower()}.")
    return " ".join(parts)


# --- weights ------------------------------------------------------------------------------

def load_weights(db: Optional[Session] = None) -> Dict[str, float]:
    """Latest learned weights from the database, or the starting weights."""
    own = db is None
    if own:
        from core.database import SessionLocal
        db = SessionLocal()
    try:
        row = db.query(ModelWeights).order_by(ModelWeights.id.desc()).first()
        if row and row.weights:
            return {k: float(row.weights.get(k, DEFAULT_WEIGHTS[k])) for k in FACTORS}
        return dict(DEFAULT_WEIGHTS)
    finally:
        if own:
            db.close()


def training_samples(db: Session) -> tuple[list[list[float]], list[int]]:
    """Each rated pair of students -> 7 factor scores and a label (1 = rated 4 or 5 on average)."""
    X, y = [], []
    # Load every student with their preferences and free time in two queries, instead of
    # one query per student (slow over a remote database such as Neon).
    db.query(User).options(selectinload(User.preference), selectinload(User.availabilities)).all()
    for f in db.query(MatchFeedback).all():
        if not (f.user and f.matched_user and f.user.preference and f.matched_user.preference):
            continue
        avg = (f.compatibility_rating + f.collaboration_quality + f.scheduling_ease) / 3
        feats = pair_features(f.user, f.matched_user)
        X.append([feats[k] for k in FACTORS])
        y.append(1 if avg >= 4 else 0)
    groups = (db.query(StudyGroup).filter(StudyGroup.kind.in_(["ai_group", "buddy"]))
              .options(selectinload(StudyGroup.feedback), selectinload(StudyGroup.memberships)).all())
    for g in groups:
        ratings = {f.user_id: (f.compatibility_rating + f.collaboration_quality + f.scheduling_ease) / 3 for f in g.feedback}
        if not ratings:
            continue
        members = [m.user for m in g.memberships if m.status == "accepted" and m.user.preference]
        for i in range(len(members)):
            for j in range(i + 1, len(members)):
                a, b = members[i], members[j]
                given = [ratings[u.id] for u in (a, b) if u.id in ratings]
                if not given:
                    continue
                feats = pair_features(a, b, subject=g.subject)
                X.append([feats[k] for k in FACTORS])
                y.append(1 if statistics.mean(given) >= 4 else 0)
    return X, y


def optimize_matching_weights(db: Session, note: str = "") -> Dict[str, Any]:
    """Learn which factors predict a well-rated match (logistic regression on feedback),
    then blend the learned importance with the current weights so one bad week cannot
    swing the model. Returns the new weights plus how much data and how accurate it was."""
    X, y = training_samples(db)
    current = load_weights(db)
    if len(X) < 20 or len(set(y)) < 2:
        return {"weights": current, "samples": len(X), "accuracy": None, "updated": False,
                "message": "Not enough feedback yet - at least 20 rated pairs with both good and poor ratings are needed."}

    Xa, ya = np.array(X), np.array(y)
    model = LogisticRegression(C=1.0, max_iter=1000)
    model.fit(Xa, ya)
    if len(X) >= 30 and min(ya.sum(), len(ya) - ya.sum()) >= 5:
        accuracy = float(cross_val_score(LogisticRegression(C=1.0, max_iter=1000), Xa, ya, cv=5).mean())
    else:
        accuracy = float(model.score(Xa, ya))

    positive = np.clip(model.coef_[0], 0, None)
    if positive.sum() == 0:
        return {"weights": current, "samples": len(X), "accuracy": accuracy, "updated": False,
                "message": "Feedback did not show a clear pattern yet - weights unchanged."}
    learned = dict(zip(FACTORS, positive / positive.sum()))
    alpha = min(0.6, len(X) / 300)
    blended = {k: (1 - alpha) * current[k] + alpha * learned[k] for k in FACTORS}
    total = sum(blended.values())
    blended = {k: round(v / total, 4) for k, v in blended.items()}

    db.add(ModelWeights(weights=blended, samples=len(X), accuracy=round(accuracy, 4),
                        note=note or f"Learned from {len(X)} rated pairs on {datetime.utcnow():%d %b %Y %H:%M} UTC"))
    db.commit()
    return {"weights": blended, "samples": len(X), "accuracy": round(accuracy, 4), "updated": True,
            "message": f"Weights re-learned from {len(X)} rated pairs."}


# --- KNN candidate retrieval + re-ranking ---------------------------------------------------

def _vectorize(user: User, all_subjects: List[str], w: Dict[str, float]) -> np.ndarray:
    pref = user.preference

    def one_hot(value: str, options: List[str]) -> np.ndarray:
        v = np.zeros(len(options))
        if _clean(value) in options:
            v[options.index(_clean(value))] = 1.0
        return v

    def unit(v: np.ndarray) -> np.ndarray:
        n = np.linalg.norm(v)
        return v / n if n > 0 else v

    sub_vec = np.zeros(len(all_subjects))
    for s in subjects_of(pref):
        if s in all_subjects:
            sub_vec[all_subjects.index(s)] = 1.0
    avail_vec = np.zeros(168)
    for h in hour_set(user):
        avail_vec[h] = 1.0
    comp_vec = np.array([level_for(pref) / 4.0])

    parts = [
        (unit(sub_vec), w["subject_overlap"]),
        (unit(avail_vec), w["availability_overlap"]),
        (unit(one_hot(pref.preferred_study_type, STUDY_TYPES)), w["study_type_match"]),
        (unit(one_hot(pref.collaboration_tendency, COLLAB_TENDENCIES)), w["collab_tendency_match"]),
        (unit(one_hot(pref.learning_style, LEARNING_STYLES)), w["learning_style_match"]),
        (unit(one_hot(pref.communication_preference, COMM_PREFS)), w["comm_pref_match"]),
        (comp_vec, w["competency_match"]),
    ]
    return np.concatenate([v * np.sqrt(weight) for v, weight in parts])


def overlap_text(hours: set[int]) -> List[str]:
    """Shared free hours as day ranges, e.g. ['Mon 18:00-21:00', 'Thu 18:00-21:00']."""
    runs, ordered = [], sorted(hours)
    for h in ordered:
        if runs and h == runs[-1][1] and h // 24 == runs[-1][0] // 24:
            runs[-1][1] = h + 1
        else:
            runs.append([h, h + 1])
    return [f"{DAYS[s // 24][:3]} {s % 24:02d}:00-{(e - 1) % 24 + 1:02d}:00" for s, e in runs]


def proposal_checklist(me: User, other: User, shared: List[str], subject: Optional[str], shared_hours: set) -> List[Dict[str, str]]:
    """The proposal's five matching factors, side by side, with a simple verdict for each."""
    p1, p2 = me.preference, other.preference
    lv = {v: k for k, v in LEVELS.items()}
    l1, l2 = level_for(p1, subject), level_for(p2, subject)
    st = study_type_score(p1.preferred_study_type, p2.preferred_study_type)
    comm = comm_score(p1.communication_preference, p2.communication_preference)
    collab = _pair(_COLLAB, _clean(p1.collaboration_tendency) or "collaborative peer", _clean(p2.collaboration_tendency) or "collaborative peer")
    slots = overlap_text(shared_hours)
    comp = calculate_competency_score(l1, l2)
    return [
        {"factor": "Subject interests", "detail": ", ".join(shared),
         "status": "match"},
        {"factor": "Study type", "detail": f"You: {p1.preferred_study_type or 'Group'} · Them: {p2.preferred_study_type or 'Group'}",
         "status": "match" if st >= 0.8 else "miss"},
        {"factor": "Availability", "detail": (", ".join(slots[:3]) + (f" +{len(slots) - 3} more" if len(slots) > 3 else "")) if slots else "No shared free time",
         "status": "match" if len(shared_hours) >= 3 else "partial" if shared_hours else "miss"},
        {"factor": "Competency level", "detail": f"{subject.title() if subject else 'Overall'}: you {lv.get(l1, '?').title()} · them {lv.get(l2, '?').title()}",
         "status": "match" if comp >= 1.0 else "partial" if comp >= 0.6 else "miss"},
        {"factor": "Social preferences", "detail": f"{p2.communication_preference or '-'} · {p2.collaboration_tendency or '-'}",
         "status": "match" if comm >= 0.6 and collab >= 0.8 else "partial" if comm >= 0.3 and collab >= 0.5 else "miss"},
    ]


def get_top_user_matches(current_user: User, other_users: List[User], top_n: int = 5,
                         weights: Optional[Dict[str, float]] = None) -> List[Dict[str, Any]]:
    """KNN finds the most similar students, then each candidate is re-ranked by compatibility.
    Only students who share at least one subject are considered (proposal: subject interests)."""
    if not current_user.preference:
        return []
    my_subjects = subjects_of(current_user.preference)
    candidates = [u for u in other_users if u.preference and u.id != current_user.id and u.consent_given
                  and not u.is_platform_admin and u.availabilities and my_subjects & subjects_of(u.preference)]
    if not candidates:
        return []
    w = weights or load_weights()
    # The student's own spelling of each subject, for display
    names = {s.strip().lower(): s.strip() for s in (current_user.preference.subjects_of_interest or "").split(",") if s.strip()}

    all_subjects = sorted({s for u in candidates + [current_user] for s in subjects_of(u.preference)})
    query = _vectorize(current_user, all_subjects, w)
    matrix = np.array([_vectorize(u, all_subjects, w) for u in candidates])

    k = min(max(top_n * 3, 15), len(candidates))
    knn = NearestNeighbors(n_neighbors=k, metric="cosine")
    knn.fit(matrix)
    distances, indices = knn.kneighbors([query])

    my_hours = hour_set(current_user)
    results = []
    for idx, dist in zip(indices[0], distances[0]):
        other = candidates[idx]
        their_hours = hour_set(other)
        shared = sorted(my_subjects & subjects_of(other.preference))
        subject = shared[0]
        feats = pair_features(current_user, other, subject=None, hours1=my_hours, hours2=their_hours)
        feats["competency_match"] = calculate_competency_score(level_for(current_user.preference, subject),
                                                               level_for(other.preference, subject))
        score = compatibility(feats, w)
        shared_names = [names.get(s, s.title()) for s in shared]
        results.append({
            "target_user_id": other.id,
            "full_name": other.full_name,
            "department": other.department,
            "academic_year": other.academic_year,
            "learning_style": other.preference.learning_style,
            "collaboration_tendency": other.preference.collaboration_tendency,
            "competency_level": other.preference.competency_level,
            "shared_subjects": shared_names,
            "shared_hours": len(my_hours & their_hours),
            "knn_similarity": round(float(1 - dist) * 100, 1),
            "compatibility_score": round(score * 100, 1),
            "factors": {k: round(v, 3) for k, v in feats.items()},
            "proposal": proposal_checklist(current_user, other, shared_names, subject, my_hours & their_hours),
            "explanation": generate_explanation(feats, shared_names, other.preference),
        })
    results.sort(key=lambda r: r["compatibility_score"], reverse=True)
    return results[:top_n]


def busy_partner_ids(db: Session, user_id: int) -> set[int]:
    """Students the user already studies with in a buddy pair."""
    ids = set()
    rows = (db.query(Membership).join(StudyGroup)
            .filter(Membership.user_id == user_id, StudyGroup.kind == "buddy", StudyGroup.status != "closed").all())
    for m in rows:
        for other in m.group.memberships:
            if other.user_id != user_id and other.status != "declined":
                ids.add(other.user_id)
    return ids
