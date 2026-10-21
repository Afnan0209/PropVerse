import logging

import mysql.connector
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import create_access_token, get_current_user, verify_password
from database import get_admin_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(credentials: LoginRequest, db=Depends(get_admin_db)):
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT u.user_id, u.username, u.password_hash, u.full_name, u.email,
                   u.is_active, r.role_name AS role
            FROM USERS u
            JOIN ROLES r ON r.role_id = u.role_id
            WHERE u.username = %s
            """,
            (credentials.username,),
        )
        user = cursor.fetchone()
        if (
            not user
            or not user["is_active"]
            or not verify_password(credentials.password, user["password_hash"])
        ):
            raise HTTPException(status_code=401, detail="Invalid username or password")

        owner_id = None
        tenant_id = None
        if user["role"] == "owner":
            cursor.execute("SELECT owner_id FROM OWNERS WHERE user_id = %s", (user["user_id"],))
            profile = cursor.fetchone()
            if not profile:
                raise HTTPException(status_code=401, detail="Invalid username or password")
            owner_id = profile["owner_id"]
        elif user["role"] == "tenant":
            cursor.execute("SELECT tenant_id FROM TENANTS WHERE user_id = %s", (user["user_id"],))
            profile = cursor.fetchone()
            if not profile:
                raise HTTPException(status_code=401, detail="Invalid username or password")
            tenant_id = profile["tenant_id"]

        token = create_access_token(user["user_id"], user["role"], owner_id, tenant_id)
        return {
            "access_token": token,
            "role": user["role"],
            "full_name": user["full_name"],
            "user_id": user["user_id"],
        }
    except mysql.connector.Error:
        logger.exception("Database error while authenticating user")
        raise HTTPException(status_code=500, detail="Login service unavailable")
    finally:
        cursor.close()


@router.get("/me")
def get_profile(user: dict = Depends(get_current_user), db=Depends(get_admin_db)):
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT u.user_id, u.full_name, u.email, r.role_name AS role
            FROM USERS u
            JOIN ROLES r ON r.role_id = u.role_id
            WHERE u.user_id = %s AND u.is_active = TRUE
            """,
            (user["user_id"],),
        )
        profile = cursor.fetchone()
        if not profile:
            raise HTTPException(status_code=401, detail="Account is inactive")
        return profile
    except mysql.connector.Error:
        logger.exception("Database error while loading user profile")
        raise HTTPException(status_code=500, detail="Profile service unavailable")
    finally:
        cursor.close()
