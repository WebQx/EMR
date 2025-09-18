import React, { useMemo } from 'react';
import { MODULE_CATALOG } from './PortalContent';
import { useAuth } from './AuthContext';

export interface DashboardLink {
  id: string;
  title: string;
  description: string;
  href?: string; // optional now; we can rely on hash routing
  badge?: string;
  external?: boolean;
  category?: string;
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

interface DashboardCardsProps { onSelect: (id: string) => void; selectedId: string | null; }

export const DashboardCards: React.FC<DashboardCardsProps> = ({ onSelect, selectedId }) => {
  const { role } = useAuth();
  const base = guessBase();
  const links: DashboardLink[] = useMemo(() => MODULE_CATALOG
    .filter(m => !role || !m.roles || m.roles.includes(role))
    .map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      href: m.externalHref ? base + m.externalHref : undefined,
      badge: m.category === 'FHIR' ? 'FHIR' : (m.category === 'Docs' ? 'Docs' : undefined),
      category: m.category
    })), [base, role]);

  return (
    <div className="panel" style={{ gridColumn: '1 / -1' }}>
  <h2 style={{ marginTop: 0 }}>Experience & Demo Surfaces {role && <span style={{ fontSize: '.6rem', color: 'var(--muted)', fontWeight: 400 }}>({role} view)</span>}</h2>
      <div className="cards">
        {links.map(l => {
          const active = l.id === selectedId;
          return (
            <div
              key={l.id}
              className="card-link"
              style={{ cursor: 'pointer', outline: active ? '2px solid var(--accent)' : 'none', position: 'relative' }}
              onClick={(e) => {
                // If user holds meta/ctrl open original target in new tab
                if ((e.metaKey || e.ctrlKey) && l.href) {
                  window.open(l.href, '_blank');
                  return;
                }
                onSelect(l.id);
                window.location.hash = l.id; // hash routing for deep link
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.5rem' }}>
                <h3>{l.title}</h3>
                {l.badge && <span className="badge">{l.badge}</span>}
              </div>
              <p>{l.description}</p>
              {l.href && <span style={{ position: 'absolute', bottom: 6, right: 8, fontSize: '.55rem', opacity: .7 }}>Ext ↗</span>}
            </div>
          );
        })}
      </div>
      <footer className="meta" style={{ fontSize: '.55rem' }}>Click to view details inline • Ctrl/Cmd+Click opens legacy destination • {links.length} modules</footer>
    </div>
  );
};
