import React, { useState } from 'react';

interface MockUser { id: string; name: string; role: string; email: string; }

const MOCK_USERS: MockUser[] = [
  { id: 'u-demo-1', name: 'Alice Patient', role: 'PATIENT', email: 'alice.patient@example.test' },
  { id: 'u-demo-2', name: 'Dr. Brian Health', role: 'PHYSICIAN', email: 'brian.physician@example.test' },
  { id: 'u-demo-3', name: 'Nina Nurse', role: 'NURSE', email: 'nina.nurse@example.test' }
];

export const AuthPanel: React.FC = () => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [expanded, setExpanded] = useState(true);

  const login = (u: MockUser) => {
    setUser(u);
    try {
      localStorage.setItem('portalUser', JSON.stringify(u));
    } catch {}
  };
  const logout = () => { setUser(null); localStorage.removeItem('portalUser'); };

  React.useEffect(() => {
    try { const raw = localStorage.getItem('portalUser'); if (raw) setUser(JSON.parse(raw)); } catch {}
  }, []);

  return (
    <div className="panel" style={{ position: 'relative' }}>
      <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Session (Mock)</span>
        <button onClick={() => setExpanded(e => !e)} style={{ fontSize: '.65rem', border: '1px solid var(--border)', background: '#fff', borderRadius: 20, padding: '.25rem .6rem', cursor: 'pointer' }}>{expanded ? 'Hide' : 'Show'}</button>
      </h2>
      {expanded && (
        <div className="auth-box">
          {!user && (
            <>
              <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>Select a mock persona to simulate login:</div>
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
      <footer className="meta">Local-only mock – no network auth.</footer>
    </div>
  );
};
