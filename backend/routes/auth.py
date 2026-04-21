from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import verify_password, create_access_token, get_password_hash, create_reset_token, verify_reset_token
from models.all_models import User
from schemas.token import Token
from schemas.user import UserCreate, UserProfile
from utils.email import send_reset_email

router = APIRouter()

@router.post("/register", response_model=UserProfile)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user in the platform.
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system",
        )
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        university=user_in.university
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login with live diagnostic logging.
    """
    try:
        user = db.query(User).filter(User.email == form_data.username).first()
        if not user:
            print(f"LOGIN FAILURE: User {form_data.username} not found in DB.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        if not verify_password(form_data.password, user.hashed_password):
            print(f"LOGIN FAILURE: Password verification failed for {form_data.username}.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token = create_access_token(data={"sub": str(user.id)})
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Internal server error during authentication")

@router.post("/forgot-password")
def forgot_password(
    email: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Asynchronous forgot password endpoint.
    Verifies user existence, generates a JWT reset token, and dispatches email via background task.
    """
    user = db.query(User).filter(User.email == email).first()
    if user:
        token = create_reset_token(email)
        # We send the email in the background so the user doesn't wait for SMTP latency
        background_tasks.add_task(send_reset_email, email, token)
        
    # We return success regardless to prevent email enumeration (Security Best Practice)
    return {"status": "success", "message": "If an account exists with this email, reset instructions have been sent."}

@router.post("/reset-password")
def reset_password(
    token: str,
    new_password: str,
    db: Session = Depends(get_db)
):
    """
    Resets the user password using a valid JWT reset token.
    """
    email = verify_reset_token(token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User associated with this token no longer exists"
        )
        
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    return {"status": "success", "message": "Password updated successfully. You can now log in."}
