/**
 * File Management Service
 * Handles organization of processed PDF files
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class FileManager {
    /**
     * Create organization folders if they don't exist
     * @param {string} sourcePath - Base source directory
     */
    async ensureFolders(sourcePath) {
        const processedPath = path.join(sourcePath, '_Processados');
        const errorPath = path.join(sourcePath, '_Processados_Erro');

        try {
            await fs.mkdir(processedPath, { recursive: true });
            await fs.mkdir(errorPath, { recursive: true });
        } catch (error) {
            logger.error(`Failed to create organization folders: ${error.message}`);
            throw error;
        }
    }

    /**
     * Sleep utility
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Move file to processed folder with retry mechanism
     * @param {string} filePath - Original file path
     * @param {boolean} success - Whether processing was successful
     */
    async moveFile(filePath, success) {
        const maxRetries = 5;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const fileName = path.basename(filePath);
                const sourceDir = path.dirname(filePath);

                // Determine destination folder
                const destFolder = success ? '_Processados' : '_Processados_Erro';
                const destPath = path.join(sourceDir, destFolder, fileName);

                // Ensure folders exist
                await this.ensureFolders(sourceDir);

                // Wait a bit before attempting move (gives OS time to release handles)
                if (attempt > 0) {
                    const waitTime = attempt * 300; // 300ms, 600ms, 900ms, 1200ms, 1500ms
                    logger.warning(`Retry ${attempt}/${maxRetries} after ${waitTime}ms...`);
                    await this.sleep(waitTime);
                }

                // Move file
                await fs.rename(filePath, destPath);

                logger.info(`File moved to ${destFolder}: ${fileName}`);
                return; // Success!

            } catch (error) {
                if ((error.code === 'EBUSY' || error.code === 'EPERM') && attempt < maxRetries - 1) {
                    // Will retry
                    continue;
                } else {
                    logger.error(`Failed to move file ${filePath} after ${attempt + 1} attempts: ${error.message}`);
                    return; // Give up but don't throw
                }
            }
        }
    }

    /**
     * Check if file should be ignored (already in organization folders or temp files)
     * @param {string} filePath - File path to check
     * @returns {boolean} True if file should be ignored
     */
    shouldIgnore(filePath) {
        const normalized = path.normalize(filePath);
        const fileName = path.basename(filePath);

        // Ignore files in processed folders
        if (normalized.includes('_Processados') || normalized.includes('_Processados_Erro')) {
            return true;
        }

        // Ignore temporary files (.temp1.pdf, .temp2.pdf, etc)
        if (fileName.includes('.temp')) {
            return true;
        }

        return false;
    }
}

module.exports = new FileManager();
