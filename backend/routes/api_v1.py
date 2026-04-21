from fastapi import APIRouter
from routes import auth, users, preferences, matches, groups, availability, notifications, sessions, admin, messages, ai

api_router = APIRouter()

# Combine all individual routers into a single v1 routing tree
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(preferences.router, prefix="/preferences", tags=["Preferences"])
api_router.include_router(matches.router, prefix="/matches", tags=["Matches"])
api_router.include_router(groups.router, prefix="/groups", tags=["Study Groups"])
api_router.include_router(availability.router, prefix="/availability", tags=["Availability"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["Sessions"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Dashboard"])
api_router.include_router(messages.router, prefix="/groups", tags=["Group Messaging"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Study Assistant"])
