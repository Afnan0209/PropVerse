from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector

# Import the database dependency we created earlier
from database import get_admin_db 

app = FastAPI(title="PropVerse API")

# Configure CORS to allow your React/Vite frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Standard Vite development port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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