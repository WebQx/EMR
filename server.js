#!/usr/bin/env node
/** Root startup wrapper (recreated) */
(async () => {
  const startTime = Date.now();
  console.log('🏥 WebQX Root Entrypoint Initializing...');
  try {
    const UnifiedServer = require('./core/unified-server.js');
    const unified = new UnifiedServer();
    await unified.start();
    console.log(`✅ WebQX Healthcare Platform Gateway started (${Date.now() - startTime}ms)`);
  } catch (e) {
    console.warn('⚠️ Platform gateway failed:', e.message);
    try {
      const Legacy = require('./core/start-webqx-server.js');
      const mgr = new Legacy();
      await mgr.start();
      console.log(`✅ Legacy orchestrator started (${Date.now() - startTime}ms)`);
    } catch (e2) {
      console.error('❌ Startup failed (unified + legacy).');
      console.error('Primary:', e); 
      console.error('Fallback:', e2);
      process.exit(1);
    }
  }
})();
