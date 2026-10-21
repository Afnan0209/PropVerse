import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRows, postJson, errorMessage } from '../api/client.js';
import { CREATE_LEASE_PATH, MANAGER_TENANTS_PATH, UNITS_PATH } from '../config/views.js';
import { money } from '../utils.js';

const EMPTY = { unit_id: '', tenant_id: '', start_date: '', end_date: '', monthly_rent: '', security_deposit: '' };

export default function LeaseForm() {
  const [units, setUnits] = useState(null);
  const [tenants, setTenants] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadResources() {
    setError('');
    try {
      const [availableUnits, availableTenants] = await Promise.all([
        getRows(UNITS_PATH),
        getRows(MANAGER_TENANTS_PATH),
      ]);
      setUnits(availableUnits);
      setTenants(availableTenants);
    } catch (requestError) {
      setUnits([]);
      setTenants([]);
      setError(errorMessage(requestError));
    }
  }

  useEffect(() => { loadResources(); }, []);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  function pickUnit(id) {
    const unit = units?.find((item) => item.unit_id === id);
    setForm((current) => ({
      ...current,
      unit_id: id,
      monthly_rent: unit ? unit.base_rent : '',
      security_deposit: unit ? unit.deposit : '',
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (form.end_date <= form.start_date) {
      setError('The lease end date must be after the start date.');
      return;
    }
    setSaving(true);
    try {
      const response = await postJson(CREATE_LEASE_PATH, {
        unit_id: form.unit_id,
        tenant_id: form.tenant_id,
        start_date: form.start_date,
        end_date: form.end_date,
        monthly_rent: form.monthly_rent,
        security_deposit: form.security_deposit,
      });
      setSuccess(response.data?.message || 'Lease created.');
      setForm(EMPTY);
      await loadResources();
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
            <select id="unit" required value={form.unit_id} onChange={(event) => pickUnit(event.target.value)} disabled={!units}>
              <option value="">{units ? (units.length ? 'Choose an available unit' : 'No units are available') : 'Loading units...'}</option>
              {units?.map((unit) => (
                <option key={unit.unit_id} value={unit.unit_id}>
                  {unit.unit_number}, {unit.building_name}, {unit.property_name} ({unit.unit_type}, {money(unit.base_rent)})
                </option>
              ))}
            </select>
          </div>

          <div className="field wide">
            <label htmlFor="tenant">Tenant</label>
            <select id="tenant" required value={form.tenant_id} onChange={(event) => set('tenant_id', event.target.value)} disabled={!tenants}>
              <option value="">{tenants ? (tenants.length ? 'Choose a tenant' : 'No tenants found') : 'Loading tenants...'}</option>
              {tenants?.map((tenant) => (
                <option key={tenant.tenant_id} value={tenant.tenant_id}>
                  {tenant.name} ({tenant.email})
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="start">Lease start</label>
            <input id="start" type="date" required value={form.start_date} onChange={(event) => set('start_date', event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="end">Lease end</label>
            <input id="end" type="date" required value={form.end_date} onChange={(event) => set('end_date', event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="rent">Monthly rent</label>
            <input id="rent" type="number" min="0.01" step="0.01" required value={form.monthly_rent} onChange={(event) => set('monthly_rent', event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="deposit">Security deposit</label>
            <input id="deposit" type="number" min="0" step="0.01" required value={form.security_deposit} onChange={(event) => set('security_deposit', event.target.value)} />
          </div>
        </div>

        <div className="modal-actions">
          <button type="submit" className="btn" disabled={saving || !units?.length || !tenants?.length}>
            {saving ? 'Creating lease...' : 'Create lease'}
          </button>
        </div>
      </form>
    </>
  );
}
