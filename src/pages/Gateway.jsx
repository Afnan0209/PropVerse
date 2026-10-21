import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { api, API_URL, errorMessage } from '../api/client.js';
import { ROLES } from '../config/views.js';

export default function Gateway() {
  const { user, loading, initError, login } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState({ state: 'checking', text: 'Checking backend...' });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [backendSlow, setBackendSlow] = useState(false);
  const [loginSlow, setLoginSlow] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (active) setBackendSlow(true);
    }, 3000);
    api.get('/')
      .then(() => {
        if (active) {
          setStatus({ state: 'ok', text: `Backend connected at ${API_URL}` });
          setBackendSlow(false);
        }
      })
      .catch((requestError) => {
        if (active) {
          setStatus({ state: 'fail', text: errorMessage(requestError) });
          setBackendSlow(false);
        }
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  if (loading) return <p className="muted route-loading">Restoring your session...</p>;
  if (user) return <Navigate to={`/${user.role}/dashboard`} replace />;

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    setLoginSlow(false);
    const timer = window.setTimeout(() => setLoginSlow(true), 3000);
    try {
      const signedIn = await login(username.trim(), password);
      navigate(`/${signedIn.role}/dashboard`, { replace: true });
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      window.clearTimeout(timer);
      setLoginSlow(false);
      setSubmitting(false);
    }
  }

  return (
    <div className="gateway">
      <div className="gateway-inner login-inner">
        <h1 className="gateway-title">PropVerse</h1>
        <p className="gateway-sub">Sign in to your property-management workspace.</p>

        <form className="login-form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {initError && <p className="alert" role="alert">Could not restore your session: {initError}</p>}
          {error && <p className="alert" role="alert">{error}</p>}
          {(backendSlow || loginSlow) && <p className="wake-message" role="status">Server is waking up, please wait.</p>}
          <button type="submit" className="btn login-submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className={`conn conn-${status.state}`} role="status">{status.text}</p>
        <p className="login-roles">Available workspaces: {Object.values(ROLES).map((role) => role.title).join(', ')}.</p>
      </div>
    </div>
  );
}
