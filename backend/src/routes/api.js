const express = require('express');
const router = express.Router();
const { verifyToken } = require('../controllers/authController');
const { logDrink, getStats, updateLog, deleteLog, getStatsRange } = require('../controllers/logController');


// Health check
router.get('/health', (req, res) => res.send('OK'));

// Protected Routes
router.use(verifyToken);

// Logs & Stats
router.post('/log', logDrink);
router.put('/log', updateLog);
router.delete('/log', deleteLog);
router.get('/stats', getStats);
router.get('/stats/range', getStatsRange);

// User Profile
const { updateProfile, getProfile } = require('../controllers/userController');
router.post('/user/profile', updateProfile);
router.get('/user/profile', getProfile);

// Chat
const { handleMessage, getChatHistory, deleteChatHistory } = require('../controllers/chatController');
router.post('/chat', handleMessage);
router.get('/chat/history', getChatHistory);
router.delete('/chat/history', deleteChatHistory);

module.exports = router;
