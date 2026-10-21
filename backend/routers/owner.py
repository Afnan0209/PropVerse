import logging

import mysql.connector
from fastapi import APIRouter, Depends, HTTPException

from auth import require_roles
from database import get_owner_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/owner", tags=["Owner"])


def _list_data(db, query: str, owner_id: str):
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(query, (owner_id,))
        return {"status": "success", "data": cursor.fetchall()}
    except mysql.connector.Error:
        logger.exception("Could not load owner data")
        raise HTTPException(status_code=500, detail="Could not load owner data")
    finally:
        cursor.close()


def _owner_id(user: dict) -> str:
    owner_id = user.get("owner_id")
    if not owner_id:
        raise HTTPException(status_code=403, detail="Owner profile is unavailable")
    return owner_id


@router.get("/properties")
def get_properties(
    user: dict = Depends(require_roles("owner")),
    db=Depends(get_owner_db),
):
    return _list_data(
        db,
        "SELECT * FROM vw_owner_portfolio WHERE owner_id = %s ORDER BY property_name",
        _owner_id(user),
    )


@router.get("/units")
def get_units(
    user: dict = Depends(require_roles("owner")),
    db=Depends(get_owner_db),
):
    return _list_data(
        db,
        "SELECT * FROM vw_owner_units WHERE owner_id = %s ORDER BY property_name, unit_number",
        _owner_id(user),
    )


@router.get("/payments")
def get_payments(
    user: dict = Depends(require_roles("owner")),
    db=Depends(get_owner_db),
):
    return _list_data(
        db,
        "SELECT * FROM vw_owner_payments WHERE owner_id = %s ORDER BY payment_date DESC",
        _owner_id(user),
    )


@router.get("/maintenance")
def get_maintenance(
    user: dict = Depends(require_roles("owner")),
    db=Depends(get_owner_db),
):
    return _list_data(
        db,
        "SELECT * FROM vw_owner_maintenance WHERE owner_id = %s ORDER BY submitted_at DESC",
        _owner_id(user),
    )
