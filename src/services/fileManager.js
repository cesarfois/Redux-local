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
     * Move file to processed folder
     * @param {string} filePath - Original file path
     * @param {boolean} success - Whether processing was successful
     */
    async moveFile(filePath, success) {
        try {
            const fileName = path.basename(filePath);
            const sourceDir = path.dirname(filePath);

            // Determine destination folder
            const destFolder = success ? '_Processados' : '_Processados_Erro';
            const destPath = path.join(sourceDir, destFolder, fileName);

            // Ensure folders exist
            await this.ensureFolders(sourceDir);

            // Move file
            await fs.rename(filePath, destPath);

            logger.info(`File moved to ${destFolder}: ${fileName}`);
        } catch (error) {
            logger.error(`Failed to move file ${filePath}: ${error.message}`);
            // Don't throw - we don't want to stop processing if file move fails
        }
    }

    /**
     * Check if file should be ignored (already in organization folders)
     * @param {string} filePath - File path to check
     * @returns {boolean} True if file should be ignored
     */
    shouldIgnore(filePath) {
        const normalized = path.normalize(filePath);
        return normalized.includes('_Processados') || normalized.includes('_Processados_Erro');
    }
}

module.exports = new FileManager();
