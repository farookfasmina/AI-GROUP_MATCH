import bcrypt
from datetime import datetime, timedelta
from jose import jwt
from typing import Optional
from core.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain-text password against a hashed one using direct bcrypt."""
    # Bcrypt requires bytes. We encode both the password and the hash.
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Returns the hashed version of a password using direct bcrypt."""
    # We encode to bytes, hash, and then decode back to string for DB storage
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_bytes.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def create_reset_token(email: str) -> str:
    """Creates a short-lived JWT for password reset (15 min)."""
    expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode = {"exp": expire, "sub": email, "type": "reset"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_reset_token(token: str) -> Optional[str]:
    """Verifies the reset token and returns the email if valid."""
    try:
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if decoded.get("type") != "reset":
            return None
        return decoded.get("sub")
    except jwt.JWTError:
        return None

# Placeholder for get_current_user dependency that can be implemented later
async def get_current_user():
    # Typically, you would extract the token from the Authorization header here,
    # decode it using jwt.decode, and fetch the user from the DB.
    # We leave this as a placeholder to be fleshed out as needed.
    pass
