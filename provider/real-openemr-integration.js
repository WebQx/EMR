/**
 * Real OpenEMR Integration for WebQX™
 * 
 * This integrates with actual OpenEMR instances and the OpenEMR GitHub repository
 * to provide real EHR functionality, not just demos.
 */

class RealOpenEMRIntegration {
    constructor() {
        console.log('🏥 Initializing Real OpenEMR Integration...');
        
        this.config = {
            // OpenEMR Demo Server (real instance)
            demoServer: 'https://demo.openemr.io',
            
            // OpenEMR API endpoints
            apiBase: '/apis/default',
            fhirBase: '/apis/default/fhir',
            
            // OpenEMR GitHub repository
            githubRepo: 'openemr/openemr',
            githubApiBase: 'https://api.github.com/repos/openemr/openemr',
            
            // Local OpenEMR instance (if available)
            localInstance: null,
            
            // Authentication
            clientId: 'webqx-integration',
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
            ]
        };
        
        this.authTokens = null;
        this.currentInstance = null;
        this.isConnected = false;
        
        this.initializeConnection();
    }

    async initializeConnection() {
        console.log('🔌 Establishing OpenEMR connection...');
        
        try {
            // Try to connect to OpenEMR demo server first
            await this.connectToOpenEMR(this.config.demoServer);
            
            // Check for local instances
            await this.detectLocalInstances();
            
            console.log('✅ OpenEMR connection established');
        } catch (error) {
            console.error('❌ Failed to establish OpenEMR connection:', error);
            // Fallback to GitHub integration
            await this.setupGitHubIntegration();
        }
    }

    async connectToOpenEMR(serverUrl) {
        console.log(`🔗 Connecting to OpenEMR at ${serverUrl}...`);
        
        try {
            // Test connection to OpenEMR server
            const versionResponse = await this.makeOpenEMRRequest(serverUrl + '/apis/default/api/version');
            
            if (versionResponse.ok) {
                const versionData = await versionResponse.json();
                console.log('✅ OpenEMR Version:', versionData);
                
                this.currentInstance = {
                    url: serverUrl,
                    version: versionData.version,
                    type: 'remote',
                    capabilities: await this.getCapabilities(serverUrl)
                };
                
                this.isConnected = true;
                return true;
            }
        } catch (error) {
            console.warn(`⚠️ Could not connect to ${serverUrl}:`, error.message);
            return false;
        }
    }

    async makeOpenEMRRequest(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...options.headers
            },
            mode: 'cors',
            ...options
        };

        // Add authentication if available
        if (this.authTokens?.access_token) {
            defaultOptions.headers['Authorization'] = `Bearer ${this.authTokens.access_token}`;
        }

        return fetch(url, defaultOptions);
    }

    async getCapabilities(serverUrl) {
        try {
            const capabilities = {
                fhir: false,
                api: false,
                version: null,
                modules: []
            };

            // Check FHIR capability
            try {
                const fhirResponse = await this.makeOpenEMRRequest(serverUrl + '/apis/default/fhir/metadata');
                if (fhirResponse.ok) {
                    capabilities.fhir = true;
                    const metadata = await fhirResponse.json();
                    capabilities.fhirVersion = metadata.fhirVersion;
                }
            } catch (e) {
                console.log('FHIR not available');
            }

            // Check API capability
            try {
                const apiResponse = await this.makeOpenEMRRequest(serverUrl + '/apis/default/api/patient');
                capabilities.api = apiResponse.ok;
            } catch (e) {
                console.log('API access limited');
            }

            return capabilities;
        } catch (error) {
            console.warn('Could not determine capabilities:', error);
            return { fhir: false, api: false };
        }
    }

    async detectLocalInstances() {
        console.log('🔍 Scanning for local OpenEMR instances...');
        
        const commonPorts = [80, 8080, 8000, 3000, 8888];
        const commonPaths = [
            'http://localhost',
            'http://127.0.0.1',
            'http://openemr.local',
            'http://emr.local'
        ];

        for (const basePath of commonPaths) {
            for (const port of commonPorts) {
                try {
                    const testUrl = `${basePath}:${port}`;
                    const connected = await this.connectToOpenEMR(testUrl);
                    if (connected) {
                        console.log(`✅ Found local OpenEMR at ${testUrl}`);
                        this.currentInstance.type = 'local';
                        return;
                    }
                } catch (error) {
                    // Continue scanning
                }
            }
        }
        
        console.log('ℹ️ No local OpenEMR instances detected');
    }

    async setupGitHubIntegration() {
        console.log('📦 Setting up OpenEMR GitHub integration...');
        
        try {
            // Get OpenEMR repository information
            const repoResponse = await fetch(this.config.githubApiBase);
            const repoData = await repoResponse.json();
            
            console.log('📊 OpenEMR Repository Info:', {
                stars: repoData.stargazers_count,
                forks: repoData.forks_count,
                version: repoData.default_branch,
                lastUpdate: repoData.updated_at
            });
            
            // Get latest releases
            const releasesResponse = await fetch(this.config.githubApiBase + '/releases');
            const releases = await releasesResponse.json();
            
            if (releases.length > 0) {
                console.log('🏷️ Latest OpenEMR Release:', releases[0].tag_name);
                this.latestVersion = releases[0];
            }
            
            this.githubIntegration = {
                repository: repoData,
                releases: releases,
                downloadUrl: repoData.clone_url
            };
            
        } catch (error) {
            console.error('❌ GitHub integration failed:', error);
        }
    }

    async launchOpenEMR(options = {}) {
        console.log('🚀 Launching real OpenEMR integration...', options);
        
        if (!this.isConnected && !this.githubIntegration) {
            throw new Error('No OpenEMR connection available. Please ensure OpenEMR is accessible.');
        }

        const launchMode = options.mode || 'embed';
        const module = options.module || 'dashboard';

        switch (launchMode) {
            case 'embed':
                return await this.launchEmbedded(module, options);
            case 'iframe':
                return await this.launchIframe(module, options);
            case 'window':
                return await this.launchWindow(module, options);
            case 'redirect':
                return await this.launchRedirect(module, options);
            default:
                return await this.launchEmbedded(module, options);
        }
    }

    async launchEmbedded(module, options) {
        console.log(`🔗 Launching embedded OpenEMR: ${module}`);
        
        if (!this.currentInstance) {
            return this.createOpenEMRSetupInterface();
        }

        const container = this.getOrCreateContainer(options.containerId || 'openemr-container');
        
        // Create embedded OpenEMR interface
        container.innerHTML = `
            <div class="openemr-embedded">
                <div class="openemr-header">
                    <div class="openemr-title">
                        <h3>🏥 OpenEMR ${this.formatModuleName(module)}</h3>
                        <span class="openemr-status">Connected to ${this.currentInstance.url}</span>
                    </div>
                    <div class="openemr-controls">
                        <button onclick="realOpenEMR.refreshModule('${module}')" class="btn-refresh">🔄 Refresh</button>
                        <button onclick="realOpenEMR.openInWindow('${module}')" class="btn-window">🪟 Open in Window</button>
                    </div>
                </div>
                <div class="openemr-content">
                    <iframe 
                        src="${this.buildModuleUrl(module)}" 
                        frameborder="0" 
                        style="width: 100%; height: 600px; border: none;"
                        onload="this.style.opacity = 1"
                        style="opacity: 0; transition: opacity 0.3s">
                    </iframe>
                </div>
                <div class="openemr-footer">
                    <span>OpenEMR v${this.currentInstance.version || 'Unknown'}</span>
                    <span>FHIR: ${this.currentInstance.capabilities.fhir ? '✅' : '❌'}</span>
                    <span>API: ${this.currentInstance.capabilities.api ? '✅' : '❌'}</span>
                </div>
            </div>
        `;

        this.addOpenEMRStyles();
        
        return {
            success: true,
            mode: 'embedded',
            module: module,
            container: container,
            instance: this.currentInstance
        };
    }

    async launchIframe(module, options) {
        console.log(`🖼️ Launching OpenEMR iframe: ${module}`);
        
        const container = this.getOrCreateContainer(options.containerId || 'openemr-iframe-container');
        
        container.innerHTML = `
            <div class="openemr-iframe-wrapper">
                <div class="iframe-header">
                    <h4>OpenEMR - ${this.formatModuleName(module)}</h4>
                    <button onclick="this.closest('.openemr-iframe-wrapper').remove()" class="close-btn">×</button>
                </div>
                <iframe 
                    src="${this.buildModuleUrl(module)}"
                    width="100%" 
                    height="800"
                    frameborder="0"
                    allow="fullscreen">
                </iframe>
            </div>
        `;

        return {
            success: true,
            mode: 'iframe',
            module: module,
            container: container
        };
    }

    async launchWindow(module, options) {
        console.log(`🪟 Launching OpenEMR window: ${module}`);
        
        const windowFeatures = 'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=yes';
        const openemrWindow = window.open(
            this.buildModuleUrl(module),
            `openemr_${module}`,
            windowFeatures
        );

        if (!openemrWindow) {
            throw new Error('Failed to open OpenEMR window. Please disable popup blocker.');
        }

        return {
            success: true,
            mode: 'window',
            module: module,
            window: openemrWindow,
            url: this.buildModuleUrl(module)
        };
    }

    async launchRedirect(module, options) {
        console.log(`↗️ Redirecting to OpenEMR: ${module}`);
        
        window.location.href = this.buildModuleUrl(module);
        
        return {
            success: true,
            mode: 'redirect',
            module: module,
            url: this.buildModuleUrl(module)
        };
    }

    buildModuleUrl(module) {
        if (!this.currentInstance) {
            // If no instance, provide setup guidance
            return 'data:text/html,<h1>OpenEMR Setup Required</h1><p>Please configure your OpenEMR instance.</p>';
        }

        const baseUrl = this.currentInstance.url;
        
        // OpenEMR module routing
        const moduleRoutes = {
            'dashboard': '/interface/main/main_screen.php',
            'patients': '/interface/patient_file/summary/summary_bottom.php',
            'calendar': '/interface/main/calendar/index.php',
            'messages': '/interface/main/messages/messages.php',
            'reports': '/interface/reports/index.php',
            'administration': '/interface/usergroup/admin.php',
            'patient_search': '/interface/main/finder/dynamic_finder.php',
            'appointments': '/interface/main/calendar/index.php',
            'clinical_data': '/interface/patient_file/summary/summary_bottom.php',
            'billing': '/interface/billing/billing_index.php',
            'procedures': '/interface/orders/orders_index.php',
            'prescriptions': '/interface/drugs/drugs_index.php'
        };

        const modulePath = moduleRoutes[module] || moduleRoutes['dashboard'];
        return `${baseUrl}${modulePath}`;
    }

    formatModuleName(module) {
        const names = {
            'dashboard': 'Dashboard',
            'patients': 'Patient Management',
            'calendar': 'Calendar',
            'appointments': 'Appointments',
            'clinical_data': 'Clinical Data',
            'patient_search': 'Patient Search',
            'messages': 'Messages',
            'reports': 'Reports',
            'administration': 'Administration',
            'billing': 'Billing',
            'procedures': 'Procedures',
            'prescriptions': 'Prescriptions'
        };
        
        return names[module] || module.charAt(0).toUpperCase() + module.slice(1);
    }

    getOrCreateContainer(containerId) {
        let container = document.getElementById(containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.className = 'openemr-integration-container';
            
            // Try to find a good place to insert it
            const mainContent = document.querySelector('.main-content, .container, main, #main');
            if (mainContent) {
                mainContent.appendChild(container);
            } else {
                document.body.appendChild(container);
            }
        }
        return container;
    }

    createOpenEMRSetupInterface() {
        console.log('⚙️ Creating OpenEMR setup interface...');
        
        const container = this.getOrCreateContainer('openemr-setup');
        
        container.innerHTML = `
            <div class="openemr-setup">
                <div class="setup-header">
                    <h2>🏥 OpenEMR Integration Setup</h2>
                    <p>Connect to your OpenEMR instance or set up a new one</p>
                </div>
                
                <div class="setup-options">
                    <div class="setup-option">
                        <h3>🌐 Connect to Existing OpenEMR</h3>
                        <p>Connect to an existing OpenEMR installation</p>
                        <input type="url" id="openemr-url" placeholder="https://your-openemr-server.com" class="url-input">
                        <button onclick="realOpenEMR.connectToCustomServer()" class="btn-connect">Connect</button>
                    </div>
                    
                    <div class="setup-option">
                        <h3>🎭 Use OpenEMR Demo Server</h3>
                        <p>Connect to the official OpenEMR demo server</p>
                        <button onclick="realOpenEMR.connectToDemo()" class="btn-demo">Connect to Demo</button>
                    </div>
                    
                    <div class="setup-option">
                        <h3>📦 Download OpenEMR</h3>
                        <p>Get the latest OpenEMR release from GitHub</p>
                        <div class="github-info">
                            <p><strong>Latest Version:</strong> ${this.latestVersion?.tag_name || 'Loading...'}</p>
                            <p><strong>Repository:</strong> openemr/openemr</p>
                        </div>
                        <button onclick="realOpenEMR.downloadOpenEMR()" class="btn-download">Download Latest Release</button>
                        <button onclick="realOpenEMR.viewInstallGuide()" class="btn-guide">Installation Guide</button>
                    </div>
                    
                    <div class="setup-option">
                        <h3>🐳 Docker Setup</h3>
                        <p>Quick setup using Docker (recommended for development)</p>
                        <div class="docker-commands">
                            <code>docker run --name openemr -d -p 80:80 -p 443:443 openemr/openemr</code>
                        </div>
                        <button onclick="realOpenEMR.copyDockerCommand()" class="btn-copy">Copy Command</button>
                        <button onclick="realOpenEMR.checkDockerInstance()" class="btn-check">Check Local Docker</button>
                    </div>
                </div>
                
                <div class="setup-status">
                    <div id="setup-messages"></div>
                </div>
            </div>
        `;
        
        this.addSetupStyles();
        
        return {
            success: true,
            mode: 'setup',
            container: container
        };
    }

    async connectToCustomServer() {
        const urlInput = document.getElementById('openemr-url');
        const serverUrl = urlInput.value.trim();
        
        if (!serverUrl) {
            this.showSetupMessage('Please enter a valid OpenEMR server URL', 'error');
            return;
        }
        
        this.showSetupMessage('Connecting to OpenEMR server...', 'info');
        
        try {
            const connected = await this.connectToOpenEMR(serverUrl);
            if (connected) {
                this.showSetupMessage('✅ Successfully connected to OpenEMR!', 'success');
                setTimeout(() => {
                    this.launchOpenEMR({ mode: 'embed', module: 'dashboard' });
                }, 1000);
            } else {
                this.showSetupMessage('❌ Could not connect to OpenEMR server. Please check the URL and try again.', 'error');
            }
        } catch (error) {
            this.showSetupMessage(`❌ Connection failed: ${error.message}`, 'error');
        }
    }

    async connectToDemo() {
        this.showSetupMessage('Connecting to OpenEMR demo server...', 'info');
        
        try {
            const connected = await this.connectToOpenEMR(this.config.demoServer);
            if (connected) {
                this.showSetupMessage('✅ Connected to OpenEMR demo server!', 'success');
                setTimeout(() => {
                    this.launchOpenEMR({ mode: 'embed', module: 'dashboard' });
                }, 1000);
            } else {
                this.showSetupMessage('❌ Demo server is currently unavailable.', 'error');
            }
        } catch (error) {
            this.showSetupMessage(`❌ Demo connection failed: ${error.message}`, 'error');
        }
    }

    downloadOpenEMR() {
        if (this.latestVersion) {
            window.open(this.latestVersion.html_url, '_blank');
            this.showSetupMessage('Opening GitHub release page...', 'info');
        } else {
            window.open('https://github.com/openemr/openemr/releases', '_blank');
        }
    }

    viewInstallGuide() {
        window.open('https://github.com/openemr/openemr/blob/master/INSTALL', '_blank');
    }

    copyDockerCommand() {
        const command = 'docker run --name openemr -d -p 80:80 -p 443:443 openemr/openemr';
        navigator.clipboard.writeText(command).then(() => {
            this.showSetupMessage('✅ Docker command copied to clipboard!', 'success');
        });
    }

    async checkDockerInstance() {
        this.showSetupMessage('Checking for local Docker OpenEMR instance...', 'info');
        
        // Try common Docker OpenEMR URLs
        const dockerUrls = [
            'http://localhost',
            'http://localhost:80',
            'http://127.0.0.1'
        ];
        
        for (const url of dockerUrls) {
            try {
                const connected = await this.connectToOpenEMR(url);
                if (connected) {
                    this.showSetupMessage(`✅ Found Docker OpenEMR at ${url}!`, 'success');
                    return;
                }
            } catch (error) {
                // Continue checking
            }
        }
        
        this.showSetupMessage('No local Docker OpenEMR instance found. Make sure Docker is running and OpenEMR is started.', 'warning');
    }

    showSetupMessage(message, type = 'info') {
        const messagesContainer = document.getElementById('setup-messages');
        if (messagesContainer) {
            const messageElement = document.createElement('div');
            messageElement.className = `setup-message ${type}`;
            messageElement.textContent = message;
            messagesContainer.appendChild(messageElement);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                messageElement.remove();
            }, 5000);
        }
        console.log(`[OpenEMR Setup] ${message}`);
    }

    refreshModule(module) {
        console.log(`🔄 Refreshing OpenEMR module: ${module}`);
        const iframe = document.querySelector('.openemr-embedded iframe');
        if (iframe) {
            iframe.src = iframe.src; // Force reload
        }
    }

    openInWindow(module) {
        this.launchWindow(module);
    }

    addOpenEMRStyles() {
        if (!document.getElementById('openemr-styles')) {
            const style = document.createElement('style');
            style.id = 'openemr-styles';
            style.textContent = `
                .openemr-embedded {
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    margin: 20px 0;
                }
                
                .openemr-header {
                    background: linear-gradient(135deg, #2563eb, #1d4ed8);
                    color: white;
                    padding: 16px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .openemr-title h3 {
                    margin: 0;
                    font-size: 18px;
                }
                
                .openemr-status {
                    font-size: 12px;
                    opacity: 0.8;
                }
                
                .openemr-controls {
                    display: flex;
                    gap: 8px;
                }
                
                .btn-refresh, .btn-window {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }
                
                .btn-refresh:hover, .btn-window:hover {
                    background: rgba(255,255,255,0.3);
                }
                
                .openemr-content {
                    position: relative;
                    min-height: 600px;
                }
                
                .openemr-footer {
                    background: #f8f9fa;
                    padding: 8px 20px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    color: #666;
                }
                
                .openemr-iframe-wrapper {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    overflow: hidden;
                    margin: 20px 0;
                }
                
                .iframe-header {
                    background: #f8f9fa;
                    padding: 12px 16px;
                    border-bottom: 1px solid #ddd;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #666;
                }
                
                .close-btn:hover {
                    color: #333;
                }
            `;
            document.head.appendChild(style);
        }
    }

    addSetupStyles() {
        if (!document.getElementById('openemr-setup-styles')) {
            const style = document.createElement('style');
            style.id = 'openemr-setup-styles';
            style.textContent = `
                .openemr-setup {
                    background: white;
                    border-radius: 12px;
                    padding: 30px;
                    margin: 20px 0;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    max-width: 800px;
                    margin: 20px auto;
                }
                
                .setup-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .setup-header h2 {
                    color: #1d4ed8;
                    margin-bottom: 8px;
                }
                
                .setup-options {
                    display: grid;
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .setup-option {
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 20px;
                }
                
                .setup-option h3 {
                    color: #374151;
                    margin-bottom: 8px;
                }
                
                .setup-option p {
                    color: #6b7280;
                    margin-bottom: 16px;
                }
                
                .url-input {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 4px;
                    margin-bottom: 12px;
                }
                
                .btn-connect, .btn-demo, .btn-download, .btn-guide, .btn-copy, .btn-check {
                    background: #2563eb;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-right: 8px;
                    margin-bottom: 8px;
                }
                
                .btn-connect:hover, .btn-demo:hover, .btn-download:hover, .btn-guide:hover, .btn-copy:hover, .btn-check:hover {
                    background: #1d4ed8;
                }
                
                .github-info {
                    background: #f8f9fa;
                    padding: 12px;
                    border-radius: 4px;
                    margin: 12px 0;
                    font-size: 14px;
                }
                
                .docker-commands {
                    background: #1f2937;
                    color: #f9fafb;
                    padding: 12px;
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 12px;
                    margin: 12px 0;
                    overflow-x: auto;
                }
                
                .setup-message {
                    padding: 8px 12px;
                    border-radius: 4px;
                    margin: 8px 0;
                }
                
                .setup-message.success {
                    background: #dcfce7;
                    color: #166534;
                    border: 1px solid #bbf7d0;
                }
                
                .setup-message.error {
                    background: #fef2f2;
                    color: #dc2626;
                    border: 1px solid #fecaca;
                }
                
                .setup-message.warning {
                    background: #fffbeb;
                    color: #d97706;
                    border: 1px solid #fed7aa;
                }
                
                .setup-message.info {
                    background: #eff6ff;
                    color: #2563eb;
                    border: 1px solid #dbeafe;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Initialize the real OpenEMR integration
window.realOpenEMR = new RealOpenEMRIntegration();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealOpenEMRIntegration;
}
