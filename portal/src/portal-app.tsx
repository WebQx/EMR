import React from 'react';
import { DashboardCards } from './components/DashboardCards';
import { AuthPanel } from './components/AuthPanel';
import { SystemStatusPanel } from './components/SystemStatusPanel';

export const PortalApp: React.FC = () => {
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
          <DashboardCards />
        </section>
        <section id="observability">
          <SystemStatusPanel />
        </section>
        <section id="session" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1.25rem' }}>
          <AuthPanel />
        </section>
      </div>
      <footer className="site-footer">WebQX Healthcare Platform © {new Date().getFullYear()} • Enhanced Portal Dashboard Preview</footer>
    </div>
  );
};
