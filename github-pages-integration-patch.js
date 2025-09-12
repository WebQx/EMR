// WebQx GitHub Pages Integration Patch - IMMEDIATE OVERRIDE VERSION
// This script immediately overrides GitHub Pages functions to prevent red status flash

console.log('🚀 WebQx GitHub Pages Integration - Immediate Override Loading...');

// Immediately override the existing functions before they can run
(function() {
    'use strict';
    
    // Configuration - WORKING ENDPOINTS ONLY
    const DEDICATED_SERVER_CONFIG = {
        // Use ONLY the working port 8080 endpoint
        remoteTriggerUrl: window.location.hostname === 'localhost' ? 
            'http://localhost:8080' : 'http://192.168.173.251:8080',
        // Backup endpoints (if main server becomes available)
        backupUrls: [
            window.location.hostname === 'localhost' ? 
                'http://localhost:3001' : 'http://192.168.173.251:3001'
        ]
    };

    console.log('🔧 Config loaded:', DEDICATED_SERVER_CONFIG);

    // Enhanced backend status checker - IMMEDIATE OVERRIDE
    async function checkBackendStatus() {
        const statusIndicator = document.getElementById('backendStatus');
        const statusText = document.getElementById('statusText');
        const startButton = document.getElementById('startBackend');
        
        if (!statusIndicator || !statusText || !startButton) {
            console.log('⚠️ Status elements not found yet, retrying...');
            setTimeout(checkBackendStatus, 500);
            return false;
        }
        
        console.log('🔄 Checking WebQx dedicated server status (Enhanced)...');
        
        // Show checking state immediately
        statusIndicator.className = 'status-indicator status-connecting';
        statusText.textContent = 'WebQx Server: Checking enhanced connection...';
        startButton.style.display = 'none';
        
        // Test the working port 8080 endpoint
        try {
            console.log('🌐 Testing primary endpoint:', DEDICATED_SERVER_CONFIG.remoteTriggerUrl);
            
            // Use OPTIONS to check if remote trigger API is available
            const response = await fetch(`${DEDICATED_SERVER_CONFIG.remoteTriggerUrl}/api/remote-start`, {
                method: 'OPTIONS',
                mode: 'cors',
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok || response.status === 204) {
                console.log('✅ Remote trigger API accessible');
                statusIndicator.className = 'status-indicator status-online';
                statusText.textContent = 'WebQx Server: Remote trigger ready ✓';
                startButton.style.display = 'none';
                return true;
            } else {
                throw new Error(`API responded with status ${response.status}`);
            }
            
        } catch (error) {
            console.log('❌ Primary endpoint failed:', error.message);
            
            // Try backup endpoint
            for (const backupUrl of DEDICATED_SERVER_CONFIG.backupUrls) {
                try {
                    console.log('🔄 Trying backup endpoint:', backupUrl);
                    const backupResponse = await fetch(`${backupUrl}/api/health`, {
                        method: 'GET',
                        mode: 'cors',
                        signal: AbortSignal.timeout(3000)
                    });
                    
                    if (backupResponse.ok) {
                        console.log('✅ Backup endpoint accessible');
                        statusIndicator.className = 'status-indicator status-online';
                        statusText.textContent = 'WebQx Server: Connected via backup ✓';
                        startButton.style.display = 'none';
                        return true;
                    }
                } catch (backupError) {
                    console.log('❌ Backup endpoint failed:', backupError.message);
                }
            }
            
            // All endpoints failed
            console.log('🔴 All endpoints offline, showing start button');
            statusIndicator.className = 'status-indicator status-offline';
            statusText.textContent = 'WebQx Server: Offline';
            startButton.style.display = 'inline-block';
            return false;
        }
    }

    // Enhanced server start function - IMMEDIATE OVERRIDE
    async function startBackend() {
        const startButton = document.getElementById('startBackend');
        const statusText = document.getElementById('statusText');
        const statusIndicator = document.getElementById('backendStatus');
        
        console.log('🚀 Enhanced remote start initiated...');
        
        // Update UI immediately
        startButton.textContent = 'Starting...';
        startButton.disabled = true;
        statusIndicator.className = 'status-indicator status-connecting';
        statusText.textContent = 'WebQx Server: Starting remote server...';
        
        try {
            console.log('🎯 Attempting enhanced remote start...');
            
            const response = await fetch(`${DEDICATED_SERVER_CONFIG.remoteTriggerUrl}/api/remote-start`, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    action: 'start',
                    source: 'github-pages-enhanced',
                    timestamp: new Date().toISOString()
                }),
                signal: AbortSignal.timeout(10000)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Enhanced remote start successful:', result);
                
                statusText.textContent = 'WebQx Server: Remote start initiated ✓';
                statusIndicator.className = 'status-indicator status-connecting';
                
                // Check status after a delay
                setTimeout(() => {
                    statusText.textContent = 'WebQx Server: Checking services...';
                    setTimeout(checkBackendStatus, 3000);
                }, 2000);
                
            } else {
                throw new Error(`Remote start failed: ${response.status}`);
            }
            
        } catch (error) {
            console.error('❌ Enhanced remote start failed:', error);
            statusText.textContent = 'WebQx Server: Remote start failed';
            statusIndicator.className = 'status-indicator status-offline';
        } finally {
            startButton.textContent = 'Start WebQx Server';
            startButton.disabled = false;
        }
    }

    // IMMEDIATE OVERRIDE - Replace functions before page loads
    if (typeof window !== 'undefined') {
        window.checkBackendStatus = checkBackendStatus;
        window.startBackend = startBackend;
        console.log('✅ Functions immediately overridden');
    }

    // Override when DOM is ready
    function initializeEnhancedIntegration() {
        console.log('🌟 WebQx Enhanced Integration Initializing...');
        
        // Ensure our functions are set
        window.checkBackendStatus = checkBackendStatus;
        window.startBackend = startBackend;
        
        // Clear any existing intervals
        if (window.webqxStatusInterval) {
            clearInterval(window.webqxStatusInterval);
        }
        
        // Run initial status check
        setTimeout(checkBackendStatus, 100);
        
        // Set up enhanced monitoring
        window.webqxStatusInterval = setInterval(checkBackendStatus, 30000);
        
        console.log('✅ Enhanced integration active');
    }

    // Initialize immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEnhancedIntegration);
    } else {
        initializeEnhancedIntegration();
    }

    // Also initialize after a short delay to ensure we override any later-loading scripts
    setTimeout(initializeEnhancedIntegration, 1000);

})();

console.log('✅ WebQx GitHub Pages integration patch loaded - ENHANCED VERSION');