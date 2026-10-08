from fastapi import APIRouter

from routes import admin, ai, auth, availability, groups, matches, messages, notifications, preferences, sessions, survey, users

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(preferences.router, prefix="/preferences", tags=["Preferences"])
api_router.include_router(matches.router, prefix="/matches", tags=["Matches"])
api_router.include_router(groups.router, prefix="/groups", tags=["Study Groups"])
api_router.include_router(messages.router, prefix="/groups", tags=["Group Messaging"])
api_router.include_router(availability.router, prefix="/availability", tags=["Availability"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["Sessions"])
api_router.include_router(survey.router, prefix="/survey", tags=["Evaluation survey"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Dashboard"])
api_router.include_router(ai.router, prefix="/ai", tags=["Study tips"])
