// WebQx GitHub Pages Integration - REAL EMR CONNECTION
// Connect to OpenEMR 7.0.3 server with WebQX branding

console.log('🏥 WebQx EMR Integration Loading - Connecting to OpenEMR 7.0.3...');

(function() {
    'use strict';
    
    // Configuration - Real EMR Server URLs
    const EMR_SERVER = 'https://fuzzy-goldfish-7vx645x7wgvv3rjxg-8085.app.github.dev';
    const API_SERVER = 'https://fuzzy-goldfish-7vx645x7wgvv3rjxg-8080.app.github.dev';
    
    console.log('🏥 EMR Server:', EMR_SERVER);
    console.log('🔌 API Server:', API_SERVER);
    
    console.log('🔧 Using EMR endpoint:', EMR_SERVER);

    // EMR Status checker - Check real OpenEMR server
    async function checkBackendStatus() {
        const statusIndicator = document.getElementById('backendStatus');
        const statusText = document.getElementById('statusText');
        const startButton = document.getElementById('startBackend');
        
        if (!statusIndicator || !statusText || !startButton) {
            console.log('⚠️ Status elements not found yet, retrying...');
            setTimeout(checkBackendStatus, 500);
            return false;
        }
        
        console.log('🔄 Checking WebQX EMR server status...');
        
        // Show checking state
        statusIndicator.className = 'status-indicator status-connecting';
        statusText.textContent = 'WebQX EMR: Checking connection...';
        startButton.style.display = 'none';
        
        try {
            console.log('🌐 Testing OpenEMR endpoint:', EMR_ENDPOINT);
            
            // Check OpenEMR server status
            const response = await fetch(`${EMR_ENDPOINT}/interface/globals.php`, {
                method: 'GET',
                mode: 'no-cors',
                signal: AbortSignal.timeout(8000)
            });
            
            if (response.type !== 'opaque' || response.status === 0) {
                // For no-cors requests, we get an opaque response if server is reachable
                console.log('✅ OpenEMR server is responding');
                statusIndicator.className = 'status-indicator status-online';
                statusText.textContent = 'WebQx EMR: Connected to OpenEMR ✓';
                startButton.style.display = 'none';
                return true;
            } else {
                throw new Error('OpenEMR not accessible');
            }
            
        } catch (error) {
            console.log('❌ Server offline:', error.message);
            statusIndicator.className = 'status-indicator status-offline';
            statusText.textContent = 'WebQx Server: Offline - Click to start';
            startButton.style.display = 'inline-block';
            return false;
        }
    }

    // Simplified redirect to OpenEMR function
    async function startBackend() {
        const startButton = document.getElementById('startBackend');
        const statusText = document.getElementById('statusText');
        const statusIndicator = document.getElementById('backendStatus');
        
        console.log('� Redirecting to OpenEMR...');
        
        // Redirect to OpenEMR login
        window.open(EMR_ENDPOINT, '_blank');
    }

    // Set up module click handlers
    function setupModuleHandlers() {
        // Patient Portal
        const patientPortalCard = document.querySelector('[data-module="patient-portal"]');
        if (patientPortalCard) {
            patientPortalCard.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('🏥 Opening Patient Portal...');
                window.open(`${EMR_ENDPOINT}/portal/index.php`, '_blank');
            });
        }
        
        // Provider Portal
        const providerPortalCard = document.querySelector('[data-module="provider-portal"]');
        if (providerPortalCard) {
            providerPortalCard.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('👩‍⚕️ Opening Provider Portal...');
                window.open(`${EMR_ENDPOINT}/interface/login/login.php`, '_blank');
            });
        }
        
        // Admin Console
        const adminConsoleCard = document.querySelector('[data-module="admin-console"]');
        if (adminConsoleCard) {
            adminConsoleCard.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('⚙️ Opening Admin Console...');
                window.open(`${EMR_ENDPOINT}/interface/super/edit_globals.php`, '_blank');
            });
        }
        
        console.log('🔗 Module handlers configured');
    }

    // Set up click handler with retry logic
    function setupClickHandler() {
        const startButton = document.getElementById('startBackend');
        if (startButton) {
            // Remove existing handlers
            startButton.onclick = null;
            const newButton = startButton.cloneNode(true);
            startButton.parentNode.replaceChild(newButton, startButton);
            
            // Add the click handler
            newButton.addEventListener('click', startBackend);
            
            console.log('✅ Click handler set up successfully');
            return true;
        } else {
            console.log('⚠️ Start button not found');
            return false;
        }
    }

    // Initialize everything
    function initializeIntegration() {
        console.log('🌟 WebQx Integration Initializing...');
        
        // Set global functions
        window.checkBackendStatus = checkBackendStatus;
        window.startBackend = startBackend;
        
        // Clear existing intervals
        if (window.webqxStatusInterval) {
            clearInterval(window.webqxStatusInterval);
        }
        
        // Set up click handler with retries
        let attempts = 0;
        function trySetupClick() {
            if (setupClickHandler() || attempts >= 10) {
                // Also set up module handlers
                setupModuleHandlers();
                return;
            }
            attempts++;
            setTimeout(trySetupClick, 500);
        }
        trySetupClick();
        
        // Start status checking
        setTimeout(checkBackendStatus, 200);
        window.webqxStatusInterval = setInterval(checkBackendStatus, 30000);
        
        console.log('✅ Integration initialized');
    }

    // Override existing functions immediately
    if (typeof window !== 'undefined') {
        window.checkBackendStatus = checkBackendStatus;
        window.startBackend = startBackend;
    }

    // Initialize when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeIntegration);
    } else {
        initializeIntegration();
    }
    
    // Also try after a delay to override any other scripts
    setTimeout(initializeIntegration, 1000);

})();