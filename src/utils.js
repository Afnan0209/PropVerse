export const humanize = (s) => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export const money = (v) =>
  v === null || v === undefined || v === '' ? '' : `₹${Number(v).toLocaleString('en-IN')}`;

export const shortDateTime = (v) =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(v)
    ? v.replace('T', ' ').slice(0, 16)
    : v;

// PROP-008 -> next id is PROP-009
export function nextId(prefix, rows, idKey) {
  let max = 0;
  rows.forEach((r) => {
    const m = String(r[idKey] ?? '').match(/(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

const TONES = {
  good: ['Paid', 'Active', 'Resolved', 'Completed', 'Available'],
  warn: ['Pending', 'In Progress', 'Assigned', 'Submitted', 'Medium', 'Under Maintenance'],
  bad: ['High', 'Failed', 'Terminated'],
  info: ['Occupied'],
};
export const toneOf = (value) => {
  for (const [tone, list] of Object.entries(TONES)) if (list.includes(value)) return tone;
  return 'quiet';
};

export const isOpenRequest = (r) => !['Resolved', 'Completed'].includes(r.status);
