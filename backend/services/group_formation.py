"""AI group formation (proposal objective 2: "recommend optimal study group or buddy matches").

KNN recommends partners for one student. This module forms groups for a whole cohort:

* For each subject, students who chose "Group" (or "Either") are split into groups of
  3-5 using the same compatibility score as the KNN re-ranking. Hardest-to-place
  students (fewest free hours) go first; then members are swapped between groups while
  the total score improves (hill climbing). A group is only formed when every member
  shares at least one free hour, so the group can actually meet.
* Students who chose "Buddy" (plus "Either" students left over) are paired by a greedy
  maximum-weight matching, improved with 2-opt swaps.
* Each run is compared with random grouping of the same students - the "traditional
  method" in the proposal - so the evaluation page can show the difference.
"""
from __future__ import annotations

import math
import random
import statistics
from dataclasses import dataclass
from itertools import combinations
from typing import Dict, List, Optional

from sqlalchemy.orm import Session, selectinload

from models.all_models import MatchRun, Membership, Notification, StudyGroup, Subject, User
from services.matching_service import (
    DAYS, compatibility, hour_set, level_for, load_weights, pair_features, subjects_of,
)

MIN_PAIR = 0.45


@dataclass(eq=False)
class Candidate:
    user: User
    hours: frozenset
    level: int
    study_type: str
    size_pref: int


class Scorer:
    """Caches pair scores - the same pair is evaluated many times during hill climbing."""

    def __init__(self, subject: str, weights: Dict[str, float]):
        self.subject, self.weights, self.cache = subject, weights, {}

    def pair(self, a: Candidate, b: Candidate) -> float:
        key = (min(a.user.id, b.user.id), max(a.user.id, b.user.id))
        if key not in self.cache:
            feats = pair_features(a.user, b.user, subject=self.subject, hours1=set(a.hours), hours2=set(b.hours))
            self.cache[key] = (compatibility(feats, self.weights), feats)
        return self.cache[key][0]

    def feats(self, a: Candidate, b: Candidate) -> Dict[str, float]:
        self.pair(a, b)
        return self.cache[(min(a.user.id, b.user.id), max(a.user.id, b.user.id))][1]

    def group(self, members: List[Candidate]) -> float:
        if len(members) < 2:
            return 0.0
        pairs = list(combinations(members, 2))
        base = sum(self.pair(a, b) for a, b in pairs) / len(pairs)
        if len(members) > 2:
            levels = {m.level for m in members if m.level}
            # A mix of levels (and at least one advanced student) helps peer teaching.
            balance = 0.5 * (len(levels) / min(3, len(members))) + 0.5 * (1.0 if any(m.level >= 3 for m in members) else 0.3)
            base = 0.85 * base + 0.15 * balance
        if not common_hours(members):
            base *= 0.55
        return max(0.0, min(1.0, base))


def common_hours(members: List[Candidate]) -> set:
    if not members:
        return set()
    common = set(members[0].hours)
    for m in members[1:]:
        common &= m.hours
    return common


def slot_label(hours: set) -> Optional[str]:
    """Longest run of shared hours, e.g. 'Tuesday 18:00-20:00'."""
    if not hours:
        return None
    ordered = sorted(hours)
    best_start, best_len, start, length = ordered[0], 1, ordered[0], 1
    for prev, cur in zip(ordered, ordered[1:]):
        if cur == prev + 1 and cur // 24 == prev // 24:
            length += 1
        else:
            start, length = cur, 1
        if length > best_len:
            best_start, best_len = start, length
    day, hour = divmod(best_start, 24)
    end = min(hour + best_len, 24)
    return f"{DAYS[day]} {hour:02d}:00-{end:02d}:00"


# --- forming ----------------------------------------------------------------------------

def form_groups(pool: List[Candidate], sc: Scorer, min_size: int, max_size: int):
    n = len(pool)
    if n < min_size:
        return [], list(pool)
    target = max(min_size, min(max_size, round(statistics.median(c.size_pref for c in pool))))
    g = max(1, round(n / target))
    while g > 1 and n / g < min_size:
        g -= 1
    while n / g > max_size:
        g += 1
    cap = math.ceil(n / g)

    order = sorted(pool, key=lambda c: (len(c.hours), c.user.id))
    seeds = [order[0]]
    while len(seeds) < g:
        rest = [c for c in order if c not in seeds]
        seeds.append(min(rest, key=lambda c: max(sc.pair(c, s) for s in seeds)))
    groups = [[s] for s in seeds]
    left = []
    for c in order:
        if c in seeds:
            continue
        options = [grp for grp in groups if len(grp) < cap and c.hours & common_hours(grp)]
        if not options:
            left.append(c)
            continue
        best = max(options, key=lambda grp: sum(sc.pair(c, m) for m in grp) / len(grp))
        best.append(c)

    improved, passes = True, 0
    while improved and passes < 25:
        improved, passes = False, passes + 1
        for i, j in combinations(range(len(groups)), 2):
            A, B = groups[i], groups[j]
            base = sc.group(A) * len(A) + sc.group(B) * len(B)
            swapped = False
            for ia in range(len(A)):
                for ib in range(len(B)):
                    A2 = A[:ia] + [B[ib]] + A[ia + 1:]
                    B2 = B[:ib] + [A[ia]] + B[ib + 1:]
                    if not common_hours(A2) or not common_hours(B2):
                        continue
                    if sc.group(A2) * len(A2) + sc.group(B2) * len(B2) > base + 1e-6:
                        groups[i], groups[j] = A2, B2
                        improved = swapped = True
                        break
                if swapped:
                    break

    for c in list(left):
        for grp in sorted(groups, key=len):
            if len(grp) < max_size and c.hours & common_hours(grp):
                grp.append(c)
                left.remove(c)
                break
    final = [grp for grp in groups if len(grp) >= min_size]
    left += [c for grp in groups if len(grp) < min_size for c in grp]
    if min_size <= len(left) < n:
        extra, left = form_groups(left, sc, min_size, max_size)
        final += extra
    return final, left


def form_pairs(pool: List[Candidate], sc: Scorer):
    options = sorted(((sc.pair(a, b), a, b) for a, b in combinations(pool, 2) if a.hours & b.hours),
                     key=lambda t: -t[0])
    used, pairs = set(), []
    for score, a, b in options:
        if score < MIN_PAIR or a.user.id in used or b.user.id in used:
            continue
        pairs.append([a, b])
        used.update((a.user.id, b.user.id))
    improved, passes = True, 0
    while improved and passes < 20:
        improved, passes = False, passes + 1
        for i, j in combinations(range(len(pairs)), 2):
            (a, b), (c, d) = pairs[i], pairs[j]
            cur = sc.pair(a, b) + sc.pair(c, d)
            for p, q in (([a, c], [b, d]), ([a, d], [b, c])):
                if p[0].hours & p[1].hours and q[0].hours & q[1].hours and sc.pair(*p) + sc.pair(*q) > cur + 1e-6:
                    pairs[i], pairs[j] = p, q
                    improved = True
                    break
    return pairs, [c for c in pool if c.user.id not in used]


def random_baseline(pool: List[Candidate], sc: Scorer, size: int, trials: int = 30) -> dict:
    """Average score of random grouping of the same students (the traditional method)."""
    if len(pool) < 2:
        return {"avg": None, "schedule_ok": None}
    rng = random.Random(7)
    scores, ok = [], []
    for _ in range(trials):
        shuffled = pool[:]
        rng.shuffle(shuffled)
        for i in range(0, len(shuffled), size):
            grp = shuffled[i:i + size]
            if len(grp) >= 2:
                scores.append(sc.group(grp))
                ok.append(1.0 if common_hours(grp) else 0.0)
    return {"avg": round(statistics.mean(scores), 4), "schedule_ok": round(statistics.mean(ok), 4)}


# --- explanations ----------------------------------------------------------------------

LEVEL_WORDS = {1: "beginner", 2: "intermediate", 3: "advanced", 4: "expert"}


def explain(members: List[Candidate], sc: Scorer, slot: Optional[str]) -> List[str]:
    reasons = []
    reasons.append(f"Everyone is free on {slot}" if slot else "No single time suits everyone yet - agree on one in the chat")
    counts = {}
    for m in members:
        if m.level:
            counts[LEVEL_WORDS[m.level]] = counts.get(LEVEL_WORDS[m.level], 0) + 1
    if counts:
        mix = ", ".join(f"{v} {k}" for k, v in counts.items())
        reasons.append(f"Skill mix: {mix}" + (" - you can teach and learn from each other" if len(counts) > 1 else ""))
    tendencies = [(m.user.preference.collaboration_tendency or "") for m in members]
    leaders = sum(1 for t in tendencies if t.lower() == "driven leader")
    if leaders == 1:
        reasons.append("One driven leader, the others collaborate and focus")
    elif leaders == 0:
        reasons.append("No clashing leaders - work is shared")
    comms = {(m.user.preference.communication_preference or "").strip() for m in members} - {""}
    if len(comms) == 1:
        reasons.append(f"Everyone prefers to communicate by {comms.pop().lower()}")
    styles = [(m.user.preference.learning_style or "") for m in members]
    common_style = max(set(styles), key=styles.count) if styles else ""
    if common_style and styles.count(common_style) >= max(2, len(members) - 1):
        reasons.append(f"Mostly {common_style.lower()} learners")
    return reasons


# --- database ------------------------------------------------------------------------

def notify(db: Session, user_id: int, message: str, type_: str = "general", payload_id=None, link=None):
    db.add(Notification(user_id=user_id, message=message, type=type_, payload_id=payload_id, link=link))


def busy_ids(db: Session, subject: str) -> set:
    rows = (db.query(Membership.user_id).join(StudyGroup)
            .filter(StudyGroup.kind.in_(["ai_group", "buddy"]), StudyGroup.status.in_(["proposed", "active"]),
                    Membership.status.in_(["pending", "accepted"]))
            .filter(StudyGroup.subject.ilike(subject)).all())
    return {r[0] for r in rows}


def waiting_students(db: Session, subject: str) -> List[Candidate]:
    busy = busy_ids(db, subject)
    out = []
    students = (db.query(User).filter(User.consent_given.is_(True), User.is_platform_admin.is_(False))
                .options(selectinload(User.preference), selectinload(User.availabilities)).all())
    for u in students:
        if u.id in busy or not u.preference or subject.lower() not in subjects_of(u.preference):
            continue
        hours = frozenset(hour_set(u))
        if not hours:
            continue
        out.append(Candidate(user=u, hours=hours, level=level_for(u.preference, subject),
                             study_type=(u.preference.preferred_study_type or "Group").lower(),
                             size_pref=u.preference.preferred_group_size or 4))
    return out


def all_subject_names(db: Session) -> List[str]:
    names = {s.name.strip() for s in db.query(Subject).filter(Subject.active.is_(True)).all()}
    for u in db.query(User).filter(User.consent_given.is_(True)).all():
        if u.preference and u.preference.subjects_of_interest:
            names.update(s.strip() for s in u.preference.subjects_of_interest.split(",") if s.strip())
    # Case-insensitive de-duplication, keeping the first spelling
    seen, out = set(), []
    for n in sorted(names):
        if n.lower() not in seen:
            seen.add(n.lower())
            out.append(n)
    return out


def _save(db: Session, subject: str, members: List[Candidate], sc: Scorer, run: MatchRun, number: int) -> StudyGroup:
    kind = "buddy" if len(members) == 2 else "ai_group"
    slot = slot_label(common_hours(members))
    score = sc.group(members)
    group = StudyGroup(
        name=f"{subject} - {'Study Buddies' if kind == 'buddy' else 'Study Group'} {number}",
        description=f"Formed by the AI matching engine for {subject}.",
        subject=subject, creator_id=members[0].user.id, kind=kind, status="proposed",
        match_score=round(score * 100, 1), reasons=explain(members, sc, slot), meeting_slot=slot, run_id=run.id,
    )
    db.add(group)
    db.flush()
    for m in members:
        db.add(Membership(user_id=m.user.id, group_id=group.id, role="member", status="pending"))
        what = "a study buddy" if kind == "buddy" else f"a study group of {len(members)}"
        notify(db, m.user.id, f"New AI match for {subject}: {what} ({round(score * 100)}% compatible). Accept or decline the invitation.",
               "group_invite", group.id, f"/groups/{group.id}")
    return group


def run_group_formation(db: Session, subjects: Optional[List[str]] = None, min_size: int = 3, max_size: int = 5,
                        trigger: str = "admin", started_by: Optional[int] = None) -> MatchRun:
    weights = load_weights(db)
    names = subjects or all_subject_names(db)
    run = MatchRun(started_by=started_by, trigger=trigger,
                   params={"subjects": subjects or [], "min_size": min_size, "max_size": max_size, "weights": weights})
    db.add(run)
    db.flush()

    per_subject, ai_scores, rnd_scores, rnd_sched = [], [], [], []
    totals = {"considered": 0, "groups": 0, "pairs": 0, "matched": 0, "unmatched": 0}
    for subject in names:
        pool = waiting_students(db, subject)
        if len(pool) < 2:
            continue
        sc = Scorer(subject, weights)
        group_pool = [c for c in pool if c.study_type in ("group", "either")]
        buddy_pool = [c for c in pool if c.study_type == "buddy"]
        groups, left = form_groups(group_pool, sc, min_size, max_size)
        buddy_pool += [c for c in left if c.study_type == "either"]
        pairs, left2 = form_pairs(buddy_pool, sc)
        unmatched = [c for c in left if c.study_type != "either"] + left2

        existing = db.query(StudyGroup).filter(StudyGroup.subject.ilike(subject),
                                               StudyGroup.kind.in_(["ai_group", "buddy"])).count()
        made = [_save(db, subject, m, sc, run, existing + i) for i, m in enumerate(groups + pairs, start=1)]
        for c in unmatched:
            notify(db, c.user.id, f"No match yet for {subject}: not enough students share your free time. "
                                  f"Adding more free hours helps - we will try again on the next run.", "general", None, "/preferences")

        size = max(min_size, min(max_size, round(statistics.median(c.size_pref for c in group_pool)))) if group_pool else 2
        base = random_baseline(group_pool if len(group_pool) >= 2 else buddy_pool, sc, size if len(group_pool) >= 2 else 2)
        if base["avg"] is not None:
            rnd_scores.append(base["avg"])
            rnd_sched.append(base["schedule_ok"])
        scores = [g.match_score / 100 for g in made]
        ai_scores += scores
        matched = sum(len(m) for m in groups + pairs)
        per_subject.append({"subject": subject, "considered": len(pool), "groups": len(groups), "pairs": len(pairs),
                            "matched": matched, "unmatched": len(unmatched),
                            "ai_avg": round(statistics.mean(scores), 4) if scores else None, "random_avg": base["avg"]})
        totals["considered"] += len(pool)
        totals["groups"] += len(groups)
        totals["pairs"] += len(pairs)
        totals["matched"] += matched
        totals["unmatched"] += len(unmatched)

    run.stats = {**totals,
                 "ai_avg": round(statistics.mean(ai_scores), 4) if ai_scores else None,
                 "random_avg": round(statistics.mean(rnd_scores), 4) if rnd_scores else None,
                 "ai_schedule_ok": 1.0 if ai_scores else None,
                 "random_schedule_ok": round(statistics.mean(rnd_sched), 4) if rnd_sched else None,
                 "subjects": per_subject}
    db.commit()
    db.refresh(run)
    return run
