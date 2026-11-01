import logging

import mysql.connector
from fastapi import APIRouter, Depends, HTTPException

from auth import require_roles
from database import get_staff_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/staff", tags=["Maintenance Dashboard"])


@router.get("/tickets")
def get_maintenance_tickets(
    _user: dict = Depends(require_roles("staff", "admin", "manager")),
    db=Depends(get_staff_db),
):
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM vw_maintenance_report")
        return {"status": "success", "data": cursor.fetchall()}
    except mysql.connector.Error:
        logger.exception("Could not load maintenance tickets")
        raise HTTPException(status_code=500, detail="Could not load maintenance tickets")
    finally:
        cursor.close()
