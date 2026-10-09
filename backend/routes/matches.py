from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from core.database import get_db
from core.deps import get_current_user
from models.all_models import MatchFeedback, Membership, Notification, StudyGroup, User
from schemas.feedback import FeedbackCreate
from services.group_formation import notify, run_group_formation
from services.matching_service import get_top_user_matches, optimize_matching_weights

router = APIRouter()


def buddy_group_between(db: Session, a: int, b: int):
    """The private 1-to-1 group two students already share (fixes the old lookup, which could
    return another student's match group)."""
    groups = (db.query(StudyGroup).join(Membership)
              .filter(StudyGroup.kind == "buddy", StudyGroup.status != "closed", Membership.user_id == a).all())
    for g in groups:
        ids = {m.user_id for m in g.memberships if m.status != "declined"}
        if b in ids:
            return g
    return None


@router.get("/me")
def get_my_matches(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Top 5 study partners: KNN finds similar students, then compatibility re-ranks them."""
    if not current_user.consent_given:
        raise HTTPException(status_code=400, detail="Please agree to the consent statement first.")
    if not current_user.preference or not current_user.preference.subjects_of_interest:
        raise HTTPException(status_code=400, detail="Add your subjects in Preferences to get matches.")
    # One query for everyone's preferences and free time (not one per student) keeps this fast.
    others = (db.query(User).filter(User.id != current_user.id)
              .options(selectinload(User.preference), selectinload(User.availabilities)).all())
    matches = get_top_user_matches(current_user, others, top_n=5)
    requested = {n.user_id for n in db.query(Notification).filter(
        Notification.type == "match_request", Notification.payload_id == current_user.id, Notification.is_read.is_(False))}
    rated = {f.matched_user_id for f in db.query(MatchFeedback).filter(MatchFeedback.user_id == current_user.id)}
    partners = {}
    for m in db.query(Membership).join(StudyGroup).filter(Membership.user_id == current_user.id, StudyGroup.kind == "buddy",
                                                          StudyGroup.status != "closed"):
        for other in m.group.memberships:
            if other.user_id != current_user.id and other.status != "declined":
                partners[other.user_id] = m.group_id
    for m in matches:
        m["partner_group_id"] = partners.get(m["target_user_id"])
        m["requested"] = m["target_user_id"] in requested
        m["rated"] = m["target_user_id"] in rated
    return matches


@router.post("/find-group")
def find_my_group(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Run AI group formation for this student's subjects right now (instead of waiting for an admin)."""
    pref = current_user.preference
    if not current_user.consent_given or not pref or not pref.subjects_of_interest or not current_user.availabilities:
        raise HTTPException(status_code=400, detail="Complete your preferences and free time first.")
    subjects = [s.strip() for s in pref.subjects_of_interest.split(",") if s.strip()]
    run = run_group_formation(db, subjects=subjects, trigger="student", started_by=current_user.id)
    mine = (db.query(Membership).join(StudyGroup)
            .filter(Membership.user_id == current_user.id, StudyGroup.run_id == run.id).count())
    if mine:
        return {"found": mine, "message": f"Found {mine} new group{'s' if mine > 1 else ''} for you - see your invitations."}
    return {"found": 0, "message": "No new group yet - not enough students share your free time. We will keep trying."}


@router.post("/{target_user_id}/connect")
def connect_with_match(target_user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Send a study-partner request."""
    target = db.get(User, target_user_id)
    if not target or target.id == current_user.id:
        raise HTTPException(status_code=404, detail="Student not found")
    if buddy_group_between(db, current_user.id, target.id):
        raise HTTPException(status_code=400, detail="You are already study partners.")
    already = db.query(Notification).filter(Notification.user_id == target.id, Notification.type == "match_request",
                                            Notification.payload_id == current_user.id, Notification.is_read.is_(False)).first()
    if already:
        return {"message": "Request already sent"}
    notify(db, target.id, f"{current_user.full_name or current_user.email} would like to study with you.",
           "match_request", current_user.id, "/notifications")
    db.commit()
    return {"message": "Request sent"}


@router.post("/{sender_id}/accept")
def accept_request(sender_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Accept a study-partner request: creates (or reopens) the private buddy group for the two students."""
    sender = db.get(User, sender_id)
    if not sender:
        raise HTTPException(status_code=404, detail="Student not found")
    group = buddy_group_between(db, current_user.id, sender.id)
    if not group:
        group = StudyGroup(name=f"{sender.full_name} & {current_user.full_name}", subject="Study partners",
                           description="Private study-partner group.", creator_id=sender.id, kind="buddy", status="active")
        db.add(group)
        db.flush()
        db.add(Membership(user_id=sender.id, group_id=group.id, role="admin", status="accepted"))
        db.add(Membership(user_id=current_user.id, group_id=group.id, role="admin", status="accepted"))
    db.query(Notification).filter(Notification.user_id == current_user.id, Notification.type == "match_request",
                                  Notification.payload_id == sender.id).update({"is_read": True})
    notify(db, sender.id, f"{current_user.full_name} accepted your study request - say hello in your private group.",
           "group", group.id, f"/groups/{group.id}")
    db.commit()
    return {"group_id": group.id, "name": group.name}


@router.post("/{target_user_id}/init-private-group")
def init_private_group(target_user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return the private group shared with a partner (used before scheduling a session)."""
    group = buddy_group_between(db, current_user.id, target_user_id)
    if not group:
        raise HTTPException(status_code=400, detail="Send a request first - you can schedule once they accept.")
    return {"group_id": group.id, "name": group.name}


@router.post("/{target_user_id}/feedback")
def submit_match_feedback(target_user_id: int, feedback: FeedbackCreate, db: Session = Depends(get_db),
                          current_user: User = Depends(get_current_user)):
    """Rate a study partner. Every rating is training data for the matching model."""
    if not db.get(User, target_user_id):
        raise HTTPException(status_code=404, detail="Student not found")
    row = db.query(MatchFeedback).filter(MatchFeedback.user_id == current_user.id,
                                         MatchFeedback.matched_user_id == target_user_id).first()
    if not row:
        row = MatchFeedback(user_id=current_user.id, matched_user_id=target_user_id)
        db.add(row)
    for field, value in feedback.model_dump().items():
        setattr(row, field, value)
    db.commit()
    try:
        optimize_matching_weights(db)
    except Exception as exc:  # learning must never stop feedback from being saved
        print("weight learning failed:", exc)
    return {"message": "Thanks - your feedback was saved."}
