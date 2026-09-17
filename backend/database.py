import mysql.connector
from mysql.connector import pooling
from fastapi import HTTPException

# Standard MySQL configuration
DB_CONFIG = {
    "host": "localhost",
    "database": "propverse",
    "raise_on_warnings": True
}

# 1. Initialize Connection Pools for your 3 DCL Users
try:
    admin_pool = pooling.MySQLConnectionPool(
        pool_name="admin_pool",
        pool_size=5,
        user="prop_admin",
        password="Admin@123",
        **DB_CONFIG
    )

    manager_pool = pooling.MySQLConnectionPool(
        pool_name="manager_pool",
        pool_size=5,
        user="property_manager",
        password="Manager@123",
        **DB_CONFIG
    )

    staff_pool = pooling.MySQLConnectionPool(
        pool_name="staff_pool",
        pool_size=5,
        user="maintenance_staff",
        password="Staff@123",
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