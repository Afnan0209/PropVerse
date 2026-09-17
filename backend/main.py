from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector

from database import get_admin_db
from routers import manager, admin, staff

app = FastAPI(title="PropVerse API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(manager.router)
app.include_router(admin.router)
app.include_router(staff.router)

@app.get("/")
def health_check():
    return {"status": "online", "message": "PropVerse Backend is running!"}

@app.get("/test-connection")
def test_db_connection(db: mysql.connector.MySQLConnection = Depends(get_admin_db)):
    """
    This route borrows the 'prop_admin' connection from the pool, 
    runs a quick query, and returns the connection.
    """
    try:
        cursor = db.cursor(dictionary=True)
        # Fetching a few roles to prove the database is responding
        cursor.execute("SELECT role_id, role_name FROM ROLES LIMIT 5;")
        roles = cursor.fetchall()
        cursor.close()
        
        return {"status": "success", "data": roles}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database query failed: {err}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)