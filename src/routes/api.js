/**
 * API Routes
 * Express routes for configuration and watcher control
 */

const express = require('express');
const router = express.Router();
const config = require('../config');
const watcher = require('../services/watcher');
const logger = require('../utils/logger');

// Get current configuration
router.get('/config', (req, res) => {
    res.json(config.get());
});

// Update configuration
router.post('/config', (req, res) => {
    const success = config.save(req.body);

    if (success) {
        // Restart watcher if it's running
        if (watcher.status()) {
            watcher.stop().then(() => {
                setTimeout(() => watcher.start(), 1000);
            });
        }
        res.json({ success: true, message: 'Configuration saved' });
    } else {
        res.status(500).json({ success: false, message: 'Failed to save configuration' });
    }
});

// Start watcher
router.post('/start', (req, res) => {
    const started = watcher.start();
    res.json({
        success: started,
        message: started ? 'Watcher started' : 'Failed to start watcher'
    });
});

// Stop watcher
router.post('/stop', async (req, res) => {
    await watcher.stop();
    res.json({ success: true, message: 'Watcher stopped' });
});

// Get logs
router.get('/logs', (req, res) => {
    res.json(logger.getLogs());
});

// Get watcher status
router.get('/status', (req, res) => {
    res.json({
        running: watcher.status(),
        config: config.get()
    });
});

module.exports = router;
