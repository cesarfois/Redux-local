/**
 * Main Application Class
 * Manages UI state and interactions
 */

import api from './services/api';

export class App {
    constructor() {
        this.elements = {};
        this.state = {
            isRunning: false
        };
    }

    /**
     * Initialize application
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadConfig();
        this.startLogPolling();
        this.checkStatus();
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            sourceInput: document.getElementById('sourcePath'),
            destInput: document.getElementById('destPath'),
            qualitySelect: document.getElementById('quality'),
            saveBtn: document.getElementById('saveBtn'),
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            logArea: document.getElementById('logArea'),
            statusIndicator: document.getElementById('statusIndicator')
        };
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        this.elements.saveBtn.addEventListener('click', () => this.saveConfig());
        this.elements.startBtn.addEventListener('click', () => this.start());
        this.elements.stopBtn.addEventListener('click', () => this.stop());
    }

    /**
     * Load configuration from backend
     */
    async loadConfig() {
        try {
            const config = await api.getConfig();
            this.elements.sourceInput.value = config.sourcePath || '';
            this.elements.destInput.value = config.destPath || '';
            this.elements.qualitySelect.value = config.quality || '/ebook';
        } catch (err) {
            console.error('Failed to load config:', err);
        }
    }

    /**
     * Save configuration
     */
    async saveConfig() {
        const config = {
            sourcePath: this.elements.sourceInput.value.trim(),
            destPath: this.elements.destInput.value.trim(),
            quality: this.elements.qualitySelect.value
        };

        try {
            const res = await api.saveConfig(config);
            if (res && res.success) {
                // Config saved, logs will update automatically
            }
        } catch (err) {
            console.error('Failed to save config:', err);
        }
    }

    /**
     * Start watcher
     */
    async start() {
        try {
            const res = await api.start();
            if (res && res.success) {
                this.state.isRunning = true;
                this.updateStatus();
            }
        } catch (err) {
            console.error('Failed to start:', err);
        }
    }

    /**
     * Stop watcher
     */
    async stop() {
        try {
            const res = await api.stop();
            if (res && res.success) {
                this.state.isRunning = false;
                this.updateStatus();
            }
        } catch (err) {
            console.error('Failed to stop:', err);
        }
    }

    /**
     * Check watcher status from backend
     */
    async checkStatus() {
        try {
            const status = await api.getStatus();
            this.state.isRunning = status.running;
            this.updateStatus();
        } catch (err) {
            console.error('Failed to check status:', err);
        }
    }

    /**
     * Update UI status indicator and buttons
     */
    updateStatus() {
        const { statusIndicator, startBtn, stopBtn } = this.elements;

        if (this.state.isRunning) {
            statusIndicator.classList.add('status-active');
            statusIndicator.classList.remove('status-inactive');
            startBtn.disabled = true;
            stopBtn.disabled = false;
        } else {
            statusIndicator.classList.add('status-inactive');
            statusIndicator.classList.remove('status-active');
            startBtn.disabled = false;
            stopBtn.disabled = true;
        }
    }

    /**
     * Update logs from backend
     */
    async updateLogs() {
        try {
            const logs = await api.getLogs();
            if (logs && Array.isArray(logs)) {
                this.renderLogs(logs);
            }
        } catch (err) {
            console.error('Failed to update logs:', err);
        }
    }

    /**
     * Render logs to UI
     * @param {Array} logs - Log entries
     */
    renderLogs(logs) {
        this.elements.logArea.innerHTML = logs.map(log => `
            <div class="log-entry">
                <span class="log-time">[${log.timestamp}]</span>
                <span class="log-msg type-${log.type}">${this.escapeHtml(log.message)}</span>
            </div>
        `).join('');
    }

    /**
     * Start polling for logs
     */
    startLogPolling() {
        // Initial load
        this.updateLogs();

        // Poll every 2 seconds
        setInterval(() => this.updateLogs(), 2000);
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
