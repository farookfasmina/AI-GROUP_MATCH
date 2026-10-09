from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.config import settings
from core.database import get_db
from core.security import create_access_token, get_password_hash, verify_password
from models.all_models import User
from routes.users import user_profile
from schemas.token import Token
from schemas.user import ForgotPasswordIn, ResendCodeIn, ResetPasswordIn, UserCreate, VerifyEmailIn
from services.otp import check_code, check_not_locked, new_code, record_login
from utils.email import send_code_email

router = APIRouter()

NOT_VERIFIED = "Please confirm your email first - enter the 6-digit code we sent you."


def find_user(db: Session, email: str):
    return db.query(User).filter(func.lower(User.email) == email.strip().lower()).first()


@router.post("/register")
def register_user(user_in: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Register a student. With email set up, the account must be confirmed with a 6-digit code."""
    email = user_in.email.lower()
    if find_user(db, email):
        raise HTTPException(status_code=400, detail="An account with this email already exists - sign in instead.")
    user = User(email=email, hashed_password=get_password_hash(user_in.password), full_name=user_in.full_name.strip(),
                university=user_in.university, department=user_in.department, academic_year=user_in.academic_year,
                email_verified=not settings.email_enabled)
    db.add(user)
    db.commit()
    db.refresh(user)
    if not user.email_verified:
        background_tasks.add_task(send_code_email, user.email, new_code(db, user, "verify"), "verify")
    return {**user_profile(user), "verification_required": not user.email_verified}


@router.post("/verify-email")
def verify_email(data: VerifyEmailIn, db: Session = Depends(get_db)):
    """Confirm the email address with the code; signs the student in."""
    user = find_user(db, data.email)
    if not user:
        raise HTTPException(status_code=400, detail="This code has expired - ask for a new one.")
    if not user.email_verified:
        check_code(db, user, "verify", data.code)
        user.email_verified = True
        db.commit()
    return {"access_token": create_access_token(data={"sub": str(user.id)}), "token_type": "bearer"}


@router.post("/resend-code")
def resend_code(data: ResendCodeIn, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Send a fresh code. Answers the same whether or not the account exists."""
    user = find_user(db, data.email)
    if user and settings.email_enabled and not (data.purpose == "verify" and user.email_verified):
        background_tasks.add_task(send_code_email, user.email, new_code(db, user, data.purpose), data.purpose)
    return {"message": "If the account exists, a new code is on its way."}


@router.post("/login", response_model=Token)
def login_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    """OAuth2 password login (the 'username' field holds the email). Five wrong passwords lock the email for 15 minutes."""
    email = form_data.username.strip().lower()
    check_not_locked(db, email)
    user = find_user(db, email)
    if not user or not verify_password(form_data.password, user.hashed_password):
        record_login(db, email, False)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password",
                            headers={"WWW-Authenticate": "Bearer"})
    if not user.email_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=NOT_VERIFIED)
    record_login(db, email, True)
    return {"access_token": create_access_token(data={"sub": str(user.id)}), "token_type": "bearer"}


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordIn, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Email a 6-digit reset code. Always answers the same, so nobody can test which emails exist."""
    user = find_user(db, data.email)
    if user:
        try:
            code = new_code(db, user, "reset")
        except HTTPException:  # asked again within a minute: same answer, so the account stays private
            return {"status": "success", "email_enabled": settings.email_enabled,
                    "message": "If an account exists with this email, a 6-digit code has been sent."}
        if settings.email_enabled:
            background_tasks.add_task(send_code_email, user.email, code, "reset")
        else:
            print(f"Password reset code for {user.email}: {code} (email sending is not set up)")
    return {"status": "success", "email_enabled": settings.email_enabled,
            "message": "If an account exists with this email, a 6-digit code has been sent."}


@router.post("/reset-password")
def reset_password(data: ResetPasswordIn, db: Session = Depends(get_db)):
    """Set a new password with the emailed code. Also confirms the email and clears the sign-in lock."""
    user = find_user(db, data.email)
    if not user:
        raise HTTPException(status_code=400, detail="This code has expired - ask for a new one.")
    check_code(db, user, "reset", data.code)
    user.hashed_password = get_password_hash(data.new_password)
    user.email_verified = True
    db.commit()
    record_login(db, user.email, True)
    return {"status": "success", "message": "Password updated. You can now sign in."}
