const express = require('express');
const router = express.Router();
const { verifyToken } = require('../controllers/authController');
const { getLogs, upsertLog } = require('../controllers/logController');
const { chat } = require('../controllers/chatController');

// Health check
router.get('/health', (req, res) => res.send('OK'));

// Protected Routes
router.use(verifyToken);

// Logs
router.get('/logs', getLogs);
router.post('/logs', upsertLog);

// Chat
router.post('/chat', chat);

module.exports = router;
