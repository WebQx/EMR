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
  { id: 'emr', title: 'EMR (Read-only Demo)', description: 'EMR dashboard preview (static sample)', externalHref: 'emr-dashboard.html', category: 'Experience', keywords: ['emr','ehr'], roles: ['provider','admin'] },
  { id: 'telehealth', title: 'Telehealth Demo', description: 'Live session / virtual visit examples', externalHref: 'telehealth-demo.html', category: 'Demo', keywords: ['telehealth','video','virtual-care'], roles: ['patient','provider','admin'] },
  { id: 'labs', title: 'Lab Results Viewer', description: 'FHIR R4 lab result rendering demo', externalHref: 'demo-lab-results-viewer.html', category: 'FHIR', keywords: ['lab','results','fhir'], roles: ['patient','provider'] },
  { id: 'appt', title: 'Appointment Booking', description: 'FHIR scheduling demonstration', externalHref: 'demo-fhir-r4-appointment-booking.html', category: 'FHIR', keywords: ['appointment','scheduling','fhir'], roles: ['patient','provider'] },
  { id: 'login', title: 'Login Page', description: 'Standalone authentication UI example', externalHref: 'login.html', category: 'Auth', keywords: ['login','auth'], roles: ['patient','provider','admin'] },
  { id: 'billing', title: 'Medical Billing', description: 'Submit and track mock claims (resets daily 08:00 UTC)', category: 'Operations', keywords: ['billing','claims'], roles: ['provider','admin'] },
  { id: 'accounting', title: 'Accounting', description: 'Create demo invoices and totals (resets daily 08:00 UTC)', category: 'Operations', keywords: ['accounting','invoices'], roles: ['admin'] },
  { id: 'access', title: 'Access Controls', description: 'Assign roles to demo users (resets daily 08:00 UTC)', category: 'Operations', keywords: ['access','roles'], roles: ['admin'] },
  { id: 'ai', title: 'AI Assist', description: 'Summarize notes, extract tasks, draft plans (mock)', category: 'AI', keywords: ['ai','summary','assistant'], roles: ['provider','admin'] },
  { id: 'transcription', title: 'Medical Transcription', description: 'WebQx Medical Transcription using Whisper (mock)', category: 'AI', keywords: ['whisper','transcription','voice'], roles: ['provider','admin'] },
  { id: 'whisper', title: 'Whisper Full Demo', description: 'Standalone Whisper UI demo pages (file & realtime)', externalHref: 'whisper-demo.html', category: 'AI', keywords: ['whisper','demo'], roles: ['provider','admin'] },
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
  <InteractiveBlock meta={meta} base={base} />
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
const InteractiveBlock: React.FC<{ meta: ModuleMeta; base: string }> = ({ meta, base }) => {
  // For key modules, embed the actual static demo page inline for an immediate "live" experience.
  if (meta.externalHref && ['labs','appt','telehealth','login'].includes(meta.id)) {
    return <ExternalDemoFrame src={base + meta.externalHref} />;
  }
  // Fallback to synthetic mini-demos where appropriate
  switch (meta.id) {
    case 'billing':
      return <BillingDemo />;
    case 'accounting':
      return <AccountingDemo />;
    case 'access':
      return <AccessDemo />;
    case 'labs':
      return <FhirObservationDemo />;
    case 'appt':
      return <AppointmentGenerator />;
    case 'telehealth':
      return <SessionIdGenerator />;
    case 'login':
      return <CredentialMasker />;
    case 'patient':
      return <PatientChartMini />;
    case 'provider':
      return <EncounterNoteDemo />;
    case 'ai':
      return <AiAssistDemo />;
    case 'transcription':
      return <TranscriptionDemo />;
    case 'admin':
      return <AdminFlagsDemo />;
    default:
      return <GenericInfo />;
  }
};

const ExternalDemoFrame: React.FC<{ src: string }> = ({ src }) => (
  <div className="mini-block" style={{ background: '#fff' }}>
    <p style={{ fontSize: '.7rem', marginTop: 0 }}>Inline demo preview (opens from this site). You can also open it in a new tab for full-screen.</p>
    <div style={{ aspectRatio: '16 / 10', width: '100%', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
      <iframe src={src} title="Inline Demo" style={{ width: '100%', height: '100%', border: '0' }} loading="lazy" />
    </div>
    <div style={{ marginTop: '.5rem' }}>
      <a className="btn small" href={src} target="_blank" rel="noopener noreferrer">Open this demo in a new tab ↗</a>
    </div>
  </div>
);

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
// Patient chart mini overview ------------------------------------------------------------
const PatientChartMini: React.FC = () => {
  const [tab, setTab] = useState<'summary'|'meds'|'allergies'>('summary');
  return (
    <div className="mini-block">
      <div style={{ display:'flex', gap:'.4rem', marginBottom:'.4rem' }}>
        {(['summary','meds','allergies'] as const).map(t => (
          <button key={t} className={`btn small ${tab===t?'':'secondary'}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab==='summary' && <pre className="code-block">{JSON.stringify({ name:'John Doe', dob:'1980-01-15', mrn:'P001234567' }, null, 2)}</pre>}
      {tab==='meds' && <pre className="code-block">{JSON.stringify([{ drug:'Atorvastatin 20mg', sig:'1 tab PO daily' }], null, 2)}</pre>}
      {tab==='allergies' && <pre className="code-block">{JSON.stringify([{ substance:'Penicillin', reaction:'Rash' }], null, 2)}</pre>}
    </div>
  );
};

// Provider encounter note demo -----------------------------------------------------------
const EncounterNoteDemo: React.FC = () => {
  const [note, setNote] = useState('CC: Cough x3 days\nHPI: 45 y/o presents with dry cough.\nPlan: OTC cough suppressant, fluids.');
  return (
    <div className="mini-block">
      <p style={{ fontSize: '.7rem', marginTop: 0 }}>Type a brief encounter note:</p>
      <textarea value={note} onChange={e=>setNote(e.target.value)} style={{ width:'100%', minHeight:120, fontFamily:'monospace', fontSize:'.7rem' }} />
      <div style={{ display:'flex', gap:'.4rem', marginTop:'.4rem' }}>
        <button className="btn small" onClick={()=>setNote(note + '\nSigned: Dr. Smith')}>Sign</button>
        <button className="btn small secondary" onClick={()=>setNote('')}>Clear</button>
      </div>
    </div>
  );
};

// Admin flags mock ----------------------------------------------------------------------
const AdminFlagsDemo: React.FC = () => {
  const [flags, setFlags] = useState({ ePrescribe:true, patientPortal:true, telehealth:true });
  const toggle = (k: keyof typeof flags) => setFlags(prev => ({ ...prev, [k]: !prev[k] }));
  return (
    <div className="mini-block">
      <p style={{ fontSize: '.7rem', marginTop: 0 }}>Toggle feature availability (mock):</p>
      <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
        {Object.entries(flags).map(([k,v]) => (
          <button key={k} className={`btn small ${v?'':'secondary'}`} onClick={()=>toggle(k as any)}>{k}: {v?'on':'off'}</button>
        ))}
      </div>
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
  <li>Progressive enhancement path: Inline frame shows the static demo page when available; swap this with native components when backend endpoints are live.</li>
  <li>Stable URL: Navigation avoids changing the address bar so everything remains at <code>/EMR/</code>.</li>
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

// AI Assist inline demo ---------------------------------------------------------------
const AiAssistDemo: React.FC = () => {
  const [text, setText] = useState('Patient reports intermittent headaches with light sensitivity. Sleep quality improved over last week. No vision changes.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runSummary = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: text, patient: { id: 'P001', name: 'John Doe' }, context: { visitType: 'follow-up' } })
      });
      if (!res.ok) throw new Error('Request failed: ' + res.status);
      const data = await res.json();
      setResult(data);
    } catch (e:any) {
      setError(e.message || 'Unknown error');
    } finally { setLoading(false); }
  };

  return (
    <div className="mini-block">
      <p style={{ fontSize: '.7rem', marginTop: 0 }}>Draft a clinical summary from free text (mock endpoint).</p>
      <textarea value={text} onChange={e=>setText(e.target.value)} style={{ width:'100%', minHeight:100, fontFamily:'monospace', fontSize:'.7rem' }} />
      <div style={{ display:'flex', gap:'.5rem', marginTop:'.4rem' }}>
        <button className="btn" onClick={runSummary} disabled={loading}>{loading ? 'Summarizing…' : 'Summarize'}</button>
        <button className="btn secondary" onClick={()=>{setText(''); setResult(null); setError(null);}}>Clear</button>
      </div>
      {error && <div style={{ color:'#b00020', fontSize:'.7rem', marginTop:'.4rem' }}>{error}</div>}
      {result && (
        <div style={{ marginTop: '.6rem' }}>
          <pre className="code-block" style={{ maxHeight: 220, overflow:'auto' }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

// Billing demo (uses /api/v1/demo/billing/*) ----------------------------------------
const BillingDemo: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    try {
      setLoading(true); setError(null);
      const r = await fetch('/api/v1/demo/billing/claims');
      if (!r.ok) throw new Error(String(r.status));
      setItems(await r.json());
    } catch (e:any) { setError(e.message); } finally { setLoading(false); }
  };
  const add = async () => {
    const payload = { patient: 'John Doe', code: '99213', amount: 125.00 };
    await fetch('/api/v1/demo/billing/claims', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
    load();
  };
  useEffect(() => { load(); }, []);
  return (
    <div className="mini-block">
      <p style={{ fontSize: '.7rem', marginTop: 0 }}>Create and view mock claims. Resets daily at 08:00 UTC.</p>
      <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
        <button className="btn" onClick={add} disabled={loading}>New claim</button>
        <button className="btn secondary" onClick={load} disabled={loading}>Refresh</button>
      </div>
      {error && <div style={{ color:'#b00020', fontSize:'.7rem' }}>{error}</div>}
      <pre className="code-block" style={{ maxHeight: 220, overflow:'auto' }}>{JSON.stringify(items, null, 2)}</pre>
    </div>
  );
};

// Accounting demo (uses /api/v1/demo/accounting/*) ----------------------------------
const AccountingDemo: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    try {
      setLoading(true); setError(null);
      const r = await fetch('/api/v1/demo/accounting/invoices');
      if (!r.ok) throw new Error(String(r.status));
      setItems(await r.json());
    } catch (e:any) { setError(e.message); } finally { setLoading(false); }
  };
  const add = async () => {
    const payload = { patient: 'John Doe', items:[{ desc:'Consult', qty:1, price:125 } ] };
    await fetch('/api/v1/demo/accounting/invoices', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
    load();
  };
  useEffect(() => { load(); }, []);
  return (
    <div className="mini-block">
      <p style={{ fontSize: '.7rem', marginTop: 0 }}>Create and view demo invoices. Resets daily at 08:00 UTC.</p>
      <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
        <button className="btn" onClick={add} disabled={loading}>New invoice</button>
        <button className="btn secondary" onClick={load} disabled={loading}>Refresh</button>
      </div>
      {error && <div style={{ color:'#b00020', fontSize:'.7rem' }}>{error}</div>}
      <pre className="code-block" style={{ maxHeight: 220, overflow:'auto' }}>{JSON.stringify(items, null, 2)}</pre>
    </div>
  );
};

// Access controls demo (uses /api/v1/demo/access/*) ---------------------------------
const AccessDemo: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState('demo-user');
  const [role, setRole] = useState('patient');
  const load = async () => {
    try {
      setLoading(true); setError(null);
      const r = await fetch('/api/v1/demo/access/roles');
      if (!r.ok) throw new Error(String(r.status));
      setItems(await r.json());
    } catch (e:any) { setError(e.message); } finally { setLoading(false); }
  };
  const add = async () => {
    const payload = { user, role };
    await fetch('/api/v1/demo/access/roles', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
    load();
  };
  useEffect(() => { load(); }, []);
  return (
    <div className="mini-block">
      <p style={{ fontSize: '.7rem', marginTop: 0 }}>Assign roles for demo users (no persistence; daily reset 08:00 UTC).</p>
      <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap', alignItems:'center' }}>
        <input style={{ fontSize:'.7rem' }} value={user} onChange={e=>setUser(e.target.value)} placeholder="user id" />
        <select value={role} onChange={e=>setRole(e.target.value)}>
          <option value="patient">patient</option>
          <option value="provider">provider</option>
          <option value="admin">admin</option>
        </select>
        <button className="btn" onClick={add} disabled={loading}>Assign</button>
        <button className="btn secondary" onClick={load} disabled={loading}>Refresh</button>
      </div>
      {error && <div style={{ color:'#b00020', fontSize:'.7rem' }}>{error}</div>}
      <pre className="code-block" style={{ maxHeight: 220, overflow:'auto' }}>{JSON.stringify(items, null, 2)}</pre>
    </div>
  );
};

// Transcription inline demo (mock Whisper) --------------------------------------------
const TranscriptionDemo: React.FC = () => {
  const [language, setLanguage] = useState('en');
  const [mode, setMode] = useState<'encounter'|'dictation'>('encounter');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runMock = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch('/api/transcription/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, mode })
      });
      if (!res.ok) throw new Error('Request failed: ' + res.status);
      const data = await res.json();
      setResult(data);
    } catch (e:any) {
      setError(e.message || 'Unknown error');
    } finally { setLoading(false); }
  };

  return (
    <div className="mini-block">
      <p style={{ fontSize: '.7rem', marginTop: 0 }}>WebQx Medical Transcription using Whisper (mock). Generates transcript and summary.</p>
      <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap', alignItems:'center' }}>
        <label style={{ fontSize: '.65rem' }}>Language</label>
        <select value={language} onChange={e=>setLanguage(e.target.value)}>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </select>
        <label style={{ fontSize: '.65rem' }}>Mode</label>
        <select value={mode} onChange={e=>setMode(e.target.value as any)}>
          <option value="encounter">Encounter</option>
          <option value="dictation">Dictation</option>
        </select>
        <button className="btn" onClick={runMock} disabled={loading}>{loading ? 'Transcribing…' : 'Run mock'}</button>
      </div>
      {error && <div style={{ color:'#b00020', fontSize:'.7rem', marginTop:'.4rem' }}>{error}</div>}
      {result && (
        <div style={{ marginTop: '.6rem' }}>
          <pre className="code-block" style={{ maxHeight: 220, overflow:'auto' }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
