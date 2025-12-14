/**
 * File Watcher Service
 * Monitors source directory for new PDF files
 */

const chokidar = require('chokidar');
const logger = require('../utils/logger');
const config = require('../config');
const ghostscript = require('./ghostscript');

class WatcherService {
    constructor() {
        this.watcher = null;
        this.isRunning = false;
    }

    /**
     * Start watching for PDF files
     * @returns {boolean} Success status
     */
    start() {
        if (this.isRunning) {
            logger.warning('Watcher is already running');
            return false;
        }

        const validation = config.validate();
        if (!validation.valid) {
            validation.errors.forEach(err => logger.error(err));
            return false;
        }

        const currentConfig = config.get();
        logger.info(`Starting watcher on: ${currentConfig.sourcePath}`);

        this.watcher = chokidar.watch(currentConfig.sourcePath, {
            persistent: true,
            ignoreInitial: false,
            depth: 0,
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100
            }
        });

        this.watcher.on('add', (filePath) => this.handleFileAdd(filePath));
        this.watcher.on('error', (error) => {
            logger.error(`Watcher error: ${error.message}`);
        });

        this.isRunning = true;
        return true;
    }

    /**
     * Handle new file detection
     * @param {string} filePath - Path to detected file
     */
    async handleFileAdd(filePath) {
        if (!filePath.toLowerCase().endsWith('.pdf')) {
            return;
        }

        logger.info(`New PDF detected: ${filePath}`);

        try {
            await ghostscript.compress(filePath);
        } catch (error) {
            logger.error(`Compression error: ${error.message}`);
        }
    }

    /**
     * Stop watching
     * @returns {Promise} Resolves when watcher is stopped
     */
    async stop() {
        if (!this.watcher) {
            logger.warning('Watcher is not running');
            return;
        }

        await this.watcher.close();
        this.watcher = null;
        this.isRunning = false;
        logger.info('Watcher stopped');
    }

    /**
     * Check if watcher is running
     * @returns {boolean} Running status
     */
    status() {
        return this.isRunning;
    }
}

module.exports = new WatcherService();
