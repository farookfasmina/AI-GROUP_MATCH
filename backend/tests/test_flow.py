"""End-to-end test of the main workflow against a throw-away SQLite database.

Run from the backend folder:  python -m pytest -q
"""
import os
import sys
import tempfile

DB_FILE = os.path.join(tempfile.mkdtemp(), "test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{DB_FILE}"
os.environ["SEED_DEMO"] = "true"
os.environ["SECRET_KEY"] = "test-secret"
os.environ["ADMIN_PASSWORD"] = "Admin@1234"
os.environ["UPLOAD_DIR"] = os.path.join(tempfile.mkdtemp(), "uploads")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

API = "/api/v1"


def login(client, email, password):
    r = client.post(f"{API}/auth/login", data={"username": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_full_student_and_admin_flow():
    with TestClient(app) as client:
        # 1. Register a new student
        r = client.post(f"{API}/auth/register", json={"email": "new.student@uni.lk", "password": "Passw0rd!",
                                                      "full_name": "New Student", "university": "Horizon Campus"})
        assert r.status_code == 200, r.text
        assert r.json()["profile_complete"] is False
        h = login(client, "new.student@uni.lk", "Passw0rd!")

        # 2. Matches are refused before consent (ethics)
        assert client.get(f"{API}/matches/me", headers=h).status_code == 400

        # 3. Consent, preferences and free time
        assert client.post(f"{API}/users/me/consent", headers=h).json()["consent_given"] is True
        r = client.put(f"{API}/preferences/me", headers=h, json={
            "subjects_of_interest": "Database Systems, Web Development",
            "subject_levels": {"Database Systems": "Beginner", "Web Development": "Advanced"},
            "competency_level": "Intermediate", "learning_style": "Visual", "communication_preference": "Video",
            "preferred_study_type": "Group", "collaboration_tendency": "Focused Learner", "preferred_group_size": 4})
        assert r.status_code == 200, r.text
        slots = [{"day_of_week": d, "start_time": "18:00", "end_time": "21:00"} for d in ("Monday", "Tuesday", "Thursday")]
        assert client.post(f"{API}/availability", headers=h, json=slots).status_code == 200
        assert client.get(f"{API}/users/me", headers=h).json()["profile_complete"] is True

        # 4. KNN matches with explanations
        matches = client.get(f"{API}/matches/me", headers=h).json()
        assert 0 < len(matches) <= 5
        assert all("explanation" in m and 0 <= m["compatibility_score"] <= 100 for m in matches)

        # 5. Partner request -> the other student accepts -> private group
        partner = matches[0]["target_user_id"]
        assert client.post(f"{API}/matches/{partner}/connect", headers=h).status_code == 200
        admin_h = login(client, "admin@studymatch.lk", "Admin@1234")
        users = client.get(f"{API}/admin/users", headers=admin_h).json()
        partner_email = next(u["email"] for u in users if u["id"] == partner)
        ph = login(client, partner_email, "Demo@1234")
        me_id = client.get(f"{API}/users/me", headers=h).json()["id"]
        group_id = client.post(f"{API}/matches/{me_id}/accept", headers=ph).json()["group_id"]
        # The same group is found again from either side (old bug: could return someone else's group)
        assert client.post(f"{API}/matches/{partner}/init-private-group", headers=h).json()["group_id"] == group_id

        # 6. Chat, session, attendance rules, feedback
        assert client.post(f"{API}/groups/{group_id}/messages", headers=h, json={"content": "Hello!"}).status_code == 200
        assert len(client.get(f"{API}/groups/{group_id}/messages", headers=ph).json()) == 1
        s = client.post(f"{API}/groups/{group_id}/sessions", headers=h,
                        json={"title": "First session", "start_time": "2030-01-01T18:00:00Z", "duration_minutes": 60})
        assert s.status_code == 200, s.text
        assert client.post(f"{API}/groups/{group_id}/sessions/{s.json()['id']}/attend", headers=h).status_code == 400
        fb = {"compatibility_rating": 5, "collaboration_quality": 4, "scheduling_ease": 4}
        assert client.post(f"{API}/matches/{partner}/feedback", headers=h, json=fb).status_code == 200

        # 7. Outsiders cannot read the private group
        other = next(u for u in users if u["is_demo"] and u["id"] not in (partner, me_id))
        oh = login(client, other["email"], "Demo@1234")
        assert client.get(f"{API}/groups/{group_id}/messages", headers=oh).status_code == 403

        # 8. AI group formation finds a group for the new student, who can accept it
        r = client.post(f"{API}/matches/find-group", headers=h)
        assert r.status_code == 200, r.text
        invites = [g for g in client.get(f"{API}/groups/me", headers=h).json() if g["my_status"] == "pending"]
        if invites:
            r = client.post(f"{API}/groups/{invites[0]['id']}/respond", headers=h, json={"accept": True})
            assert r.json()["my_status"] == "accepted"

        # 9. Survey and admin evaluation
        r = client.post(f"{API}/survey", headers=h, json={"sus_answers": [5, 1, 5, 1, 5, 1, 5, 1, 5, 1],
                                                          "fairness": 4, "usefulness": 5, "ease": 5})
        assert r.json()["sus_score"] == 100.0
        a = client.get(f"{API}/admin/analytics", headers=admin_h).json()
        assert a["ai_vs_random"]["ai_avg"] > a["ai_vs_random"]["random_avg"]
        assert client.get(f"{API}/admin/export/feedback", headers=admin_h).status_code == 200
        assert client.get(f"{API}/admin/stats", headers=h).status_code == 403

        # 10. Admin can delete a student who has messages, feedback and groups (old bug: failed)
        assert client.delete(f"{API}/admin/users/{me_id}", headers=admin_h).status_code == 200
        # ...and remove all demo data in one click
        assert client.post(f"{API}/admin/demo/clear", headers=admin_h).json()["removed"] > 0


def test_reset_password_uses_body_not_url():
    with TestClient(app) as client:
        r = client.post(f"{API}/auth/reset-password", json={"token": "bad", "new_password": "Whatever123"})
        assert r.status_code == 400
