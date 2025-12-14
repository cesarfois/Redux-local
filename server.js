/**
 * PDF Compression Server
 * Main application entry point
 * 
 * Architecture:
 * - Modular design with separation of concerns
 * - Professional error handling
 * - Structured logging system
 */

const express = require('express');
const cors = require('cors');
const logger = require('./src/utils/logger');
const apiRoutes = require('./src/routes/api');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
// In production, serve Vite build output from 'dist'
// In development, Vite dev server runs separately on port 5173
const path = require('path');
const fs = require('fs');
const distPath = path.join(__dirname, 'dist');

if (fs.existsSync(distPath)) {
    // Production mode: serve Vite build
    app.use(express.static(distPath));
    logger.info('Serving Vite production build from /dist');
} else {
    // Development mode: serve old public folder as fallback
    app.use(express.static('public'));
    logger.info('Development mode: Use "npm run dev:frontend" for Vite HMR');
}


// API Routes
app.use('/api', apiRoutes);

// Favicon handler
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(`Server error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    logger.info(`Server running at http://localhost:${PORT}`);
    logger.process(`ACTIVE CONFIG: "OPTIMIZED BALANCE" (/printer + 200 DPI + Forced JPEG)`);
    logger.info('Ready to compress PDFs');
});

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Shutting down gracefully...');
    process.exit(0);
});
