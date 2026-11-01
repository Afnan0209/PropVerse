import logging

import mysql.connector
from fastapi import APIRouter, Depends, HTTPException

from auth import require_roles
from database import get_manager_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])


@router.get("/property-overview")
def get_property_overview(
    _user: dict = Depends(require_roles("admin", "manager")),
    db=Depends(get_manager_db),
):
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM vw_property_overview")
        return {"status": "success", "data": cursor.fetchall()}
    except mysql.connector.Error:
        logger.exception("Could not load property overview")
        raise HTTPException(status_code=500, detail="Could not load properties")
    finally:
        cursor.close()


@router.get("/owners")
def get_owners(
    _user: dict = Depends(require_roles("admin", "manager")),
    db=Depends(get_manager_db),
):
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM vw_owner_portfolio ORDER BY owner_name, property_name")
        return {"status": "success", "data": cursor.fetchall()}
    except mysql.connector.Error:
        logger.exception("Could not load owner portfolio")
        raise HTTPException(status_code=500, detail="Could not load owners")
    finally:
        cursor.close()


@router.get("/tenants")
def get_tenants(
    _user: dict = Depends(require_roles("admin", "manager")),
    db=Depends(get_manager_db),
):
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM vw_tenant_lease_details ORDER BY tenant_name")
        return {"status": "success", "data": cursor.fetchall()}
    except mysql.connector.Error:
        logger.exception("Could not load tenant lease details")
        raise HTTPException(status_code=500, detail="Could not load tenants")
    finally:
        cursor.close()
