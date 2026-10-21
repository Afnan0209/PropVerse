import logging
import uuid
from typing import Literal

import mysql.connector
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from auth import require_roles
from database import get_tenant_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/tenant", tags=["Tenant"])


class MaintenanceRequest(BaseModel):
    category: Literal["Plumbing", "Electrical", "HVAC", "Appliance", "Structural", "Other"]
    priority: Literal["Low", "Medium", "High"]
    description: str = Field(min_length=1, max_length=2000)


def _tenant_id(user: dict) -> str:
    tenant_id = user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=403, detail="Tenant profile is unavailable")
    return tenant_id


def _list_data(db, query: str, tenant_id: str):
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(query, (tenant_id,))
        return {"status": "success", "data": cursor.fetchall()}
    except mysql.connector.Error:
        logger.exception("Could not load tenant data")
        raise HTTPException(status_code=500, detail="Could not load tenant data")
    finally:
        cursor.close()


@router.get("/lease")
def get_lease(
    user: dict = Depends(require_roles("tenant")),
    db=Depends(get_tenant_db),
):
    return _list_data(
        db,
        "SELECT * FROM vw_tenant_lease_details WHERE tenant_id = %s ORDER BY lease_start DESC",
        _tenant_id(user),
    )


@router.get("/payments")
def get_payments(
    user: dict = Depends(require_roles("tenant")),
    db=Depends(get_tenant_db),
):
    return _list_data(
        db,
        "SELECT * FROM vw_tenant_payments WHERE tenant_id = %s ORDER BY payment_date DESC",
        _tenant_id(user),
    )


@router.get("/maintenance")
def get_maintenance(
    user: dict = Depends(require_roles("tenant")),
    db=Depends(get_tenant_db),
):
    return _list_data(
        db,
        "SELECT * FROM vw_tenant_maintenance WHERE tenant_id = %s ORDER BY submitted_at DESC",
        _tenant_id(user),
    )


@router.post("/maintenance")
def create_maintenance_request(
    request: MaintenanceRequest,
    user: dict = Depends(require_roles("tenant")),
    db=Depends(get_tenant_db),
):
    tenant_id = _tenant_id(user)
    cursor = db.cursor()
    try:
        cursor.execute(
            """
            SELECT unit_id
            FROM vw_tenant_active_units
            WHERE tenant_id = %s
              AND lease_start <= CURDATE()
              AND lease_end >= CURDATE()
            ORDER BY lease_start DESC
            LIMIT 1
            """,
            (tenant_id,),
        )
        lease = cursor.fetchone()
        if not lease:
            raise HTTPException(status_code=400, detail="An active lease is required to submit a request")

        cursor.execute(
            """
            INSERT INTO MAINTENANCE_REQUESTS
                (request_id, tenant_id, unit_id, category, priority, description)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (str(uuid.uuid4()), tenant_id, lease[0], request.category, request.priority, request.description),
        )
        db.commit()
        return {"status": "success", "message": "Maintenance request submitted"}
    except HTTPException:
        db.rollback()
        raise
    except mysql.connector.Error:
        db.rollback()
        logger.exception("Could not create tenant maintenance request")
        raise HTTPException(status_code=500, detail="Could not submit maintenance request")
    finally:
        cursor.close()
