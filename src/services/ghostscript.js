/**
 * Ghostscript Service
 * Handles PDF compression using Ghostscript with dual-pass strategy
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const fsSync = require('fs');
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
            if (fsSync.existsSync(p)) {
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
     * Build Standard Profile arguments (115 DPI, Bicubic, Threshold 1.0)
     * @param {string} inputFile - Path to input PDF
     * @param {string} outputFile - Path to output PDF
     * @returns {Array} Array of Ghostscript arguments
     */
    buildStandardArgs(inputFile, outputFile) {
        return [
            '-sDEVICE=pdfwrite',
            '-dCompatibilityLevel=1.4',
            '-dPDFSETTINGS=/screen',

            // Threshold parameters (CRITICAL for forcing downsampling)
            '-dColorImageDownsampleThreshold=1.0',
            '-dGrayImageDownsampleThreshold=1.0',
            '-dMonoImageDownsampleThreshold=1.0',

            // Image resolution (115 DPI)
            '-dColorImageResolution=115',
            '-dGrayImageResolution=115',
            '-dMonoImageResolution=115',

            // Downsampling type
            '-dColorImageDownsampleType=/Bicubic',
            '-dGrayImageDownsampleType=/Bicubic',
            '-dMonoImageDownsampleType=/Bicubic',

            // Optimization flags
            '-dDetectDuplicateImages=true',
            '-dCompressPages=true',

            // Process control
            '-dNOPAUSE',
            '-dQUIET',
            '-dBATCH',

            `-sOutputFile=${outputFile}`,
            inputFile
        ];
    }

    /**
     * Build RGB Fallback Profile arguments (Forces RGB conversion for scans/CMYK)
     * @param {string} inputFile - Path to input PDF
     * @param {string} outputFile - Path to output PDF
     * @returns {Array} Array of Ghostscript arguments
     */
    buildRGBFallbackArgs(inputFile, outputFile) {
        return [
            '-sDEVICE=pdfwrite',
            '-dCompatibilityLevel=1.4',
            '-dPDFSETTINGS=/screen',

            // Force RGB color conversion
            '-sColorConversionStrategy=RGB',
            '-sProcessColorModel=DeviceRGB',

            // Disable auto filter, force DCT (JPEG)
            '-dAutoFilterColorImages=false',
            '-dColorImageFilter=/DCTEncode',

            // Image resolution
            '-dColorImageResolution=115',
            '-dGrayImageResolution=115',
            '-dMonoImageResolution=115',

            // Optimization flags
            '-dDetectDuplicateImages=true',
            '-dCompressPages=true',

            // Process control
            '-dNOPAUSE',
            '-dQUIET',
            '-dBATCH',

            `-sOutputFile=${outputFile}`,
            inputFile
        ];
    }

    /**
     * Get file size in bytes
     * @param {string} filePath - Path to file
     * @returns {Promise<number>} File size in bytes
     */
    async getFileSize(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return stats.size;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Format bytes to human readable format
     * @param {number} bytes - Bytes to format
     * @returns {string} Formatted string
     */
    formatBytes(bytes) {
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    }

    /**
     * Sleep utility for adding delays
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Copy file with retry mechanism (handles EBUSY errors)
     * @param {string} source - Source file path
     * @param {string} destination - Destination file path
     * @param {number} retries - Number of retries (default: 3)
     * @returns {Promise}
     */
    async copyFileWithRetry(source, destination, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                await fs.copyFile(source, destination);
                return;
            } catch (error) {
                if (error.code === 'EBUSY' && i < retries - 1) {
                    logger.warning(`File busy, retrying in ${(i + 1) * 200}ms...`);
                    await this.sleep((i + 1) * 200); // Exponential backoff: 200ms, 400ms, 600ms
                } else {
                    throw error;
                }
            }
        }
    }

    /**
     * Compress with specific profile
     * @param {string} inputFile - Path to input PDF
     * @param {string} outputFile - Path to output PDF
     * @param {string} profile - 'standard' or 'rgb-fallback'
     * @returns {Promise<Object>} Result object with success, outputSize, profile
     */
    compressWithProfile(inputFile, outputFile, profile) {
        return new Promise((resolve, reject) => {
            const gsCommand = this.getCommand();
            const args = profile === 'standard'
                ? this.buildStandardArgs(inputFile, outputFile)
                : this.buildRGBFallbackArgs(inputFile, outputFile);

            const gs = spawn(gsCommand, args, { shell: false });

            let errorOutput = '';

            gs.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            gs.on('error', (err) => {
                reject(new Error(`Failed to start Ghostscript: ${err.message}`));
            });

            gs.on('close', async (code) => {
                if (code === 0) {
                    // Wait a bit for Ghostscript to fully release file handles
                    await this.sleep(300);

                    const outputSize = await this.getFileSize(outputFile);
                    resolve({
                        success: true,
                        outputSize,
                        profile
                    });
                } else {
                    reject(new Error(`Ghostscript failed (exit code: ${code})`));
                }
            });
        });
    }

    /**
     * Compress PDF with dual-pass strategy
     * @param {string} inputFile - Path to input PDF
     * @param {string} finalOutputFile - Path to final output PDF
     * @returns {Promise<Object>} Result with success, profile used, and size info
     */
    async compressDualPass(inputFile, finalOutputFile) {
        const originalSize = await this.getFileSize(inputFile);
        const fileName = path.basename(inputFile);
        const tempDir = path.dirname(inputFile);
        const tempOutput1 = path.join(tempDir, `${fileName}.temp1.pdf`);
        const tempOutput2 = path.join(tempDir, `${fileName}.temp2.pdf`);

        logger.info(`Original size: ${this.formatBytes(originalSize)}`);

        try {
            // ATTEMPT 1: Standard Profile
            logger.process('Attempt 1: Standard Profile (115 DPI Bicubic)');

            try {
                const result1 = await this.compressWithProfile(inputFile, tempOutput1, 'standard');

                if (result1.outputSize < originalSize) {
                    const reduction = ((1 - result1.outputSize / originalSize) * 100).toFixed(1);
                    logger.success(`✓ Standard profile succeeded: ${this.formatBytes(originalSize)} → ${this.formatBytes(result1.outputSize)} (${reduction}% reduction)`);

                    // Copy successful result to final output (with retry)
                    await this.copyFileWithRetry(tempOutput1, finalOutputFile);

                    // Cleanup
                    await this.cleanupTemp([tempOutput1, tempOutput2]);

                    return {
                        success: true,
                        profile: 'Standard (115 DPI)',
                        originalSize,
                        finalSize: result1.outputSize,
                        reduction
                    };
                } else {
                    logger.warning(`✗ Standard profile failed - output larger or equal (${this.formatBytes(result1.outputSize)})`);
                }
            } catch (error) {
                logger.warning(`✗ Standard profile error: ${error.message}`);
            }

            // ATTEMPT 2: RGB Fallback Profile
            logger.process('Attempt 2: RGB Fallback Profile (CMYK/Scan optimized)');

            try {
                const result2 = await this.compressWithProfile(inputFile, tempOutput2, 'rgb-fallback');

                if (result2.outputSize < originalSize) {
                    const reduction = ((1 - result2.outputSize / originalSize) * 100).toFixed(1);
                    logger.success(`✓ RGB profile succeeded: ${this.formatBytes(originalSize)} → ${this.formatBytes(result2.outputSize)} (${reduction}% reduction)`);

                    // Copy successful result to final output (with retry)
                    await this.copyFileWithRetry(tempOutput2, finalOutputFile);

                    // Cleanup
                    await this.cleanupTemp([tempOutput1, tempOutput2]);

                    return {
                        success: true,
                        profile: 'RGB Fallback',
                        originalSize,
                        finalSize: result2.outputSize,
                        reduction
                    };
                } else {
                    logger.warning(`✗ RGB profile failed - output larger or equal (${this.formatBytes(result2.outputSize)})`);
                }
            } catch (error) {
                logger.warning(`✗ RGB profile error: ${error.message}`);
            }

            // BOTH FAILED: Keep original
            logger.warning(`⚠ File is irreducible - keeping original (${this.formatBytes(originalSize)})`);

            // Copy original to output (with retry)
            await this.copyFileWithRetry(inputFile, finalOutputFile);

            // Cleanup
            await this.cleanupTemp([tempOutput1, tempOutput2]);

            return {
                success: true,
                profile: 'Original (Irreducible)',
                originalSize,
                finalSize: originalSize,
                reduction: '0.0'
            };

        } catch (error) {
            // Cleanup on error
            await this.cleanupTemp([tempOutput1, tempOutput2]);
            throw error;
        }
    }

    /**
     * Clean up temporary files
     * @param {Array<string>} files - Array of file paths to delete
     */
    async cleanupTemp(files) {
        for (const file of files) {
            try {
                if (fsSync.existsSync(file)) {
                    await fs.unlink(file);
                }
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    }

    /**
     * Legacy compress method (for backwards compatibility)
     * Now uses dual-pass strategy
     * @param {string} filePath - Path to PDF file to compress
     * @returns {Promise} Resolves when compression completes
     */
    async compress(filePath) {
        const fileName = path.basename(filePath);
        const currentConfig = config.get();
        const destFile = path.join(currentConfig.destPath, fileName);

        logger.process(`Starting compression: ${fileName}`);

        // Ensure destination directory exists
        if (!fsSync.existsSync(currentConfig.destPath)) {
            try {
                await fs.mkdir(currentConfig.destPath, { recursive: true });
            } catch (e) {
                const error = `Failed to create destination directory: ${e.message}`;
                logger.error(error);
                throw new Error(error);
            }
        }

        logger.process(`Using Ghostscript: ${this.getCommand()}`);

        const result = await this.compressDualPass(filePath, destFile);

        logger.success(`Successfully processed: ${fileName} (${result.profile})`);

        return { fileName, destFile, ...result };
    }
}

module.exports = new GhostscriptService();
