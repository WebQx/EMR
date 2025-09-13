/**
 * WebQX Integration Initialization
 * Bootstraps the complete integration system
 */

(function() {
    'use strict';

    // Initialize core components
    const api = new APIGateway();
    const moduleRegistry = new ModuleRegistry();
    const dbConnector = new MariaDBConnector();
    const placementManager = new PlacementCardsManager(dbConnector);

    // Global WebQX object
    window.WebQX = {
        api,
        modules: moduleRegistry,
        db: dbConnector,
        cards: placementManager,
        user: null,
        
        async init() {
            console.log('🚀 Initializing WebQX Integration System...');
            
            try {
                // Check API health
                await this.checkHealth();
                
                // Initialize user session
                await this.initSession();
                
                // Load user-specific modules and cards
                await this.loadUserContent();
                
                // Setup event handlers
                this.setupEventHandlers();
                
                console.log('✅ WebQX Integration System ready');
                this.updateStatus('online');
                
            } catch (error) {
                console.error('❌ WebQX initialization failed:', error);
                this.updateStatus('offline');
            }
        },

        async checkHealth() {
            try {
                const health = await this.api.health();
                console.log('✅ API Health:', health.status);
                return health;
            } catch (error) {
                console.warn('⚠️ API health check failed, using offline mode');
                throw error;
            }
        },

        async initSession() {
            const token = localStorage.getItem('webqx_token');
            if (token) {
                try {
                    const userData = await this.api.request('/auth/me');
                    this.user = userData.user;
                    this.cards.setActiveUser(this.user);
                    console.log('✅ User session restored:', this.user.email);
                } catch (error) {
                    localStorage.removeItem('webqx_token');
                    console.log('ℹ️ No valid session found');
                }
            }
        },

        async loadUserContent() {
            if (this.user) {
                // Load user-specific placement cards
                await this.cards.loadCards(this.user.id);
                
                // Filter modules by user role
                this.filterModulesByRole();
                
                // Update UI with user data
                this.updateUserUI();
            } else {
                // Load default cards for anonymous users
                await this.cards.loadCards(null);
            }
        },

        filterModulesByRole() {
            const userRole = this.user?.role || 'patient';
            const availableModules = this.modules.getByRole(userRole);
            
            // Show/hide module cards based on access
            document.querySelectorAll('[data-module]').forEach(card => {
                const moduleId = card.dataset.module;
                const hasAccess = availableModules.some(m => m.id === moduleId);
                card.style.display = hasAccess ? 'block' : 'none';
            });
        },

        updateUserUI() {
            if (this.user) {
                // Update user name displays
                document.querySelectorAll('[data-user-name]').forEach(el => {
                    el.textContent = this.user.first_name || this.user.email;
                });
                
                // Update user role displays
                document.querySelectorAll('[data-user-role]').forEach(el => {
                    el.textContent = this.user.role || 'Patient';
                });
            }
        },

        setupEventHandlers() {
            // Module launch handler
            document.addEventListener('click', async (e) => {
                const moduleCard = e.target.closest('[data-module]');
                if (moduleCard) {
                    e.preventDefault();
                    const moduleId = moduleCard.dataset.module;
                    await this.launchModule(moduleId);
                }
            });

            // Card refresh handler
            document.addEventListener('click', async (e) => {
                if (e.target.matches('[data-refresh-card]')) {
                    const cardId = e.target.dataset.refreshCard;
                    await this.cards.refreshCardData(cardId);
                }
            });
        },

        async launchModule(moduleId) {
            try {
                // Log access
                if (this.user) {
                    await this.api.logModuleAccess(moduleId, this.user.id);
                }
                
                // Launch module
                await this.modules.launch(moduleId, this.user);
                
            } catch (error) {
                console.error(`Failed to launch module ${moduleId}:`, error);
                alert(`Cannot access ${moduleId}: ${error.message}`);
            }
        },

        updateStatus(status) {
            const indicator = document.getElementById('backendStatus');
            const text = document.getElementById('statusText');
            const button = document.getElementById('startBackend');
            
            if (indicator) {
                indicator.className = `status-indicator status-${status}`;
            }
            
            if (text) {
                text.textContent = status === 'online' 
                    ? 'WebQx Server: Online' 
                    : 'WebQx Server: Offline';
            }
            
            if (button) {
                button.style.display = status === 'online' ? 'none' : 'inline-block';
            }
        },

        // Public API methods
        async login(email, password) {
            const result = await this.api.login(email, password);
            this.user = result.user;
            this.cards.setActiveUser(this.user);
            await this.loadUserContent();
            return result;
        },

        async logout() {
            await this.api.logout();
            this.user = null;
            this.cards.setActiveUser(null);
            window.location.reload();
        }
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => WebQX.init());
    } else {
        WebQX.init();
    }

    // Legacy API compatibility
    window.webqxAPI = WebQX;
    window.moduleAPI = {
        openAppointments: () => WebQX.launchModule('patient-portal'),
        openMedicalRecords: () => WebQX.launchModule('patient-portal'),
        openPrescriptions: () => WebQX.launchModule('patient-portal'),
        openTelehealth: () => WebQX.launchModule('telehealth'),
        openMessages: () => WebQX.launchModule('patient-portal'),
        openProviderPortal: () => WebQX.launchModule('provider-portal'),
        openAdminConsole: () => WebQX.launchModule('admin-console'),
        openEMRSystem: () => WebQX.launchModule('emr-system')
    };

})();