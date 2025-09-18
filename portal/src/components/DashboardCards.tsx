import React from 'react';

export interface DashboardLink {
  id: string;
  title: string;
  description: string;
  href: string;
  badge?: string;
  external?: boolean;
}

const guessBase = (): string => {
  // Derive '/webqx/' when at /webqx/portal/ on Pages, fallback '/'
  const path = window.location.pathname;
  const idx = path.indexOf('/portal/');
  if (idx !== -1) {
    return path.substring(0, idx + 1); // includes trailing '/'
  }
  return '/';
};

export const DashboardCards: React.FC = () => {
  const base = guessBase();
  const links: DashboardLink[] = [
    { id: 'patient', title: 'Patient Portal', description: 'Patient-facing experience & onboarding flows', href: base + 'patient-portal/' },
    { id: 'provider', title: 'Provider Workspace', description: 'Clinical tools & encounter management', href: base + 'provider/' },
    { id: 'telehealth', title: 'Telehealth Demo', description: 'Live session / virtual visit examples', href: base + 'telehealth-demo.html', badge: 'Demo' },
    { id: 'labs', title: 'Lab Results Viewer', description: 'FHIR R4 lab result rendering demo', href: base + 'demo-lab-results-viewer.html', badge: 'FHIR' },
    { id: 'appt', title: 'Appointment Booking', description: 'FHIR scheduling demonstration', href: base + 'demo-fhir-r4-appointment-booking.html', badge: 'FHIR' },
    { id: 'login', title: 'Login Page', description: 'Standalone authentication UI example', href: base + 'login.html' },
    { id: 'admin', title: 'Admin Console', description: 'Operational oversight & configuration', href: base + 'admin-console/' },
    { id: 'docs', title: 'System README', description: 'Platform architecture & guidance', href: base + 'README.md', badge: 'Docs' }
  ];
  return (
    <div className="panel" style={{ gridColumn: '1 / -1' }}>
      <h2 style={{ marginTop: 0 }}>Experience & Demo Surfaces</h2>
      <div className="cards">
        {links.map(l => (
          <a key={l.id} className="card-link" href={l.href} target={l.external ? '_blank' : undefined} rel={l.external ? 'noopener noreferrer' : undefined}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.5rem' }}>
              <h3>{l.title}</h3>
              {l.badge && <span className="badge">{l.badge}</span>}
            </div>
            <p>{l.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
};
