from fastapi.testclient import TestClient
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import app

def test_login_500():
    client = TestClient(app)
    print("--- SIMULATING LOGIN POST REQUEST ---")
    payload = {
        "username": "james80@example.net",
        "password": "password123"
    }
    try:
        response = client.post("/api/v1/auth/login", data=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 500:
            print("REPRODUCED: The server returned a 500 Internal Error.")
    except Exception as e:
        print(f"Crashed during request: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_login_500()
