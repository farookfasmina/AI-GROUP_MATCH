"""Start-up data: subject catalogue, first admin and (optionally) demo students.

Demo students are flagged is_demo, so Admin -> Overview -> "Remove demo data" deletes them
and everything they created before real research data is collected.
"""
import random
import secrets
from datetime import datetime, time, timedelta

from sqlalchemy.orm import Session

from core.config import settings
from core.security import get_password_hash
from models.all_models import (
    Availability, GroupFeedback, GroupMessage, Notification, Preference, StudyGroup, StudySession, Subject,
    SurveyResponse, User,
)
from services.group_formation import run_group_formation
from services.matching_service import DAYS, optimize_matching_weights

SUBJECTS = [
    ("IT1010", "Programming Fundamentals"), ("IT2020", "Data Structures & Algorithms"),
    ("IT2030", "Database Systems"), ("IT2040", "Web Development"), ("IT3010", "Computer Networks"),
    ("IT3020", "Software Engineering"), ("IT3030", "Machine Learning"), ("IT3040", "Mobile App Development"),
    ("IT2050", "Statistics"), ("IT3050", "Information Security"),
]
DEMO_PASSWORD = "Demo@1234"
FEATURED = "student@demo.lk"

FIRST = ["Amaya", "Nimal", "Kavindu", "Sahan", "Dilini", "Ishara", "Tharushi", "Ravindu", "Nadeesha", "Pasindu",
         "Fathima", "Aysha", "Mohamed", "Rizwan", "Shifna", "Hasna", "Arjun", "Kavya", "Priya", "Saman",
         "Thilini", "Chamod", "Ruwan", "Sachini", "Hiruni", "Yasiru", "Imesha", "Dinuka", "Nethmi", "Lahiru",
         "Zainab", "Ifham", "Keerthana", "Vithursan", "Shalini", "Ashan", "Malsha", "Oshadi", "Janith", "Senuri",
         "Rashmi", "Tharindu", "Nuwan", "Sewmini", "Akeel", "Rifka", "Harini", "Dulaj"]
LAST = ["Perera", "Fernando", "Silva", "Jayasinghe", "Bandara", "Wickramasinghe", "Rathnayake", "Herath", "Nizam",
        "Rahman", "Kumar", "Sivakumar", "Gunawardena", "Dissanayake", "Mendis", "Hussain"]
DEPARTMENTS = ["Information Technology", "Software Engineering", "Networking & Mobile Computing", "Data Science"]
BLOCKS = [(8, 11), (9, 12), (13, 16), (14, 17), (18, 20), (18, 21), (19, 22)]
CHAT = ["Hi everyone! Looking forward to studying together.", "Does {slot} work for our first meeting?",
        "Works for me!", "I'll bring my notes from the last lecture.",
        "Can someone explain the last tutorial question? I got stuck.", "Sure - I'll go through it when we meet.",
        "Great session today, thanks all.", "I shared the past papers in the chat."]


def seed_subjects(db: Session):
    if db.query(Subject).count():
        return
    for code, name in SUBJECTS:
        db.add(Subject(code=code, name=name))
    db.commit()


def seed_admin(db: Session):
    if db.query(User).filter(User.is_platform_admin.is_(True)).first():
        return
    password = settings.ADMIN_PASSWORD or ("Admin@1234" if settings.SEED_DEMO else secrets.token_urlsafe(12))
    if not settings.ADMIN_PASSWORD:
        print(f"Admin account {settings.ADMIN_EMAIL} created with password: {password} (set ADMIN_PASSWORD to choose one)")
    db.add(User(email=settings.ADMIN_EMAIL.lower(), hashed_password=get_password_hash(password),
                full_name="Platform Admin", university="Horizon Campus", is_platform_admin=True, consent_given=True))
    db.commit()


def _pick(rng, options):
    values, weights = zip(*options)
    return rng.choices(values, weights=weights, k=1)[0]


def seed_demo(db: Session):
    if not settings.SEED_DEMO or db.query(User).filter(User.is_demo.is_(True)).first():
        return
    rng = random.Random(2026)
    names = [s[1] for s in SUBJECTS]
    popularity = [3, 6, 6, 5, 2, 4, 5, 3, 2, 2]
    pw = get_password_hash(DEMO_PASSWORD)
    users = []
    for i in range(48):
        first, last = FIRST[i], LAST[(i * 7) % len(LAST)]
        u = User(email=FEATURED if i == 0 else f"{first.lower()}.{last.lower()}{i}@demo.lk", hashed_password=pw,
                 full_name=f"{first} {last}", university="Horizon Campus", department=rng.choice(DEPARTMENTS),
                 academic_year=f"Year {rng.randint(1, 4)}", is_demo=True, consent_given=True,
                 created_at=datetime.utcnow() - timedelta(days=rng.randint(1, 28)))
        u.consent_at = u.created_at
        if i == 0:
            subjects = ["Data Structures & Algorithms", "Database Systems"]
            levels = {"Data Structures & Algorithms": "Beginner", "Database Systems": "Advanced"}
        else:
            subjects = list(dict.fromkeys(rng.choices(names, weights=popularity, k=rng.randint(1, 3))))
            levels = {s: _pick(rng, [("Beginner", 3), ("Intermediate", 5), ("Advanced", 3), ("Expert", 1)]) for s in subjects}
        u.preference = Preference(
            subjects_of_interest=", ".join(subjects), subject_levels=levels,
            competency_level=_pick(rng, [("Beginner", 3), ("Intermediate", 5), ("Advanced", 3), ("Expert", 1)]),
            learning_style=rng.choice(["Visual", "Auditory", "Reading/Writing", "Kinesthetic"]),
            communication_preference=_pick(rng, [("Text", 3), ("Voice", 2), ("Video", 3), ("In-Person", 3)]),
            preferred_study_type="Either" if i == 0 else _pick(rng, [("Group", 5), ("Buddy", 2), ("Either", 3)]),
            collaboration_tendency=_pick(rng, [("Collaborative Peer", 5), ("Driven Leader", 2), ("Focused Learner", 3)]),
            preferred_group_size=_pick(rng, [(3, 3), (4, 5), (5, 2)]),
        )
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Saturday"] if i == 0 else rng.sample(DAYS, rng.randint(2, 4))
        blocks = [(18, 21)] if i == 0 else rng.sample(BLOCKS, rng.randint(1, 2))
        for d in days:
            for start, end in blocks:
                u.availabilities.append(Availability(day_of_week=d, start_time=time(start), end_time=time(end)))
        db.add(u)
        users.append(u)
    db.commit()

    run_group_formation(db, trigger="seed")
    featured = users[0]
    now = datetime.utcnow()
    proposed = db.query(StudyGroup).filter(StudyGroup.status == "proposed").all()
    keep_pending = next((g for g in proposed if any(m.user_id == featured.id for m in g.memberships)), None)
    for g in proposed:
        g.created_at = now - timedelta(days=rng.randint(10, 18))
        for m in g.memberships:
            m.status = "accepted"
            m.joined_at = g.created_at + timedelta(hours=rng.randint(1, 30))
        if g is keep_pending:
            # The demo student keeps one invitation to accept, to show the whole flow.
            next(m for m in g.memberships if m.user_id == featured.id).status = "pending"
            g.created_at = now - timedelta(hours=2)
            continue
        g.status = "active"
        ids = [m.user_id for m in g.memberships]
        for k, line in enumerate(CHAT[: rng.randint(3, len(CHAT))]):
            db.add(GroupMessage(group_id=g.id, sender_id=ids[k % len(ids)], content=line.format(slot=g.meeting_slot or "this week"),
                                created_at=g.created_at + timedelta(hours=5 + k * 7)))
        show_up = 0.45 + 0.6 * max(0.0, (g.match_score or 50) / 100 - 0.45)
        for k in range(rng.randint(1, 3)):
            db.add(StudySession(group_id=g.id, title=f"{g.subject} revision #{k + 1}",
                                start_time=now - timedelta(days=9 - k * 3, hours=rng.randint(0, 4)),
                                duration_minutes=rng.choice([60, 90, 120]), location=rng.choice(["Library room 2", "Google Meet", "Lab 4"]),
                                created_by=ids[0], attendees=[x for x in ids if rng.random() < show_up]))
        if rng.random() < 0.6 or featured.id in ids:
            db.add(StudySession(group_id=g.id, title=f"{g.subject} practice", start_time=now + timedelta(days=rng.randint(1, 6), hours=3),
                                duration_minutes=90, location="Google Meet", created_by=ids[-1], attendees=[]))
        for uid in ids:
            if uid == featured.id or rng.random() > 0.75:
                continue
            mean = 2.0 + 3.0 * ((g.match_score or 50) / 100 - 0.5) / 0.35
            r = lambda: max(1, min(5, round(rng.gauss(mean, 0.7))))
            c = r()
            db.add(GroupFeedback(group_id=g.id, user_id=uid, compatibility_rating=c, collaboration_quality=r(),
                                 scheduling_ease=max(1, min(5, round(rng.gauss(4.2, 0.6)))), would_continue=c >= 3,
                                 feedback_text=rng.choice(["", "", "Good mix of skills.", "Hard to find a time sometimes.",
                                                           "Really helpful group!", "One member rarely joined."]),
                                 created_at=now - timedelta(days=rng.randint(0, 4))))
    for u in users[1:]:
        if rng.random() < 0.55:
            base = rng.choice([4, 4, 5, 3])
            answers = [max(1, min(5, round(rng.gauss(base if q % 2 == 0 else 6 - base, 0.6)))) for q in range(10)]
            score = sum((a - 1) if q % 2 == 0 else (5 - a) for q, a in enumerate(answers)) * 2.5
            db.add(SurveyResponse(user_id=u.id, sus_answers=answers, sus_score=score, fairness=rng.choice([3, 4, 4, 5]),
                                  usefulness=rng.choice([3, 4, 5, 5]), ease=rng.choice([4, 4, 5, 3])))
    db.query(Notification).filter(Notification.user_id != featured.id).update({"is_read": True})
    db.commit()
    try:
        optimize_matching_weights(db, note="Learned from demo feedback (seed data)")
    except Exception as exc:  # optional - the admin can press "Re-learn from feedback" later
        db.rollback()
        print("Demo weight learning skipped:", exc)


def seed(db: Session):
    seed_subjects(db)
    seed_admin(db)
    seed_demo(db)
