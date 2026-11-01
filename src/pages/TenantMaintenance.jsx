import { useEffect, useState } from 'react';
import { getRows, postJson, errorMessage } from '../api/client.js';
import DataTable from '../components/DataTable.jsx';

const CATEGORIES = ['Plumbing', 'Electrical', 'HVAC', 'Appliance', 'Structural', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const EMPTY = { category: 'Plumbing', priority: 'Medium', description: '' };
const COLUMNS = [
  { key: 'submitted_at', label: 'Submitted' },
  { key: 'property_name', label: 'Property' },
  { key: 'unit_number', label: 'Unit' },
  { key: 'category', label: 'Category' },
  { key: 'priority', label: 'Priority', type: 'badge' },
  { key: 'status', label: 'Status', type: 'badge' },
  { key: 'description', label: 'Description' },
];

export default function TenantMaintenance({ view }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  async function loadRequests() {
    setLoading(true);
    setError('');
    try {
      setRows(await getRows(view.path));
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRequests(); }, [view.path]);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const response = await postJson('/api/tenant/maintenance', form);
      setSuccess(response.data?.message || 'Maintenance request submitted.');
      setForm(EMPTY);
      await loadRequests();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1>{view.label}</h1>
          <p className="muted">{loading ? 'Loading...' : `${rows.length} ${rows.length === 1 ? view.singular : view.plural}`}</p>
        </div>
        <span className="badge badge-quiet">For your account only</span>
      </header>

      {error && <p className="alert" role="alert">{error}</p>}
      {success && <p className="notice" role="status">{success}</p>}

      <form className="panel request-form" onSubmit={submit}>
        <h2>New request</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" value={form.category} onChange={(event) => set('category', event.target.value)}>
              {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="priority">Priority</label>
            <select id="priority" value={form.priority} onChange={(event) => set('priority', event.target.value)}>
              {PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}
            </select>
          </div>
          <div className="field wide">
            <label htmlFor="description">Description</label>
            <textarea id="description" rows="4" required maxLength="2000" value={form.description} onChange={(event) => set('description', event.target.value)} />
          </div>
        </div>
        <button type="submit" className="btn" disabled={saving}>
          {saving ? 'Submitting...' : 'Submit request'}
        </button>
      </form>

      <h2 className="section-title">Your requests</h2>
      {!loading && !error && rows.length === 0 && <p className="empty">No maintenance requests yet.</p>}
      {rows.length > 0 && <DataTable columns={COLUMNS} rows={rows} idKey="request_id" />}
    </>
  );
}
