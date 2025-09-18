import React, { useEffect, useState } from 'react';

interface MetricsPayload {
  requestCount?: number;
  avgLatencyMs?: number;
  openEmrCircuit?: any;
  [k: string]: any;
}

export const MetricsPanel: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsPayload | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let interval: any = null;
    let demoMode = false;
    const load = async () => {
      try {
        const res = await fetch('/internal/metrics');
        if (!res.ok) throw new Error('Metrics endpoint not available');
        const data = await res.json();
        if (active) setMetrics(data);
      } catch (e: any) {
        if (active && !demoMode) {
          demoMode = true;
            setError('');
            setMetrics({
              requestCount: 0,
              avgLatencyMs: 0,
              mode: 'Demo Mode',
              note: 'Live metrics disabled in static preview'
            });
          if (interval) clearInterval(interval);
        }
      }
    };
    load();
    interval = setInterval(load, 10000);
    return () => { active = false; if (interval) clearInterval(interval); };
  }, []);

  return (
    <div style={panelStyle}>
      <h2 style={titleStyle}>Runtime Metrics</h2>
  {error && <div style={errorStyle}>{error}</div>}
      {!metrics && !error && <div>Loading...</div>}
      {metrics && (
        <div style={{ display: 'grid', gap: '.35rem' }}>
          {Object.entries(metrics).map(([k,v]) => (
            <div key={k}><strong>{k}</strong>: {typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>
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
