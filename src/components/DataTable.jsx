import Badge from './Badge.jsx';
import { money, shortDateTime } from '../utils.js';

function Cell({ col, value }) {
  if (value === null || value === undefined || value === '') return <span className="muted">-</span>;
  if (col.type === 'badge') return <Badge value={value} />;
  if (col.type === 'money') return <span className="num">{money(value)}</span>;
  if (col.type === 'number') return <span className="num">{Number(value).toLocaleString('en-IN')}</span>;
  return shortDateTime(String(value));
}

export default function DataTable({ columns, rows, idKey }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((c) => <th key={c.key} scope="col">{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row[idKey] ?? i}>
              {columns.map((c) => <td key={c.key}><Cell col={c} value={row[c.key]} /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
