from fastapi.testclient import TestClient
from app.main import app
from core.database import SessionLocal
from models.all_models import User, StudyGroup, Membership, StudySession, Notification
from datetime import datetime, timedelta

client = TestClient(app)

def test_platform_features():
    print("Starting Full Platform Integration Test...")
    
    # 1. Database Connection Check
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        print(f"DB Connection: OK (Found {user_count} users)")
    except Exception as e:
        print(f"DB Connection Error: {e}")
        return
    
    # Grab a test user (seeded via seed_data.py)
    test_user = db.query(User).first()
    if not test_user:
        print("Error: No users found. Run seed_data.py first.")
        return
    db.close()

    email = test_user.email
    password = "password123"
    
    print(f"Testing with User: {email}")

    # 2. Auth: Login
    print("\n--- Testing Authentication ---")
    login_res = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    if login_res.status_code == 200:
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login: SUCCESS")
    else:
        print(f"Login: FAILED ({login_res.status_code})")
        print(login_res.json())
        return

    # 3. Users: Me
    print("\n--- Testing User Profile ---")
    me_res = client.get("/api/v1/users/me", headers=headers)
    if me_res.status_code == 200:
        print(f"Get Profile: SUCCESS ({me_res.json()['email']})")
    else:
        print(f"Get Profile: FAILED ({me_res.status_code})")

    # 4. Groups: Create Group
    print("\n--- Testing Group Management ---")
    group_data = {
        "name": "Integration Test Group",
        "description": "Created by automated test",
        "subject": "Testing 101"
    }
    create_group_res = client.post("/api/v1/groups", json=group_data, headers=headers)
    if create_group_res.status_code == 200:
        group_id = create_group_res.json()["id"]
        print(f"Create Group: SUCCESS (ID: {group_id})")
    else:
        print(f"Create Group: FAILED ({create_group_res.status_code})")
        print(create_group_res.json())
        return

    # 5. Groups: List Groups
    list_groups_res = client.get("/api/v1/groups", headers=headers)
    if list_groups_res.status_code == 200:
        print(f"List Groups: SUCCESS ({len(list_groups_res.json())} groups found)")
    else:
        print(f"List Groups: FAILED")

    # 6. Sessions: Create Session
    print("\n--- Testing Study Sessions ---")
    session_data = {
        "title": "Exam Review",
        "start_time": (datetime.utcnow() + timedelta(days=1)).isoformat(),
        "duration_minutes": 90,
        "location": "Virtual Library"
    }
    create_session_res = client.post(f"/api/v1/groups/{group_id}/sessions", json=session_data, headers=headers)
    if create_session_res.status_code == 200:
        print("Create Session: SUCCESS")
    else:
        print(f"Create Session: FAILED ({create_session_res.status_code})")
        print(create_session_res.json())

    # 7. Sessions: List My Sessions
    my_sessions_res = client.get("/api/v1/sessions/me", headers=headers)
    if my_sessions_res.status_code == 200:
        print(f"List My Sessions: SUCCESS ({len(my_sessions_res.json())} sessions found)")
    else:
        print(f"List My Sessions: FAILED")

    # 8. Notifications: List
    print("\n--- Testing Notifications ---")
    notif_res = client.get("/api/v1/notifications", headers=headers)
    if notif_res.status_code == 200:
        print(f"List Notifications: SUCCESS ({len(notif_res.json())} items)")
    else:
        print(f"List Notifications: FAILED")

    # 9. AI: Basic Check
    print("\n--- Testing AI Service ---")
    ai_res = client.get("/api/v1/ai/insights", headers=headers)
    if ai_res.status_code == 200:
        print(f"AI Insights: SUCCESS ({len(ai_res.json())} items)")
    else:
        print(f"AI Insights: Returned {ai_res.status_code}")

    # 10. Feedback: Submit Feedback Check
    print("\n--- Testing Match Feedback ---")
    matches_res = client.get("/api/v1/matches/me", headers=headers)
    if matches_res.status_code == 200 and len(matches_res.json()) > 0:
        target_user_id = matches_res.json()[0]["target_user_id"]
        feedback_data = {
            "compatibility_rating": 5,
            "collaboration_quality": 4,
            "scheduling_ease": 4,
            "feedback_text": "Great collaboration during our test study session!"
        }
        feedback_res = client.post(f"/api/v1/matches/{target_user_id}/feedback", json=feedback_data, headers=headers)
        if feedback_res.status_code == 200:
            print("Submit Match Feedback: SUCCESS")
        else:
            print(f"Submit Match Feedback: FAILED ({feedback_res.status_code})")
            print(feedback_res.json())
    else:
        print("Submit Match Feedback: SKIPPED (No matches found)")

    # 11. Admin Weights & Optimization Test
    print("\n--- Testing Admin AI Weight Tuning ---")
    db = SessionLocal()
    admin_user = db.query(User).filter(User.is_platform_admin == True).first()
    db.close()
    
    if admin_user:
        admin_login = client.post("/api/v1/auth/login", data={"username": admin_user.email, "password": "password123"})
        if admin_login.status_code == 200:
            admin_token = admin_login.json()["access_token"]
            admin_headers = {"Authorization": f"Bearer {admin_token}"}
            
            # Fetch Weights
            w_res = client.get("/api/v1/admin/weights", headers=admin_headers)
            if w_res.status_code == 200:
                print(f"GET Admin Weights: SUCCESS")
            else:
                print(f"GET Admin Weights: FAILED ({w_res.status_code})")
                
            # Run Optimization
            opt_res = client.post("/api/v1/admin/optimize-weights", headers=admin_headers)
            if opt_res.status_code == 200:
                print(f"POST Optimize Weights: SUCCESS")
            else:
                print(f"POST Optimize Weights: FAILED ({opt_res.status_code})")
        else:
            print("Admin Login: FAILED")
    else:
        print("Admin AI Tuning Check: SKIPPED (No admin found in DB)")



    print("\n========================================")
    print("      INTEGRATION TEST COMPLETED        ")
    print("========================================")

if __name__ == "__main__":
    test_platform_features()
