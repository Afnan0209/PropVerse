import os
from datetime import datetime, timedelta, timezone
from typing import Callable, Optional

import bcrypt
import jwt
from fastapi import Depends, Header, HTTPException


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def _jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise RuntimeError("JWT_SECRET must be configured")
    return secret


def create_access_token(
    user_id: str,
    role: str,
    owner_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
) -> str:
    expires_minutes = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=expires_minutes),
    }
    if owner_id is not None:
        payload["owner_id"] = owner_id
    if tenant_id is not None:
        payload["tenant_id"] = tenant_id
    return jwt.encode(payload, _jwt_secret(), algorithm="HS256")


def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    try:
        payload = jwt.decode(token, _jwt_secret(), algorithms=["HS256"])
        user_id = payload["user_id"]
        role = payload["role"]
        if not isinstance(user_id, str) or not isinstance(role, str):
            raise ValueError("Invalid token claims")
        return {
            "user_id": user_id,
            "role": role,
            "owner_id": payload.get("owner_id"),
            "tenant_id": payload.get("tenant_id"),
        }
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def require_roles(*roles: str) -> Callable:
    def role_dependency(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user

    return role_dependency
