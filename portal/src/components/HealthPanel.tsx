import React, { useEffect, useState } from 'react';

interface HealthState {
  status: string;
  timestamp?: string;
  [k: string]: any;
}

export const HealthPanel: React.FC = () => {
  const [health, setHealth] = useState<HealthState | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let active = true;
    const fetchHealth = async () => {
      try {
        const res = await fetch('/health');
        if (!res.ok) throw new Error('Health fetch failed');
        const data = await res.json();
        if (active) {
          setHealth(data);
          setError('');
        }
      } catch (e:any) {
        if (active) setError(e.message);
      }
    };
    fetchHealth();
    const id = setInterval(fetchHealth, 10000);
    return () => { active = false; clearInterval(id); };
  }, []);

  return (
    <div style={panelStyle}>
      <h2 style={titleStyle}>Platform Health</h2>
      {error && <div style={errorStyle}>{error}</div>}
      {!health && !error && <div>Loading...</div>}
      {health && (
        <div style={{ display: 'grid', gap: '.5rem' }}>
          <div><strong>Status:</strong> {health.status}</div>
          {Object.entries(health).filter(([k]) => k !== 'status').map(([k,v]) => (
            <div key={k}><strong>{k}:</strong> {String(v)}</div>
          ))}
        </div>
      )}
    </div>
  );
};

const panelStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: 8,
  padding: '1rem',
  background: '#fff'
};
const titleStyle: React.CSSProperties = { marginTop: 0, fontSize: '1.1rem' };
const errorStyle: React.CSSProperties = { color: '#b00020', fontSize: '.9rem' };
