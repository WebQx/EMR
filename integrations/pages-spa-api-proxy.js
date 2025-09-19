/*
  Pages SPA API Proxy
  - Rewrites relative API calls from the static SPA (GitHub Pages) to the configured backend (Railway).
  - Uses window.WEBQX_CONFIG if available; otherwise falls back to window.WEBQX_PROD_API or same-origin.
*/
(function(){
  try {
    const originalFetch = window.fetch;
    const cfg = (window.WEBQX_CONFIG && window.WEBQX_CONFIG.getConfig && window.WEBQX_CONFIG.getConfig()) || {
      api_base: window.WEBQX_PROD_API || window.location.origin
    };
    const apiBase = (cfg.api_base || '').replace(/\/$/, '');

    // Only enable on GitHub Pages or when explicitly forced to remote mode
    const isPages = /github\.io$/.test(window.location.hostname);
    const forced = window.WEBQX_FORCE_ENV === 'remote';
    if (!isPages && !forced) return;

    const shouldRewrite = (path) => (
      /^\/(internal\/metrics|health|api\/.*|fhir\/.*)$/.test(path)
    );

    window.fetch = function(input, init){
      try {
        let url = typeof input === 'string' ? input : (input && input.url) || '';
        if (url && url.startsWith('/') && shouldRewrite(url)) {
          const rewritten = apiBase + url;
          return originalFetch.call(this, rewritten, init);
        }
      } catch (_) {}
      return originalFetch.apply(this, arguments);
    };

    console.log('🔀 Pages SPA API proxy active →', apiBase);
  } catch (e) {
    console.warn('Pages SPA API proxy failed to initialize:', e);
  }
})();
