const OWNER_READ_ROLES = ['admin', 'manager'];

const ownerViews = [
  {
    key: 'owners', label: 'Owners', kind: 'table', singular: 'owner', plural: 'owners',
    path: '/api/admin/owners', idKey: 'property_id', readOnly: true, allowedRoles: OWNER_READ_ROLES,
    columns: [
      { key: 'owner_name', label: 'Owner' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'property_name', label: 'Property' },
      { key: 'property_type', label: 'Type' },
      { key: 'city', label: 'City' },
      { key: 'total_area', label: 'Area (sq ft)', type: 'number' },
    ],
  },
  {
    key: 'tenants', label: 'Tenants', kind: 'table', singular: 'tenant', plural: 'tenants',
    path: '/api/admin/tenants', idKey: 'lease_id', readOnly: true, allowedRoles: OWNER_READ_ROLES,
    columns: [
      { key: 'tenant_name', label: 'Tenant' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'property_name', label: 'Property' },
      { key: 'building_name', label: 'Building' },
      { key: 'unit_number', label: 'Unit' },
      { key: 'monthly_rent', label: 'Monthly rent', type: 'money' },
      { key: 'lease_end', label: 'Lease ends' },
      { key: 'lease_status', label: 'Lease status', type: 'badge' },
    ],
  },
];

export const ROLES = {
  admin: {
    title: 'Admin',
    blurb: 'Manage the full property portfolio.',
    allowedRoles: ['admin'],
    views: [
      {
        key: 'properties', label: 'Properties', kind: 'table', singular: 'property', plural: 'properties',
        path: '/api/admin/property-overview', idKey: 'property_id', allowedRoles: ['admin'],
        columns: [
          { key: 'property_id', label: 'Property ID' },
          { key: 'property_name', label: 'Property' },
          { key: 'property_type', label: 'Type' },
          { key: 'city', label: 'City' },
          { key: 'state', label: 'State' },
          { key: 'total_area', label: 'Area (sq ft)', type: 'number' },
          { key: 'owner_id', label: 'Owner ID' },
        ],
      },
      ...ownerViews,
    ],
  },
  manager: {
    title: 'Manager',
    blurb: 'Find available units and create leases for tenants.',
    allowedRoles: ['manager'],
    views: [
      {
        key: 'available-units', label: 'Available units', kind: 'table', singular: 'unit', plural: 'units',
        path: '/api/manager/available-units', idKey: 'unit_id', allowedRoles: ['manager'],
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
      { key: 'new-lease', label: 'New lease', kind: 'lease', allowedRoles: ['manager'] },
      ...ownerViews,
    ],
  },
  staff: {
    title: 'Staff',
    blurb: 'See maintenance tickets across all properties.',
    allowedRoles: ['staff'],
    views: [
      {
        key: 'tickets', label: 'Maintenance tickets', kind: 'table', singular: 'ticket', plural: 'tickets',
        path: '/api/staff/tickets', idKey: 'request_id', allowedRoles: ['staff'],
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
  owner: {
    title: 'Owner',
    blurb: 'Track your properties, units, income and maintenance.',
    allowedRoles: ['owner'],
    summaryPaths: ['/api/owner/properties', '/api/owner/units', '/api/owner/payments'],
    views: [
      {
        key: 'properties', label: 'My properties', kind: 'table', singular: 'property', plural: 'properties',
        path: '/api/owner/properties', idKey: 'property_id', allowedRoles: ['owner'],
        columns: [
          { key: 'property_name', label: 'Property' },
          { key: 'property_type', label: 'Type' },
          { key: 'city', label: 'City' },
          { key: 'total_area', label: 'Area (sq ft)', type: 'number' },
          { key: 'is_active', label: 'Active', type: 'badge' },
        ],
      },
      {
        key: 'units', label: 'My units', kind: 'table', singular: 'unit', plural: 'units',
        path: '/api/owner/units', idKey: 'unit_id', allowedRoles: ['owner'],
        columns: [
          { key: 'property_name', label: 'Property' },
          { key: 'building_name', label: 'Building' },
          { key: 'unit_number', label: 'Unit' },
          { key: 'unit_type', label: 'Type' },
          { key: 'status', label: 'Status', type: 'badge' },
          { key: 'base_rent', label: 'Rent', type: 'money' },
          { key: 'tenant_name', label: 'Current tenant' },
        ],
      },
      {
        key: 'payments', label: 'Payments received', kind: 'table', singular: 'payment', plural: 'payments',
        path: '/api/owner/payments', idKey: 'payment_id', allowedRoles: ['owner'],
        columns: [
          { key: 'payment_date', label: 'Date' },
          { key: 'property_name', label: 'Property' },
          { key: 'unit_number', label: 'Unit' },
          { key: 'amount', label: 'Amount', type: 'money' },
          { key: 'payment_method', label: 'Method' },
          { key: 'payment_status', label: 'Status', type: 'badge' },
        ],
      },
      {
        key: 'maintenance', label: 'Maintenance', kind: 'table', singular: 'request', plural: 'requests',
        path: '/api/owner/maintenance', idKey: 'request_id', allowedRoles: ['owner'],
        columns: [
          { key: 'submitted_at', label: 'Submitted' },
          { key: 'property_name', label: 'Property' },
          { key: 'unit_number', label: 'Unit' },
          { key: 'category', label: 'Category' },
          { key: 'priority', label: 'Priority', type: 'badge' },
          { key: 'status', label: 'Status', type: 'badge' },
          { key: 'description', label: 'Description' },
        ],
      },
    ],
  },
  tenant: {
    title: 'Tenant',
    blurb: 'View your lease, payments and maintenance requests.',
    allowedRoles: ['tenant'],
    summaryPaths: ['/api/tenant/lease', '/api/tenant/payments'],
    views: [
      {
        key: 'lease', label: 'My lease', kind: 'table', singular: 'lease', plural: 'leases',
        path: '/api/tenant/lease', idKey: 'lease_id', allowedRoles: ['tenant'],
        columns: [
          { key: 'property_name', label: 'Property' },
          { key: 'building_name', label: 'Building' },
          { key: 'unit_number', label: 'Unit' },
          { key: 'lease_start', label: 'Start date' },
          { key: 'lease_end', label: 'End date' },
          { key: 'monthly_rent', label: 'Monthly rent', type: 'money' },
          { key: 'lease_status', label: 'Status', type: 'badge' },
        ],
      },
      {
        key: 'payments', label: 'My payments', kind: 'table', singular: 'payment', plural: 'payments',
        path: '/api/tenant/payments', idKey: 'payment_id', allowedRoles: ['tenant'],
        columns: [
          { key: 'payment_date', label: 'Date' },
          { key: 'property_name', label: 'Property' },
          { key: 'unit_number', label: 'Unit' },
          { key: 'amount', label: 'Amount', type: 'money' },
          { key: 'payment_method', label: 'Method' },
          { key: 'payment_status', label: 'Status', type: 'badge' },
        ],
      },
      {
        key: 'maintenance', label: 'Maintenance requests', kind: 'maintenance', singular: 'request',
        plural: 'requests', path: '/api/tenant/maintenance', idKey: 'request_id', allowedRoles: ['tenant'],
      },
    ],
  },
};

export const CREATE_LEASE_PATH = '/api/manager/create-lease';
export const UNITS_PATH = '/api/manager/available-units';
export const MANAGER_TENANTS_PATH = '/api/manager/tenants';
