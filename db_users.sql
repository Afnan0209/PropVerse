-- Run with an account allowed to manage MySQL users and grants.
-- Replace every placeholder password before running this script.

CREATE USER IF NOT EXISTS 'prop_admin'@'%' IDENTIFIED BY 'REPLACE_WITH_ADMIN_PASSWORD';
CREATE USER IF NOT EXISTS 'property_manager'@'%' IDENTIFIED BY 'REPLACE_WITH_PROPERTY_MANAGER_PASSWORD';
CREATE USER IF NOT EXISTS 'maintenance_staff'@'%' IDENTIFIED BY 'REPLACE_WITH_MAINTENANCE_STAFF_PASSWORD';
CREATE USER IF NOT EXISTS 'prop_owner'@'%' IDENTIFIED BY 'REPLACE_WITH_PROPERTY_OWNER_PASSWORD';
CREATE USER IF NOT EXISTS 'prop_tenant'@'%' IDENTIFIED BY 'REPLACE_WITH_PROPERTY_TENANT_PASSWORD';

GRANT ALL PRIVILEGES ON propverse.* TO 'prop_admin'@'%';

GRANT SELECT ON propverse.vw_property_overview TO 'property_manager'@'%';
GRANT SELECT ON propverse.vw_available_units TO 'property_manager'@'%';
GRANT SELECT ON propverse.vw_active_leases TO 'property_manager'@'%';
GRANT SELECT ON propverse.vw_maintenance_report TO 'property_manager'@'%';
GRANT SELECT ON propverse.vw_owner_portfolio TO 'property_manager'@'%';
GRANT SELECT ON propverse.vw_tenant_lease_details TO 'property_manager'@'%';
GRANT SELECT ON propverse.vw_owner_units TO 'property_manager'@'%';
GRANT SELECT ON propverse.vw_owner_payments TO 'property_manager'@'%';
GRANT SELECT ON propverse.vw_tenant_payments TO 'property_manager'@'%';
GRANT SELECT ON propverse.vw_tenant_active_units TO 'property_manager'@'%';
GRANT SELECT ON propverse.vw_owner_maintenance TO 'property_manager'@'%';
GRANT SELECT ON propverse.vw_tenant_maintenance TO 'property_manager'@'%';
GRANT SELECT ON propverse.UNITS TO 'property_manager'@'%';
GRANT SELECT ON propverse.TENANTS TO 'property_manager'@'%';
GRANT SELECT ON propverse.USERS TO 'property_manager'@'%';
GRANT INSERT ON propverse.LEASES TO 'property_manager'@'%';
GRANT INSERT ON propverse.LEASE_TENANTS TO 'property_manager'@'%';
GRANT UPDATE ON propverse.UNITS TO 'property_manager'@'%';

GRANT SELECT, UPDATE ON propverse.MAINTENANCE_REQUESTS TO 'maintenance_staff'@'%';
GRANT SELECT, UPDATE ON propverse.MAINTENANCE_ASSIGNMENTS TO 'maintenance_staff'@'%';
GRANT SELECT ON propverse.vw_maintenance_report TO 'maintenance_staff'@'%';

GRANT SELECT ON propverse.vw_owner_portfolio TO 'prop_owner'@'%';
GRANT SELECT ON propverse.vw_owner_units TO 'prop_owner'@'%';
GRANT SELECT ON propverse.vw_owner_payments TO 'prop_owner'@'%';
GRANT SELECT ON propverse.vw_owner_maintenance TO 'prop_owner'@'%';

GRANT SELECT ON propverse.vw_tenant_lease_details TO 'prop_tenant'@'%';
GRANT SELECT ON propverse.vw_tenant_payments TO 'prop_tenant'@'%';
GRANT SELECT ON propverse.vw_tenant_active_units TO 'prop_tenant'@'%';
GRANT SELECT ON propverse.vw_tenant_maintenance TO 'prop_tenant'@'%';
GRANT INSERT ON propverse.MAINTENANCE_REQUESTS TO 'prop_tenant'@'%';

FLUSH PRIVILEGES;
