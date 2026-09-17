from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import date
import mysql.connector
import uuid
from database import get_manager_db

router = APIRouter(prefix="/api/manager", tags=["Manager Dashboard"])

class LeaseCreate(BaseModel):
    unit_id: str
    tenant_id: str           # <-- Brought this back!
    start_date: date
    end_date: date
    monthly_rent: float
    security_deposit: float

@router.post("/create-lease")
def create_lease(lease: LeaseCreate, db: mysql.connector.MySQLConnection = Depends(get_manager_db)):
    """Creates a new lease and links the tenant. Trigger auto-updates unit status."""
    try:
        cursor = db.cursor()
        new_lease_id = str(uuid.uuid4())
        
        # 1. Insert the core lease details into LEASES
        sql_lease = """
            INSERT INTO LEASES (lease_id, unit_id, lease_start, lease_end, monthly_rent, security_deposit)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        val_lease = (
            new_lease_id, 
            lease.unit_id, 
            lease.start_date, 
            lease.end_date, 
            lease.monthly_rent,
            lease.security_deposit
        )
        cursor.execute(sql_lease, val_lease)
        
        # 2. Link the tenant to this new lease in LEASE_TENANTS
        sql_tenant = """
            INSERT INTO LEASE_TENANTS (lease_id, tenant_id, is_primary)
            VALUES (%s, %s, %s)
        """
        # We set is_primary to True (1) for this initial tenant
        val_tenant = (new_lease_id, lease.tenant_id, 1)
        cursor.execute(sql_tenant, val_tenant)

        # Commit BOTH inserts as a single transaction
        db.commit()
        cursor.close()
        
        return {"status": "success", "message": "Lease created and tenant linked. Unit status updated."}
    except mysql.connector.Error as err:
        db.rollback() # If either insert fails, undo everything
        raise HTTPException(status_code=500, detail=f"Database error: {err}")

@router.get("/available-units")
def get_available_units(db: mysql.connector.MySQLConnection = Depends(get_manager_db)):
    """Fetches all currently available units using the pre-built MySQL view."""
    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT * FROM vw_available_units;")
        units = cursor.fetchall()
        cursor.close()
        
        return {"status": "success", "data": units}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")