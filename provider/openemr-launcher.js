/**
 * WebQX™ OpenEMR Integration Launcher
 * 
 * Handles authentication, initialization, and launching of OpenEMR functionality
 * from the provider portal with proper OAuth2 flow and FHIR integration.
 */

class OpenEMRLauncher {
    constructor() {
        this.config = {
            baseUrl: this.getOpenEMRBaseUrl(),
            clientId: 'webqx-provider-portal',
            redirectUri: this.getRedirectUri(),
            scopes: [
                'openid',
                'fhirUser',
                'patient/Patient.read',
                'patient/Patient.write',
                'patient/Appointment.read',
                'patient/Appointment.write',
                'patient/Encounter.read',
                'patient/Encounter.write',
                'patient/Observation.read',
                'patient/DocumentReference.read',
                'user/Practitioner.read'
            ],
            fhirBaseUrl: null,
            apiVersion: '7.0.2'
        };
        
        this.tokens = null;
        this.userContext = null;
        this.isInitialized = false;
        
        // Load stored tokens if available
        this.loadStoredTokens();
    }

    /**
     * Initialize OpenEMR integration
     */
    async initialize() {
        try {
            console.log('🔄 Initializing OpenEMR integration...');
            
            // Detect OpenEMR configuration
            await this.detectOpenEMRConfiguration();
            
            // Check authentication status
            await this.checkAuthenticationStatus();
            
            this.isInitialized = true;
            
            console.log('✅ OpenEMR integration initialized successfully');
            return {
                success: true,
                status: 'initialized',
                config: this.config,
                authenticated: !!this.tokens
            };
        } catch (error) {
            console.error('❌ Failed to initialize OpenEMR integration:', error);
            return {
                success: false,
                error: error.message,
                status: 'initialization_failed'
            };
        }
    }

    /**
     * Launch OpenEMR with proper authentication
     */
    async launchOpenEMR(launchContext = {}) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            // Check if we need to authenticate
            if (!this.tokens || this.isTokenExpired()) {
                console.log('🔐 Authentication required, starting OAuth2 flow...');
                return await this.startAuthenticationFlow(launchContext);
            }

            // Launch OpenEMR with current tokens
            return await this.performLaunch(launchContext);
            
        } catch (error) {
            console.error('❌ Failed to launch OpenEMR:', error);
            throw error;
        }
    }

    /**
     * Start OAuth2 authentication flow
     */
    async startAuthenticationFlow(launchContext = {}) {
        const state = this.generateState();
        const codeVerifier = this.generateCodeVerifier();
        const codeChallenge = await this.generateCodeChallenge(codeVerifier);
        
        // Store PKCE parameters
        sessionStorage.setItem('openemr_code_verifier', codeVerifier);
        sessionStorage.setItem('openemr_state', state);
        sessionStorage.setItem('openemr_launch_context', JSON.stringify(launchContext));
        
        // Build authorization URL
        const authParams = new URLSearchParams({
            response_type: 'code',
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            scope: this.config.scopes.join(' '),
            state: state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        });

        const authUrl = `${this.config.baseUrl}/oauth2/default/authorize?${authParams}`;
        
        console.log('🔗 Redirecting to OpenEMR authorization...');
        
        // Open in new window or redirect based on context
        if (launchContext.newWindow !== false) {
            this.openAuthWindow(authUrl);
        } else {
            window.location.href = authUrl;
        }
        
        return {
            success: true,
            action: 'authentication_started',
            authUrl: authUrl
        };
    }

    /**
     * Handle OAuth2 callback
     */
    async handleAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
            throw new Error(`Authentication failed: ${error}`);
        }

        if (!code || !state) {
            throw new Error('Missing authorization code or state parameter');
        }

        // Verify state
        const storedState = sessionStorage.getItem('openemr_state');
        if (state !== storedState) {
            throw new Error('Invalid state parameter - possible CSRF attack');
        }

        // Exchange code for tokens
        const codeVerifier = sessionStorage.getItem('openemr_code_verifier');
        const tokens = await this.exchangeCodeForTokens(code, codeVerifier);
        
        // Store tokens
        this.tokens = tokens;
        this.storeTokens(tokens);
        
        // Get launch context
        const launchContext = JSON.parse(sessionStorage.getItem('openemr_launch_context') || '{}');
        
        // Clean up session storage
        sessionStorage.removeItem('openemr_code_verifier');
        sessionStorage.removeItem('openemr_state');
        sessionStorage.removeItem('openemr_launch_context');
        
        // Complete launch
        return await this.performLaunch(launchContext);
    }

    /**
     * Perform actual OpenEMR launch
     */
    async performLaunch(launchContext = {}) {
        try {
            console.log('🚀 Launching OpenEMR with context:', launchContext);
            
            // Get user information
            await this.fetchUserInfo();
            
            // Validate FHIR access
            if (this.config.fhirBaseUrl) {
                await this.validateFHIRAccess();
            }
            
            const launchOptions = {
                openemrUrl: this.buildOpenEMRLaunchUrl(launchContext),
                userContext: this.userContext,
                tokens: this.tokens,
                fhirCapable: !!this.config.fhirBaseUrl,
                launchContext: launchContext
            };

            // Determine launch method
            switch (launchContext.mode || 'window') {
                case 'embed':
                    return this.launchEmbedded(launchOptions);
                case 'redirect':
                    return this.launchRedirect(launchOptions);
                case 'modal':
                    return this.launchModal(launchOptions);
                default:
                    return this.launchInNewWindow(launchOptions);
            }
            
        } catch (error) {
            console.error('❌ Launch failed:', error);
            throw error;
        }
    }

    /**
     * Launch OpenEMR in new window
     */
    async launchInNewWindow(options) {
        const openemrWindow = window.open(
            options.openemrUrl,
            'openemr_window',
            'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=yes,menubar=yes'
        );

        if (!openemrWindow) {
            throw new Error('Failed to open OpenEMR window. Please disable popup blocker.');
        }

        // Monitor window for close
        const checkClosed = setInterval(() => {
            if (openemrWindow.closed) {
                clearInterval(checkClosed);
                console.log('📱 OpenEMR window closed');
            }
        }, 1000);

        return {
            success: true,
            action: 'launched_in_window',
            window: openemrWindow,
            url: options.openemrUrl
        };
    }

    /**
     * Launch OpenEMR in modal
     */
    async launchModal(options) {
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'openemr-modal-launcher';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🏥 OpenEMR System</h3>
                        <button class="close-btn" onclick="this.closest('.openemr-modal-launcher').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <iframe src="${options.openemrUrl}" 
                                style="width: 100%; height: 600px; border: none;">
                        </iframe>
                    </div>
                </div>
            </div>
        `;

        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .openemr-modal-launcher {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.8);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .openemr-modal-launcher .modal-content {
                background: white;
                border-radius: 8px;
                width: 95%;
                max-width: 1200px;
                height: 90%;
                max-height: 800px;
                display: flex;
                flex-direction: column;
            }
            .openemr-modal-launcher .modal-header {
                padding: 16px;
                border-bottom: 1px solid #ddd;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .openemr-modal-launcher .modal-body {
                flex: 1;
                overflow: hidden;
            }
            .openemr-modal-launcher .close-btn {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
            }
            .openemr-modal-launcher .close-btn:hover {
                background: #f0f0f0;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(modal);

        return {
            success: true,
            action: 'launched_in_modal',
            modal: modal,
            url: options.openemrUrl
        };
    }

    /**
     * Launch embedded OpenEMR
     */
    async launchEmbedded(options) {
        // Find container or create one
        let container = document.getElementById('openemr-embed-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'openemr-embed-container';
            container.style.cssText = 'width: 100%; height: 600px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;';
            
            // Insert into main content area
            const mainContent = document.querySelector('.main-content .container');
            if (mainContent) {
                mainContent.appendChild(container);
            } else {
                document.body.appendChild(container);
            }
        }

        // Create iframe
        container.innerHTML = `
            <iframe src="${options.openemrUrl}" 
                    style="width: 100%; height: 100%; border: none;">
                OpenEMR is loading...
            </iframe>
        `;

        return {
            success: true,
            action: 'launched_embedded',
            container: container,
            url: options.openemrUrl
        };
    }

    /**
     * Launch with redirect
     */
    async launchRedirect(options) {
        window.location.href = options.openemrUrl;
        return {
            success: true,
            action: 'launched_redirect',
            url: options.openemrUrl
        };
    }

    // Utility methods

    getOpenEMRBaseUrl() {
        // Try to detect from environment or use default
        return process.env.OPENEMR_BASE_URL || 
               localStorage.getItem('openemr_base_url') || 
               'https://demo.openemr.io';
    }

    getRedirectUri() {
        const isGitHubPages = window.location.hostname.includes('github.io');
        const baseUrl = isGitHubPages ? 'https://webqx.github.io/webqx' : window.location.origin;
        return `${baseUrl}/provider/openemr-callback.html`;
    }

    async detectOpenEMRConfiguration() {
        try {
            // Try to get version and capabilities
            const response = await fetch(`${this.config.baseUrl}/apis/default/api/version`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                const versionInfo = await response.json();
                this.config.apiVersion = versionInfo.version || this.config.apiVersion;
                
                // Check for FHIR support
                const fhirResponse = await fetch(`${this.config.baseUrl}/apis/default/fhir/metadata`, {
                    method: 'GET',
                    headers: { 'Accept': 'application/fhir+json' }
                });

                if (fhirResponse.ok) {
                    this.config.fhirBaseUrl = `${this.config.baseUrl}/apis/default/fhir`;
                    console.log('✅ FHIR R4 support detected');
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not detect OpenEMR configuration:', error.message);
        }
    }

    async checkAuthenticationStatus() {
        if (this.tokens && !this.isTokenExpired()) {
            try {
                await this.fetchUserInfo();
                console.log('✅ Existing authentication valid');
                return true;
            } catch (error) {
                console.log('🔄 Existing tokens invalid, will re-authenticate');
                this.clearTokens();
                return false;
            }
        }
        return false;
    }

    async exchangeCodeForTokens(code, codeVerifier) {
        const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: this.config.redirectUri,
            client_id: this.config.clientId,
            code_verifier: codeVerifier
        });

        const response = await fetch(`${this.config.baseUrl}/oauth2/default/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: tokenParams
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token exchange failed: ${response.statusText} - ${errorText}`);
        }

        const tokenData = await response.json();
        
        return {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            tokenType: tokenData.token_type || 'Bearer',
            expiresIn: tokenData.expires_in,
            scope: tokenData.scope,
            idToken: tokenData.id_token,
            expiresAt: Date.now() + (tokenData.expires_in * 1000)
        };
    }

    async fetchUserInfo() {
        if (!this.tokens) {
            throw new Error('No access token available');
        }

        const response = await fetch(`${this.config.baseUrl}/oauth2/default/userinfo`, {
            headers: {
                'Authorization': `${this.tokens.tokenType} ${this.tokens.accessToken}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch user info: ${response.statusText}`);
        }

        this.userContext = await response.json();
        return this.userContext;
    }

    async validateFHIRAccess() {
        if (!this.config.fhirBaseUrl || !this.tokens) {
            return false;
        }

        try {
            const response = await fetch(`${this.config.fhirBaseUrl}/Patient`, {
                headers: {
                    'Authorization': `${this.tokens.tokenType} ${this.tokens.accessToken}`,
                    'Accept': 'application/fhir+json'
                }
            });

            if (response.ok) {
                console.log('✅ FHIR access validated');
                return true;
            }
        } catch (error) {
            console.warn('⚠️ FHIR access validation failed:', error.message);
        }
        return false;
    }

    buildOpenEMRLaunchUrl(launchContext) {
        const params = new URLSearchParams();
        
        // Add authentication token as parameter for direct access
        if (this.tokens?.accessToken) {
            params.append('access_token', this.tokens.accessToken);
        }
        
        // Add launch context parameters
        if (launchContext.patient) {
            params.append('patient', launchContext.patient);
        }
        
        if (launchContext.encounter) {
            params.append('encounter', launchContext.encounter);
        }
        
        if (launchContext.module) {
            params.append('module', launchContext.module);
        }

        const baseUrl = `${this.config.baseUrl}/interface/main/main_screen.php`;
        return params.toString() ? `${baseUrl}?${params}` : baseUrl;
    }

    // Token management
    loadStoredTokens() {
        const stored = localStorage.getItem('openemr_tokens');
        if (stored) {
            try {
                this.tokens = JSON.parse(stored);
            } catch (error) {
                console.warn('Failed to parse stored tokens');
                localStorage.removeItem('openemr_tokens');
            }
        }
    }

    storeTokens(tokens) {
        localStorage.setItem('openemr_tokens', JSON.stringify(tokens));
    }

    clearTokens() {
        this.tokens = null;
        localStorage.removeItem('openemr_tokens');
    }

    isTokenExpired() {
        if (!this.tokens?.expiresAt) {
            return true;
        }
        // Add 5 minute buffer
        return Date.now() > (this.tokens.expiresAt - 300000);
    }

    // Utility functions
    generateState() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    generateCodeVerifier() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return this.base64URLEncode(array);
    }

    async generateCodeChallenge(codeVerifier) {
        const encoder = new TextEncoder();
        const data = encoder.encode(codeVerifier);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return this.base64URLEncode(new Uint8Array(digest));
    }

    base64URLEncode(buffer) {
        return btoa(String.fromCharCode(...buffer))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    openAuthWindow(url) {
        const authWindow = window.open(
            url,
            'openemr_auth',
            'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        if (!authWindow) {
            throw new Error('Failed to open authentication window. Please disable popup blocker.');
        }

        // Monitor for completion
        const checkComplete = setInterval(() => {
            try {
                if (authWindow.closed) {
                    clearInterval(checkComplete);
                    console.log('🔐 Authentication window closed');
                }
                
                // Check if redirected to callback
                if (authWindow.location.href.includes('openemr-callback')) {
                    clearInterval(checkComplete);
                    authWindow.close();
                    // The callback page will handle the rest
                }
            } catch (error) {
                // Cross-origin access will throw errors, this is expected
            }
        }, 1000);

        return authWindow;
    }
}

// Global instance
window.openEMRLauncher = new OpenEMRLauncher();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.openEMRLauncher.initialize();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OpenEMRLauncher;
}
