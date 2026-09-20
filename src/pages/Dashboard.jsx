import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ROLES } from '../config/views.js';
import { getRows, errorMessage } from '../api/client.js';
import { isOpenRequest, money, shortDateTime } from '../utils.js';
import Badge from '../components/Badge.jsx';

const tally = (rows, key, order) => {
  const counts = {};
  rows.forEach((r) => { counts[r[key]] = (counts[r[key]] || 0) + 1; });
  const labels = order || Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  return labels.map((label) => ({ label, n: counts[label] || 0 }));
};
const sum = (rows, key) => rows.reduce((s, r) => s + Number(r[key] || 0), 0);

// What each role sees on its overview, computed from the one list its API provides
const SUMMARIES = {
  admin: (rows) => ({
    ledger: [
      { label: 'Properties', value: rows.length, note: `${new Set(rows.map((r) => r.city)).size} cities` },
      { label: 'Residential', value: rows.filter((r) => r.property_type === 'Residential').length, note: 'properties' },
      { label: 'Commercial', value: rows.filter((r) => r.property_type === 'Commercial').length, note: 'properties' },
      { label: 'Total area', value: `${sum(rows, 'total_area').toLocaleString('en-IN')} sq ft`, note: `${new Set(rows.map((r) => r.owner_id)).size} owners` },
    ],
    charts: [
      { title: 'Properties by type', items: tally(rows, 'property_type') },
      { title: 'Properties by owner', items: tally(rows, 'owner_id') },
    ],
  }),
  manager: (rows) => ({
    ledger: [
      { label: 'Units to let', value: rows.length, note: `${new Set(rows.map((r) => r.property_name)).size} properties with vacancies` },
      { label: 'Rent on offer', value: money(sum(rows, 'base_rent')), note: 'per month if all are let' },
      { label: 'Deposits on offer', value: money(sum(rows, 'deposit')), note: 'across available units' },
      { label: 'Average rent', value: rows.length ? money(Math.round(sum(rows, 'base_rent') / rows.length)) : '-', note: 'per available unit' },
    ],
    charts: [
      { title: 'Available by unit type', items: tally(rows, 'unit_type') },
      { title: 'Available by property', items: tally(rows, 'property_name') },
    ],
  }),
  staff: (rows) => {
    const open = rows.filter(isOpenRequest);
    return {
      ledger: [
        { label: 'Open tickets', value: open.length, note: `${rows.length} in total` },
        { label: 'High priority open', value: open.filter((r) => r.priority === 'High').length, note: 'need attention first' },
        { label: 'In progress', value: rows.filter((r) => r.status === 'In Progress').length, note: 'being worked on' },
        { label: 'Closed', value: rows.length - open.length, note: 'resolved or completed' },
      ],
      charts: [
        { title: 'Tickets by status', items: tally(rows, 'status', ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Completed']) },
        { title: 'Tickets by priority', items: tally(rows, 'priority', ['High', 'Medium', 'Low']) },
      ],
      feed: [...rows].sort((a, b) => String(b.submitted_at).localeCompare(String(a.submitted_at))).slice(0, 6),
    };
  },
};

function Bars({ items }) {
  const max = Math.max(1, ...items.map((i) => i.n));
  return (
    <ul className="bars">
      {items.map(({ label, n }) => (
        <li key={label}>
          <span className="bar-label">{label}</span>
          <span className="bar-track"><span className="bar-fill" style={{ width: `${(n / max) * 100}%` }} /></span>
          <span className="bar-n">{n}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const { role } = useParams();
  const source = ROLES[role].views[0];
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setRows(null);
    setError('');
    getRows(source.path).then(setRows).catch((e) => setError(`${errorMessage(e)}  (GET ${source.path})`));
  }, [role, source.path]);

  if (error) return <p className="alert" role="alert">{error}</p>;
  if (!rows) return <p className="muted">Loading overview...</p>;

  const s = SUMMARIES[role](rows);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Overview</h1>
          <p className="muted">Live from your PropVerse database.</p>
        </div>
      </header>

      <section className="ledger" aria-label="Key figures">
        {s.ledger.map((item) => (
          <div className="ledger-item" key={item.label}>
            <p className="ledger-label">{item.label}</p>
            <p className="ledger-value">{item.value}</p>
            <p className="ledger-note">{item.note}</p>
          </div>
        ))}
      </section>

      <div className="two-col">
        {s.feed ? (
          <>
            <section>
              {s.charts.map((c, i) => (
                <div key={c.title} className={i ? 'gap-top' : ''}>
                  <h2>{c.title}</h2>
                  <Bars items={c.items} />
                </div>
              ))}
            </section>
            <section>
              <h2>Latest tickets</h2>
              <ul className="feed">
                {s.feed.map((r) => (
                  <li key={r.request_id}>
                    <div>
                      <strong>{r.category}</strong> in {r.unit_number}
                      <p className="muted">{r.property_name}</p>
                    </div>
                    <div className="feed-meta">
                      <Badge value={r.status} />
                      <span className="muted">{shortDateTime(r.submitted_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : (
          s.charts.map((c) => (
            <section key={c.title}>
              <h2>{c.title}</h2>
              <Bars items={c.items} />
            </section>
          ))
        )}
      </div>
    </>
  );
}
