import os
import uuid
from datetime import date, timedelta
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv

from auth import hash_password

load_dotenv(Path(__file__).with_name(".env"))

DEMO_PASSWORD = "Demo@123"
DEMO_USERNAMES = (
    "admin1",
    "manager1",
    "staff1",
    "owner1",
    "owner2",
    "owner3",
    "tenant1",
    "tenant2",
    "tenant3",
    "tenant4",
    "tenant5",
    # Remove accounts from the previous demo seed when refreshing the dataset.
    "pv_admin",
    "pv_manager",
    "pv_staff",
    "owner_asha",
    "owner_dev",
    "owner_meera",
    "tenant_aarav",
    "tenant_isha",
    "tenant_rohan",
    "tenant_kavya",
    "tenant_vivek",
)


def _new_id() -> str:
    return str(uuid.uuid4())


def _delete_ids(cursor, table: str, column: str, values: list[str]) -> None:
    if values:
        placeholders = ", ".join(["%s"] * len(values))
        cursor.execute(
            f"DELETE FROM {table} WHERE {column} IN ({placeholders})",
            tuple(values),
        )


def _ids(cursor, query: str, values: list[str]) -> list[str]:
    if not values:
        return []
    placeholders = ", ".join(["%s"] * len(values))
    cursor.execute(query.format(placeholders=placeholders), tuple(values))
    return [row[0] for row in cursor.fetchall()]


def _remove_previous_demo(cursor) -> None:
    placeholders = ", ".join(["%s"] * len(DEMO_USERNAMES))
    cursor.execute(
        f"SELECT user_id FROM USERS WHERE username IN ({placeholders})",
        DEMO_USERNAMES,
    )
    user_ids = [row[0] for row in cursor.fetchall()]
    owner_ids = _ids(
        cursor,
        "SELECT owner_id FROM OWNERS WHERE user_id IN ({placeholders})",
        user_ids,
    )
    tenant_ids = _ids(
        cursor,
        "SELECT tenant_id FROM TENANTS WHERE user_id IN ({placeholders})",
        user_ids,
    )
    property_ids = _ids(
        cursor,
        "SELECT property_id FROM PROPERTIES WHERE owner_id IN ({placeholders})",
        owner_ids,
    )
    building_ids = _ids(
        cursor,
        "SELECT building_id FROM BUILDINGS WHERE property_id IN ({placeholders})",
        property_ids,
    )
    unit_ids = _ids(
        cursor,
        "SELECT unit_id FROM UNITS WHERE building_id IN ({placeholders})",
        building_ids,
    )
    lease_ids_from_units = _ids(
        cursor,
        "SELECT lease_id FROM LEASES WHERE unit_id IN ({placeholders})",
        unit_ids,
    )
    lease_ids_from_tenants = _ids(
        cursor,
        "SELECT lease_id FROM LEASE_TENANTS WHERE tenant_id IN ({placeholders})",
        tenant_ids,
    )
    lease_ids = list(dict.fromkeys(lease_ids_from_units + lease_ids_from_tenants))
    request_ids = []
    if tenant_ids and unit_ids:
        cursor.execute(
            f"""
            SELECT request_id FROM MAINTENANCE_REQUESTS
            WHERE tenant_id IN ({', '.join(['%s'] * len(tenant_ids))})
               OR unit_id IN ({', '.join(['%s'] * len(unit_ids))})
            """,
            tuple(tenant_ids + unit_ids),
        )
        request_ids = [row[0] for row in cursor.fetchall()]
    elif tenant_ids:
        request_ids = _ids(
            cursor,
            "SELECT request_id FROM MAINTENANCE_REQUESTS WHERE tenant_id IN ({placeholders})",
            tenant_ids,
        )
    elif unit_ids:
        request_ids = _ids(
            cursor,
            "SELECT request_id FROM MAINTENANCE_REQUESTS WHERE unit_id IN ({placeholders})",
            unit_ids,
        )

    _delete_ids(cursor, "AUDIT_LOGS", "record_id", request_ids)
    _delete_ids(cursor, "MAINTENANCE_REQUESTS", "request_id", request_ids)
    _delete_ids(cursor, "RENT_PAYMENTS", "lease_id", lease_ids)
    _delete_ids(cursor, "LEASE_TENANTS", "lease_id", lease_ids)
    _delete_ids(cursor, "LEASE_TENANTS", "tenant_id", tenant_ids)
    _delete_ids(cursor, "LEASES", "lease_id", lease_ids)
    _delete_ids(cursor, "UNITS", "unit_id", unit_ids)
    _delete_ids(cursor, "BUILDINGS", "building_id", building_ids)
    _delete_ids(cursor, "PROPERTIES", "property_id", property_ids)
    _delete_ids(cursor, "EMPLOYEES", "user_id", user_ids)
    _delete_ids(cursor, "OWNERS", "owner_id", owner_ids)
    _delete_ids(cursor, "TENANTS", "tenant_id", tenant_ids)
    _delete_ids(cursor, "USERS", "user_id", user_ids)


def seed() -> None:
    config = {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": int(os.getenv("DB_PORT", "3306")),
        "database": os.getenv("DB_NAME", "propverse"),
        "user": os.environ["ADMIN_USER"],
        "password": os.environ["ADMIN_PASS"],
    }
    if os.getenv("DB_SSL_CA"):
        config["ssl_ca"] = os.environ["DB_SSL_CA"]
        config["ssl_verify_cert"] = True

    connection = mysql.connector.connect(**config)
    cursor = connection.cursor()
    try:
        _remove_previous_demo(cursor)

        roles = {}
        for role_name in ("admin", "manager", "staff", "owner", "tenant"):
            role_id = _new_id()
            cursor.execute(
                """
                INSERT INTO ROLES (role_id, role_name, description)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE description = VALUES(description)
                """,
                (role_id, role_name, f"PropVerse {role_name} role"),
            )
            cursor.execute("SELECT role_id FROM ROLES WHERE role_name = %s", (role_name,))
            roles[role_name] = cursor.fetchone()[0]

        people = [
            ("admin1", "Ananya Rao", "admin1@propverse.demo", "admin"),
            ("manager1", "Kabir Shah", "manager1@propverse.demo", "manager"),
            ("staff1", "Neha Kulkarni", "staff1@propverse.demo", "staff"),
            ("owner1", "Asha Kapoor", "owner1@propverse.demo", "owner"),
            ("owner2", "Dev Malhotra", "owner2@propverse.demo", "owner"),
            ("owner3", "Meera Joshi", "owner3@propverse.demo", "owner"),
            ("tenant1", "Aarav Mehta", "tenant1@propverse.demo", "tenant"),
            ("tenant2", "Isha Sharma", "tenant2@propverse.demo", "tenant"),
            ("tenant3", "Rohan Patel", "tenant3@propverse.demo", "tenant"),
            ("tenant4", "Kavya Nair", "tenant4@propverse.demo", "tenant"),
            ("tenant5", "Vivek Iyer", "tenant5@propverse.demo", "tenant"),
        ]
        users = {}
        password_hash = hash_password(DEMO_PASSWORD)
        for username, full_name, email, role_name in people:
            user_id = _new_id()
            users[username] = user_id
            cursor.execute(
                """
                INSERT INTO USERS
                    (user_id, role_id, username, email, password_hash, full_name, phone, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE)
                """,
                (
                    user_id,
                    roles[role_name],
                    username,
                    email,
                    password_hash,
                    full_name,
                    f"+91-{uuid.uuid4().int % 9000000000 + 1000000000}",
                ),
            )

        owners = {}
        for username in ("owner1", "owner2", "owner3"):
            owner_id = _new_id()
            owners[username] = owner_id
            cursor.execute(
                "INSERT INTO OWNERS (owner_id, user_id) VALUES (%s, %s)",
                (owner_id, users[username]),
            )

        tenants = {}
        for index in range(1, 6):
            username = f"tenant{index}"
            tenant_id = _new_id()
            tenants[username] = tenant_id
            cursor.execute(
                """
                INSERT INTO TENANTS (tenant_id, user_id, id_proof_type, id_proof_number)
                VALUES (%s, %s, %s, %s)
                """,
                (tenant_id, users[username], "Aadhaar", f"DEMO-{uuid.uuid4().hex[:12].upper()}"),
            )

        cursor.execute(
            """
            INSERT INTO EMPLOYEES
                (employee_id, user_id, department, designation, hire_date, is_active)
            VALUES (%s, %s, %s, %s, %s, TRUE)
            """,
            (_new_id(), users["staff1"], "Maintenance", "Maintenance Technician", date(2022, 4, 1)),
        )

        property_specs = [
            ("Lakeview Residency", "Residential", "Bengaluru", "Karnataka", "560001", "owner1"),
            ("Indiranagar Heights", "Residential", "Bengaluru", "Karnataka", "560038", "owner2"),
            ("Pune Central Plaza", "Commercial", "Pune", "Maharashtra", "411001", "owner2"),
            ("Baner Garden Homes", "Residential", "Pune", "Maharashtra", "411045", "owner3"),
        ]
        properties = []
        buildings = []
        for index, (name, kind, city, state, postal_code, owner_name) in enumerate(property_specs, start=1):
            property_id = _new_id()
            building_id = _new_id()
            properties.append(property_id)
            buildings.append(building_id)
            cursor.execute(
                """
                INSERT INTO PROPERTIES
                    (property_id, owner_id, property_name, property_type, address, city, state, postal_code, total_area)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    property_id,
                    owners[owner_name],
                    name,
                    kind,
                    f"{index * 10} Demo Road",
                    city,
                    state,
                    postal_code,
                    12000 + index * 1500,
                ),
            )
            cursor.execute(
                """
                INSERT INTO BUILDINGS (building_id, property_id, building_name, floors)
                VALUES (%s, %s, %s, %s)
                """,
                (building_id, property_id, f"{name} Tower", 4),
            )

        units = []
        for index in range(1, 17):
            property_index = (index - 1) // 4
            unit_id = _new_id()
            units.append(unit_id)
            cursor.execute(
                """
                INSERT INTO UNITS
                    (unit_id, building_id, unit_number, floor_number, unit_type, status, base_rent, deposit)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    unit_id,
                    buildings[property_index],
                    f"{(index - 1) % 4 + 1}0{(index - 1) % 4 + 1}",
                    (index - 1) % 4 + 1,
                    "2BHK" if index % 2 else "3BHK",
                    "Available",
                    22000 + (property_index + 1) * 2500,
                    50000 + (property_index + 1) * 5000,
                ),
            )

        lease_ids = []
        lease_tenant_usernames = ("tenant1", "tenant2", "tenant3", "tenant4")
        lease_start = date.today() - timedelta(days=120)
        lease_end = date.today() + timedelta(days=245)
        for index, tenant_username in enumerate(lease_tenant_usernames):
            lease_id = _new_id()
            lease_ids.append(lease_id)
            unit_id = units[index * 4]
            cursor.execute(
                """
                INSERT INTO LEASES
                    (lease_id, unit_id, lease_start, lease_end, monthly_rent, security_deposit, status)
                VALUES (%s, %s, %s, %s, %s, %s, 'Active')
                """,
                (lease_id, unit_id, lease_start, lease_end, 28000 + index * 2000, 65000 + index * 5000),
            )
            cursor.execute("UPDATE UNITS SET status = %s WHERE unit_id = %s", ("Occupied", unit_id))
            cursor.execute(
                """
                INSERT INTO LEASE_TENANTS (lease_id, tenant_id, is_primary)
                VALUES (%s, %s, TRUE)
                """,
                (lease_id, tenants[tenant_username]),
            )

        for lease_index, lease_id in enumerate(lease_ids):
            for payment_index in range(1, 4):
                cursor.execute(
                    """
                    INSERT INTO RENT_PAYMENTS
                        (payment_id, lease_id, amount, payment_date, payment_method,
                         payment_status, transaction_reference)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        _new_id(),
                        lease_id,
                        28000 + lease_index * 2000,
                        date.today() - timedelta(days=payment_index * 30),
                        ("UPI", "Bank Transfer", "UPI")[(payment_index - 1) % 3],
                        "Pending" if lease_index == 3 and payment_index == 3 else "Paid",
                        f"DEMO-{uuid.uuid4().hex.upper()}",
                    ),
                )

        maintenance = [
            ("Plumbing", "High", "Kitchen sink tap is leaking.", "Submitted", 0),
            ("Electrical", "Medium", "Living room light needs inspection.", "Assigned", 4),
            ("Appliance", "Low", "Please inspect the refrigerator seal.", "Resolved", 8),
            ("HVAC", "High", "Air conditioner is not cooling.", "In Progress", 12),
            ("Structural", "Medium", "Balcony door latch is loose.", "Submitted", 0),
            ("Plumbing", "Low", "Bathroom drain is slow.", "Completed", 4),
            ("Electrical", "High", "Intermittent power near the kitchen outlet.", "Assigned", 8),
            ("Other", "Medium", "Common-area access card needs replacement.", "Submitted", 12),
        ]
        for category, priority, description, status, unit_index in maintenance:
            cursor.execute(
                """
                INSERT INTO MAINTENANCE_REQUESTS
                    (request_id, tenant_id, unit_id, category, priority, description, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    _new_id(),
                    tenants[f"tenant{unit_index // 4 + 1}"],
                    units[unit_index],
                    category,
                    priority,
                    description,
                    status,
                ),
            )

        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()

    print(f"{'Username':<12} {'Role':<10} Password")
    print("-" * 40)
    for username, _full_name, _email, role_name in people:
        print(f"{username:<12} {role_name:<10} {DEMO_PASSWORD}")


if __name__ == "__main__":
    seed()
