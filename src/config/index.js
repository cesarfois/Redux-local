/**
 * Configuration Module
 * Handles loading, saving, and validation of application configuration
 */

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const CONFIG_FILE = 'config.json';

class ConfigManager {
    constructor() {
        this.config = {
            sourcePath: '',
            destPath: '',
            quality: '/ebook',
            manualGsPath: null,
            // Ghostscript Parameters - Based on WORKING manual command
            pdfSettings: '/screen',
            compatibilityLevel: '1.4',
            colorImageResolution: 115,
            grayImageResolution: 115,
            monoImageResolution: 115,
            colorImageDownsampleType: '/Bicubic',
            grayImageDownsampleType: '/Bicubic',
            monoImageDownsampleType: '/Bicubic',
            colorImageDownsampleThreshold: 1.0,
            grayImageDownsampleThreshold: 1.0,
            monoImageDownsampleThreshold: 1.0,
            detectDuplicateImages: true,
            compressPages: true
        };
        this.load();
    }

    /**
     * Load configuration from file
     */
    load() {
        if (fs.existsSync(CONFIG_FILE)) {
            try {
                const data = fs.readFileSync(CONFIG_FILE, 'utf8');
                this.config = { ...this.config, ...JSON.parse(data) };
                logger.info('Configuration loaded successfully');
            } catch (err) {
                logger.error(`Error loading config: ${err.message}`);
            }
        } else {
            logger.info('No config file found, using defaults');
        }
    }

    /**
     * Save configuration to file
     * @param {Object} newConfig - Configuration object to merge and save
     * @returns {boolean} Success status
     */
    save(newConfig) {
        try {
            this.config = { ...this.config, ...newConfig };
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
            logger.info('Configuration saved successfully');
            return true;
        } catch (err) {
            logger.error(`Error saving config: ${err.message}`);
            return false;
        }
    }

    /**
     * Get current configuration
     * @returns {Object} Current configuration
     */
    get() {
        return { ...this.config };
    }

    /**
     * Validate configuration
     * @returns {Object} Validation result with valid flag and errors array
     */
    validate() {
        const errors = [];

        if (!this.config.sourcePath) {
            errors.push('Source path is not defined');
        } else if (!fs.existsSync(this.config.sourcePath)) {
            errors.push(`Source path does not exist: ${this.config.sourcePath}`);
        }

        if (!this.config.destPath) {
            errors.push('Destination path is not defined');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

module.exports = new ConfigManager();
