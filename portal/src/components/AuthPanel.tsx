import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface MockUser { id: string; name: string; role: string; email: string; }

const MOCK_USERS: MockUser[] = [
  { id: 'u-demo-1', name: 'Alice Patient', role: 'patient', email: 'alice.patient@example.test' },
  { id: 'u-demo-2', name: 'Dr. Brian Health', role: 'provider', email: 'brian.provider@example.test' },
  { id: 'u-demo-3', name: 'Ada Admin', role: 'admin', email: 'ada.admin@example.test' }
];

export const AuthPanel: React.FC = () => {
  const { role, setRole, reset } = useAuth();
  const [user, setUser] = useState<MockUser | null>(null);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    try { const raw = localStorage.getItem('portalUser'); if (raw) setUser(JSON.parse(raw)); } catch {}
  }, []);

  const login = (u: MockUser) => {
    setUser(u);
    setRole(u.role);
    try {
      localStorage.setItem('portalUser', JSON.stringify(u));
      // Seed unified demo auth keys used by other modules/pages
      localStorage.setItem('webqx_demo', 'true');
      localStorage.setItem('webqx_auth_provider', 'demo');
      localStorage.setItem('webqx_token', `demo-token-${u.role}`);
      localStorage.setItem('webqx_user', JSON.stringify(u));
    } catch {}
  };
  const logout = () => {
    setUser(null);
    reset();
    localStorage.removeItem('portalUser');
    // Clear unified demo auth keys
    localStorage.removeItem('webqx_demo');
    localStorage.removeItem('webqx_auth_provider');
    localStorage.removeItem('webqx_token');
    localStorage.removeItem('webqx_user');
  };

  return (
    <div className="panel" style={{ position: 'relative' }}>
      <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Session / Role</span>
        <button onClick={() => setExpanded(e => !e)} style={{ fontSize: '.65rem', border: '1px solid var(--border)', background: '#fff', borderRadius: 20, padding: '.25rem .6rem', cursor: 'pointer' }}>{expanded ? 'Hide' : 'Show'}</button>
      </h2>
      {expanded && (
        <div className="auth-box">
          {!user && (
            <>
              <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>Select a mock user to establish a role:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
                {MOCK_USERS.map(u => (
                  <button key={u.id} onClick={() => login(u)} className="secondary" style={{ flex: '1 1 110px', minWidth: 110, background: '#fff', color: 'var(--accent)', border: '1px solid var(--border)' }}>{u.role}</button>
                ))}
              </div>
            </>
          )}
          {user && (
            <div className="auth-user">
              <strong>{user.name}</strong>
              <span style={{ fontSize: '.65rem', letterSpacing: '.5px' }}>{user.role}</span>
              <span style={{ fontSize: '.65rem' }}>{user.email}</span>
              <div style={{ display: 'flex', gap: '.5rem', marginTop: '.4rem' }}>
                <button onClick={logout} style={{ background: 'var(--danger)', border: '1px solid var(--danger)', color: '#fff', padding: '.4rem .65rem', borderRadius: 6, cursor: 'pointer', fontSize: '.65rem' }}>Logout</button>
              </div>
            </div>
          )}
        </div>
      )}
      <footer className="meta">Role: {role ? role : 'not selected yet'} • Local-only mock session</footer>
    </div>
  );
};
