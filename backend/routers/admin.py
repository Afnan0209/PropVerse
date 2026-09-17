from fastapi import APIRouter, Depends, HTTPException
import mysql.connector
from database import get_admin_db

# Create a router instance for the Admin
router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])

@router.get("/property-overview")
def get_property_overview(db: mysql.connector.MySQLConnection = Depends(get_admin_db)):
    """Fetches a high-level overview of all properties and their owners."""
    try:
        cursor = db.cursor(dictionary=True)
        # Using the view created in schema.sql
        cursor.execute("SELECT * FROM vw_property_overview;")
        overview = cursor.fetchall()
        cursor.close()
        
        return {"status": "success", "data": overview}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")