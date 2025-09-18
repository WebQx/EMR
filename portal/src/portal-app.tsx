import React, { useEffect, useState } from 'react';
import { DashboardCards } from './components/DashboardCards';
import { AuthPanel } from './components/AuthPanel';
// Diagnostics now lazy-toggle (SystemStatus + Placement) inside DiagnosticsSection
import { ReadmePreview } from './components/ReadmePreview';
import { PortalContent } from './components/PortalContent';
import { AuthProvider, useAuth } from './components/AuthContext';
import { computeBasePath } from './components/basePath';
import { HeroWelcome } from './components/HeroWelcome';
import { DiagnosticsSection } from './components/DiagnosticsSection';

const AppInner: React.FC = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const { role } = useAuth();

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
          <a href="#overview">Overview</a>
          <a href="#diagnostics">Diagnostics</a>
          <a href="#session">Session</a>
        </nav>
      </header>
      <div className="grid" style={{ gap: '1.25rem' }}>
        <HeroWelcome />
        {/* Experiences & content are visible even before role; internal gating handles access notes */}
        <section id="experiences">
          <DashboardCards onSelect={setSelected} selectedId={selected} />
        </section>
        <section id="content-detail">
          <PortalContent selectedId={selected} base={computeBasePath()} onClose={() => { setSelected(null); window.location.hash = ''; }} />
        </section>
        <section id="overview">
          <ReadmePreview />
        </section>
        <section id="diagnostics">
          <DiagnosticsSection />
        </section>
        <section id="session" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1.25rem' }}>
          <AuthPanel />
        </section>
      </div>
      <footer className="site-footer">WebQX Healthcare Platform © {new Date().getFullYear()} • Enhanced Portal Dashboard Preview</footer>
    </div>
  );
};

export const PortalApp: React.FC = () => (
  <AuthProvider>
    <AppInner />
  </AuthProvider>
);

// Local deriveBase removed; using computeBasePath utility
