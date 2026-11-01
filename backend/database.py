import logging
import os
from typing import Generator

import mysql.connector
from fastapi import HTTPException
from mysql.connector import pooling
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "database": os.getenv("DB_NAME", "propverse"),
    "raise_on_warnings": True,
}

if os.getenv("DB_SSL_CA"):
    DB_CONFIG["ssl_ca"] = os.environ["DB_SSL_CA"]
    DB_CONFIG["ssl_verify_cert"] = True

POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "3"))


def _create_pool(pool_name: str, user_env: str, password_env: str):
    user = os.getenv(user_env)
    password = os.getenv(password_env)
    if not user or not password:
        raise RuntimeError(f"{user_env} and {password_env} must be configured")
    try:
        return pooling.MySQLConnectionPool(
            pool_name=pool_name,
            pool_size=POOL_SIZE,
            user=user,
            password=password,
            **DB_CONFIG,
        )
    except mysql.connector.Error:
        logger.exception("Could not create the %s database connection pool", pool_name)
        raise


admin_pool = _create_pool("admin_pool", "ADMIN_USER", "ADMIN_PASS")
manager_pool = _create_pool("manager_pool", "MANAGER_USER", "MANAGER_PASS")
staff_pool = _create_pool("staff_pool", "STAFF_USER", "STAFF_PASS")
owner_pool = _create_pool("owner_pool", "OWNER_USER", "OWNER_PASS")
tenant_pool = _create_pool("tenant_pool", "TENANT_USER", "TENANT_PASS")


def _get_connection(pool) -> Generator:
    connection = None
    try:
        connection = pool.get_connection()
        yield connection
    except mysql.connector.Error:
        logger.exception("Could not obtain a database connection")
        raise HTTPException(status_code=500, detail="Database connection failed")
    finally:
        if connection is not None:
            connection.close()


def get_admin_db():
    yield from _get_connection(admin_pool)


def get_manager_db():
    yield from _get_connection(manager_pool)


def get_staff_db():
    yield from _get_connection(staff_pool)


def get_owner_db():
    yield from _get_connection(owner_pool)


def get_tenant_db():
    yield from _get_connection(tenant_pool)
