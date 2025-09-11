/**
 * WebQx Patient Portal - Module Cards API Integration
 * Fixes server integration errors for all placement cards
 */

class ModuleCardsAPI {
    constructor() {
        this.baseURL = window.location.hostname.includes('github.io') 
            ? 'http://192.168.173.251:3001' 
            : 'http://localhost:3001';
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    // API call with error handling
    async apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('webqx_access_token') || 'demo-token'}`
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`❌ API Error for ${endpoint}:`, error);
            return this.getFallbackData(endpoint);
        }
    }

    // Fallback data when server is unavailable
    getFallbackData(endpoint) {
        const fallbackData = {
            '/api/patient/dashboard': {
                appointments: { count: 2, next: "Tomorrow 2:00 PM" },
                prescriptions: { active: 3, ready: 1 },
                messages: { unread: 1 },
                healthScore: 98,
                offline: true
            }
        };
        return fallbackData[endpoint] || { error: 'Service unavailable', offline: true };
    }

    // Update dashboard stats
    async updateDashboard() {
        const data = await this.apiCall('/api/patient/dashboard');
        
        // Update stat cards
        document.querySelectorAll('.stat-card').forEach((card, index) => {
            const number = card.querySelector('.stat-number');
            if (number) {
                switch (index) {
                    case 0: number.textContent = data.appointments?.count || '0'; break;
                    case 1: number.textContent = data.prescriptions?.active || '0'; break;
                    case 2: number.textContent = data.messages?.unread || '0'; break;
                    case 3: number.textContent = data.healthScore ? `${data.healthScore}%` : 'N/A'; break;
                }
            }
        });

        if (data.offline) {
            this.showOfflineIndicator();
        }
    }

    // Handle module clicks
    async openAppointments() {
        window.location.href = '../demo-fhir-r4-appointment-booking.html';
    }

    async openMedicalRecords() {
        window.location.href = '../demo-lab-results-viewer.html';
    }

    async openPrescriptions() {
        window.location.href = '../demo/PharmacyLocator-demo.html';
    }

    async openTelehealth() {
        window.location.href = 'telehealth-session.html';
    }

    async openMessages() {
        alert('Messages: 1 new message from Dr. Smith about lab results');
    }

    // Show offline indicator
    showOfflineIndicator() {
        if (!document.querySelector('.offline-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'offline-indicator';
            indicator.textContent = '⚠️ Offline Mode - Limited functionality';
            indicator.style.cssText = 'position:fixed;top:10px;right:10px;background:#f59e0b;color:white;padding:10px;border-radius:5px;z-index:1000;';
            document.body.appendChild(indicator);
        }
    }
}

// Initialize API integration
const moduleAPI = new ModuleCardsAPI();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    moduleAPI.updateDashboard();
});

// Export for global use
window.moduleAPI = moduleAPI;