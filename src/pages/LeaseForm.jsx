import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRows, postJson, errorMessage } from '../api/client.js';
import { CREATE_LEASE_PATH, UNITS_PATH } from '../config/views.js';
import { money } from '../utils.js';

const EMPTY = { unit_id: '', tenant_id: '', start_date: '', end_date: '', monthly_rent: '', security_deposit: '' };

export default function LeaseForm() {
  const [units, setUnits] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const loadUnits = () =>
    getRows(UNITS_PATH).then(setUnits).catch((e) => { setUnits([]); setError(errorMessage(e)); });
  useEffect(() => { loadUnits(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Picking a unit fills in its listed rent and deposit (still editable)
  function pickUnit(id) {
    const u = units?.find((x) => x.unit_id === id);
    setForm((f) => ({
      ...f,
      unit_id: id,
      monthly_rent: u ? u.base_rent : '',
      security_deposit: u ? u.deposit : '',
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.end_date <= form.start_date) {
      setError('The lease end date must be after the start date.');
      return;
    }
    setSaving(true);
    try {
      const res = await postJson(CREATE_LEASE_PATH, {
        unit_id: form.unit_id,
        tenant_id: form.tenant_id.trim(),
        start_date: form.start_date,
        end_date: form.end_date,
        monthly_rent: Number(form.monthly_rent),
        security_deposit: Number(form.security_deposit),
      });
      setSuccess(res.data?.message || 'Lease created.');
      setForm(EMPTY);
      loadUnits(); // the unit is now occupied, so it leaves the list
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1>New lease</h1>
          <p className="muted">Creates the lease and links the tenant. The unit is marked occupied automatically.</p>
        </div>
      </header>

      {success && <p className="notice" role="status">{success} <Link to="../available-units">View available units</Link></p>}
      {error && <p className="alert" role="alert">{error}</p>}

      <form className="panel" onSubmit={submit}>
        <div className="form-grid">
          <div className="field wide">
            <label htmlFor="unit">Unit</label>
            <select id="unit" required value={form.unit_id} onChange={(e) => pickUnit(e.target.value)} disabled={!units}>
              <option value="">{units ? (units.length ? 'Choose an available unit' : 'No units are available') : 'Loading units...'}</option>
              {units?.map((u) => (
                <option key={u.unit_id} value={u.unit_id}>
                  {u.unit_number}, {u.building_name}, {u.property_name} ({u.unit_type}, {money(u.base_rent)})
                </option>
              ))}
            </select>
          </div>

          <div className="field wide">
            <label htmlFor="tenant">Tenant ID</label>
            <input id="tenant" required placeholder="For example TEN-001" value={form.tenant_id} onChange={(e) => set('tenant_id', e.target.value)} />
            <p className="hint">The tenant_id from the TENANTS table. The lease fails if this ID does not exist.</p>
          </div>

          <div className="field">
            <label htmlFor="start">Lease start</label>
            <input id="start" type="date" required value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="end">Lease end</label>
            <input id="end" type="date" required value={form.end_date} onChange={(e) => set('end_date', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="rent">Monthly rent</label>
            <input id="rent" type="number" min="0" step="0.01" required value={form.monthly_rent} onChange={(e) => set('monthly_rent', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="deposit">Security deposit</label>
            <input id="deposit" type="number" min="0" step="0.01" required value={form.security_deposit} onChange={(e) => set('security_deposit', e.target.value)} />
          </div>
        </div>

        <div className="modal-actions">
          <button type="submit" className="btn" disabled={saving || !units?.length}>
            {saving ? 'Creating lease...' : 'Create lease'}
          </button>
        </div>
      </form>
    </>
  );
}
