from fastapi import APIRouter, Depends, HTTPException
import mysql.connector
from database import get_staff_db

# Create a router instance for the Maintenance Staff
router = APIRouter(prefix="/api/staff", tags=["Maintenance Dashboard"])

@router.get("/tickets")
def get_maintenance_tickets(db: mysql.connector.MySQLConnection = Depends(get_staff_db)):
    """Fetches all maintenance requests using the staff connection."""
    try:
        cursor = db.cursor(dictionary=True)
        # Using the maintenance view created in schema.sql
        cursor.execute("SELECT * FROM vw_maintenance_report;")
        tickets = cursor.fetchall()
        cursor.close()
        
        return {"status": "success", "data": tickets}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")