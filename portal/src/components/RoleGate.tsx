import React from 'react';
import { useAuth } from './AuthContext';

export const RoleGate: React.FC = () => {
  const { role, setRole, setPersona } = useAuth();
  if (role) return null;

  const seedDemoUser = (r: string) => {
    // Create a consistent demo session used across modules/pages
    const userByRole: Record<string, { id: string; name: string; email: string; role: string }> = {
      patient: { id: 'demo-patient', name: 'Demo Patient', email: 'demo@patient.com', role: 'patient' },
      provider: { id: 'demo-provider', name: 'Demo Provider', email: 'physician@webqx.com', role: 'provider' },
      admin: { id: 'demo-admin', name: 'Demo Admin', email: 'admin@webqx.com', role: 'admin' }
    };
    const u = userByRole[r] || userByRole.patient;
    try {
      localStorage.setItem('webqx_demo', 'true');
      localStorage.setItem('webqx_auth_provider', 'demo');
      localStorage.setItem('webqx_token', `demo-token-${u.role}`);
      localStorage.setItem('webqx_user', JSON.stringify(u));
    } catch {}
  };

  const pick = (r: string, p?: string) => () => {
    setRole(r);
    if (p) setPersona(p);
    seedDemoUser(r);
  };

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
