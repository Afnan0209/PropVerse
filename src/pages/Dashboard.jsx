import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ROLES } from '../config/views.js';
import { getRows, errorMessage } from '../api/client.js';
import { isOpenRequest, money, shortDateTime } from '../utils.js';
import Badge from '../components/Badge.jsx';

const tally = (rows, key, order) => {
  const counts = {};
  rows.forEach((row) => {
    if (row[key] !== null && row[key] !== undefined && row[key] !== '') {
      counts[row[key]] = (counts[row[key]] || 0) + 1;
    }
  });
  const labels = order || Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  return labels.map((label) => ({ label, n: counts[label] || 0 }));
};
const sum = (rows, key) => rows.reduce((total, row) => total + Number(row[key] || 0), 0);

const SUMMARIES = {
  admin: (rows) => ({
    ledger: [
      { label: 'Properties', value: rows.length, note: `${new Set(rows.map((row) => row.city)).size} cities` },
      { label: 'Residential', value: rows.filter((row) => row.property_type === 'Residential').length, note: 'properties' },
      { label: 'Commercial', value: rows.filter((row) => row.property_type === 'Commercial').length, note: 'properties' },
      { label: 'Total area', value: `${sum(rows, 'total_area').toLocaleString('en-IN')} sq ft`, note: `${new Set(rows.map((row) => row.owner_id)).size} owners` },
    ],
    charts: [
      { title: 'Properties by type', items: tally(rows, 'property_type') },
      { title: 'Properties by owner', items: tally(rows, 'owner_id') },
    ],
  }),
  manager: (rows) => ({
    ledger: [
      { label: 'Units to let', value: rows.length, note: `${new Set(rows.map((row) => row.property_name)).size} properties with vacancies` },
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
        { label: 'High priority open', value: open.filter((row) => row.priority === 'High').length, note: 'need attention first' },
        { label: 'In progress', value: rows.filter((row) => row.status === 'In Progress').length, note: 'being worked on' },
        { label: 'Closed', value: rows.length - open.length, note: 'resolved or completed' },
      ],
      charts: [
        { title: 'Tickets by status', items: tally(rows, 'status', ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Completed']) },
        { title: 'Tickets by priority', items: tally(rows, 'priority', ['High', 'Medium', 'Low']) },
      ],
      feed: [...rows].sort((a, b) => String(b.submitted_at).localeCompare(String(a.submitted_at))).slice(0, 6),
    };
  },
  owner: ({ properties, units, payments }) => {
    const occupied = units.filter((unit) => unit.status === 'Occupied').length;
    const collected = payments.filter((payment) => payment.payment_status === 'Paid');
    return {
      ledger: [
        { label: 'Properties', value: properties.length, note: 'in your portfolio' },
        { label: 'Units', value: units.length, note: `${occupied} occupied · ${units.filter((unit) => unit.status === 'Available').length} available` },
        { label: 'Occupied', value: occupied, note: 'leased units' },
        { label: 'Rent collected', value: money(sum(collected, 'amount')), note: `${collected.length} paid payments` },
      ],
      charts: [
        { title: 'Properties by city', items: tally(properties, 'city') },
        { title: 'Units by status', items: tally(units, 'status', ['Occupied', 'Available', 'Under Maintenance']) },
      ],
    };
  },
  tenant: ({ leases, payments }) => {
    const lease = leases.find((row) => row.lease_id);
    const lastPayment = [...payments].sort((a, b) => String(b.payment_date).localeCompare(String(a.payment_date)))[0];
    return {
      ledger: [
        { label: 'Leased unit', value: lease?.unit_number || '-', note: lease?.property_name || 'No active lease' },
        { label: 'Monthly rent', value: lease ? money(lease.monthly_rent) : '-', note: 'current lease' },
        { label: 'Lease ends', value: lease?.lease_end || '-', note: lease?.lease_status || 'No active lease' },
        { label: 'Last payment', value: lastPayment ? money(lastPayment.amount) : '-', note: lastPayment?.payment_date || 'No payments recorded' },
      ],
      charts: [
        { title: 'Your lease', items: tally(leases.filter((row) => row.lease_status), 'lease_status') },
        { title: 'Payments by status', items: tally(payments, 'payment_status', ['Paid', 'Pending', 'Failed']) },
      ],
    };
  },
};

function Bars({ items }) {
  const max = Math.max(1, ...items.map((item) => item.n));
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
  const config = ROLES[role];
  const source = config.views[0];
  const paths = config.summaryPaths || [source.path];
  const pathsKey = paths.join('|');
  const [datasets, setDatasets] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setDatasets(null);
    setError('');
    Promise.all(paths.map((path) => getRows(path)))
      .then(setDatasets)
      .catch((requestError) => setError(`${errorMessage(requestError)}  (GET ${source.path})`));
  }, [role, pathsKey]);

  if (error) return <p className="alert" role="alert">{error}</p>;
  if (!datasets) return <p className="muted">Loading overview...</p>;

  let summaryData = datasets[0];
  if (role === 'owner') {
    summaryData = { properties: datasets[0], units: datasets[1], payments: datasets[2] };
  } else if (role === 'tenant') {
    summaryData = { leases: datasets[0], payments: datasets[1] };
  }
  const summary = SUMMARIES[role](summaryData);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Overview</h1>
          <p className="muted">Live from your PropVerse database.</p>
        </div>
      </header>

      <section className="ledger" aria-label="Key figures">
        {summary.ledger.map((item) => (
          <div className="ledger-item" key={item.label}>
            <p className="ledger-label">{item.label}</p>
            <p className="ledger-value">{item.value}</p>
            <p className="ledger-note">{item.note}</p>
          </div>
        ))}
      </section>

      <div className="two-col">
        {summary.feed ? (
          <>
            <section>
              {summary.charts.map((chart, index) => (
                <div key={chart.title} className={index ? 'gap-top' : ''}>
                  <h2>{chart.title}</h2>
                  <Bars items={chart.items} />
                </div>
              ))}
            </section>
            <section>
              <h2>Latest tickets</h2>
              <ul className="feed">
                {summary.feed.map((row) => (
                  <li key={row.request_id}>
                    <div>
                      <strong>{row.category}</strong> in {row.unit_number}
                      <p className="muted">{row.property_name}</p>
                    </div>
                    <div className="feed-meta">
                      <Badge value={row.status} />
                      <span className="muted">{shortDateTime(row.submitted_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : (
          summary.charts.map((chart) => (
            <section key={chart.title}>
              <h2>{chart.title}</h2>
              <Bars items={chart.items} />
            </section>
          ))
        )}
      </div>
    </>
  );
}
