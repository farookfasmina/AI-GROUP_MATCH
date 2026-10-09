from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from core.database import get_db
from core.deps import get_current_user, get_optional_current_user
from models.all_models import GroupFeedback, Membership, StudyGroup, StudySession, User
from schemas.feedback import GroupFeedbackCreate
from schemas.session import StudySessionCreate
from schemas.study_group import RespondIn, StudyGroupCreate
from services.group_formation import notify
from services.matching_service import level_for, optimize_matching_weights

router = APIRouter()


def membership_of(group: StudyGroup, user_id: int):
    return next((m for m in group.memberships if m.user_id == user_id), None)


def active_members(group: StudyGroup):
    return [m for m in group.memberships if m.status != "declined"]


def group_summary(g: StudyGroup, user: User | None) -> dict:
    mine = membership_of(g, user.id) if user else None
    return {
        "id": g.id, "name": g.name, "description": g.description, "subject": g.subject,
        "creator_id": g.creator_id, "created_at": g.created_at, "kind": g.kind or "manual",
        "status": g.status or "active", "match_score": g.match_score, "meeting_slot": g.meeting_slot,
        "reasons": g.reasons or [], "member_count": len(active_members(g)),
        "people": [{"id": m.user_id, "name": m.user.full_name} for m in active_members(g)],
        "user_role": mine.role if mine and mine.status != "declined" else "",
        "my_status": mine.status if mine else None,
        "my_feedback": bool(user and any(f.user_id == user.id for f in g.feedback)),
    }


def load_group(db: Session, group_id: int, user: User, need_accepted: bool = False) -> tuple[StudyGroup, Membership | None]:
    group = db.get(StudyGroup, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    mine = membership_of(group, user.id)
    is_member = mine is not None and mine.status != "declined"
    if not is_member and not user.is_platform_admin:
        raise HTTPException(status_code=403, detail="You are not a member of this study group.")
    if need_accepted:
        if not mine or mine.status != "accepted":
            raise HTTPException(status_code=403, detail="Accept the invitation first.")
        if group.status == "closed":
            raise HTTPException(status_code=400, detail="This group has been closed.")
    return group, mine


@router.post("")
def create_group(group_in: StudyGroupCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a public study group; the creator becomes its admin."""
    group = StudyGroup(name=group_in.name.strip(), description=(group_in.description or "").strip(),
                       subject=group_in.subject.strip(), creator_id=current_user.id, kind="manual", status="active")
    db.add(group)
    db.flush()
    db.add(Membership(user_id=current_user.id, group_id=group.id, role="admin", status="accepted"))
    db.commit()
    db.refresh(group)
    return group_summary(group, current_user)


@router.get("")
def list_groups(db: Session = Depends(get_db), current_user: User | None = Depends(get_optional_current_user)):
    """Public groups anyone can join. AI groups and buddy pairs are private."""
    groups = (db.query(StudyGroup)
              .filter(or_(StudyGroup.kind == "manual", StudyGroup.kind.is_(None)),
                      or_(StudyGroup.status != "closed", StudyGroup.status.is_(None)))
              .order_by(StudyGroup.created_at.desc()).all())
    return [group_summary(g, current_user) for g in groups]


@router.get("/me")
def my_groups(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Every group the student belongs to or is invited to, invitations first."""
    rows = [m.group for m in current_user.memberships if m.status != "declined"]
    order = {"proposed": 0, "active": 1, "closed": 2}
    return sorted((group_summary(g, current_user) for g in rows), key=lambda g: (order.get(g["status"], 1), g["name"]))


@router.get("/{group_id}")
def group_detail(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    group, mine = load_group(db, group_id, current_user)
    show_contacts = group.status == "active"
    members = []
    for m in group.memberships:
        u, p = m.user, m.user.preference
        members.append({
            "id": u.id, "full_name": u.full_name, "department": u.department, "academic_year": u.academic_year,
            "role": m.role, "status": m.status,
            "email": u.email if show_contacts and m.status == "accepted" else None,
            "competency": next((k for k, v in {"Beginner": 1, "Intermediate": 2, "Advanced": 3, "Expert": 4}.items()
                                if v == level_for(p, group.subject)), None) if p else None,
            "collaboration_tendency": p.collaboration_tendency if p else None,
            "learning_style": p.learning_style if p else None,
            "communication_preference": p.communication_preference if p else None,
        })
    out = group_summary(group, current_user)
    out["members"] = members
    out["sessions"] = [session_out(s) for s in sorted(group.sessions, key=lambda s: s.start_time)]
    mine_fb = next((f for f in group.feedback if f.user_id == current_user.id), None)
    out["feedback"] = None if not mine_fb else {
        "compatibility_rating": mine_fb.compatibility_rating, "collaboration_quality": mine_fb.collaboration_quality,
        "scheduling_ease": mine_fb.scheduling_ease, "would_continue": mine_fb.would_continue,
        "feedback_text": mine_fb.feedback_text}
    ratings = [(f.compatibility_rating + f.collaboration_quality + f.scheduling_ease) / 3 for f in group.feedback]
    out["avg_rating"] = round(sum(ratings) / len(ratings), 2) if ratings else None
    return out


@router.post("/{group_id}/join")
def join_group(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    group = db.get(StudyGroup, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    if (group.kind or "manual") != "manual" or group.status == "closed":
        raise HTTPException(status_code=400, detail="This group is private - members join by invitation.")
    mine = membership_of(group, current_user.id)
    if mine and mine.status != "declined":
        raise HTTPException(status_code=400, detail="You are already a member of this group.")
    if mine:
        mine.status = "accepted"
    else:
        db.add(Membership(user_id=current_user.id, group_id=group.id, role="member", status="accepted"))
    for m in active_members(group):
        notify(db, m.user_id, f"{current_user.full_name} joined {group.name}.", "group", group.id, f"/groups/{group.id}")
    db.commit()
    return {"message": f"You joined {group.name}"}


@router.post("/{group_id}/leave")
def leave_group(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    group, mine = load_group(db, group_id, current_user)
    if not mine:
        raise HTTPException(status_code=400, detail="You are not a member of this group.")
    mine.status = "declined"
    remaining = [m for m in active_members(group) if m.user_id != current_user.id]
    if group.kind in ("ai_group", "buddy") and len(remaining) < 2:
        group.status = "closed"
    for m in remaining:
        notify(db, m.user_id, f"{current_user.full_name} left {group.name}.", "group", group.id, f"/groups/{group.id}")
    db.commit()
    return {"message": "You left the group"}


@router.post("/{group_id}/respond")
def respond_to_invite(group_id: int, data: RespondIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Accept or decline an AI group invitation. The group starts when everyone has answered."""
    group, mine = load_group(db, group_id, current_user)
    if not mine or mine.status != "pending":
        raise HTTPException(status_code=400, detail="You have already answered this invitation.")
    if group.status == "closed":
        raise HTTPException(status_code=400, detail="This group has been closed.")
    mine.status = "accepted" if data.accept else "declined"
    others = [m for m in active_members(group) if m.user_id != current_user.id]
    link = f"/groups/{group.id}"
    if data.accept:
        for m in others:
            notify(db, m.user_id, f"{current_user.full_name} accepted the invitation to {group.name}.", "group", group.id, link)
    elif group.kind == "buddy" or len(others) < 2:
        group.status = "closed"
        for m in others:
            notify(db, m.user_id, f"{group.name} was closed because {current_user.full_name} declined. "
                                  f"You are back in the matching pool.", "group", group.id, "/groups")
    else:
        for m in others:
            notify(db, m.user_id, f"{current_user.full_name} declined {group.name}; the group continues without them.",
                   "group", group.id, link)
    remaining = active_members(group)
    if group.status == "proposed" and len(remaining) >= 2 and all(m.status == "accepted" for m in remaining):
        group.status = "active"
        for m in remaining:
            notify(db, m.user_id, f"{group.name} is now active - everyone accepted. Plan your first session!",
                   "group", group.id, link)
    db.commit()
    return {"my_status": mine.status, "group_status": group.status}


@router.get("/{group_id}/members")
def get_group_members(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    group, _ = load_group(db, group_id, current_user)
    return [{"id": m.user.id, "full_name": m.user.full_name, "email": m.user.email if m.status == "accepted" else None,
             "role": m.role, "status": m.status, "joined_at": m.joined_at} for m in active_members(group)]


# --- sessions --------------------------------------------------------------------------

def session_out(s: StudySession) -> dict:
    return {"id": s.id, "group_id": s.group_id, "group_name": s.group.name if s.group else None, "title": s.title,
            "start_time": s.start_time, "duration_minutes": s.duration_minutes, "location": s.location,
            "attendees": s.attendees or [], "created_by": s.created_by}


@router.post("/{group_id}/sessions")
def create_session(group_id: int, session_in: StudySessionCreate, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    """Any member who accepted can plan a session; the others are notified."""
    group, _ = load_group(db, group_id, current_user, need_accepted=True)
    start = session_in.start_time
    if start.tzinfo:
        start = start.astimezone(timezone.utc).replace(tzinfo=None)
    s = StudySession(group_id=group.id, title=session_in.title.strip(), start_time=start,
                     duration_minutes=session_in.duration_minutes, location=(session_in.location or "").strip(),
                     created_by=current_user.id, attendees=[])
    db.add(s)
    for m in active_members(group):
        if m.user_id != current_user.id and m.status == "accepted":
            notify(db, m.user_id, f"New session in {group.name}: {s.title}", "session", group.id, f"/groups/{group.id}")
    db.commit()
    db.refresh(s)
    return session_out(s)


@router.post("/{group_id}/sessions/{session_id}/attend")
def toggle_attendance(group_id: int, session_id: int, db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)):
    """Mark (or unmark) "I attended" - attendance is an engagement metric in the evaluation."""
    group, _ = load_group(db, group_id, current_user, need_accepted=True)
    s = db.get(StudySession, session_id)
    if not s or s.group_id != group.id:
        raise HTTPException(status_code=404, detail="Session not found")
    if s.start_time > datetime.utcnow():
        raise HTTPException(status_code=400, detail="You can mark attendance once the session has started.")
    people = list(s.attendees or [])
    if current_user.id in people:
        people.remove(current_user.id)
    else:
        people.append(current_user.id)
    s.attendees = people
    db.commit()
    return session_out(s)


@router.delete("/{group_id}/sessions/{session_id}")
def delete_session(group_id: int, session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    group, mine = load_group(db, group_id, current_user, need_accepted=True)
    s = db.get(StudySession, session_id)
    if not s or s.group_id != group.id:
        raise HTTPException(status_code=404, detail="Session not found")
    if s.created_by != current_user.id and mine.role != "admin":
        raise HTTPException(status_code=403, detail="Only the person who planned it can cancel this session.")
    db.delete(s)
    db.commit()
    return {"message": "Session cancelled"}


# --- feedback ---------------------------------------------------------------------------

@router.post("/{group_id}/feedback")
def give_group_feedback(group_id: int, data: GroupFeedbackCreate, db: Session = Depends(get_db),
                        current_user: User = Depends(get_current_user)):
    group, _ = load_group(db, group_id, current_user, need_accepted=True)
    row = db.query(GroupFeedback).filter(GroupFeedback.group_id == group.id, GroupFeedback.user_id == current_user.id).first()
    if not row:
        row = GroupFeedback(group_id=group.id, user_id=current_user.id)
        db.add(row)
    for field, value in data.model_dump().items():
        setattr(row, field, value)
    db.commit()
    try:
        optimize_matching_weights(db)
    except Exception as exc:
        print("weight learning failed:", exc)
    return {"message": "Thanks - your feedback helps the AI match better."}
