from fastapi.testclient import TestClient
from app.main import app
from core.database import SessionLocal
from models.all_models import User

# This lets us emulate browser requests directly against the app without a running server!
client = TestClient(app)

def run_demo():
    print("========================================")
    print("      AI SYSTEM BACKEND ROUTE DEMO      ")
    print("========================================")

    # 1. Grab a dummy user from the database we just seeded
    db = SessionLocal()
    first_user = db.query(User).first()
    db.close()

    if not first_user:
        print("Error: Database has no users! Did you run seed_data.py?")
        return
        
    print(f"\n[1] Found seeded user: {first_user.email}")
    print("    Attempting to log in as this user to get a JWT Token...")

    # 2. Test the /login endpoint (OAuth2 requires form-data 'username' and 'password')
    # Because we patched bcrypt properly, 'password123' works flawlessy!
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": first_user.email, "password": "password123"}
    )

    if login_response.status_code != 200:
        print(f"Login failed! Status: {login_response.status_code}")
        print(login_response.json())
        return
        
    token_data = login_response.json()
    access_token = token_data["access_token"]
    print("\n[SUCCESS] Login Route (/api/v1/auth/login) validated!")
    print(f"Generated JWT Token:\n{access_token[:50]}... (truncated)")

    # 3. Test the protected /me endpoint using the Token
    print("\n[2] Attempting to access Protected Route (/api/v1/users/me)")
    print("    Attaching the JWT token to the Authorization header...")
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    me_response = client.get("/api/v1/users/me", headers=headers)

    if me_response.status_code != 200:
        print(f"Profile fetch failed! Status: {me_response.status_code}")
        print(me_response.json())
        return

    profile_data = me_response.json()
    print("\n[SUCCESS] Protected Route (/api/v1/users/me) validated!")
    print("\n[User Profile Data Returned]")
    for key, value in profile_data.items():
        print(f" - {key}: {value}")

    print("\n========================================")
    print("          DEMO COMPLETED                ")
    print("========================================")

if __name__ == "__main__":
    run_demo()
