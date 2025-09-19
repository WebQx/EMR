/**
 * WebQX GitHub Pages Integration Patch
 * Connects homepage with all modules and placement cards via MariaDB
 */

class WebQXIntegration {
    constructor() {
        // Resolve API base from runtime config; on GitHub Pages, relative requests are rewritten by pages-spa-api-proxy.js
        const cfg = (window.WEBQX_CONFIG && window.WEBQX_CONFIG.getConfig && window.WEBQX_CONFIG.getConfig()) || {};
        this.apiBaseUrl = (cfg.api_base ? cfg.api_base.replace(/\/$/, '') : '') + '/api/v1';
        this.localApiUrl = '';
        this.modules = new Map();
        this.placementCards = new Map();
        this.authToken = null;
        this.currentUser = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 WebQX Integration System initializing...');
        
        // Initialize module registry
        this.registerModules();
        
        // Initialize placement cards
        this.initializePlacementCards();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check backend connectivity
        await this.checkBackendStatus();
        
        // Initialize user session
        await this.initializeSession();
        
        console.log('✅ WebQX Integration System ready');
    }

    registerModules() {
        // Patient Portal Modules
        this.modules.set('patient-portal', {
            name: 'Patient Portal',
            url: './patient-portal/',
            icon: '👤',
            status: 'active',
            database: 'webqx_patient_data',
            tables: ['appointments', 'medical_records', 'prescriptions', 'messages']
        });

        // Provider Portal Modules
        this.modules.set('provider-portal', {
            name: 'Provider Portal',
            url: './provider/',
            icon: '👨⚕️',
            status: 'active',
            database: 'webqx_provider_data',
            tables: ['patients', 'schedules', 'clinical_notes', 'prescriptions']
        });

        // Admin Console Modules
        this.modules.set('admin-console', {
            name: 'Admin Console',
            url: './admin-console/',
            icon: '⚙️',
            status: 'active',
            database: 'webqx_admin_data',
            tables: ['users', 'system_logs', 'configurations', 'audit_trails']
        });

        // Telehealth Module
        this.modules.set('telehealth', {
            name: 'Telehealth',
            url: './telehealth.html',
            icon: '📹',
            status: 'active',
            database: 'webqx_telehealth_data',
            tables: ['sessions', 'recordings', 'participants', 'chat_messages']
        });

        // EMR System Module
        this.modules.set('emr-system', {
            name: 'EMR System',
            url: './webqx-emr-system/',
            icon: '🏥',
            status: 'active',
            database: 'openemr',
            tables: ['patients', 'encounters', 'forms', 'prescriptions']
        });
    }

    initializePlacementCards() {
        // Patient Portal Cards
        this.placementCards.set('patient-appointments', {
            title: 'Appointments',
            icon: '📅',
            module: 'patient-portal',
            action: 'openAppointments',
            data: { count: 2, next: 'Dr. Smith - Tomorrow 2:00 PM' }
        });

        this.placementCards.set('patient-records', {
            title: 'Medical Records',
            icon: '📋',
            module: 'patient-portal',
            action: 'openMedicalRecords',
            data: { newResults: 2, totalRecords: 45 }
        });

        this.placementCards.set('patient-prescriptions', {
            title: 'Prescriptions',
            icon: '💊',
            module: 'patient-portal',
            action: 'openPrescriptions',
            data: { active: 3, readyForPickup: 1 }
        });

        // Provider Portal Cards
        this.placementCards.set('provider-patients', {
            title: 'Patient Management',
            icon: '👥',
            module: 'provider-portal',
            action: 'openPatients',
            data: { totalPatients: 156, todayAppointments: 8 }
        });

        this.placementCards.set('provider-schedule', {
            title: 'Schedule',
            icon: '📅',
            module: 'provider-portal',
            action: 'openSchedule',
            data: { todaySlots: 8, availableSlots: 3 }
        });

        // Admin Console Cards
        this.placementCards.set('admin-users', {
            title: 'User Management',
            icon: '👤',
            module: 'admin-console',
            action: 'openUserManagement',
            data: { totalUsers: 1247, activeUsers: 892 }
        });

        this.placementCards.set('admin-system', {
            title: 'System Status',
            icon: '⚙️',
            module: 'admin-console',
            action: 'openSystemStatus',
            data: { uptime: '99.9%', activeServers: 4 }
        });

        // Telehealth Cards
        this.placementCards.set('telehealth-sessions', {
            title: 'Video Sessions',
            icon: '📹',
            module: 'telehealth',
            action: 'openTelehealth',
            data: { activeSessions: 12, scheduledToday: 25 }
        });
    }

    setupEventListeners() {
        // Module card click handlers
        document.addEventListener('click', (e) => {
            const moduleCard = e.target.closest('[data-module]');
            if (moduleCard) {
                const moduleId = moduleCard.dataset.module;
                this.openModule(moduleId);
            }
        });

        // Backend status check
        document.getElementById('startBackend')?.addEventListener('click', () => {
            this.startBackendServices();
        });

        // Auto-refresh status every 30 seconds
        setInterval(() => {
            this.checkBackendStatus();
        }, 30000);
    }

    async checkBackendStatus() {
        const statusIndicator = document.getElementById('backendStatus');
        const statusText = document.getElementById('statusText');
        const startButton = document.getElementById('startBackend');

        try {
            // Try relative /health first; on GitHub Pages this will be rewritten to the configured backend by pages-spa-api-proxy.js
            const response = await fetch(`/health`, { method: 'GET' });
            if (!response.ok) throw new Error('Server not responding');
            const data = await response.json();
            statusIndicator?.classList.remove('status-offline');
            statusIndicator?.classList.add('status-online');
            if (statusText) statusText.textContent = `WebQx Server: Online (${data.version || 'v1.0'})`;
            if (startButton) startButton.style.display = 'none';
            // Update module status
            await this.updateModuleStatus();
        } catch (error) {
            // Mark offline; relative /health will be the single source of truth on Pages
            statusIndicator?.classList.remove('status-online');
            statusIndicator?.classList.add('status-offline');
            if (statusText) statusText.textContent = 'WebQx Server: Offline';
            if (startButton) startButton.style.display = 'inline-block';
        }
    }

    async updateModuleStatus() {
        // Always derive a baseline from /health to avoid noisy 404s
        await this.updateModuleStatusFromHealth();
        // Optionally refine using /api/v1/modules/status when explicitly enabled
        const tryModulesStatus = (window && window.WEBQX_TRY_MODULE_STATUS === true);
        if (!tryModulesStatus) return;
        try {
            const response = await fetch(`${this.getApiUrl()}/modules/status`, { method: 'GET' });
            if (response.ok) {
                const moduleStatuses = await response.json();
                this.applyModuleStatuses(moduleStatuses);
            }
        } catch (_) {
            // Silent: health-based status remains
        }
    }

    applyModuleStatuses(moduleStatuses) {
        if (!Array.isArray(moduleStatuses)) return;
        moduleStatuses.forEach(module => {
            const card = document.querySelector(`[data-module="${module.id}"]`);
            if (card) {
                const statusElement = card.querySelector('.module-status');
                if (statusElement) {
                    statusElement.textContent = module.status;
                    statusElement.className = `module-status status-${module.status}`;
                }
            }
        });
    }

    async updateModuleStatusFromHealth() {
        try {
            const r = await fetch(`/health`);
            if (!r.ok) return;
            const h = await r.json();
            const statuses = [
                { id: 'patient-portal', status: 'active' },
                { id: 'provider-portal', status: 'active' },
                { id: 'admin-console', status: 'active' },
                { id: 'telehealth', status: h?.services?.telehealth ? 'active' : 'degraded' },
                { id: 'emr-system', status: h?.services?.openemr ? 'active' : 'degraded' }
            ];
            this.applyModuleStatuses(statuses);
        } catch (_) {
            // noop
        }
    }

    async initializeSession() {
        // Check for existing session
        const token = localStorage.getItem('webqx_token');
        if (token) {
            try {
                const response = await fetch(`${this.getApiUrl()}/auth/verify`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const userData = await response.json();
                    this.authToken = token;
                    this.currentUser = userData.user;
                    this.updateUIForUser();
                }
            } catch (error) {
                localStorage.removeItem('webqx_token');
            }
        }
    }

    updateUIForUser() {
        if (this.currentUser) {
            // Update user-specific content
            const userElements = document.querySelectorAll('[data-user-content]');
            userElements.forEach(element => {
                const contentType = element.dataset.userContent;
                switch (contentType) {
                    case 'name':
                        element.textContent = this.currentUser.name || 'User';
                        break;
                    case 'role':
                        element.textContent = this.currentUser.role || 'Patient';
                        break;
                }
            });

            // Show/hide modules based on user role
            this.filterModulesByRole();
        }
    }

    filterModulesByRole() {
        const userRole = this.currentUser?.role || 'patient';
        const moduleCards = document.querySelectorAll('[data-module]');
        
        moduleCards.forEach(card => {
            const moduleId = card.dataset.module;
            const module = this.modules.get(moduleId);
            
            if (module) {
                const hasAccess = this.checkModuleAccess(moduleId, userRole);
                card.style.display = hasAccess ? 'block' : 'none';
            }
        });
    }

    checkModuleAccess(moduleId, userRole) {
        const accessRules = {
            'patient-portal': ['patient', 'admin'],
            'provider-portal': ['provider', 'physician', 'nurse', 'admin'],
            'admin-console': ['admin', 'administrator'],
            'telehealth': ['patient', 'provider', 'physician', 'nurse', 'admin'],
            'emr-system': ['provider', 'physician', 'nurse', 'admin']
        };

        return accessRules[moduleId]?.includes(userRole.toLowerCase()) || false;
    }

    async openModule(moduleId) {
        const module = this.modules.get(moduleId);
        if (!module) {
            console.error(`Module ${moduleId} not found`);
            return;
        }

        // Log module access
        await this.logModuleAccess(moduleId);

        // Check if user has access
        if (this.currentUser && !this.checkModuleAccess(moduleId, this.currentUser.role)) {
            alert('Access denied. You do not have permission to access this module.');
            return;
        }

        // Open module
        if (module.url.startsWith('http')) {
            window.open(module.url, '_blank');
        } else {
            window.location.href = module.url;
        }
    }

    async logModuleAccess(moduleId) {
        try {
            await fetch(`${this.getApiUrl()}/analytics/module-access`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.authToken ? `Bearer ${this.authToken}` : ''
                },
                body: JSON.stringify({
                    module_id: moduleId,
                    user_id: this.currentUser?.id,
                    timestamp: new Date().toISOString(),
                    source: 'github-pages'
                })
            });
        } catch (error) {
            console.warn('Could not log module access:', error);
        }
    }

    async startBackendServices() {
        const startButton = document.getElementById('startBackend');
        const statusText = document.getElementById('statusText');
        
        if (startButton) startButton.textContent = 'Starting...';
        if (statusText) statusText.textContent = 'WebQx Server: Starting services...';

        try {
            // Attempt to start local services
            const response = await fetch(`${this.localApiUrl}/system/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ services: ['api', 'database', 'telehealth'] })
            });

            if (response.ok) {
                if (statusText) statusText.textContent = 'WebQx Server: Services starting...';
                
                // Wait for services to be ready
                setTimeout(() => {
                    this.checkBackendStatus();
                }, 5000);
            } else {
                throw new Error('Failed to start services');
            }
        } catch (error) {
            if (statusText) statusText.textContent = 'WebQx Server: Failed to start';
            if (startButton) {
                startButton.textContent = 'Start WebQx Server';
                startButton.style.display = 'inline-block';
            }
            console.error('Failed to start backend services:', error);
        }
    }

    getApiUrl() {
        return this.authToken ? this.localApiUrl : this.apiBaseUrl;
    }

    // Database Integration Methods
    async queryDatabase(query, params = []) {
        try {
            const response = await fetch(`${this.getApiUrl()}/database/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.authToken ? `Bearer ${this.authToken}` : ''
                },
                body: JSON.stringify({ query, params })
            });

            if (response.ok) {
                return await response.json();
            } else {
                throw new Error(`Database query failed: ${response.status}`);
            }
        } catch (error) {
            console.error('Database query error:', error);
            return null;
        }
    }

    async getPlacementCardData(cardId) {
        const card = this.placementCards.get(cardId);
        if (!card) return null;

        try {
            // Query database for real-time data
            const response = await fetch(`${this.getApiUrl()}/placement-cards/${cardId}/data`, {
                headers: {
                    'Authorization': this.authToken ? `Bearer ${this.authToken}` : ''
                }
            });

            if (response.ok) {
                const data = await response.json();
                return { ...card, data };
            } else {
                return card; // Return static data if API fails
            }
        } catch (error) {
            console.warn(`Could not fetch data for card ${cardId}:`, error);
            return card; // Return static data if API fails
        }
    }

    async updatePlacementCard(cardId, element) {
        const cardData = await this.getPlacementCardData(cardId);
        if (!cardData || !element) return;

        // Update card content with real-time data
        const titleElement = element.querySelector('.card-title');
        const dataElement = element.querySelector('.card-data');
        const statusElement = element.querySelector('.card-status');

        if (titleElement) titleElement.textContent = cardData.title;
        if (dataElement && cardData.data) {
            // Format data based on card type
            let dataText = '';
            switch (cardId) {
                case 'patient-appointments':
                    dataText = `${cardData.data.count} upcoming, Next: ${cardData.data.next}`;
                    break;
                case 'patient-records':
                    dataText = `${cardData.data.newResults} new results, ${cardData.data.totalRecords} total`;
                    break;
                case 'patient-prescriptions':
                    dataText = `${cardData.data.active} active, ${cardData.data.readyForPickup} ready`;
                    break;
                default:
                    dataText = JSON.stringify(cardData.data);
            }
            dataElement.textContent = dataText;
        }
        if (statusElement) statusElement.textContent = '✓ Available';
    }

    // Public API for modules
    getModuleAPI() {
        return {
            openModule: (moduleId) => this.openModule(moduleId),
            getPlacementCardData: (cardId) => this.getPlacementCardData(cardId),
            queryDatabase: (query, params) => this.queryDatabase(query, params),
            getCurrentUser: () => this.currentUser,
            isAuthenticated: () => !!this.authToken
        };
    }
}

// Initialize WebQX Integration System
const webqxIntegration = new WebQXIntegration();

// Expose API globally for modules
window.webqxAPI = webqxIntegration.getModuleAPI();

// Module-specific APIs
window.moduleAPI = {
    openAppointments: () => webqxIntegration.openModule('patient-portal'),
    openMedicalRecords: () => webqxIntegration.openModule('patient-portal'),
    openPrescriptions: () => webqxIntegration.openModule('patient-portal'),
    openTelehealth: () => webqxIntegration.openModule('telehealth'),
    openMessages: () => webqxIntegration.openModule('patient-portal'),
    openProviderPortal: () => webqxIntegration.openModule('provider-portal'),
    openAdminConsole: () => webqxIntegration.openModule('admin-console'),
    openEMRSystem: () => webqxIntegration.openModule('emr-system')
};

console.log('🎯 WebQX GitHub Pages Integration loaded successfully');