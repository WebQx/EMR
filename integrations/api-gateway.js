/**
 * WebQX API Gateway
 * Unified API interface for all modules and database operations
 */

class APIGateway {
    constructor() {
        this.baseUrl = this.detectApiUrl();
        this.token = localStorage.getItem('webqx_token');
        this.endpoints = {
            auth: '/auth',
            modules: '/modules', 
            database: '/database',
            placement: '/placement-cards',
            analytics: '/analytics'
        };
    }

    detectApiUrl() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3001/api/v1';
        }
        return 'https://webqx-api.herokuapp.com/api/v1';
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    // Authentication
    async login(email, password) {
        const data = await this.request(`${this.endpoints.auth}/token`, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        this.token = data.access_token;
        localStorage.setItem('webqx_token', this.token);
        return data;
    }

    async logout() {
        try {
            await this.request(`${this.endpoints.auth}/logout`, { method: 'POST' });
        } finally {
            this.token = null;
            localStorage.removeItem('webqx_token');
        }
    }

    // Database operations
    async query(sql, params = []) {
        return await this.request(`${this.endpoints.database}/query`, {
            method: 'POST',
            body: JSON.stringify({ sql, params })
        });
    }

    // Module operations
    async getModuleStatus() {
        return await this.request(`${this.endpoints.modules}/status`);
    }

    async getModuleData(moduleId, dataType) {
        return await this.request(`${this.endpoints.modules}/${moduleId}/data/${dataType}`);
    }

    // Placement cards
    async getPlacementCards(userId = null) {
        const params = userId ? `?user_id=${userId}` : '';
        return await this.request(`${this.endpoints.placement}${params}`);
    }

    async updatePlacementCard(cardId, updates) {
        return await this.request(`${this.endpoints.placement}/${cardId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    // Analytics
    async logModuleAccess(moduleId, userId = null) {
        return await this.request(`${this.endpoints.analytics}/module-access`, {
            method: 'POST',
            body: JSON.stringify({
                module_id: moduleId,
                user_id: userId,
                timestamp: new Date().toISOString()
            })
        });
    }

    // Health check
    async health() {
        return await this.request('/health');
    }
}

window.APIGateway = APIGateway;