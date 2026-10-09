import csv
import io
import statistics
from collections import Counter
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from core.database import get_db
from core.deps import get_current_user
from models.all_models import (
    EmailCode, GroupFeedback, GroupMessage, LoginAttempt, MatchFeedback, MatchRun, Membership, ModelWeights, Notification, Preference,
    StudyGroup, StudyInsight, StudySession, Subject, SurveyResponse, User,
)
from schemas.study_group import MatchRunIn, SubjectIn
from services.group_formation import notify, run_group_formation
from services.matching_service import DEFAULT_WEIGHTS, FACTOR_LABELS, FACTORS, load_weights, optimize_matching_weights

router = APIRouter()


def get_platform_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_platform_admin:
        raise HTTPException(status_code=403, detail="Platform administrator privileges required.")
    return current_user


def _mean(xs, digits=3):
    xs = [x for x in xs if x is not None]
    return round(statistics.mean(xs), digits) if xs else None


def _avg3(f):
    return (f.compatibility_rating + f.collaboration_quality + f.scheduling_ease) / 3


def _attendance(db: Session):
    expected = attended = 0
    for s in db.query(StudySession).filter(StudySession.start_time < datetime.utcnow()).all():
        members = sum(1 for m in s.group.memberships if m.status == "accepted")
        expected += members
        attended += len(s.attendees or [])
    return round(attended / expected, 3) if expected else None


def _run_out(r: MatchRun):
    return {"id": r.id, "trigger": r.trigger, "params": r.params, "stats": r.stats, "created_at": r.created_at}


# --- overview ------------------------------------------------------------------------

@router.get("/stats")
def get_platform_stats(db: Session = Depends(get_db), admin: User = Depends(get_platform_admin)):
    students = db.query(User).filter(User.is_platform_admin.is_(False)).all()
    ready = [u for u in students if u.consent_given and u.preference and u.preference.subjects_of_interest and u.availabilities]
    groups = db.query(StudyGroup).all()
    ai_active = [g for g in groups if g.kind in ("ai_group", "buddy") and g.status == "active" and g.match_score is not None]
    in_group = {m.user_id for g in groups if g.status in ("active", "proposed") for m in g.memberships if m.status in ("accepted", "pending")}
    feedback = db.query(GroupFeedback).all() + db.query(MatchFeedback).all()
    surveys = db.query(SurveyResponse).all()
    signups = Counter(u.created_at.date().isoformat() for u in students if u.created_at)
    return {
        "total_users": len(students) + db.query(User).filter(User.is_platform_admin.is_(True)).count(),
        "students": len(students), "ready_students": len(ready),
        "matched_students": len(in_group & {u.id for u in students}),
        "total_groups": len(groups),
        "ai_groups": sum(1 for g in groups if g.kind == "ai_group" and g.status != "closed"),
        "buddy_pairs": sum(1 for g in groups if g.kind == "buddy" and g.status != "closed"),
        "manual_groups": sum(1 for g in groups if (g.kind or "manual") == "manual" and g.status != "closed"),
        "pending_invites": sum(1 for g in groups if g.status == "proposed"),
        "total_sessions": db.query(StudySession).count(),
        "messages": db.query(GroupMessage).count(),
        "avg_match_score": _mean([g.match_score for g in ai_active], 1),
        "avg_rating": _mean([_avg3(f) for f in feedback], 2),
        "feedback_count": len(feedback),
        "attendance_rate": _attendance(db),
        "sus_avg": _mean([s.sus_score for s in surveys], 1),
        "survey_count": len(surveys),
        "demo_users": db.query(User).filter(User.is_demo.is_(True)).count(),
        "signups": sorted(signups.items())[-14:],
        "recent_runs": [_run_out(r) for r in db.query(MatchRun).order_by(MatchRun.id.desc()).limit(5).all()],
    }


# --- users ---------------------------------------------------------------------------

@router.get("/users")
def get_all_users(db: Session = Depends(get_db), admin: User = Depends(get_platform_admin)):
    out = []
    for u in db.query(User).order_by(User.created_at.desc()).all():
        p = u.preference
        out.append({
            "id": u.id, "email": u.email, "full_name": u.full_name, "university": u.university,
            "department": u.department, "academic_year": u.academic_year,
            "is_admin": bool(u.is_platform_admin), "is_demo": bool(u.is_demo), "consent_given": bool(u.consent_given),
            "created_at": u.created_at,
            "subjects": p.subjects_of_interest if p else "", "study_type": p.preferred_study_type if p else None,
            "competency_level": p.competency_level if p else None,
            "free_slots": len(u.availabilities),
            "groups": sum(1 for m in u.memberships if m.status == "accepted" and m.group.status != "closed"),
        })
    return out


@router.patch("/users/{user_id}/toggle-admin")
def toggle_user_admin(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_platform_admin)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot change your own admin status.")
    user.is_platform_admin = not user.is_platform_admin
    db.commit()
    return {"message": f"{user.full_name} is {'now' if user.is_platform_admin else 'no longer'} an admin."}


def delete_user_everywhere(db: Session, user: User, new_owner_id: int):
    """Delete a user and everything that points to them. (The first version failed here,
    because messages, feedback and created groups still referenced the user.)"""
    for model, col in ((GroupMessage, GroupMessage.sender_id), (StudyInsight, StudyInsight.user_id),
                       (GroupFeedback, GroupFeedback.user_id), (SurveyResponse, SurveyResponse.user_id),
                       (Notification, Notification.user_id), (Membership, Membership.user_id)):
        db.query(model).filter(col == user.id).delete(synchronize_session=False)
    db.query(EmailCode).filter(EmailCode.user_id == user.id).delete(synchronize_session=False)
    db.query(LoginAttempt).filter(LoginAttempt.email == user.email).delete(synchronize_session=False)
    db.query(MatchFeedback).filter((MatchFeedback.user_id == user.id) | (MatchFeedback.matched_user_id == user.id)) \
        .delete(synchronize_session=False)
    db.query(StudyGroup).filter(StudyGroup.creator_id == user.id).update({"creator_id": new_owner_id}, synchronize_session=False)
    db.query(StudySession).filter(StudySession.created_by == user.id).update({"created_by": None}, synchronize_session=False)
    db.query(MatchRun).filter(MatchRun.started_by == user.id).update({"started_by": None}, synchronize_session=False)
    db.flush()
    db.expire(user)
    db.delete(user)


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_platform_admin)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account here.")
    delete_user_everywhere(db, user, admin.id)
    db.commit()
    return {"message": "User deleted"}


# --- subjects ------------------------------------------------------------------------

@router.get("/subjects")
def list_subjects(db: Session = Depends(get_db), admin: User = Depends(get_platform_admin)):
    prefs = [p.subjects_of_interest.lower() for p in db.query(Preference).all() if p.subjects_of_interest]
    out = []
    for s in db.query(Subject).order_by(Subject.name).all():
        students = sum(1 for p in prefs if s.name.lower() in [x.strip() for x in p.split(",")])
        groups = db.query(StudyGroup).filter(StudyGroup.subject.ilike(s.name), StudyGroup.status != "closed").count()
        out.append({"id": s.id, "code": s.code, "name": s.name, "active": s.active, "students": students, "groups": groups})
    return out


@router.post("/subjects")
def create_subject(data: SubjectIn, db: Session = Depends(get_db), admin: User = Depends(get_platform_admin)):
    if db.query(Subject).filter((Subject.code == data.code.upper()) | (Subject.name.ilike(data.name))).first():
        raise HTTPException(status_code=400, detail="A subject with this code or name already exists.")
    s = Subject(code=data.code.strip().upper(), name=data.name.strip(), active=data.active)
    db.add(s)
    db.commit()
    return {"id": s.id}


@router.put("/subjects/{subject_id}")
def update_subject(subject_id: int, data: SubjectIn, db: Session = Depends(get_db), admin: User = Depends(get_platform_admin)):
    s = db.get(Subject, subject_id)
    if not s:
        raise HTTPException(status_code=404, detail="Subject not found")
    s.code, s.name, s.active = data.code.strip().upper(), data.name.strip(), data.active
    db.commit()
    return {"id": s.id}


@router.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db), admin: User = Depends(get_platform_admin)):
    s = db.get(Subject, subject_id)
    if not s:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(s)
    db.commit()
    return {"message": "Subject removed"}


# --- AI matching -------------------------------------------------------------------------

@router.post("/matching/run")
def run_matching(data: MatchRunIn, db: Session = Depends(get_db), admin: User = Depends(get_platform_admin)):
    if data.min_size > data.max_size:
        raise HTTPException(status_code=400, detail="The smallest group size cannot be bigger than the largest.")
    run = run_group_formation(db, data.subjects or None, data.min_size, data.max_size, "admin", admin.id)
    return _run_out(run)


@router.get("/matching/runs")
def list_runs(db: Session = Depends(get_db), admin: User = Depends(get_platform_admin)):
    return [_run_out(r) for r in db.query(MatchRun).order_by(MatchRun.id.desc()).limit(50).all()]


@router.get("/weights")
def get_matching_weights(db: Session = Depends(get_db), admin: User = Depends(get_platform_admin)):
    history = db.query(ModelWeights).order_by(ModelWeights.id.desc()).limit(20).all()
    return {
        "factors": [{"key": k, "label": FACTOR_LABELS[k]} for k in FACTORS],
        "default": DEFAULT_WEIGHTS, "current": load_weights(db),
        "history": [{"id": h.id, "weights": h.weights, "samples": h.samples, "accuracy": h.accuracy,
                     "note": h.note, "created_at": h.created_at} for h in history],
    }


@router.post("/optimize-weights")
def run_weight_optimization(db: Session = Depends(get_db), admin: User = Depends(get_platform_admin)):
    result = optimize_matching_weights(db)
    if not result["updated"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@router.post("/weights/reset")
def reset_weights(db: Session = Depends(get_db), admin: User = Depends(get_platform_admin)):
    db.add(ModelWeights(weights=dict(DEFAULT_WEIGHTS), samples=0, note="Reset to the starting weights"))
    db.commit()
    return {"message": "Weights reset"}


# --- groups ------------------------------------------------------------------------------

@router.get("/groups")
def all_groups(db: Session = Depends(get_db), admin: User = Depends(get_platform_admin)):
    out = []
    for g in db.query(StudyGroup).order_by(StudyGroup.id.desc()).all():
        members = [m for m in g.memberships if m.status != "declined"]
        ratings = [_avg3(f) for f in g.feedback]
        out.append({"id": g.id, "name": g.name, "subject": g.subject, "kind": g.kind or "manual", "status": g.status or "active",
                    "match_score": g.match_score, "meeting_slot": g.meeting_slot, "created_at": g.created_at,
                    "members": [m.user.full_name for m in members], "member_count": len(members),
                    "sessions": len(g.sessions), "messages": len(g.messages),
                    "avg_rating": round(sum(ratings) / len(ratings), 2) if ratings else None, "feedback_count": len(ratings)})
    return out


@router.post("/groups/{group_id}/close")
def close_group(group_id: int, db: Session = Depends(get_db), admin: User = Depends(get_platform_admin)):
    g = db.get(StudyGroup, group_id)
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    g.status = "closed"
    for m in g.memberships:
        if m.status != "declined":
            notify(db, m.user_id, f"{g.name} was closed by an administrator. You are back in the matching pool.", "group", g.id, "/groups")
    db.commit()
    return {"message": "Group closed"}


# --- evaluation (proposal objective 4) -------------------------------------------------------

def _pearson(xs, ys):
    if len(xs) < 3:
        return None
    mx, my = statistics.mean(xs), statistics.mean(ys)
    sx = sum((x - mx) ** 2 for x in xs) ** 0.5
    sy = sum((y - my) ** 2 for y in ys) ** 0.5
    if not sx or not sy:
        return None
    return round(sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx * sy), 3)


@router.get("/analytics")
def analytics(db: Session = Depends(get_db), admin: User = Depends(get_platform_admin)):
    gfb = [f for f in db.query(GroupFeedback).all() if f.group.match_score is not None]
    buckets = [(0, 50, "< 50%"), (50, 60, "50-59%"), (60, 70, "60-69%"), (70, 80, "70-79%"), (80, 101, "80%+")]
    by_bucket = [{"bucket": label, "avg_rating": _mean([_avg3(f) for f in gfb if lo <= f.group.match_score < hi], 2),
                  "count": sum(1 for f in gfb if lo <= f.group.match_score < hi)} for lo, hi, label in buckets]

    runs = db.query(MatchRun).all()
    stat = lambda key: [r.stats.get(key) for r in runs if r.stats and r.stats.get(key) is not None]
    all_fb = db.query(GroupFeedback).all()
    pair_fb = db.query(MatchFeedback).all()
    surveys = db.query(SurveyResponse).all()
    bands = Counter("Excellent (80+)" if s.sus_score >= 80 else "Good (68-79)" if s.sus_score >= 68
                    else "OK (51-67)" if s.sus_score >= 51 else "Poor (<51)" for s in surveys)
    groups = db.query(StudyGroup).all()
    ai_ever = [g for g in groups if g.kind in ("ai_group", "buddy") and g.run_id]
    weights = load_weights(db)

    def by_kind(kind):
        rows = [f for f in all_fb if f.group.kind == kind]
        return {"count": len(rows), "avg_rating": _mean([_avg3(f) for f in rows], 2)}

    subjects = {}
    for g in groups:
        if g.kind in ("ai_group", "buddy") and g.status != "closed":
            subjects.setdefault(g.subject, {"subject": g.subject, "groups": 0, "scores": [], "ratings": []})
            subjects[g.subject]["groups"] += 1
            subjects[g.subject]["scores"].append(g.match_score)
            subjects[g.subject]["ratings"] += [_avg3(f) for f in g.feedback]
    return {
        "feedback": {
            "count": len(all_fb) + len(pair_fb),
            "overall": _mean([_avg3(f) for f in all_fb + pair_fb], 2),
            "compatibility": _mean([f.compatibility_rating for f in all_fb + pair_fb], 2),
            "collaboration": _mean([f.collaboration_quality for f in all_fb + pair_fb], 2),
            "scheduling": _mean([f.scheduling_ease for f in all_fb + pair_fb], 2),
            "would_continue": _mean([1.0 if f.would_continue else 0.0 for f in all_fb], 3),
        },
        "score_vs_rating": by_bucket,
        "correlation": _pearson([f.group.match_score for f in gfb], [_avg3(f) for f in gfb]),
        "ai_vs_random": {"ai_avg": _mean(stat("ai_avg")), "random_avg": _mean(stat("random_avg")),
                         "ai_schedule_ok": _mean(stat("ai_schedule_ok")), "random_schedule_ok": _mean(stat("random_schedule_ok")),
                         "runs": len(stat("ai_avg"))},
        "by_kind": {"group": by_kind("ai_group"), "buddy": by_kind("buddy"), "manual": by_kind("manual")},
        "engagement": {
            "attendance_rate": _attendance(db),
            "sessions": db.query(StudySession).count(),
            "messages": db.query(GroupMessage).count(),
            "acceptance_rate": round(sum(1 for g in ai_ever if g.status == "active") / len(ai_ever), 3) if ai_ever else None,
        },
        "survey": {
            "count": len(surveys), "sus": _mean([s.sus_score for s in surveys], 1),
            "fairness": _mean([s.fairness for s in surveys], 2), "usefulness": _mean([s.usefulness for s in surveys], 2),
            "ease": _mean([s.ease for s in surveys], 2),
            "bands": [{"band": b, "count": bands.get(b, 0)} for b in ("Excellent (80+)", "Good (68-79)", "OK (51-67)", "Poor (<51)")],
        },
        "weights": [{"key": k, "label": FACTOR_LABELS[k], "default": DEFAULT_WEIGHTS[k], "current": weights[k]} for k in FACTORS],
        "subjects": [{"subject": v["subject"], "groups": v["groups"], "avg_score": _mean(v["scores"], 1),
                      "avg_rating": _mean(v["ratings"], 2)} for v in sorted(subjects.values(), key=lambda x: x["subject"])],
        "comments": [{"group": f.group.name, "rating": round(_avg3(f), 1), "comment": f.feedback_text, "created_at": f.created_at}
                     for f in sorted(all_fb, key=lambda f: f.created_at or datetime.min, reverse=True) if f.feedback_text][:12],
    }


@router.get("/export/{kind}")
def export_csv(kind: str, db: Session = Depends(get_db), admin: User = Depends(get_platform_admin)):
    """Research data export (anonymous: student ids only, no names or emails)."""
    buf = io.StringIO()
    w = csv.writer(buf)
    if kind == "feedback":
        w.writerow(["type", "group_id", "subject", "group_kind", "match_score", "student_id", "partner_id",
                    "compatibility", "collaboration", "scheduling", "would_continue", "comment", "created_at"])
        for f in db.query(GroupFeedback).all():
            w.writerow(["group", f.group_id, f.group.subject, f.group.kind, f.group.match_score, f.user_id, "",
                        f.compatibility_rating, f.collaboration_quality, f.scheduling_ease, f.would_continue,
                        f.feedback_text or "", f.created_at])
        for f in db.query(MatchFeedback).all():
            w.writerow(["partner", "", "", "knn", "", f.user_id, f.matched_user_id, f.compatibility_rating,
                        f.collaboration_quality, f.scheduling_ease, "", f.feedback_text or "", f.created_at])
    elif kind == "survey":
        w.writerow(["student_id"] + [f"sus_q{i}" for i in range(1, 11)] + ["sus_score", "fairness", "usefulness", "ease", "comment"])
        for s in db.query(SurveyResponse).all():
            w.writerow([s.user_id] + list(s.sus_answers) + [s.sus_score, s.fairness, s.usefulness, s.ease, s.comment or ""])
    elif kind == "groups":
        w.writerow(["group_id", "subject", "kind", "status", "match_score", "members", "meeting_slot", "sessions", "messages", "created_at"])
        for g in db.query(StudyGroup).all():
            w.writerow([g.id, g.subject, g.kind, g.status, g.match_score, sum(1 for m in g.memberships if m.status != "declined"),
                        g.meeting_slot or "", len(g.sessions), len(g.messages), g.created_at])
    else:
        raise HTTPException(status_code=404, detail="Unknown export")
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv",
                             headers={"Content-Disposition": f'attachment; filename="studymatch-{kind}.csv"'})


@router.post("/demo/clear")
def clear_demo(db: Session = Depends(get_db), admin: User = Depends(get_platform_admin)):
    """Remove the demo students and everything they created, before collecting real research data."""
    demo = db.query(User).filter(User.is_demo.is_(True)).all()
    if not demo:
        return {"removed": 0}
    ids = {u.id for u in demo}
    group_ids = {m.group_id for m in db.query(Membership).filter(Membership.user_id.in_(ids)).all()}
    db.query(StudyInsight).filter(StudyInsight.group_id.in_(group_ids)).delete(synchronize_session=False)
    for g in db.query(StudyGroup).filter(StudyGroup.id.in_(group_ids)).all():
        db.delete(g)
    db.flush()
    for u in demo:
        delete_user_everywhere(db, u, admin.id)
    db.query(MatchRun).delete(synchronize_session=False)
    db.query(ModelWeights).delete(synchronize_session=False)
    db.commit()
    return {"removed": len(ids)}
