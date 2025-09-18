import React from 'react';
import { createRoot } from 'react-dom/client';
import { PortalApp } from './portal-app';
import './styles.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(<PortalApp />);
}
