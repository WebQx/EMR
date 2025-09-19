import React from 'react';
import { useAuth } from './AuthContext';

export const RoleGate: React.FC = () => {
  const { role, setRole, setPersona } = useAuth();
  if (role) return null;

  const pick = (r: string, p?: string) => () => { setRole(r); if (p) setPersona(p); };

  return (
    <div className="overlay">
      <div className="modal">
        <h2 style={{ marginTop: 0 }}>Choose your role to start</h2>
        <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginTop: '.25rem' }}>This sets up a tailored demo view. You can change it anytime in the Session panel.</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'.75rem', marginTop: '.75rem' }}>
          <button className="btn" onClick={pick('patient','john-doe')}>Patient</button>
          <button className="btn" onClick={pick('provider','dr-smith')}>Provider</button>
          <button className="btn" onClick={pick('admin','ops-admin')}>Admin</button>
        </div>
        <div style={{ marginTop: '.9rem', fontSize: '.7rem', color: 'var(--muted)' }}>
          Data resets daily at 08:00 UTC for billing, accounting, and access demos.
        </div>
      </div>
    </div>
  );
};
