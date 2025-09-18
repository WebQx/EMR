import React, { useEffect, useState } from 'react';

interface FeatureFlags {
  USE_FHIR_MOCK?: boolean;
  AI_ASSIST_ENABLED?: boolean;
  USE_REMOTE_OPENEMR?: boolean;
  [k: string]: any;
}

export const FeaturesPanel: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch('/internal/metrics');
        if (res.ok) {
          const data = await res.json();
          const featureLike: FeatureFlags = {
            USE_FHIR_MOCK: !!data?.env?.USE_FHIR_MOCK,
            AI_ASSIST_ENABLED: !!data?.env?.AI_ASSIST_ENABLED,
            USE_REMOTE_OPENEMR: !!data?.env?.USE_REMOTE_OPENEMR
          };
          if (active) setFlags(featureLike);
        } else {
          throw new Error('metrics not ok');
        }
      } catch (e:any) {
        if (active) {
          setError(e.message);
          if (!flags) {
            setFlags({
              USE_FHIR_MOCK: true,
              AI_ASSIST_ENABLED: true,
              USE_REMOTE_OPENEMR: false,
              MOCK: true
            });
          }
        }
      }
    };
    load();
    const id = setInterval(load, 15000);
    return () => { active = false; clearInterval(id); };
  }, []);

  return (
    <div style={panelStyle}>
      <h2 style={titleStyle}>Feature Flags</h2>
  {error && <div style={errorStyle}>{error} (fallback)</div>}
      {!flags && !error && <div>Loading...</div>}
      {flags && (
        <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
          {Object.entries(flags).map(([k,v]) => (
            <li key={k}><strong>{k}</strong>: {v ? 'ENABLED' : 'disabled'}</li>
          ))}
        </ul>
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
