// WebQx GitHub Pages Integration Patch
// This script updates the existing GitHub Pages "Start WebQx Server" functionality
// to use our dedicated server's remote triggering endpoints

// Configuration
const DEDICATED_SERVER_CONFIG = {
    // Main server endpoints (use localhost for testing, 192.168.173.251 for production)
    mainServerUrl: window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'http://192.168.173.251:3000',
    authServerUrl: window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'http://192.168.173.251:3001', 
    // Remote trigger API endpoint (this is our working endpoint)
    remoteTriggerUrl: window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'http://192.168.173.251:8080',
    // Fallback endpoints
    fallbackUrls: [
        window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'http://192.168.173.251:8080'
    ]
};

// Enhanced backend status checker with multiple endpoint support
async function checkBackendStatus() {
    const statusIndicator = document.getElementById('backendStatus');
    const statusText = document.getElementById('statusText');
    const startButton = document.getElementById('startBackend');
    
    console.log('🔄 Checking WebQx dedicated server status...');
    
    // Try multiple endpoints to check server status
    const endpoints = [
        `${DEDICATED_SERVER_CONFIG.remoteTriggerUrl}/api/remote-start`, // Test with POST options
        `${DEDICATED_SERVER_CONFIG.mainServerUrl}/api/server-status`,
        `${DEDICATED_SERVER_CONFIG.authServerUrl}/api/health`
    ];
    
    let serverOnline = false;
    let statusDetails = '';
    
    for (const endpoint of endpoints) {
        try {
            console.log(`🌐 Checking endpoint: ${endpoint}`);
            
            // For remote trigger endpoint, use OPTIONS to check if it's available
            const method = endpoint.includes('remote-start') ? 'OPTIONS' : 'GET';
            
            const response = await fetch(endpoint, {
                method: method,
                mode: 'cors',
                headers: {
                    'Accept': 'application/json'
                },
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok || response.status === 200 || response.status === 204) {
                console.log(`✅ Server response from ${endpoint}: ${response.status}`);
                
                statusIndicator.className = 'status-indicator status-online';
                statusText.textContent = `WebQx Server: Connected ✓ (Remote trigger ready)`;
                startButton.style.display = 'none';
                serverOnline = true;
                break; // Found working endpoint
            }
        } catch (error) {
            console.log(`❌ Endpoint ${endpoint} failed:`, error.message);
            continue; // Try next endpoint
        }
    }
    
    if (!serverOnline) {
        console.log('🔴 All server endpoints offline');
        statusIndicator.className = 'status-indicator status-offline';
        statusText.textContent = 'WebQx Server: Offline';
        startButton.style.display = 'inline-block';
    }
    
    return serverOnline;
}

// Enhanced server start function with remote triggering
async function startBackend() {
    const startButton = document.getElementById('startBackend');
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('backendStatus');
    
    console.log('🚀 Initiating WebQx server remote start...');
    
    // Update UI to show starting state
    startButton.textContent = 'Starting...';
    startButton.disabled = true;
    statusIndicator.className = 'status-indicator status-connecting';
    statusText.textContent = 'WebQx Server: Starting dedicated server...';
    
    try {
        // Method 1: Use our dedicated remote trigger API
        console.log('🎯 Attempting remote start via dedicated API...');
        
        const remoteTriggerResponse = await fetch(`${DEDICATED_SERVER_CONFIG.remoteTriggerUrl}/api/remote-start`, {
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
        
        if (remoteTriggerResponse.ok) {
            const result = await remoteTriggerResponse.json();
            console.log('✅ Remote start successful:', result);
            
            statusText.textContent = 'WebQx Server: Remote start initiated ✓';
            
            // Wait for services to come online
            setTimeout(async () => {
                statusText.textContent = 'WebQx Server: Checking services...';
                await new Promise(resolve => setTimeout(resolve, 3000));
                await checkBackendStatus();
            }, 2000);
            
            return; // Success, exit function
        }
        
    } catch (error) {
        console.log('⚠️ Remote trigger API failed:', error.message);
    }
    
    try {
        // Method 2: Direct server wake via main gateway
        console.log('🔄 Attempting wake via main server gateway...');
        
        const wakeResponse = await fetch(`${DEDICATED_SERVER_CONFIG.mainServerUrl}/api/wake`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'wake',
                source: 'github-pages'
            }),
            signal: AbortSignal.timeout(8000)
        });
        
        if (wakeResponse.ok) {
            console.log('✅ Server wake successful');
            statusText.textContent = 'WebQx Server: Wake signal sent ✓';
            
            setTimeout(async () => {
                await checkBackendStatus();
            }, 5000);
            
            return; // Success, exit function
        }
        
    } catch (error) {
        console.log('⚠️ Server wake failed:', error.message);
    }
    
    try {
        // Method 3: Legacy GitHub webhook (if configured)
        console.log('🐙 Attempting GitHub webhook trigger...');
        
        const webhookResponse = await fetch('https://api.github.com/repos/WebQx/webqx/dispatches', {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event_type: 'start-webqx-server',
                client_payload: {
                    server_ip: '192.168.173.251',
                    trigger_source: 'github-pages',
                    timestamp: new Date().toISOString()
                }
            }),
            signal: AbortSignal.timeout(8000)
        });
        
        if (webhookResponse.ok || webhookResponse.status === 204) {
            console.log('✅ GitHub webhook sent');
            statusText.textContent = 'WebQx Server: GitHub trigger sent...';
            
            setTimeout(async () => {
                await checkBackendStatus();
            }, 8000);
            
            return; // Success, exit function
        }
        
    } catch (error) {
        console.log('⚠️ GitHub webhook failed:', error.message);
    }
    
    // All methods failed
    console.log('❌ All remote start methods failed');
    statusText.textContent = 'WebQx Server: Remote start failed (check server)';
    statusIndicator.className = 'status-indicator status-offline';
    
    // Reset button state
    startButton.textContent = 'Start WebQx Server';
    startButton.disabled = false;
}

// Enhanced monitoring with detailed server health
async function monitorServerHealth() {
    try {
        const response = await fetch(`${DEDICATED_SERVER_CONFIG.mainServerUrl}/api/server-status`, {
            method: 'GET',
            mode: 'cors',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
            const status = await response.json();
            console.log('📊 Server health:', status);
            
            // Update detailed status if available
            if (status.services) {
                const runningServices = Object.values(status.services).filter(s => s === 'online').length;
                const totalServices = Object.keys(status.services).length;
                
                if (runningServices === totalServices) {
                    document.getElementById('statusText').textContent = 
                        `WebQx Server: All services online ✓ (${totalServices}/${totalServices})`;
                } else if (runningServices > 0) {
                    document.getElementById('statusText').textContent = 
                        `WebQx Server: Partially online (${runningServices}/${totalServices})`;
                    document.getElementById('backendStatus').className = 'status-indicator status-connecting';
                }
            }
        }
    } catch (error) {
        // Silent fail for health monitoring
        console.log('Health check failed (normal if server offline)');
    }
}

// Initialize enhanced monitoring
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌟 WebQx GitHub Pages Integration Enhanced');
    
    // Replace existing functions
    window.checkBackendStatus = checkBackendStatus;
    window.startBackend = startBackend;
    
    // Initial status check
    checkBackendStatus();
    
    // Enhanced monitoring every 30 seconds
    setInterval(() => {
        checkBackendStatus();
        monitorServerHealth();
    }, 30000);
    
    // Quick health check every 10 seconds when server is online
    setInterval(monitorServerHealth, 10000);
});

// Add enhanced status CSS if not present
if (!document.querySelector('#enhanced-status-css')) {
    const style = document.createElement('style');
    style.id = 'enhanced-status-css';
    style.textContent = `
        .status-indicator.status-connecting {
            background-color: #f6ad55 !important;
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .status-bar {
            transition: all 0.3s ease;
        }
        
        .status-bar:hover {
            background-color: rgba(0,0,0,0.05);
        }
    `;
    document.head.appendChild(style);
}

console.log('✅ WebQx GitHub Pages integration patch loaded');