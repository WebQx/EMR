(function(){
  try {
    if (!window.openEMRConfig) {
      var cfg = (window.WEBQX_CONFIG && window.WEBQX_CONFIG.getConfig && window.WEBQX_CONFIG.getConfig()) || {};
      var base = (window.WEBQX_PROD_EMR || cfg.emr_base || cfg.api_base || window.location.origin || '').replace(/\/$/, '');
      window.openEMRConfig = {
        baseUrl: base,
        version: 'mock-1.0',
        source: 'openemr-launcher-shim'
      };
      console.info('WebQX EMR config (shim) set to', window.openEMRConfig);
    }

    if (!window.openEMRLauncher) {
      var baseUrl = (window.openEMRConfig && window.openEMRConfig.baseUrl) || window.location.origin;
      window.openEMRLauncher = {
        isInitialized: true,
        launchOpenEMR: function(opts){
          opts = opts || {};
          var module = opts.module || 'home';
          var mode = opts.mode || 'modal';
          var newWindow = !!opts.newWindow || mode === 'window' || mode === 'redirect';
          var action = 'launch:' + module + ':' + mode;
          try {
            if (newWindow) {
              var url = baseUrl + '/';
              // simple module hint via hash to avoid query interference
              if (module) url += '#module=' + encodeURIComponent(module);
              window.open(url, '_blank');
            }
          } catch(e){ /* ignore pop-up blocks; still resolve */ }
          return Promise.resolve({ success: true, action: action, module: module, mode: mode });
        }
      };
      console.info('WebQX EMR launcher shim initialized');
    }
  } catch(e){
    console.warn('OpenEMR launcher shim encountered an error:', e);
  }
})();
