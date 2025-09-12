/**
 * WebQX Deployment Configuration
 * Ensures all placement cards are properly integrated with servers
 */

// Server integration configuration
const DEPLOYMENT_CONFIG = {
    // Server endpoints
    SERVERS: {
        AUTH_SERVER: 'http://localhost:3001',
        STATIC_SERVER: 'http://localhost:3000',
        WEBSOCKET_SERVER: 'ws://localhost:3001'
    },
    
    // Placement card integrations
    PLACEMENT_CARDS: {
        PATIENT_PORTAL: {
            endpoint: '/patient-portal/',
            server: 'STATIC_SERVER',
            auth_required: true,
            features: ['appointments', 'records', 'prescriptions', 'telehealth']
        },
        PROVIDER_PORTAL: {
            endpoint: '/provider/',
            server: 'STATIC_SERVER',
            auth_required: true,
            features: ['emr', 'scheduling', 'telehealth', 'clinical-data']
        },
        ADMIN_CONSOLE: {
            endpoint: '/admin-console-clean.html',
            server: 'STATIC_SERVER',
            auth_required: true,
            features: ['testing', 'user-management', 'system-monitoring']
        },
        TELEHEALTH: {
            endpoint: '/telehealth-server-test.html',
            server: 'STATIC_SERVER',
            websocket: 'WEBSOCKET_SERVER',
            auth_required: true,
            features: ['video', 'audio', 'messaging', 'transcription']
        },
        CONNECTION_TEST: {
            endpoint: '/github-pages-test.html',
            server: 'STATIC_SERVER',
            auth_required: false,
            features: ['health-check', 'cors-test', 'authentication-test']
        }
    },
    
    // API integration points
    API_INTEGRATIONS: {
        AUTHENTICATION: {
            login: '/api/v1/auth/token/',
            refresh: '/api/v1/auth/refresh/',
            profile: '/api/v1/auth/me/',
            logout: '/api/v1/auth/logout/'
        },
        USER_MANAGEMENT: {
            list: '/api/v1/users/',
            create: '/api/v1/users/',
            update: '/api/v1/users/{id}',
            delete: '/api/v1/users/{id}',
            stats: '/api/v1/users/stats/'
        },
        HEALTH_CHECK: {
            status: '/health/',
            metrics: '/metrics/',
            version: '/version/'
        }
    }
};

// Validate server connections
async function validateServerConnections() {
    const results = {};
    
    for (const [serverName, url] of Object.entries(DEPLOYMENT_CONFIG.SERVERS)) {
        if (serverName === 'WEBSOCKET_SERVER') continue; // Skip WebSocket validation for now
        
        try {
            const response = await fetch(`${url}/health/`, {
                method: 'GET',
                mode: 'cors',
                timeout: 5000
            });
            
            results[serverName] = {
                status: response.ok ? 'connected' : 'error',
                url: url,
                response_code: response.status
            };
        } catch (error) {
            results[serverName] = {
                status: 'disconnected',
                url: url,
                error: error.message
            };
        }
    }
    
    return results;
}

// Initialize placement card integrations
function initializePlacementCards() {
    const cards = document.querySelectorAll('.platform-card, .test-card');
    
    cards.forEach(card => {
        const cardType = card.getAttribute('data-card-type');
        if (cardType && DEPLOYMENT_CONFIG.PLACEMENT_CARDS[cardType]) {
            const config = DEPLOYMENT_CONFIG.PLACEMENT_CARDS[cardType];
            const serverUrl = DEPLOYMENT_CONFIG.SERVERS[config.server];
            
            // Update card with server integration
            card.setAttribute('data-server-url', serverUrl);
            card.setAttribute('data-endpoint', config.endpoint);
            card.setAttribute('data-auth-required', config.auth_required);
            
            // Add click handler for server integration
            card.addEventListener('click', () => {
                handleCardClick(cardType, config, serverUrl);
            });
        }
    });
}

// Handle placement card clicks with server integration
async function handleCardClick(cardType, config, serverUrl) {
    console.log(`[CARD] Activating ${cardType} with server ${serverUrl}`);
    
    // Check authentication if required
    if (config.auth_required) {
        const token = localStorage.getItem('webqx_token');
        if (!token) {
            console.log('[AUTH] Authentication required, redirecting to login');
            // Handle authentication
            return;
        }
    }
    
    // Navigate to the integrated endpoint
    const fullUrl = `${serverUrl}${config.endpoint}`;
    
    if (cardType === 'TELEHEALTH' || cardType === 'CONNECTION_TEST') {
        window.open(fullUrl, '_blank', 'width=1200,height=800');
    } else {
        window.location.href = fullUrl;
    }
}

// Test all placement card integrations
async function testPlacementCardIntegrations() {
    console.log('[TEST] Testing placement card integrations...');
    
    const results = {};
    
    for (const [cardType, config] of Object.entries(DEPLOYMENT_CONFIG.PLACEMENT_CARDS)) {
        const serverUrl = DEPLOYMENT_CONFIG.SERVERS[config.server];
        const fullUrl = `${serverUrl}${config.endpoint}`;
        
        try {
            const response = await fetch(fullUrl, {
                method: 'HEAD',
                mode: 'cors'
            });
            
            results[cardType] = {
                status: response.ok ? 'available' : 'error',
                url: fullUrl,
                features: config.features
            };
        } catch (error) {
            results[cardType] = {
                status: 'unavailable',
                url: fullUrl,
                error: error.message,
                features: config.features
            };
        }
    }
    
    console.log('[TEST] Placement card integration results:', results);
    return results;
}

// Initialize deployment configuration
function initializeDeploymentConfig() {
    console.log('[DEPLOY] Initializing deployment configuration...');
    
    // Validate server connections
    validateServerConnections().then(results => {
        console.log('[DEPLOY] Server connection results:', results);
        
        // Update UI with connection status
        updateConnectionStatus(results);
    });
    
    // Initialize placement cards
    initializePlacementCards();
    
    // Test integrations
    testPlacementCardIntegrations().then(results => {
        console.log('[DEPLOY] All placement cards tested');
        updateCardStatus(results);
    });
}

// Update connection status in UI
function updateConnectionStatus(results) {
    const statusElement = document.getElementById('backend-status');
    if (!statusElement) return;
    
    const connectedServers = Object.values(results).filter(r => r.status === 'connected').length;
    const totalServers = Object.keys(results).length;
    
    if (connectedServers === totalServers) {
        statusElement.innerHTML = `
            <div style="color: #10b981;">
                <span>[CONNECTED] All servers online (${connectedServers}/${totalServers})</span>
            </div>
        `;
    } else {
        statusElement.innerHTML = `
            <div style="color: #f59e0b;">
                <span>[PARTIAL] ${connectedServers}/${totalServers} servers connected</span>
            </div>
        `;
    }
}

// Update card status based on integration tests
function updateCardStatus(results) {
    for (const [cardType, result] of Object.entries(results)) {
        const card = document.querySelector(`[data-card-type="${cardType}"]`);
        if (card) {
            const statusIndicator = card.querySelector('.status-indicator') || 
                                  document.createElement('div');
            statusIndicator.className = 'status-indicator';
            statusIndicator.style.cssText = `
                width: 8px; height: 8px; border-radius: 50%; 
                background: ${result.status === 'available' ? '#10b981' : '#ef4444'};
                display: inline-block; margin-right: 8px;
            `;
            
            if (!card.querySelector('.status-indicator')) {
                card.insertBefore(statusIndicator, card.firstChild);
            }
        }
    }
}

// Export configuration
if (typeof window !== 'undefined') {
    window.DEPLOYMENT_CONFIG = DEPLOYMENT_CONFIG;
    window.initializeDeploymentConfig = initializeDeploymentConfig;
    
    // Auto-initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', initializeDeploymentConfig);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DEPLOYMENT_CONFIG, initializeDeploymentConfig };
}