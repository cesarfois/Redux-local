/**
 * API Service
 * Handles all API communication with the backend
 */

class ApiService {
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
    }

    /**
     * Generic API call helper
     * @param {string} endpoint - API endpoint
     * @param {string} method - HTTP method
     * @param {Object} body - Request body
     * @returns {Promise} Response data
     */
    async call(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const res = await fetch(`${this.baseUrl}${endpoint}`, options);
            return await res.json();
        } catch (err) {
            console.error('API Error:', err);
            throw err;
        }
    }

    // Configuration
    async getConfig() {
        return this.call('/config');
    }

    async saveConfig(config) {
        return this.call('/config', 'POST', config);
    }

    // Watcher control
    async start() {
        return this.call('/start', 'POST');
    }

    async stop() {
        return this.call('/stop', 'POST');
    }

    // Logs
    async getLogs() {
        return this.call('/logs');
    }

    // Status
    async getStatus() {
        return this.call('/status');
    }
}

export default new ApiService();
