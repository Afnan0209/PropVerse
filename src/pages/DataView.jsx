import { useEffect, useMemo, useState } from 'react';
import { getRows, errorMessage } from '../api/client.js';
import DataTable from '../components/DataTable.jsx';

export default function DataView({ view }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    getRows(view.path)
      .then(setRows)
      .catch((e) => setError(`${errorMessage(e)}  (GET ${view.path})`))
      .finally(() => setLoading(false));
  };
  useEffect(load, [view.path]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => Object.values(r).join(' ').toLowerCase().includes(q)) : rows;
  }, [rows, query]);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>{view.label}</h1>
          <p className="muted">
            {loading ? 'Loading...' : `${shown.length} of ${rows.length} ${rows.length === 1 ? view.singular : view.plural}`}
          </p>
        </div>
        <div className="head-tools">
          <input
            type="search" className="search" placeholder={`Search ${view.plural}`}
            aria-label={`Search ${view.plural}`} value={query} onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn ghost" onClick={load}>Refresh</button>
        </div>
      </header>

      {error && <p className="alert" role="alert">{error}</p>}
      {!loading && !error && rows.length === 0 && <p className="empty">No {view.plural} found.</p>}
      {shown.length > 0 && <DataTable columns={view.columns} rows={shown} idKey={view.idKey} />}
    </>
  );
}
