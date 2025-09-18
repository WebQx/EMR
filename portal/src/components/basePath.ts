// Utility to derive correct base path on GitHub Pages after repo rename to EMR
// Handles both historical /webqx/ and new /EMR/ plus local dev.
export function computeBasePath(): string {
  if (typeof window === 'undefined') return '/';
  const p = window.location.pathname; // e.g. /EMR/portal/ or /EMR/
  // Known repository folder names (old and new) for backward compatibility
  const candidates = ['/EMR/', '/webqx/'];
  for (const c of candidates) {
    if (p.startsWith(c)) return c; // includes trailing slash
  }
  // Fallback root
  return '/';
}

export function withBase(rel: string): string {
  const b = computeBasePath();
  if (rel.startsWith('/')) rel = rel.slice(1);
  return b + rel;
}
