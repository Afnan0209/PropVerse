import logging
import uuid
from datetime import date
from decimal import Decimal

import mysql.connector
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from auth import require_roles
from database import get_manager_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/manager", tags=["Manager Dashboard"])


class LeaseCreate(BaseModel):
    unit_id: str
    tenant_id: str
    start_date: date
    end_date: date
    monthly_rent: Decimal = Field(gt=0)
    security_deposit: Decimal = Field(ge=0)


@router.post("/create-lease")
def create_lease(
    lease: LeaseCreate,
    _user: dict = Depends(require_roles("manager")),
    db=Depends(get_manager_db),
):
    if lease.end_date <= lease.start_date:
        raise HTTPException(status_code=400, detail="Lease end date must be after lease start date")

    cursor = db.cursor()
    try:
        cursor.execute(
            "SELECT status FROM UNITS WHERE unit_id = %s FOR UPDATE",
            (lease.unit_id,),
        )
        unit = cursor.fetchone()
        if not unit:
            db.rollback()
            raise HTTPException(status_code=404, detail="Unit not found")
        if unit[0] != "Available":
            db.rollback()
            raise HTTPException(status_code=409, detail="Unit is not available")

        cursor.execute("SELECT tenant_id FROM TENANTS WHERE tenant_id = %s", (lease.tenant_id,))
        if not cursor.fetchone():
            db.rollback()
            raise HTTPException(status_code=404, detail="Tenant not found")

        lease_id = str(uuid.uuid4())
        cursor.execute(
            """
            INSERT INTO LEASES
                (lease_id, unit_id, lease_start, lease_end, monthly_rent, security_deposit)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                lease_id,
                lease.unit_id,
                lease.start_date,
                lease.end_date,
                lease.monthly_rent,
                lease.security_deposit,
            ),
        )
        cursor.execute(
            """
            INSERT INTO LEASE_TENANTS (lease_id, tenant_id, is_primary)
            VALUES (%s, %s, %s)
            """,
            (lease_id, lease.tenant_id, True),
        )
        db.commit()
        return {"status": "success", "message": "Lease created and tenant linked"}
    except HTTPException:
        raise
    except mysql.connector.Error as err:
        db.rollback()
        logger.exception("Could not create lease")
        if err.errno == 1644:
            raise HTTPException(status_code=400, detail="Lease dates are invalid")
        if err.errno == 1452:
            raise HTTPException(status_code=404, detail="Unit or tenant not found")
        raise HTTPException(status_code=500, detail="Could not create lease")
    finally:
        cursor.close()


@router.get("/available-units")
def get_available_units(
    _user: dict = Depends(require_roles("manager", "admin")),
    db=Depends(get_manager_db),
):
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM vw_available_units")
        return {"status": "success", "data": cursor.fetchall()}
    except mysql.connector.Error:
        logger.exception("Could not load available units")
        raise HTTPException(status_code=500, detail="Could not load available units")
    finally:
        cursor.close()


@router.get("/tenants")
def get_tenants(
    _user: dict = Depends(require_roles("manager", "admin")),
    db=Depends(get_manager_db),
):
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT t.tenant_id, u.full_name AS name, u.email
            FROM TENANTS t
            JOIN USERS u ON u.user_id = t.user_id
            ORDER BY u.full_name
            """
        )
        return {"status": "success", "data": cursor.fetchall()}
    except mysql.connector.Error:
        logger.exception("Could not load tenants for lease creation")
        raise HTTPException(status_code=500, detail="Could not load tenants")
    finally:
        cursor.close()
