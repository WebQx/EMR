import React, { useEffect, useState } from 'react';
import { DashboardCards } from './components/DashboardCards';
import { AuthPanel } from './components/AuthPanel';
import { SystemStatusPanel } from './components/SystemStatusPanel';
import { PlacementStatusPanel } from './components/PlacementStatusPanel';
import { ReadmePreview } from './components/ReadmePreview';
import { PortalContent } from './components/PortalContent';

export const PortalApp: React.FC = () => {
  const [selected, setSelected] = useState<string | null>(null);

  // Initialize from hash for deep linking
  useEffect(() => {
    const applyHash = () => {
      const h = window.location.hash.replace(/^#/, '').trim();
      setSelected(h || null);
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  return (
    <div className="portal-shell">
      <header className="portal-header">
        <h1>WebQX Portal</h1>
        <nav>
          <a href="#top">Home</a>
          <a href="#experiences">Experiences</a>
          <a href="#observability">Observability</a>
          <a href="#session">Session</a>
        </nav>
      </header>
      <div className="grid" style={{ gap: '1.25rem' }}>
        <section id="experiences">
          <DashboardCards onSelect={setSelected} selectedId={selected} />
        </section>
        <section id="content-detail">
          <PortalContent selectedId={selected} base={deriveBase()} onClose={() => { setSelected(null); window.location.hash = ''; }} />
        </section>
        <section id="observability">
          <SystemStatusPanel />
        </section>
        <section id="placement-status">
          <PlacementStatusPanel />
        </section>
        <section id="overview">
          <ReadmePreview />
        </section>
        <section id="session" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1.25rem' }}>
          <AuthPanel />
        </section>
      </div>
      <footer className="site-footer">WebQX Healthcare Platform © {new Date().getFullYear()} • Enhanced Portal Dashboard Preview</footer>
    </div>
  );
};

function deriveBase(): string {
  const loc = window.location.pathname; // /webqx/portal/
  const idx = loc.indexOf('/portal/');
  if (idx !== -1) return loc.substring(0, idx + 1);
  return '/';
}
