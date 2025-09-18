import React, { useEffect, useState } from 'react';
import { HealthPanel } from './components/HealthPanel';
import { FeaturesPanel } from './components/FeaturesPanel';
import { MetricsPanel } from './components/MetricsPanel';

export const PortalApp: React.FC = () => {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '1.5rem', maxWidth: 1280, margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600 }}>WebQX Portal</h1>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <a href="#" aria-label="Home">Home</a>
          <a href="#features">Features</a>
          <a href="#metrics">Metrics</a>
          <a href="#ai">AI Assist</a>
        </nav>
      </header>
      <main style={{ display: 'grid', gap: '1.25rem' }}>
        <section>
          <HealthPanel />
        </section>
        <section id="features">
          <FeaturesPanel />
        </section>
        <section id="metrics">
          <MetricsPanel />
        </section>
      </main>
      <footer style={{ marginTop: '2rem', fontSize: '.85rem', color: '#666' }}>
        WebQX Healthcare Platform &copy; {new Date().getFullYear()} - Draft Portal Interface
      </footer>
    </div>
  );
};
