// WebQx GitHub Pages Integration Patch - SIMPLIFIED WORKING VERSION
// Focus ONLY on the working port 8080 endpoint

console.log('🚀 WebQx GitHub Pages Integration - Simplified Working Version Loading...');

(function() {
    'use strict';
    
    // Configuration - ONLY the working endpoint
    const WORKING_ENDPOINT = 'http://192.168.173.251:8080';
    
    console.log('🔧 Using working endpoint:', WORKING_ENDPOINT);

    // Simplified status checker - ONLY check the working endpoint
    async function checkBackendStatus() {
        const statusIndicator = document.getElementById('backendStatus');
        const statusText = document.getElementById('statusText');
        const startButton = document.getElementById('startBackend');
        
        if (!statusIndicator || !statusText || !startButton) {
            console.log('⚠️ Status elements not found yet, retrying...');
            setTimeout(checkBackendStatus, 500);
            return false;
        }
        
        console.log('🔄 Checking WebQx server status...');
        
        // Show checking state
        statusIndicator.className = 'status-indicator status-connecting';
        statusText.textContent = 'WebQx Server: Checking connection...';
        startButton.style.display = 'none';
        
        try {
            console.log('🌐 Testing endpoint:', WORKING_ENDPOINT);
            
            const response = await fetch(`${WORKING_ENDPOINT}/api/remote-start`, {
                method: 'OPTIONS',
                mode: 'cors',
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok || response.status === 204) {
                console.log('✅ Server is accessible and ready');
                statusIndicator.className = 'status-indicator status-online';
                statusText.textContent = 'WebQx Server: Online ✓';
                startButton.style.display = 'none';
                return true;
            } else {
                throw new Error(`Server responded with status ${response.status}`);
            }
            
        } catch (error) {
            console.log('❌ Server offline:', error.message);
            statusIndicator.className = 'status-indicator status-offline';
            statusText.textContent = 'WebQx Server: Offline - Click to start';
            startButton.style.display = 'inline-block';
            return false;
        }
    }

    // Simplified server start function
    async function startBackend() {
        const startButton = document.getElementById('startBackend');
        const statusText = document.getElementById('statusText');
        const statusIndicator = document.getElementById('backendStatus');
        
        console.log('🚀 Starting WebQx server...');
        
        // Update UI
        const originalText = startButton.textContent;
        startButton.textContent = 'Starting...';
        startButton.disabled = true;
        statusIndicator.className = 'status-indicator status-connecting';
        statusText.textContent = 'WebQx Server: Starting...';
        
        try {
            console.log('🎯 Sending start command to:', WORKING_ENDPOINT);
            
            const response = await fetch(`${WORKING_ENDPOINT}/api/remote-start`, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    action: 'start',
                    source: 'github-pages',
                    timestamp: new Date().toISOString()
                }),
                signal: AbortSignal.timeout(10000)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Server start successful:', result);
                
                statusText.textContent = 'WebQx Server: Starting up...';
                statusIndicator.className = 'status-indicator status-connecting';
                
                // Check status after startup delay
                setTimeout(() => {
                    statusText.textContent = 'WebQx Server: Checking services...';
                    setTimeout(checkBackendStatus, 5000);
                }, 3000);
                
            } else {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`Start failed: ${response.status} - ${errorText}`);
            }
            
        } catch (error) {
            console.error('❌ Server start failed:', error);
            statusText.textContent = 'WebQx Server: Start failed - Try again';
            statusIndicator.className = 'status-indicator status-offline';
        } finally {
            startButton.textContent = originalText;
            startButton.disabled = false;
        }
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