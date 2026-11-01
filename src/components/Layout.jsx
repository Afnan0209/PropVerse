import { NavLink, Outlet, Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { ROLES } from '../config/views.js';

export default function Layout() {
  const { role } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const cfg = ROLES[role];
  if (!cfg || !user || !cfg.allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;

  function signOut() {
    logout();
    navigate('/login', { replace: true });
  }

  const views = cfg.views.filter((view) => view.allowedRoles.includes(user.role));

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to={`/${role}/dashboard`} className="brand" aria-label="PropVerse home">
          <span className="brand-mark" aria-hidden="true" />
          PropVerse
        </Link>
        <div className="identity">
          <p className="user-name">{user.full_name}</p>
          <p className="role-chip">{cfg.title} workspace</p>
        </div>

        <nav aria-label="Main">
          <NavLink to={`/${role}/dashboard`} className="nav-link">Overview</NavLink>
          {views.map((view) => (
            <NavLink key={view.key} to={`/${role}/${view.key}`} className="nav-link">
              {view.label}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="logout-btn" onClick={signOut}>Logout</button>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
