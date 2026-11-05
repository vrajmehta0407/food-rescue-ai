from typing import List, Optional
from fastapi import Depends, Header
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.core.exceptions import UnauthorizedError, ForbiddenError
from app.models.user import User


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """Dependency extracting and validating the authenticated user from the Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedError("Missing or invalid Authorization header.")

    token = authorization.split(" ")[1]
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedError("Invalid token payload: missing subject.")
    except Exception:
        raise UnauthorizedError("Session has expired or token is invalid. Please log in again.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise UnauthorizedError("User associated with this token no longer exists.")
    if not user.is_active:
        raise ForbiddenError("User account is inactive.")

    return user


def require_role(allowed_roles: List[str]):
    """Factory creating an endpoint dependency checking if the user belongs to allowed roles."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles and current_user.role != "admin":
            raise ForbiddenError(f"Access restricted to roles: {', '.join(allowed_roles)}.")
        return current_user
    return role_checker

