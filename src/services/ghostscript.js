/**
 * Ghostscript Service
 * Handles PDF compression using Ghostscript
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config');

class GhostscriptService {
    constructor() {
        this.gsCommand = this.detectGhostscript();
    }

    /**
     * Auto-detect Ghostscript installation path
     * @returns {string} Path to Ghostscript executable
     */
    detectGhostscript() {
        const possiblePaths = [
            'C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe',
            'C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64.exe',
            'C:\\Program Files\\gs\\gs10.05.0\\bin\\gswin64c.exe',
        ];

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                return p;
            }
        }

        return 'gswin64c'; // Fallback to PATH
    }

    /**
     * Get Ghostscript command path
     * @returns {string} Ghostscript executable path
     */
    getCommand() {
        const currentConfig = config.get();
        return currentConfig.manualGsPath || this.gsCommand;
    }

    /**
     * Build Ghostscript arguments for PDF compression
     * @param {string} inputFile - Path to input PDF
     * @param {string} outputFile - Path to output PDF
     * @returns {Array} Array of Ghostscript arguments
     */
    buildArgs(inputFile, outputFile) {
        const cfg = config.get();

        return [
            '-sDEVICE=pdfwrite',
            `-dCompatibilityLevel=${cfg.compatibilityLevel || '1.4'}`,
            `-dPDFSETTINGS=${cfg.pdfSettings || '/screen'}`,

            // Threshold parameters (CRITICAL for forcing downsampling)
            `-dColorImageDownsampleThreshold=${cfg.colorImageDownsampleThreshold || 1.0}`,
            `-dGrayImageDownsampleThreshold=${cfg.grayImageDownsampleThreshold || 1.0}`,
            `-dMonoImageDownsampleThreshold=${cfg.monoImageDownsampleThreshold || 1.0}`,

            // Image resolution
            `-dColorImageResolution=${cfg.colorImageResolution || 115}`,
            `-dGrayImageResolution=${cfg.grayImageResolution || 115}`,
            `-dMonoImageResolution=${cfg.monoImageResolution || 115}`,

            // Downsampling type
            `-dColorImageDownsampleType=${cfg.colorImageDownsampleType || '/Bicubic'}`,
            `-dGrayImageDownsampleType=${cfg.grayImageDownsampleType || '/Bicubic'}`,
            `-dMonoImageDownsampleType=${cfg.monoImageDownsampleType || '/Bicubic'}`,

            // Optimization flags
            `-dDetectDuplicateImages=${cfg.detectDuplicateImages !== false}`,
            `-dCompressPages=${cfg.compressPages !== false}`,

            // Process control
            '-dNOPAUSE',
            '-dBATCH',

            `-sOutputFile=${outputFile}`,
            inputFile
        ];
    }

    /**
     * Compress a PDF file
     * @param {string} filePath - Path to PDF file to compress
     * @returns {Promise} Resolves when compression completes
     */
    compress(filePath) {
        return new Promise((resolve, reject) => {
            const fileName = path.basename(filePath);
            const currentConfig = config.get();
            const destFile = path.join(currentConfig.destPath, fileName);

            logger.process(`Starting compression: ${fileName}`);

            // Ensure destination directory exists
            if (!fs.existsSync(currentConfig.destPath)) {
                try {
                    fs.mkdirSync(currentConfig.destPath, { recursive: true });
                } catch (e) {
                    const error = `Failed to create destination directory: ${e.message}`;
                    logger.error(error);
                    return reject(new Error(error));
                }
            }

            const gsCommand = this.getCommand();
            const args = this.buildArgs(filePath, destFile);

            logger.process(`Using Ghostscript: ${gsCommand}`);

            const gs = spawn(gsCommand, args, { shell: false });

            let errorOutput = '';

            gs.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            gs.on('error', (err) => {
                const error = `Failed to start Ghostscript: ${err.message}`;
                logger.error(error);
                reject(new Error(error));
            });

            gs.on('close', (code) => {
                if (code === 0) {
                    logger.success(`Successfully compressed: ${fileName}`);
                    resolve({ fileName, destFile, code });
                } else {
                    const error = `Compression failed for ${fileName} (exit code: ${code})`;
                    logger.error(error);
                    if (errorOutput) {
                        logger.error(`GS Output: ${errorOutput}`);
                    }
                    reject(new Error(error));
                }
            });
        });
    }
}

module.exports = new GhostscriptService();
