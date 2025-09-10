/**
 * Demo Authentication Helper for WebQX Provider Portal
 * 
 * Provides demo authentication tokens for testing OpenEMR integration
 * without requiring full login flow on GitHub Pages
 */

(function() {
    'use strict';

    // Check if we're in demo mode (GitHub Pages or localhost)
    const isDemoMode = window.location.hostname.includes('github.io') || 
                      window.location.hostname.includes('localhost');

    if (isDemoMode) {
        console.log('🎭 Running in demo mode - setting up demo authentication');
        
        // Create demo authentication tokens
        const demoAuth = {
            providerAuthToken: 'demo_token_' + Date.now(),
            providerUser: {
                id: 'demo_provider_001',
                name: 'Dr. Demo Provider',
                email: 'demo@webqx.health',
                role: 'physician',
                specialties: ['General Practice', 'Family Medicine'],
                organization: 'WebQX Demo Health System',
                npi: '1234567890',
                licenses: ['MD-12345'],
                verified: true,
                permissions: [
                    'openemr_access',
                    'patient_management',
                    'telehealth',
                    'fhir_read',
                    'fhir_write'
                ]
            },
            providerLoginTime: new Date().toISOString()
        };

        // Store demo authentication in localStorage
        localStorage.setItem('providerAuthToken', demoAuth.providerAuthToken);
        localStorage.setItem('providerUser', JSON.stringify(demoAuth.providerUser));
        localStorage.setItem('providerLoginTime', demoAuth.providerLoginTime);

        // Also store in sessionStorage for compatibility
        sessionStorage.setItem('providerAuthToken', demoAuth.providerAuthToken);
        sessionStorage.setItem('providerUser', JSON.stringify(demoAuth.providerUser));
        sessionStorage.setItem('providerLoginTime', demoAuth.providerLoginTime);

        console.log('✅ Demo authentication configured:', demoAuth.providerUser);

        // Add demo mode indicator to page
        document.addEventListener('DOMContentLoaded', function() {
            const demoIndicator = document.createElement('div');
            demoIndicator.id = 'demo-mode-indicator';
            demoIndicator.innerHTML = `
                <div style="
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    background: rgba(255, 193, 7, 0.9);
                    color: #000;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: bold;
                    z-index: 10001;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                ">
                    🎭 DEMO MODE
                </div>
            `;
            document.body.appendChild(demoIndicator);
        });

        // Override authentication check functions if they exist
        window.checkProviderAuthentication = function() {
            return true;
        };

        window.isProviderAuthenticated = function() {
            return true;
        };

        window.getProviderUser = function() {
            return demoAuth.providerUser;
        };

        window.getProviderToken = function() {
            return demoAuth.providerAuthToken;
        };

        // Prevent redirects to login page in demo mode
        const originalLocation = window.location;
        let preventRedirect = false;

        Object.defineProperty(window, 'location', {
            get: function() {
                return originalLocation;
            },
            set: function(val) {
                if (preventRedirect && val.toString().includes('login.html')) {
                    console.log('🚫 Prevented redirect to login page in demo mode');
                    return;
                }
                originalLocation.href = val;
            }
        });

        // Enable redirect prevention
        preventRedirect = true;

        console.log('🎭 Demo authentication active - OpenEMR integration ready for testing');
    }
})();
