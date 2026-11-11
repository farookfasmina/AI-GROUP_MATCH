from fastapi import APIRouter, Depends, HTTPException, status
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
NOT_SENT = "We could not send the email just now - please try again in a minute."


def find_user(db: Session, email: str):
    return db.query(User).filter(func.lower(User.email) == email.strip().lower()).first()


def send_code(db: Session, user: User, purpose: str) -> bool:
    """Make a fresh code and email it now, before the page gets its answer.
    (The first version sent it as a background task. On the hosted site the server can be
    paused the moment the answer is sent, so the email was often never sent at all - and
    nobody was told. Now the request waits the second or two the email takes.)"""
    return bool(send_code_email(user.email, new_code(db, user, purpose), purpose))


@router.post("/register")
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
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
    sent = send_code(db, user, "verify") if not user.email_verified else True
    return {**user_profile(user), "verification_required": not user.email_verified, "email_sent": sent}


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
def resend_code(data: ResendCodeIn, db: Session = Depends(get_db)):
    """Send a fresh code. Answers the same whether or not the account exists - unless the
    email could not be sent, which the student has to know to try again."""
    user = find_user(db, data.email)
    if user and settings.email_enabled and not (data.purpose == "verify" and user.email_verified):
        if not send_code(db, user, data.purpose):
            raise HTTPException(status_code=503, detail=NOT_SENT)
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
        # The right password, but the email was never confirmed (often days ago, so the old
        # code has expired). Send a fresh one now, so the page that opens next is telling the truth.
        try:
            send_code(db, user, "verify")
        except HTTPException:  # one was sent in the last minute - that one still works
            pass
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=NOT_VERIFIED)
    record_login(db, email, True)
    return {"access_token": create_access_token(data={"sub": str(user.id)}), "token_type": "bearer"}


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordIn, db: Session = Depends(get_db)):
    """Email a 6-digit reset code. Always answers the same, so nobody can test which emails exist."""
    user = find_user(db, data.email)
    if user:
        try:
            code = new_code(db, user, "reset")
        except HTTPException:  # asked again within a minute: same answer, so the account stays private
            return {"status": "success", "email_enabled": settings.email_enabled,
                    "message": "If an account exists with this email, a 6-digit code has been sent."}
        if settings.email_enabled:
            if not send_code_email(user.email, code, "reset"):
                raise HTTPException(status_code=503, detail=NOT_SENT)
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
