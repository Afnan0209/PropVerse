import { toneOf } from '../utils.js';

export default function Badge({ value }) {
  return <span className={`badge badge-${toneOf(value)}`}>{value}</span>;
}
