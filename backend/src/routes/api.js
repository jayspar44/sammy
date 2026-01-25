const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// Capture at module load - updates when nodemon restarts
const serverStartTime = new Date().toISOString();
const pkg = require('../../package.json');
const { verifyToken } = require('../controllers/authController');
const { logDrink, getStats, updateLog, deleteLog, getStatsRange, getCumulativeStats, getAllTimeStats } = require('../controllers/logController');

// Chat-specific rate limiter (10 requests per minute per IP)
const chatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: { error: 'Too many chat requests, please slow down.' },
    standardHeaders: true,
    legacyHeaders: false
});


// Health check (public - returns version and server start time)
router.get('/health', (req, res) => res.json({
    status: 'OK',
    version: pkg.version,
    serverStartTime
}));

// Protected Routes
router.use(verifyToken);

// Logs & Stats
router.post('/log', logDrink);
router.put('/log', updateLog);
router.delete('/log', deleteLog);
router.get('/stats', getStats);
router.get('/stats/range', getStatsRange);
router.get('/stats/cumulative', getCumulativeStats);
router.get('/stats/all-time', getAllTimeStats);

// User Profile
const { updateProfile, getProfile, getMilestones } = require('../controllers/userController');
router.post('/user/profile', updateProfile);
router.get('/user/profile', getProfile);
router.get('/user/milestones', getMilestones);

// Weekly Plan
const { setWeeklyPlan, getWeeklyPlan, getWeeklySummary } = require('../controllers/weeklyPlanController');
router.post('/user/weekly-plan', setWeeklyPlan);
router.get('/user/weekly-plan', getWeeklyPlan);
router.get('/stats/weekly-summary', getWeeklySummary);

// Chat
const { handleMessage, getChatHistory, deleteChatHistory } = require('../controllers/chatController');
router.post('/chat', chatLimiter, handleMessage);
router.get('/chat/history', getChatHistory);
router.delete('/chat/history', deleteChatHistory);

module.exports = router;
