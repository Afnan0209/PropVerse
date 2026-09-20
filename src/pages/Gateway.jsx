import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, API_URL, errorMessage } from '../api/client.js';
import { ROLES } from '../config/views.js';

export default function Gateway() {
  const [status, setStatus] = useState({ state: 'checking', text: 'Checking backend...' });

  useEffect(() => {
    // Your main.py has GET / returning {"status": "online"}
    api.get('/')
      .then(() => setStatus({ state: 'ok', text: `Backend connected at ${API_URL}` }))
      .catch((e) => setStatus({ state: 'fail', text: errorMessage(e) }));
  }, []);

  return (
    <div className="gateway">
      <div className="gateway-inner">
        <h1 className="gateway-title">PropVerse</h1>
        <p className="gateway-sub">Property management for owners, managers and maintenance crews. Choose the workspace you are signing in to.</p>

        <ul className="role-list">
          {Object.entries(ROLES).map(([key, info]) => (
            <li key={key}>
              <Link to={`/${key}/dashboard`} className="role-row">
                <span className="role-name">{info.title}</span>
                <span className="role-blurb">{info.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>

        <p className={`conn conn-${status.state}`} role="status">{status.text}</p>
      </div>
    </div>
  );
}
