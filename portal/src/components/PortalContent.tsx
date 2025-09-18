import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

// Re-exported type to keep consistency with DashboardCards definitions
export interface ModuleMeta {
  id: string;
  title: string;
  description: string;
  externalHref?: string; // original target link if it exists
  category: string;
  keywords: string[];
  roles?: string[]; // permitted roles (undefined => all)
}

// Central catalog of modules/cards so both the card grid and content panel stay in sync
export const MODULE_CATALOG: ModuleMeta[] = [
  { id: 'patient', title: 'Patient Portal', description: 'Patient-facing experience & onboarding flows', externalHref: 'patient-portal/', category: 'Experience', keywords: ['patient','onboarding','engagement'], roles: ['patient'] },
  { id: 'provider', title: 'Provider Workspace', description: 'Clinical tools & encounter management', externalHref: 'provider/', category: 'Experience', keywords: ['provider','clinical','encounter'], roles: ['provider'] },
  { id: 'telehealth', title: 'Telehealth Demo', description: 'Live session / virtual visit examples', externalHref: 'telehealth-demo.html', category: 'Demo', keywords: ['telehealth','video','virtual-care'], roles: ['patient','provider','admin'] },
  { id: 'labs', title: 'Lab Results Viewer', description: 'FHIR R4 lab result rendering demo', externalHref: 'demo-lab-results-viewer.html', category: 'FHIR', keywords: ['lab','results','fhir'], roles: ['patient','provider'] },
  { id: 'appt', title: 'Appointment Booking', description: 'FHIR scheduling demonstration', externalHref: 'demo-fhir-r4-appointment-booking.html', category: 'FHIR', keywords: ['appointment','scheduling','fhir'], roles: ['patient','provider'] },
  { id: 'login', title: 'Login Page', description: 'Standalone authentication UI example', externalHref: 'login.html', category: 'Auth', keywords: ['login','auth'], roles: ['patient','provider','admin'] },
  { id: 'admin', title: 'Admin Console', description: 'Operational oversight & configuration', externalHref: 'admin-console/', category: 'Operations', keywords: ['admin','ops'], roles: ['admin'] },
  { id: 'docs', title: 'System README', description: 'Platform architecture & guidance', externalHref: 'README.md', category: 'Docs', keywords: ['docs','readme'], roles: ['patient','provider','admin'] }
];

interface PortalContentProps { selectedId: string | null; base: string; onClose: () => void; }

export const PortalContent: React.FC<PortalContentProps> = ({ selectedId, base, onClose }) => {
  const { role } = useAuth();
  const meta = MODULE_CATALOG.find(m => m.id === selectedId);
  if (!selectedId) {
    return (
      <div className="panel" style={{ gridColumn: '1 / -1' }}>
        <h2 style={{ marginTop: 0 }}>Module / Surface Details</h2>
        <p>Select any card to view deeper context, sample data, implementation notes, and quick actions here.</p>
        <p style={{ fontSize: '.7rem' }}>This panel turns each previously "useless" placement card into an embedded knowledge & interaction space without leaving the portal.</p>
      </div>
    );
  }
  if (!meta) {
    return (
      <div className="panel" style={{ gridColumn: '1 / -1' }}>
        <h2>Unknown Selection</h2>
        <p>No metadata found for id <code>{selectedId}</code>.</p>
        <button className="btn" onClick={onClose}>Back</button>
      </div>
    );
  }
  if (role && meta.roles && !meta.roles.includes(role)) {
    return (
      <div className="panel" style={{ gridColumn: '1 / -1' }}>
        <h2 style={{ margin: 0 }}>{meta.title}</h2>
        <p style={{ fontSize: '.7rem' }}>This module is not available for the current role <strong>{role}</strong>. Select a different role in the Session panel to view it.</p>
        <button className="btn" onClick={onClose} style={{ fontSize: '.6rem' }}>Close</button>
      </div>
    );
  }

  return (
    <div className="panel" style={{ gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>{meta.title}</h2>
        <button className="btn" onClick={onClose} style={{ fontSize: '.65rem' }}>Close</button>
      </div>
      <p style={{ marginTop: '.5rem' }}>{meta.description}</p>
      <SectionDivider title="Purpose" />
      <PurposeBlock meta={meta} />
      <SectionDivider title="Sample / Interactive" />
      <InteractiveBlock id={meta.id} />
      <SectionDivider title="Implementation Notes" />
      <ImplementationNotes meta={meta} base={base} />
      {meta.externalHref && (
        <footer className="meta">External target: <a href={base + meta.externalHref} target="_blank" rel="noopener noreferrer">Open in new tab</a></footer>
      )}
    </div>
  );
};

const SectionDivider: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ margin: '1.2rem 0 .6rem', borderTop: '1px solid var(--border)', paddingTop: '.5rem' }}>
    <h3 style={{ margin: 0, fontSize: '.8rem', letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--muted)' }}>{title}</h3>
  </div>
);

const PurposeBlock: React.FC<{ meta: ModuleMeta }> = ({ meta }) => {
  const mapping: Record<string, string> = {
    patient: 'Deliver patient-centered views: profile, appointments, results, and engagement workflows.',
    provider: 'Support clinicians with encounter management, documentation aides, and clinical decision surfaces.',
    telehealth: 'Enable remote consultations (video + messaging) with reliability metrics and session orchestration.',
    labs: 'Render DiagnosticReport & Observation FHIR resources in an accessible, human-readable form.',
    appt: 'Demonstrate scheduling primitives using FHIR Appointment and Slot resources.',
    login: 'Showcase modular auth UI, MFA extensibility, and identity provider hand-off patterns.',
    admin: 'Centralize operational oversight: system switches, feature flags, compliance attestations.',
    docs: 'Provide living platform documentation kept adjacent to the code for drift minimization.'
  };
  return <p style={{ fontSize: '.75rem' }}>{mapping[meta.id] || meta.description}</p>;
};

// Simple interactive block per module id
const InteractiveBlock: React.FC<{ id: string }> = ({ id }) => {
  switch (id) {
    case 'labs':
      return <FhirObservationDemo />;
    case 'appt':
      return <AppointmentGenerator />;
    case 'telehealth':
      return <SessionIdGenerator />;
    case 'login':
      return <CredentialMasker />;
    default:
      return <GenericInfo />;
  }
};

const GenericInfo: React.FC = () => (
  <div style={{ fontSize: '.7rem' }}>
    <p>Interactive sample not yet defined for this surface. This placeholder confirms the selection system works locally without full backend dependencies.</p>
  </div>
);

// FHIR Observation mini demo (synthetic) -------------------------------------------------
const FhirObservationDemo: React.FC = () => {
  const [value, setValue] = useState(() => 4.6 + Math.random());
  const resource = {
    resourceType: 'Observation',
    status: 'final',
    code: { text: 'Hemoglobin A1c' },
    valueQuantity: { value: Number(value.toFixed(2)), unit: '%' },
    effectiveDateTime: new Date().toISOString()
  };
  return (
    <div className="mini-block">
      <p style={{ fontSize: '.7rem', marginTop: 0 }}>Synthetic Observation resource (HbA1c). Click regenerate to vary value.</p>
      <pre className="code-block" style={{ maxHeight: 180, overflow: 'auto' }}>{JSON.stringify(resource, null, 2)}</pre>
      <button className="btn" onClick={() => setValue(4.6 + Math.random())}>Regenerate</button>
    </div>
  );
};

// Appointment generator (simplified) ------------------------------------------------------
const AppointmentGenerator: React.FC = () => {
  const [count, setCount] = useState(1);
  const appts = Array.from({ length: count }, (_, i) => ({
    resourceType: 'Appointment', status: 'proposed', description: 'Teleconsult ' + (i + 1), start: new Date(Date.now() + i * 3600000).toISOString()
  }));
  return (
    <div className="mini-block">
      <p style={{ fontSize: '.7rem', marginTop: 0 }}>Generate example FHIR Appointment resources client-side (static demo).</p>
      <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
        <label style={{ fontSize: '.65rem' }}>Count</label>
        <input type="number" min={1} max={5} value={count} onChange={e => setCount(Number(e.target.value))} style={{ width: 60 }} />
      </div>
      <pre className="code-block" style={{ maxHeight: 180, overflow: 'auto' }}>{JSON.stringify(appts, null, 2)}</pre>
    </div>
  );
};

// Telehealth session ID generator ---------------------------------------------------------
const SessionIdGenerator: React.FC = () => {
  const [sessionId, setSessionId] = useState<string>(() => randomId());
  return (
    <div className="mini-block">
      <p style={{ fontSize: '.7rem', marginTop: 0 }}>Simulate creation of a telehealth session identifier (client-only UUID-ish).</p>
      <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
        <input style={{ fontFamily: 'monospace', fontSize: '.65rem', flex: 1 }} value={sessionId} readOnly />
        <button className="btn" onClick={() => setSessionId(randomId())}>New</button>
      </div>
    </div>
  );
};

// Credential masker -----------------------------------------------------------------------
const CredentialMasker: React.FC = () => {
  const [input, setInput] = useState('');
  const masked = input.replace(/.(?=.{4})/g, '•');
  return (
    <div className="mini-block">
      <p style={{ fontSize: '.7rem', marginTop: 0 }}>Type any credential; it will be masked except the last 4 chars (frontend demo).</p>
      <input value={input} onChange={e => setInput(e.target.value)} placeholder="Enter secret" style={{ width: '100%', fontSize: '.7rem' }} />
      <div style={{ fontFamily: 'monospace', fontSize: '.75rem', marginTop: '.4rem' }}>{masked || '•'.repeat(8)}</div>
    </div>
  );
};

// Implementation notes --------------------------------------------------------------------
const ImplementationNotes: React.FC<{ meta: ModuleMeta; base: string }> = ({ meta, base }) => {
  return (
    <ul style={{ fontSize: '.65rem', lineHeight: 1.4, paddingLeft: '1rem', margin: '.4rem 0 1rem' }}>
      <li>Category: <strong>{meta.category}</strong></li>
      <li>Keywords: {meta.keywords.join(', ')}</li>
      <li>Client-rendered: Content is generated entirely in-portal to remain functional on static hosting.</li>
      <li>Progressive enhancement path: Replace this block with live API integration once backend endpoints are proxied to Pages.</li>
      <li>Hash routing: Selection is reflected in URL (<code>#{meta.id}</code>) to allow direct linking.</li>
      {meta.externalHref && <li>Original placement target preserved as external link (opens new tab) to avoid breaking legacy expectations.</li>}
      <li>Zero network dependency (except README & health panels) ensures basic functionality even offline.</li>
    </ul>
  );
};

function randomId() {
  return 'sess_' + Math.random().toString(36).slice(2, 10);
}

// Lightweight styling hooks (leveraging existing .panel and tokens)
// Additional small utility classes could eventually move to styles.css if reused.
