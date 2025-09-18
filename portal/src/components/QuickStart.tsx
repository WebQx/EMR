import React from 'react';
import { useAuth } from './AuthContext';

interface QuickStartProps {
  onSelect: (id: string) => void;
  scrollTo: (id: string) => void;
}

export const QuickStart: React.FC<QuickStartProps> = ({ onSelect, scrollTo }) => {
  const { setRole } = useAuth();

  const launch = (id: string, role: string) => {
    setRole(role);
    onSelect(id);
    setTimeout(() => scrollTo('content-detail'), 0);
  };

  return (
    <section style={{ gridColumn: '1 / -1' }}>
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Quick start</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          <button className="btn" onClick={() => launch('labs', 'provider')}>View latest labs</button>
          <button className="btn" onClick={() => launch('appt', 'patient')}>Book an appointment</button>
          <button className="btn" onClick={() => launch('telehealth', 'provider')}>Start telehealth visit</button>
          <button className="btn" onClick={() => launch('login', 'patient')}>Try login UI</button>
        </div>
        <footer className="meta">One-click flows set an appropriate role and open the demo inline.</footer>
      </div>
    </section>
  );
};
