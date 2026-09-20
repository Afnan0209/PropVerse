import { NavLink, Outlet, useParams, Navigate, Link } from 'react-router-dom';
import { ROLES } from '../config/views.js';

export default function Layout() {
  const { role } = useParams();
  const cfg = ROLES[role];
  if (!cfg) return <Navigate to="/" replace />;

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/" className="brand" aria-label="PropVerse, switch role">
          <span className="brand-mark" aria-hidden="true" />
          PropVerse
        </Link>
        <p className="role-chip">{cfg.title} workspace</p>

        <nav aria-label="Main">
          <NavLink to={`/${role}/dashboard`} className="nav-link">Overview</NavLink>
          {cfg.views.map((v) => (
            <NavLink key={v.key} to={`/${role}/${v.key}`} className="nav-link">{v.label}</NavLink>
          ))}
        </nav>

        <Link to="/" className="switch">Switch role</Link>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
