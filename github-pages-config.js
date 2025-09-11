/**
 * WebQX GitHub Pages Configuration
 * Configures frontend to connect to local WebQX server from GitHub Pages
 */

// Configuration for GitHub Pages deployment
const WEBQX_CONFIG = {
    // Backend server configuration
    BACKEND_URL: 'http://localhost:3001', // Change this to your machine's IP for external access
    BACKEND_IP: '192.168.1.100:3001', // Replace with your actual IP address
    
    // GitHub Pages URLs
    GITHUB_PAGES_URL: 'https://webqx-health.github.io/webqx',
    
    // API endpoints
    API_ENDPOINTS: {
        AUTH: '/api/v1/auth',
        USERS: '/api/v1/users',
        HEALTH: '/health'
    },
    
    // OAuth configuration
    OAUTH_PROVIDERS: {
        google: '/auth/google',
        microsoft: '/auth/microsoft'
    },
    
    // Demo credentials for GitHub Pages users
    DEMO_CREDENTIALS: {
        patient: { email: 'demo@patient.com', password: 'patient123' },
        physician: { email: 'physician@webqx.com', password: 'demo123' },
        provider: { email: 'doctor@webqx.com', password: 'provider123' },
        admin: { email: 'admin@webqx.com', password: 'admin123' }
    }
};

// Auto-detect backend URL based on environment
function getBackendUrl() {
    // If running on GitHub Pages
    if (window.location.hostname.includes('github.io')) {
        // Try to connect to common local IP addresses
        const possibleIPs = [
            'http://localhost:3001',
            'http://127.0.0.1:3001',
            'http://192.168.1.100:3001', // Replace with actual IP
            'http://10.0.0.100:3001'     // Replace with actual IP
        ];
        
        // Return the configured IP or localhost as fallback
        return WEBQX_CONFIG.BACKEND_IP ? `http://${WEBQX_CONFIG.BACKEND_IP}` : possibleIPs[0];
    }
    
    // Local development
    return WEBQX_CONFIG.BACKEND_URL;
}

// Test backend connectivity
async function testBackendConnection() {
    const backendUrl = getBackendUrl();
    
    try {
        const response = await fetch(`${backendUrl}/health/`, {
            method: 'GET',
            mode: 'cors'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend connection successful:', data);
            return { success: true, url: backendUrl, data };
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Backend connection failed:', error);
        return { success: false, url: backendUrl, error: error.message };
    }
}

// Initialize WebQX configuration
function initializeWebQX() {
    const backendUrl = getBackendUrl();
    
    console.log('🚀 WebQX Configuration Initialized');
    console.log('📍 Frontend URL:', window.location.origin);
    console.log('🔗 Backend URL:', backendUrl);
    console.log('🌐 Environment:', window.location.hostname.includes('github.io') ? 'GitHub Pages' : 'Local');
    
    // Set global configuration
    window.WEBQX_CONFIG = {
        ...WEBQX_CONFIG,
        CURRENT_BACKEND_URL: backendUrl,
        IS_GITHUB_PAGES: window.location.hostname.includes('github.io')
    };
    
    // Test connection
    testBackendConnection().then(result => {
        if (result.success) {
            console.log('✅ WebQX backend is accessible');
            showConnectionStatus('connected', result.url);
        } else {
            console.warn('⚠️ WebQX backend connection failed');
            showConnectionStatus('disconnected', result.url, result.error);
        }
    });
}

// Show connection status in UI
function showConnectionStatus(status, url, error = null) {
    const statusElement = document.getElementById('backend-status');
    if (!statusElement) return;
    
    if (status === 'connected') {
        statusElement.innerHTML = `
            <div style="color: #10b981; display: flex; align-items: center; gap: 8px;">
                <span style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite;"></span>
                <span>Backend Connected: ${url}</span>
            </div>
        `;
    } else {
        statusElement.innerHTML = `
            <div style="color: #ef4444; display: flex; align-items: center; gap: 8px;">
                <span style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%;"></span>
                <span>Backend Disconnected: ${url}</span>
                ${error ? `<small style="opacity: 0.7;">(${error})</small>` : ''}
            </div>
        `;
    }
}

// WebQX API helper functions
const WebQXAPI = {
    // Authentication
    async login(email, password, userType = null) {
        const response = await fetch(`${window.WEBQX_CONFIG.CURRENT_BACKEND_URL}/api/v1/auth/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, user_type: userType })
        });
        
        if (!response.ok) {
            throw new Error(`Login failed: ${response.status}`);
        }
        
        return response.json();
    },
    
    // Get user profile
    async getProfile(token) {
        const response = await fetch(`${window.WEBQX_CONFIG.CURRENT_BACKEND_URL}/api/v1/auth/me/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error(`Profile fetch failed: ${response.status}`);
        }
        
        return response.json();
    },
    
    // Health check
    async healthCheck() {
        const response = await fetch(`${window.WEBQX_CONFIG.CURRENT_BACKEND_URL}/health/`);
        return response.json();
    }
};

// Initialize when DOM is loaded
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initializeWebQX);
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WEBQX_CONFIG, getBackendUrl, testBackendConnection, WebQXAPI };
} else {
    window.WebQXAPI = WebQXAPI;
}