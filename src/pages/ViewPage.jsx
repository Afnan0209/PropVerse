import { Navigate, useParams } from 'react-router-dom';
import { ROLES } from '../config/views.js';
import DataView from './DataView.jsx';
import LeaseForm from './LeaseForm.jsx';

export default function ViewPage() {
  const { role, view: key } = useParams();
  const view = ROLES[role]?.views.find((v) => v.key === key);
  if (!view) return <Navigate to={`/${role}/dashboard`} replace />;
  return view.kind === 'lease' ? <LeaseForm /> : <DataView key={`${role}-${view.key}`} view={view} />;
}
