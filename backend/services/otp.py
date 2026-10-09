"""Email one-time codes and sign-in limits."""
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from core.config import settings
from models.all_models import EmailCode, LoginAttempt, User

CODE_MINUTES = 10
MAX_TRIES = 5
RESEND_SECONDS = 60
LOCK_FAILS = 5
LOCK_MINUTES = 15


def _hash(user_id: int, code: str) -> str:
    return hmac.new(settings.SECRET_KEY.encode(), f"{user_id}:{code}".encode(), hashlib.sha256).hexdigest()


def new_code(db: Session, user: User, purpose: str) -> str:
    """Create a fresh 6-digit code (older unused ones stop working). At most one per minute."""
    last = (db.query(EmailCode).filter(EmailCode.user_id == user.id, EmailCode.purpose == purpose)
            .order_by(EmailCode.id.desc()).first())
    if last and last.created_at > datetime.utcnow() - timedelta(seconds=RESEND_SECONDS):
        raise HTTPException(status_code=429, detail="A code was just sent - wait a minute before asking for another.")
    db.query(EmailCode).filter(EmailCode.user_id == user.id, EmailCode.purpose == purpose,
                               EmailCode.used.is_(False)).update({"used": True})
    code = f"{secrets.randbelow(10**6):06d}"
    db.add(EmailCode(user_id=user.id, purpose=purpose, code_hash=_hash(user.id, code),
                     expires_at=datetime.utcnow() + timedelta(minutes=CODE_MINUTES)))
    db.commit()
    return code


def check_code(db: Session, user: User, purpose: str, code: str) -> None:
    """Raise a clear error unless `code` is the latest valid code; a correct code works once."""
    row = (db.query(EmailCode).filter(EmailCode.user_id == user.id, EmailCode.purpose == purpose,
                                      EmailCode.used.is_(False)).order_by(EmailCode.id.desc()).first())
    if not row or row.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="This code has expired - ask for a new one.")
    if row.attempts >= MAX_TRIES:
        raise HTTPException(status_code=400, detail="Too many wrong tries - ask for a new code.")
    row.attempts += 1
    if not hmac.compare_digest(row.code_hash, _hash(user.id, (code or "").strip())):
        db.commit()
        left = MAX_TRIES - row.attempts
        raise HTTPException(status_code=400, detail=f"That code is not right. {left} tr{'y' if left == 1 else 'ies'} left.")
    row.used = True
    db.commit()


def check_not_locked(db: Session, email: str) -> None:
    since = datetime.utcnow() - timedelta(minutes=LOCK_MINUTES)
    fails = db.query(LoginAttempt).filter(LoginAttempt.email == email, LoginAttempt.success.is_(False),
                                          LoginAttempt.created_at > since).count()
    if fails >= LOCK_FAILS:
        raise HTTPException(status_code=429, detail=f"Too many wrong passwords. Try again in {LOCK_MINUTES} minutes, or reset your password.")


def record_login(db: Session, email: str, success: bool) -> None:
    if success:  # a good sign-in clears the counter
        db.query(LoginAttempt).filter(LoginAttempt.email == email).delete()
    else:
        db.add(LoginAttempt(email=email, success=False))
    db.commit()
