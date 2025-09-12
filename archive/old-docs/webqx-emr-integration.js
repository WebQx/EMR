/**
 * WebQX EMR Integration JavaScript
 * Connects GitHub Pages modules to real OpenEMR 7.0.3 server
 */

// EMR Server Configuration
const EMR_CONFIG = {
    // External Codespace URLs (accessible from GitHub Pages)
    EMR_BASE: 'https://fuzzy-goldfish-7vx645x7wgvv3rjxg-8085.app.github.dev',
    API_BASE: 'https://fuzzy-goldfish-7vx645x7wgvv3rjxg-8080.app.github.dev',
    
    endpoints: {
        // EMR API endpoints
        emr_status: '/webqx-api.php?action=status',
        emr_health: '/webqx-api.php?action=health',
        community_stats: '/webqx-api.php?action=community-stats',
        emr_sync: '/webqx-api.php?action=sync',
        
        // Remote control endpoints
        server_status: '/api/server-status',
        remote_start: '/api/remote-start',
        
        // OpenEMR direct endpoints
        emr_login: '/interface/login/login.php',
        patient_portal: '/portal/index.php',
        provider_interface: '/interface/main/main.php',
        admin_console: '/interface/super/rules.php'
    }
};

// Backend Status Management
class WebQXBackend {
    constructor() {
        this.isConnected = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.statusElement = document.getElementById('backendStatus');
        this.statusText = document.getElementById('statusText');
        this.startButton = document.getElementById('startBackend');
        
        this.init();
    }
    
    init() {
        console.log('🔄 Initializing WebQX Backend Connection...');
        this.checkBackendStatus();
        
        // Set up auto-refresh every 30 seconds
        setInterval(() => this.checkBackendStatus(), 30000);
        
        // Set up start button
        if (this.startButton) {
            this.startButton.onclick = () => this.startBackend();
        }
    }
    
    async checkBackendStatus() {
        try {
            console.log('🔍 Checking EMR server status...');
            
            // Test EMR server
            const emrResponse = await fetch(`${EMR_CONFIG.EMR_BASE}${EMR_CONFIG.endpoints.emr_status}`, {
                method: 'GET',
                mode: 'cors'
            });
            
            if (emrResponse.ok) {
                const emrData = await emrResponse.json();
                console.log('✅ EMR Server connected:', emrData);
                this.updateStatus(true, `WebQX EMR ${emrData.version} - ${emrData.status}`);
                this.isConnected = true;
                this.retryCount = 0;
                
                // Hide start button when connected
                if (this.startButton) {
                    this.startButton.style.display = 'none';
                }
                
                // Update community stats
                this.updateCommunityStats();
                
            } else {
                throw new Error('EMR server not responding');
            }
            
        } catch (error) {
            console.log('❌ Backend connection failed:', error.message);
            this.handleConnectionError();
        }
    }
    
    handleConnectionError() {
        this.isConnected = false;
        this.retryCount++;
        
        if (this.retryCount < this.maxRetries) {
            this.updateStatus(false, `WebQx Server: Retrying connection... (${this.retryCount}/${this.maxRetries})`);
            // Show start button
            if (this.startButton) {
                this.startButton.style.display = 'inline-block';
            }
        } else {
            this.updateStatus(false, 'WebQx Server: Connection failed - Click Start to retry');
            if (this.startButton) {
                this.startButton.style.display = 'inline-block';
            }
        }
    }
    
    updateStatus(isOnline, message) {
        if (this.statusElement) {
            this.statusElement.className = `status-indicator ${isOnline ? 'status-online' : 'status-offline'}`;
        }
        
        if (this.statusText) {
            this.statusText.textContent = message;
        }
    }
    
    async startBackend() {
        try {
            console.log('🚀 Starting WebQX backend services...');
            this.updateStatus(false, 'WebQx Server: Starting...');
            
            if (this.startButton) {
                this.startButton.disabled = true;
                this.startButton.textContent = 'Starting...';
            }
            
            // Try to start via remote API
            const response = await fetch(`${EMR_CONFIG.API_BASE}${EMR_CONFIG.endpoints.remote_start}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    service: 'webqx-emr',
                    action: 'start'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Start command sent:', data);
                
                // Wait a moment then check status
                setTimeout(() => {
                    this.retryCount = 0;
                    this.checkBackendStatus();
                }, 2000);
                
            } else {
                throw new Error('Failed to start backend');
            }
            
        } catch (error) {
            console.error('❌ Failed to start backend:', error);
            this.updateStatus(false, 'WebQx Server: Failed to start');
        } finally {
            if (this.startButton) {
                this.startButton.disabled = false;
                this.startButton.textContent = 'Start WebQx Server';
            }
        }
    }
    
    async updateCommunityStats() {
        try {
            const response = await fetch(`${EMR_CONFIG.EMR_BASE}${EMR_CONFIG.endpoints.community_stats}`);
            if (response.ok) {
                const stats = await response.json();
                console.log('📊 Community stats updated:', stats);
                
                // Update any community stats displays on the page
                this.displayCommunityStats(stats);
            }
        } catch (error) {
            console.log('⚠️ Could not fetch community stats:', error.message);
        }
    }
    
    displayCommunityStats(stats) {
        // Update stats displays if they exist on the page
        const statsElements = {
            'underserved-patients': stats.underserved_patients,
            'free-services': stats.free_services_provided,
            'mobile-clinic-visits': stats.mobile_clinic_visits,
            'telemedicine-consults': stats.telemedicine_consults
        };
        
        Object.entries(statsElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value.toLocaleString();
            }
        });
    }
    
    // Module Integration Methods
    openPatientPortal() {
        const url = `${EMR_CONFIG.EMR_BASE}${EMR_CONFIG.endpoints.patient_portal}`;
        window.open(url, '_blank');
    }
    
    openProviderInterface() {
        const url = `${EMR_CONFIG.EMR_BASE}${EMR_CONFIG.endpoints.provider_interface}`;
        window.open(url, '_blank');
    }
    
    openAdminConsole() {
        const url = `${EMR_CONFIG.EMR_BASE}${EMR_CONFIG.endpoints.admin_console}`;
        window.open(url, '_blank');
    }
    
    openEMRLogin() {
        const url = `${EMR_CONFIG.EMR_BASE}${EMR_CONFIG.endpoints.emr_login}`;
        window.open(url, '_blank');
    }
}

// Module API for GitHub Pages integration
window.moduleAPI = {
    // Patient Portal functions
    openAppointments() {
        window.open(`${EMR_CONFIG.EMR_BASE}/interface/main/calendar/index.php`, '_blank');
    },
    
    openMedicalRecords() {
        window.open(`${EMR_CONFIG.EMR_BASE}/interface/patient_file/summary/demographics.php`, '_blank');
    },
    
    openPrescriptions() {
        window.open(`${EMR_CONFIG.EMR_BASE}/interface/drugs/dispense_drug.php`, '_blank');
    },
    
    openBilling() {
        window.open(`${EMR_CONFIG.EMR_BASE}/interface/billing/billing_report.php`, '_blank');
    },
    
    // Provider Portal functions
    openPatientList() {
        window.open(`${EMR_CONFIG.EMR_BASE}/interface/main/finder/patient_select.php`, '_blank');
    },
    
    openClinicalNotes() {
        window.open(`${EMR_CONFIG.EMR_BASE}/interface/forms/SOAP/new.php`, '_blank');
    },
    
    openLabResults() {
        window.open(`${EMR_CONFIG.EMR_BASE}/interface/orders/orders_results.php`, '_blank');
    },
    
    // Admin functions
    openUserManagement() {
        window.open(`${EMR_CONFIG.EMR_BASE}/interface/usergroup/usergroup_admin.php`, '_blank');
    },
    
    openSystemSettings() {
        window.open(`${EMR_CONFIG.EMR_BASE}/interface/super/edit_globals.php`, '_blank');
    },
    
    // Community Health functions
    openCommunityHealth() {
        window.open(`${EMR_CONFIG.EMR_BASE}/webqx-api.php?action=community-stats`, '_blank');
    },
    
    openMobileClinic() {
        window.open(`${EMR_CONFIG.EMR_BASE}/interface/main/calendar/add_edit_event.php?pc_cattype=1`, '_blank');
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏥 WebQX EMR Integration loaded');
    console.log('🔗 EMR Base URL:', EMR_CONFIG.EMR_BASE);
    
    // Initialize backend connection
    window.webqxBackend = new WebQXBackend();
    
    // Make EMR config available globally
    window.EMR_CONFIG = EMR_CONFIG;
    
    console.log('✅ WebQX modules connected to EMR server');
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EMR_CONFIG, WebQXBackend };
}