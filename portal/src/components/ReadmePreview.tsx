import React, { useEffect, useState } from 'react';
import { computeBasePath } from './basePath';

export const ReadmePreview: React.FC = () => {
  const [html, setHtml] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
  const base = computeBasePath();
        const res = await fetch(base + 'README.md');
        if (!res.ok) throw new Error('README fetch failed');
        const md = await res.text();
        if (!active) return;
        const firstSection = md.split(/\n## /)[0].split('\n').slice(0, 40).join('\n');
        setHtml(renderBasicMarkdown(firstSection));
      } catch (e:any) {
        if (active) setError(e.message);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  return (
    <div className="panel" style={{ gridColumn: '1 / -1' }}>
      <h2 style={{ marginTop: 0 }}>Project Overview (Excerpt)</h2>
      {error && <div className="error-msg">{error} (README preview fallback)</div>}
      {!error && !html && <div className="loading-skeleton" style={{ height: 48 }} />}
      {html && <div style={{ fontSize: '.75rem', lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: html }} />}
      <footer className="meta"><a href={computeBasePath() + 'README.md'} target="_blank" rel="noopener noreferrer">Open full README</a></footer>
    </div>
  );
};

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function renderBasicMarkdown(md: string): string {
  const lines = md.split(/\n+/);
  const out: string[] = [];
  for (const ln of lines) {
    if (/^#\s+/.test(ln)) { out.push(`<h3>${escapeHtml(ln.replace(/^#\s+/, ''))}</h3>`); continue; }
    if (!ln.trim()) { out.push(''); continue; }
    out.push(`<p>${escapeHtml(ln)}</p>`);
  }
  return out.join('\n');
}
