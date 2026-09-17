import os
import mysql.connector
from mysql.connector import pooling
from fastapi import HTTPException
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "database": os.getenv("DB_NAME", "propverse"),
    "raise_on_warnings": True
}

try:
    admin_pool = pooling.MySQLConnectionPool(
        pool_name="admin_pool",
        pool_size=5,
        user=os.getenv("ADMIN_USER"),
        password=os.getenv("ADMIN_PASS"),
        **DB_CONFIG
    )
    
    manager_pool = pooling.MySQLConnectionPool(
        pool_name="manager_pool",
        pool_size=5,
        user=os.getenv("MANAGER_USER"),
        password=os.getenv("MANAGER_PASS"),
        **DB_CONFIG
    )

    staff_pool = pooling.MySQLConnectionPool(
        pool_name="staff_pool",
        pool_size=5,
        user=os.getenv("STAFF_USER"),
        password=os.getenv("STAFF_PASS"),
        **DB_CONFIG
    )
    print("Database connection pools established successfully.")
except mysql.connector.Error as err:
    print(f"Error creating connection pools: {err}")

# 2. FastAPI Dependencies (Yields a connection for a specific route)
def get_admin_db():
    try:
        conn = admin_pool.get_connection()
        yield conn
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail="Database connection failed")
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

def get_manager_db():
    try:
        conn = manager_pool.get_connection()
        yield conn
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail="Database connection failed")
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

def get_staff_db():
    try:
        conn = staff_pool.get_connection()
        yield conn
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail="Database connection failed")
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()