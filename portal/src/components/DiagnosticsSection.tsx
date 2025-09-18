import React, { useState } from 'react';
import { SystemStatusPanel } from './SystemStatusPanel';
import { PlacementStatusPanel } from './PlacementStatusPanel';

export const DiagnosticsSection: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <section style={{ gridColumn: '1 / -1' }}>
      <div className="panel" style={{ padding: '.9rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '.95rem' }}>Diagnostics</h2>
          <button className="btn" style={{ background: open ? 'var(--danger)' : 'var(--accent-grad)' }} onClick={() => setOpen(o => !o)}>
            {open ? 'Hide System Diagnostics' : 'Show System Diagnostics'}
          </button>
        </div>
        {open && (
          <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
            <SystemStatusPanel />
            <PlacementStatusPanel />
          </div>
        )}
        {!open && <p style={{ fontSize: '.65rem', color: 'var(--muted)', marginTop: '.6rem' }}>Diagnostics include health probe, feature flags, mock metrics, and placement availability. Hidden by default to reduce noise.</p>}
      </div>
    </section>
  );
};
