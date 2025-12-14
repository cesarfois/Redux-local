/**
 * Logger Module
 * Centralized logging system with structured log management
 */

class Logger {
    constructor(maxLogs = 200) {
        this.logs = [];
        this.maxLogs = maxLogs;
    }

    /**
     * Add a log entry
     * @param {string} message - Log message
     * @param {string} type - Log type: 'info', 'success', 'warning', 'error', 'process'
     */
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = { timestamp, message, type };

        this.logs.unshift(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.pop();
        }

        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    /**
     * Get all logs
     * @returns {Array} Array of log entries
     */
    getLogs() {
        return this.logs;
    }

    /**
     * Clear all logs
     */
    clear() {
        this.logs = [];
        this.log('Logs cleared', 'info');
    }

    // Convenience methods
    info(message) { this.log(message, 'info'); }
    success(message) { this.log(message, 'success'); }
    warning(message) { this.log(message, 'warning'); }
    error(message) { this.log(message, 'error'); }
    process(message) { this.log(message, 'process'); }
}

module.exports = new Logger();
