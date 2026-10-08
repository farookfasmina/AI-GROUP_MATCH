from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import create_access_token, create_reset_token, get_password_hash, verify_password, verify_reset_token
from models.all_models import User
from routes.users import user_profile
from schemas.token import Token
from schemas.user import ForgotPasswordIn, ResetPasswordIn, UserCreate
from utils.email import send_reset_email

router = APIRouter()


@router.post("/register")
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new student account."""
    email = user_in.email.lower()
    if db.query(User).filter(func.lower(User.email) == email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists - sign in instead.")
    user = User(
        email=email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name.strip(),
        university=user_in.university,
        department=user_in.department,
        academic_year=user_in.academic_year,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user_profile(user)


@router.post("/login", response_model=Token)
def login_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    """OAuth2 password login (the 'username' field holds the email)."""
    user = db.query(User).filter(func.lower(User.email) == form_data.username.strip().lower()).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"access_token": create_access_token(data={"sub": str(user.id)}), "token_type": "bearer"}


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordIn, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Email a 15-minute reset link. Always answers the same, so nobody can test which emails exist."""
    user = db.query(User).filter(func.lower(User.email) == data.email.lower()).first()
    if user:
        background_tasks.add_task(send_reset_email, user.email, create_reset_token(user.email))
    return {"status": "success", "message": "If an account exists with this email, reset instructions have been sent."}


@router.post("/reset-password")
def reset_password(data: ResetPasswordIn, db: Session = Depends(get_db)):
    """Set a new password with a valid reset token. (Sent in the request body, never in the URL,
    so the password does not end up in server logs.)"""
    email = verify_reset_token(data.token)
    if not email:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired - request a new one.")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="The account for this link no longer exists.")
    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"status": "success", "message": "Password updated. You can now sign in."}
