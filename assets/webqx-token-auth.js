// Minimal token acquisition helper.
// Expects an auth endpoint that issues JWT on POST /auth/api/token/ with JSON {username, password}
// Stores token in localStorage under 'webqx-jwt'.

window.WebQXAuth = (function(){
  const ACCESS_KEY = 'webqx-jwt';
  const REFRESH_KEY = 'webqx-jwt-refresh';
  let autoTimer = null;

  function resolveBase(baseUrl){
    if(!baseUrl || baseUrl === 'auto') return '';
    return baseUrl.replace(/\/$/, '');
  }
  function decode(token){
    try { const [,p] = token.split('.'); return JSON.parse(atob(p.replace(/-/g,'+').replace(/_/g,'/'))); } catch(_){ return null; }
  }
  function isExpired(token, skewSec=30){
    const c = decode(token); if(!c || !c.exp) return true; return (Date.now()/1000) > (c.exp - skewSec);
  }
  async function login(options){
    // options: { baseUrl, email, password }
    const { baseUrl, email, password } = typeof options === 'object' ? options : { baseUrl: arguments[0], email: arguments[1], password: arguments[2] };
    const root = resolveBase(baseUrl);
    const url = root + '/auth/api/token/';
    const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, password}) });
    if(!res.ok){
      let msg = 'Login failed: '+res.status;
      try { const j = await res.json(); if(j.detail) msg += ' - '+j.detail; } catch(_){ }
      throw new Error(msg);
    }
    const data = await res.json();
    const access = data.access || data.token || data.id_token;
    if(!access) throw new Error('No access token in response');
    if(data.refresh) localStorage.setItem(REFRESH_KEY, data.refresh);
    localStorage.setItem(ACCESS_KEY, access);
    return access;
  }
  async function refresh(baseUrl){
    const refresh = localStorage.getItem(REFRESH_KEY);
    if(!refresh) throw new Error('No refresh token');
    const root = resolveBase(baseUrl);
    const url = root + '/auth/api/token/refresh/';
    const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({refresh}) });
    if(!res.ok) throw new Error('Refresh failed: '+res.status);
    const data = await res.json();
    const access = data.access;
    if(access) localStorage.setItem(ACCESS_KEY, access);
    return access;
  }
  function getToken(){ return localStorage.getItem(ACCESS_KEY); }
  function getClaims(){ const t = getToken(); return t ? decode(t) : null; }
  async function ensureFreshAccessToken(baseUrl){
    const token = getToken();
    if(!token) return null;
    if(isExpired(token)){
      try { return await refresh(baseUrl); } catch(e){ console.warn('Auto refresh failed', e); logout(); return null; }
    }
    return token;
  }
  function initAutoRefresh({ baseUrl='auto', intervalSec=60 }={}){
    if(autoTimer) clearInterval(autoTimer);
    autoTimer = setInterval(()=>{ ensureFreshAccessToken(baseUrl); }, intervalSec*1000);
  }
  function logout(){ localStorage.removeItem(ACCESS_KEY); localStorage.removeItem(REFRESH_KEY); if(autoTimer) clearInterval(autoTimer); }
  return { login, refresh, getToken, getClaims, logout, ensureFreshAccessToken, initAutoRefresh, _decode: decode };
})();
