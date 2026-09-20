/**
 * The screens of each workspace, matched to the real FastAPI routes:
 *   admin.py   GET  /api/admin/property-overview
 *   manager.py GET  /api/manager/available-units   POST /api/manager/create-lease
 *   staff.py   GET  /api/staff/tickets
 *
 * When you add a new backend route, add one entry here and a new page appears.
 * column types: text (default) | money | number | badge
 */
export const ROLES = {
  admin: {
    title: 'Admin',
    blurb: 'See every property in the portfolio and who owns it.',
    views: [
      {
        key: 'properties', label: 'Properties', kind: 'table', singular: 'property', plural: 'properties',
        path: '/api/admin/property-overview', idKey: 'property_id',
        columns: [
          { key: 'property_id', label: 'Property ID' },
          { key: 'property_name', label: 'Property' },
          { key: 'property_type', label: 'Type' },
          { key: 'city', label: 'City' },
          { key: 'state', label: 'State' },
          { key: 'total_area', label: 'Area (sq ft)', type: 'number' },
          { key: 'owner_id', label: 'Owner' },
        ],
      },
    ],
  },
  manager: {
    title: 'Manager',
    blurb: 'Find available units and create leases for tenants.',
    views: [
      {
        key: 'available-units', label: 'Available units', kind: 'table', singular: 'unit', plural: 'units',
        path: '/api/manager/available-units', idKey: 'unit_id',
        columns: [
          { key: 'unit_id', label: 'Unit ID' },
          { key: 'unit_number', label: 'Unit' },
          { key: 'unit_type', label: 'Type' },
          { key: 'building_name', label: 'Building' },
          { key: 'property_name', label: 'Property' },
          { key: 'city', label: 'City' },
          { key: 'base_rent', label: 'Monthly rent', type: 'money' },
          { key: 'deposit', label: 'Deposit', type: 'money' },
        ],
      },
      { key: 'new-lease', label: 'New lease', kind: 'lease' },
    ],
  },
  staff: {
    title: 'Staff',
    blurb: 'See maintenance tickets across all properties.',
    views: [
      {
        key: 'tickets', label: 'Maintenance tickets', kind: 'table', singular: 'ticket', plural: 'tickets',
        path: '/api/staff/tickets', idKey: 'request_id',
        columns: [
          { key: 'request_id', label: 'Request' },
          { key: 'category', label: 'Category' },
          { key: 'priority', label: 'Priority', type: 'badge' },
          { key: 'status', label: 'Status', type: 'badge' },
          { key: 'unit_number', label: 'Unit' },
          { key: 'property_name', label: 'Property' },
          { key: 'submitted_at', label: 'Submitted' },
        ],
      },
    ],
  },
};

export const CREATE_LEASE_PATH = '/api/manager/create-lease';
export const UNITS_PATH = '/api/manager/available-units';
