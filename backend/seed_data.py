import sys
import os
import random
from datetime import time

# Ensure imports work when running directly from the backend directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import SessionLocal, Base, engine
from models.all_models import User, Preference, Availability, StudyGroup, Membership, Notification
from core.security import get_password_hash
from faker import Faker

fake = Faker()

# Mock Choice Configurations
DEPARTMENTS = ["Computer Science", "Information Technology", "Mathematics", "Physics", "Engineering", "Business", "Biology", "Psychology"]
ACADEMIC_YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"]
SUBJECTS = [
    "Calculus I", "Data Structures", "Algorithms", "Machine Learning", 
    "Quantum Physics", "Organic Chemistry", "Macroeconomics", 
    "Cognitive Psychology", "Linear Algebra", "Database Systems",
    "Computer Networks", "Cybersecurity", "Ethics", "Modern Literature"
]
LEARNING_STYLES = ["Visual", "Auditory", "Reading/Writing", "Kinesthetic"]
COMMUNICATIONS = ["Discord", "WhatsApp", "Zoom", "In-Person", "Slack", "Email", "Microsoft Teams"]
COMPETENCY_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"]
DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

def seed_database():
    print("Initializing Database...")
    # This automatically builds any missing tables based on all_models.py
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        print("Creating 50 Users with Preferences and Availabilities...")
        users = []
        
        # --- ENSURE STABLE TEST USER FOR VIVA ---
        test_user_email = "james80@example.net"
        existing_test_user = db.query(User).filter(User.email == test_user_email).first()
        if not existing_test_user:
            viva_user = User(
                email=test_user_email,
                hashed_password=get_password_hash("password123"),
                full_name="James Viva admin",
                university="Main Campus University",
                department="Computer Science",
                academic_year="Senior",
                is_platform_admin=True
            )
            db.add(viva_user)
            db.commit()
            db.refresh(viva_user)
            users.append(viva_user)
            print(f"Created Viva Admin: {test_user_email}")
        else:
            users.append(existing_test_user)
            print(f"Viva Admin already exists: {test_user_email}")
        
        # Create remaining users (50 total)
        for _ in range(50 - len(users)):
            # 1. User Account
            user = User(
                email=fake.unique.email(),
                hashed_password=get_password_hash("password123"), # default password for dummy sets
                full_name=fake.name(),
                university=fake.city() + " University",
                department=random.choice(DEPARTMENTS),
                academic_year=random.choice(ACADEMIC_YEARS)
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            users.append(user)
            
            # 2. Preference (2 to 4 subjects)
            selected_subjects = random.sample(SUBJECTS, random.randint(2, 4))
            pref = Preference(
                user_id=user.id,
                subjects_of_interest=", ".join(selected_subjects),
                learning_style=random.choice(LEARNING_STYLES),
                communication_preference=random.choice(COMMUNICATIONS),
                competency_level=random.choice(COMPETENCY_LEVELS)
            )
            db.add(pref)
            
            # 3. Availability (exactly 2 slots)
            for _ in range(2):
                start_h = random.randint(8, 18) # Between 8 AM and 6 PM
                end_h = start_h + random.randint(1, 3) # 1 to 3 hours later
                avail = Availability(
                    user_id=user.id,
                    day_of_week=random.choice(DAYS_OF_WEEK),
                    start_time=time(hour=start_h, minute=0),
                    end_time=time(hour=end_h, minute=0)
                )
                db.add(avail)
                
            db.commit()
            
        print("Creating 8 Study Groups and adding Memberships...")
        study_groups = []
        for _ in range(8):
            # 4. Study Group Details
            creator = random.choice(users)
            group_subject = random.choice(SUBJECTS)
            group = StudyGroup(
                name=f"{group_subject} {fake.catch_phrase()}",
                description=fake.paragraph(nb_sentences=3),
                subject=group_subject,
                creator_id=creator.id
            )
            db.add(group)
            db.commit()
            db.refresh(group)
            study_groups.append(group)
            
            # 5. Memberships (Creator defaults to Admin)
            admin_membership = Membership(
                user_id=creator.id,
                group_id=group.id,
                role="admin"
            )
            db.add(admin_membership)
            
            # Random regular members (3 to 6 matching)
            potential_members = [u for u in users if u.id != creator.id]
            group_members = random.sample(potential_members, random.randint(3, 6))
            for member in group_members:
                user_membership = Membership(
                    user_id=member.id,
                    group_id=group.id,
                    role="member"
                )
                db.add(user_membership)
                
            db.commit()
            
        print("Generating Notifications...")
        for user in users:
            # Random chance to have some notifications
            if random.random() > 0.4:
                notif = Notification(
                    user_id=user.id,
                    message=random.choice([
                        "Welcome to the AI Study Match Platform!",
                        "You have a new group recommendation based on your syllabus.",
                        f"A new session starts soon on {random.choice(DAYS_OF_WEEK)}.",
                        "Someone joined your study group!"
                    ]),
                    is_read=random.choice([True, False])
                )
                db.add(notif)
        db.commit()
        
        print("====== Database Seeded Successfully! ======")
        print(f"Generated {len(users)} users.")
        print(f"Generated {len(study_groups)} groups.")
        print("Password for all test users is: 'password123'")
        
    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
