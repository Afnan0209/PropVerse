-- ==========================================================
-- PropVerse Master Database Schema
-- ==========================================================

DROP DATABASE IF EXISTS propverse;
CREATE DATABASE propverse;
USE propverse;

-- ==========================================================
-- 1. TABLES (In Dependency Order)
-- ==========================================================

CREATE TABLE ROLES (
    role_id VARCHAR(36) PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE USERS (
    user_id VARCHAR(36) PRIMARY KEY,
    role_id VARCHAR(36) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES ROLES(role_id)
);

CREATE TABLE AUDIT_LOGS (
    audit_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id VARCHAR(36) NOT NULL,
    old_data JSON,
    new_data JSON,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE SET NULL
);

CREATE TABLE OWNERS (
    owner_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
);

CREATE TABLE EMPLOYEES (
    employee_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    department VARCHAR(50) NOT NULL,
    designation VARCHAR(50) NOT NULL,
    hire_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
);

CREATE TABLE TENANTS (
    tenant_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    id_proof_type VARCHAR(50) NOT NULL,
    id_proof_number VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
);

CREATE TABLE VENDORS (
    vendor_id VARCHAR(36) PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    rating DECIMAL(3, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE AMENITIES (
    amenity_id VARCHAR(36) PRIMARY KEY,
    amenity_name VARCHAR(100) UNIQUE NOT NULL,
    monthly_fee DECIMAL(10, 2) DEFAULT 0.00
);

CREATE TABLE PROPERTIES (
    property_id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    property_name VARCHAR(100) NOT NULL,
    property_type VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    total_area DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (owner_id) REFERENCES OWNERS(owner_id) ON DELETE RESTRICT
);

CREATE TABLE PROPERTY_AMENITIES (
    property_id VARCHAR(36) NOT NULL,
    amenity_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (property_id, amenity_id),
    FOREIGN KEY (property_id) REFERENCES PROPERTIES(property_id) ON DELETE CASCADE,
    FOREIGN KEY (amenity_id) REFERENCES AMENITIES(amenity_id) ON DELETE CASCADE
);

CREATE TABLE BUILDINGS (
    building_id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36) NOT NULL,
    building_name VARCHAR(100) NOT NULL,
    floors INT NOT NULL,
    FOREIGN KEY (property_id) REFERENCES PROPERTIES(property_id) ON DELETE CASCADE
);

CREATE TABLE UNITS (
    unit_id VARCHAR(36) PRIMARY KEY,
    building_id VARCHAR(36) NOT NULL,
    unit_number VARCHAR(50) NOT NULL,
    floor_number INT NOT NULL,
    unit_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Available',
    base_rent DECIMAL(10, 2) NOT NULL,
    deposit DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (building_id) REFERENCES BUILDINGS(building_id) ON DELETE CASCADE
);

CREATE TABLE LEASES (
    lease_id VARCHAR(36) PRIMARY KEY,
    unit_id VARCHAR(36) NOT NULL,
    lease_start DATE NOT NULL,
    lease_end DATE NOT NULL,
    monthly_rent DECIMAL(10, 2) NOT NULL,
    security_deposit DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    FOREIGN KEY (unit_id) REFERENCES UNITS(unit_id) ON DELETE RESTRICT
);

CREATE TABLE LEASE_TENANTS (
    lease_id VARCHAR(36) NOT NULL,
    tenant_id VARCHAR(36) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (lease_id, tenant_id),
    FOREIGN KEY (lease_id) REFERENCES LEASES(lease_id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES TENANTS(tenant_id) ON DELETE RESTRICT
);

CREATE TABLE RENT_PAYMENTS (
    payment_id VARCHAR(36) PRIMARY KEY,
    lease_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'Pending',
    transaction_reference VARCHAR(100) UNIQUE,
    FOREIGN KEY (lease_id) REFERENCES LEASES(lease_id) ON DELETE RESTRICT
);

CREATE TABLE MAINTENANCE_REQUESTS (
    request_id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    unit_id VARCHAR(36) NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Submitted',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (tenant_id) REFERENCES TENANTS(tenant_id) ON DELETE RESTRICT,
    FOREIGN KEY (unit_id) REFERENCES UNITS(unit_id) ON DELETE CASCADE
);

CREATE TABLE MAINTENANCE_ASSIGNMENTS (
    assignment_id VARCHAR(36) PRIMARY KEY,
    request_id VARCHAR(36) NOT NULL,
    vendor_id VARCHAR(36),
    employee_id VARCHAR(36),
    assigned_date DATE NOT NULL,
    estimated_cost DECIMAL(10, 2),
    actual_cost DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'Assigned',
    notes TEXT,
    FOREIGN KEY (request_id) REFERENCES MAINTENANCE_REQUESTS(request_id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES VENDORS(vendor_id) ON DELETE SET NULL,
    FOREIGN KEY (employee_id) REFERENCES EMPLOYEES(employee_id) ON DELETE SET NULL
);

-- ==========================================================
-- 2. CUSTOM INDEXES
-- ==========================================================

CREATE INDEX idx_properties_city ON PROPERTIES(city);
CREATE INDEX idx_units_status ON UNITS(status);
CREATE INDEX idx_leases_status ON LEASES(status);
CREATE INDEX idx_payments_date ON RENT_PAYMENTS(payment_date);
CREATE INDEX idx_maintenance_status ON MAINTENANCE_REQUESTS(status);

-- ==========================================================
-- 3. VIEWS
-- ==========================================================

CREATE VIEW vw_property_overview AS
SELECT 
    p.property_id,
    p.property_name,
    p.property_type,
    p.city,
    p.state,
    p.total_area,
    o.owner_id
FROM PROPERTIES p
JOIN OWNERS o 
    ON p.owner_id = o.owner_id;

CREATE VIEW vw_available_units AS
SELECT 
    u.unit_id,
    u.unit_number,
    u.unit_type,
    u.base_rent,
    u.deposit,
    b.building_name,
    p.property_name,
    p.city
FROM UNITS u
JOIN BUILDINGS b 
    ON u.building_id = b.building_id
JOIN PROPERTIES p 
    ON b.property_id = p.property_id
WHERE u.status = 'Available';

CREATE VIEW vw_active_leases AS
SELECT 
    l.lease_id,
    l.unit_id,
    l.lease_start,
    l.lease_end,
    l.monthly_rent,
    l.security_deposit,
    l.status
FROM LEASES l
WHERE l.status = 'Active';

CREATE VIEW vw_maintenance_report AS
SELECT 
    mr.request_id,
    mr.category,
    mr.priority,
    mr.status,
    mr.submitted_at,
    u.unit_number,
    p.property_name
FROM MAINTENANCE_REQUESTS mr
JOIN UNITS u 
    ON mr.unit_id = u.unit_id
JOIN BUILDINGS b 
    ON u.building_id = b.building_id
JOIN PROPERTIES p 
    ON b.property_id = p.property_id;

-- ==========================================================
-- 4. TRIGGERS
-- ==========================================================

DELIMITER $$

CREATE TRIGGER trg_lease_after_insert
AFTER INSERT ON LEASES
FOR EACH ROW
BEGIN
    IF NEW.status = 'Active' THEN
        UPDATE UNITS
        SET status = 'Occupied'
        WHERE unit_id = NEW.unit_id;
    END IF;
END$$

CREATE TRIGGER trg_validate_lease_dates
BEFORE INSERT ON LEASES
FOR EACH ROW
BEGIN
    IF NEW.lease_end <= NEW.lease_start THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lease end date must be after lease start date';
    END IF;
END$$

CREATE TRIGGER trg_payment_before_insert
BEFORE INSERT ON RENT_PAYMENTS
FOR EACH ROW
BEGIN
    IF NEW.amount > 0 THEN
        SET NEW.payment_status = 'Paid';
    END IF;
END$$

CREATE TRIGGER trg_maintenance_before_update
BEFORE UPDATE ON MAINTENANCE_REQUESTS
FOR EACH ROW
BEGIN
    IF NEW.status = 'Resolved' AND OLD.status <> 'Resolved' THEN
        SET NEW.resolved_at = CURRENT_TIMESTAMP;
    END IF;
END$$

CREATE TRIGGER trg_maintenance_audit_insert
AFTER INSERT ON MAINTENANCE_REQUESTS
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOGS
    (
        audit_id, user_id, action, table_name, record_id, old_data, new_data
    )
    VALUES
    (
        UUID(), NULL, 'INSERT', 'MAINTENANCE_REQUESTS', NEW.request_id, NULL,
        JSON_OBJECT(
            'tenant_id', NEW.tenant_id,
            'unit_id', NEW.unit_id,
            'category', NEW.category,
            'priority', NEW.priority,
            'description', NEW.description,
            'status', NEW.status
        )
    );
END$$

CREATE TRIGGER trg_maintenance_audit_update
AFTER UPDATE ON MAINTENANCE_REQUESTS
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOGS
    (
        audit_id, user_id, action, table_name, record_id, old_data, new_data
    )
    VALUES
    (
        UUID(), NULL, 'UPDATE', 'MAINTENANCE_REQUESTS', NEW.request_id,
        JSON_OBJECT(
            'status', OLD.status,
            'priority', OLD.priority,
            'category', OLD.category
        ),
        JSON_OBJECT(
            'status', NEW.status,
            'priority', NEW.priority,
            'category', NEW.category
        )
    );
END$$

DELIMITER ;

-- ==========================================================
-- 5. DATABASE CONTROL LANGUAGE (DCL)
-- ==========================================================

-- Admin Account
CREATE USER IF NOT EXISTS 'prop_admin'@'localhost' IDENTIFIED BY 'Admin@123';
GRANT ALL PRIVILEGES ON propverse.* TO 'prop_admin'@'localhost';

-- Manager Account
CREATE USER IF NOT EXISTS 'property_manager'@'localhost' IDENTIFIED BY 'Manager@123';
GRANT SELECT, INSERT, UPDATE, DELETE ON propverse.* TO 'property_manager'@'localhost';
GRANT SELECT ON propverse.vw_available_units TO 'property_manager'@'localhost';

-- Maintenance Staff Account
CREATE USER IF NOT EXISTS 'maintenance_staff'@'localhost' IDENTIFIED BY 'Staff@123';
GRANT SELECT, UPDATE ON propverse.MAINTENANCE_REQUESTS TO 'maintenance_staff'@'localhost';
GRANT SELECT, UPDATE ON propverse.MAINTENANCE_ASSIGNMENTS TO 'maintenance_staff'@'localhost';
GRANT SELECT ON propverse.vw_maintenance_report TO 'maintenance_staff'@'localhost';

FLUSH PRIVILEGES;