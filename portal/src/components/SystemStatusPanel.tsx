import React from 'react';
import { HealthPanel } from './HealthPanel';
import { FeaturesPanel } from './FeaturesPanel';
import { MetricsPanel } from './MetricsPanel';

// Thin wrapper that arranges the three existing panels in a unified layout.
export const SystemStatusPanel: React.FC = () => {
  return (
    <div className="panel" style={{ gridColumn: '1 / -1' }}>
      <h2 style={{ marginTop: 0 }}>Platform Observability</h2>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
        <div><HealthPanel /></div>
        <div><FeaturesPanel /></div>
        <div><MetricsPanel /></div>
      </div>
  <footer className="meta">Attempts live endpoints first; on failure switches to Demo Mode (no further polling) for a clean static preview.</footer>
    </div>
  );
};
