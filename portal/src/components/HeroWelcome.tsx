import React from 'react';
import { useAuth } from './AuthContext';

export const HeroWelcome: React.FC = () => {
  const { role, setRole } = useAuth();
  if (role) return null; // hide when role selected
  return (
    <section style={{ gridColumn: '1 / -1' }}>
      <div className="panel" style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)', color: '#fff', border: 'none', boxShadow: '0 6px 18px -4px rgba(0,0,0,.25)', position: 'relative', overflow: 'hidden' }}>
        <h1 style={{ margin: 0, fontSize: '1.9rem', letterSpacing: '.5px' }}>Unified EMR Demo Portal</h1>
        <p style={{ fontSize: '.9rem', lineHeight: 1.4, maxWidth: 780, margin: '.85rem 0 1.2rem', color: 'rgba(255,255,255,.92)' }}>
          Explore patient, provider, and admin perspectives in a single experience. Select a role below to load tailored modules.
          This static deployment runs in <strong>Demo Mode</strong> — interactive examples use mock data (no live backend required).
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem', marginBottom: '1rem' }}>
          {['patient','provider','admin'].map(r => (
            <button key={r} onClick={() => setRole(r)} style={{
              background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.35)',
              padding: '.65rem 1rem', borderRadius: 10, cursor: 'pointer', fontSize: '.75rem', letterSpacing: '.5px', fontWeight: 500
            }}>{r.charAt(0).toUpperCase() + r.slice(1)} Role</button>
          ))}
        </div>
        <p style={{ fontSize: '.6rem', margin: 0, opacity: .85 }}>Need real backend metrics? Deploy server stack locally or in cloud and disable demo mode.</p>
      </div>
    </section>
  );
};
