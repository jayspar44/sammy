const { db, isReady } = require('../services/firebase');
const { calculateStats, calculateCumulativeStats } = require('../services/statsService');
const admin = require('firebase-admin');

const logDrink = async (req, res) => {
    const { uid } = req.user;
    const { date, count, type: _type } = req.body; // Date is YYYY-MM-DD

    if (!date || count === undefined) {
        return res.status(400).json({ error: 'Date and count are required' });
    }

    // Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Validate count
    if (typeof count !== 'number' || count < 0) {
        return res.status(400).json({ error: 'Count must be a non-negative number' });
    }

    // Check DB readiness
    if (!isReady) {
        return res.status(503).json({ error: 'Database not connected' });
    }

    try {
        const userRef = db.collection('users').doc(uid);
        const logRef = userRef.collection('logs').doc(date);

        await db.runTransaction(async (t) => {
            const doc = await t.get(logRef);
            const userDoc = await t.get(userRef);

            // Get current user limits/costs for stats
            const userData = userDoc.exists ? userDoc.data() : {};
            const dailyGoal = userData.dailyGoal ?? 2;
            const costPerDrink = userData.avgDrinkCost ?? 10;
            const calsPerDrink = userData.avgDrinkCals ?? 150;

            const existingData = doc.exists ? doc.data() : {};

            // Handle legacy 'count' vs new 'habits.drinking.count'
            // We default to 0 if neither exists
            let currentDrinkingCount = 0;
            if (existingData.habits && existingData.habits.drinking) {
                currentDrinkingCount = existingData.habits.drinking.count || 0;
            } else if (existingData.count !== undefined) {
                currentDrinkingCount = existingData.count;
            }

            const newCount = currentDrinkingCount + count;

            // Structure to save
            const habitsData = existingData.habits || {};
            habitsData.drinking = {
                count: newCount,
                goal: dailyGoal, // Snapshot of the goal at this time
                cost: costPerDrink,
                cals: calsPerDrink,
                updatedAt: new Date().toISOString()
            };

            t.set(logRef, {
                userId: uid,
                date,
                habits: habitsData,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
        });

        res.json({ success: true, message: "Logged successfully" });
    } catch (error) {
        req.log.error({ err: error }, 'Error logging drink');
        res.status(500).json({ error: 'Failed to log drink' });
    }
};

const getStats = async (req, res) => {
    const { uid } = req.user;
    // Allow client to specify 'today' to handle timezone differences
    const clientDate = req.query.date;
    const todayStr = clientDate || new Date().toISOString().split('T')[0];

    // For date math, create a Date object at UTC midnight for this date string
    const anchorDate = new Date(todayStr);

    // MOCK MODE if DB not connected
    // MOCK MODE if DB not connected
    if (!isReady) {
        // Generate mock trends relative to the requested date
        const mockTrends = [];
        const baseDate = new Date(anchorDate);

        for (let i = 0; i < 30; i++) {
            const d = new Date(baseDate);
            d.setDate(baseDate.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            mockTrends.push({
                date: dateStr,
                count: Math.floor(Math.random() * 6),
                limit: 2
            });
        }

        return res.json({
            today: { count: 3, limit: 2 },
            trends: mockTrends,
            insights: {
                moneySaved: 50,
                caloriesCut: 1200,
                dryStreak: 3
            }
        });
    }

    try {
        const stats = await calculateStats(uid, anchorDate);
        res.json(stats);
    } catch (error) {
        req.log.error({ err: error }, 'Error fetching stats');
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

const updateLog = async (req, res) => {
    const { uid } = req.user;
    const { date, newCount, newGoal, devMode } = req.body;

    if (!date || (newCount === undefined && newGoal === undefined)) {
        return res.status(400).json({ error: 'Date and either newCount or newGoal are required' });
    }

    // Validate that date is not in the future (unless devMode is enabled)
    if (!devMode) {
        const requestedDate = new Date(date + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (requestedDate > today) {
            return res.status(400).json({ error: 'Cannot edit future dates' });
        }
    }

    // Check DB readiness
    if (!isReady) {
        return res.status(503).json({ error: 'Database not connected' });
    }

    try {
        const userRef = db.collection('users').doc(uid);
        const logRef = userRef.collection('logs').doc(date);

        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            const logDoc = await t.get(logRef);

            // Get current user settings for this update
            const userData = userDoc.exists ? userDoc.data() : {};
            const dailyGoal = userData.dailyGoal ?? 2;
            const costPerDrink = userData.avgDrinkCost ?? 10;
            const calsPerDrink = userData.avgDrinkCals ?? 150;

            const existingData = logDoc.exists ? logDoc.data() : {};
            const habitsData = existingData.habits || {};

            // Determine values to save
            const currentDrinking = habitsData.drinking || {};

            // If newCount is provided, use it, otherwise keep existing
            const countToSave = newCount !== undefined ? parseInt(newCount) : (currentDrinking.count || 0);

            // If newGoal is provided, use it, otherwise keep existing OR fall back to dailyGoal
            let goalToSave;
            if (newGoal !== undefined) {
                goalToSave = parseInt(newGoal);
            } else if (currentDrinking.goal !== undefined) {
                goalToSave = currentDrinking.goal;
            } else {
                goalToSave = dailyGoal;
            }

            // Set the new count (absolute value, not increment)
            habitsData.drinking = {
                count: countToSave,
                goal: goalToSave,
                cost: costPerDrink,
                cals: calsPerDrink,
                updatedAt: new Date().toISOString()
            };

            t.set(logRef, {
                userId: uid,
                date,
                habits: habitsData,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
        });

        res.json({ success: true, message: "Log updated successfully" });
    } catch (error) {
        req.log.error({ err: error }, 'Error updating log');
        res.status(500).json({ error: 'Failed to update log' });
    }
};

const deleteLog = async (req, res) => {
    const { uid } = req.user;
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: 'Date is required' });
    }

    // Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Check DB readiness
    if (!isReady) {
        return res.status(503).json({ error: 'Database not connected' });
    }

    try {
        const userRef = db.collection('users').doc(uid);
        const logRef = userRef.collection('logs').doc(date);

        await logRef.delete();

        res.json({ success: true, message: "Log deleted successfully" });
    } catch (error) {
        req.log.error({ err: error }, 'Error deleting log');
        res.status(500).json({ error: 'Failed to delete log' });
    }
};

const getStatsRange = async (req, res) => {
    const { uid } = req.user;
    const { startDate, endDate } = req.query; // YYYY-MM-DD strings

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Check DB readiness
    if (!isReady) {
        // Mock data for range
        const mockData = {};
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            mockData[dateStr] = {
                today: { count: Math.floor(Math.random() * 5), limit: 2 },
                // Add trends/insights if needed for the modal, but modal primarily needs today's count & limit per day
                trends: []
            };
        }
        return res.json(mockData);
    }

    try {
        const userRef = db.collection('users').doc(uid);
        const logsRef = userRef.collection('logs');

        // Query range - limit to reasonably expected range size (e.g. 1-2 weeks)
        const snapshot = await logsRef
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .get();

        const userDoc = await userRef.get();
        const userData = userDoc.exists ? userDoc.data() : {};

        // Default values
        const goal = userData.dailyGoal ?? 2;

        const results = {};

        // Initialize all days in range with 0/default if no log exists? 
        // Or just return found logs and let frontend handle gaps.
        // Frontend likely easier if we return what we found, and it defaults valid days.
        // But let's build a map of date -> stats

        snapshot.forEach(doc => {
            const data = doc.data();
            const date = data.date;

            let count = 0;
            let dayGoal = goal; // Could be historical goal if we stored it

            if (data.habits && data.habits.drinking) {
                count = data.habits.drinking.count || 0;
                if (data.habits.drinking.goal) dayGoal = data.habits.drinking.goal;
            } else if (data.count !== undefined) {
                count = data.count;
            }

            results[date] = {
                today: { count, limit: dayGoal },
                // Modal check 'hasRecord' based on trends presence in old code. 
                // We should explicitly signal if a record exists.
                hasRecord: true,
                trends: [{ date: date, count }] // Mimic structure if needed, or simplify frontend
            };
        });

        res.json(results);

    } catch (error) {
        req.log.error({ err: error }, 'Error fetching stats range');
        res.status(500).json({ error: 'Failed to fetch stats range' });
    }
};

const getCumulativeStats = async (req, res) => {
    const { uid } = req.user;
    const { mode = 'target', range = '90d', date } = req.query;

    // Validate mode
    if (!['target', 'benchmark'].includes(mode)) {
        return res.status(400).json({ error: 'Mode must be "target" or "benchmark"' });
    }

    // Validate range
    if (!['90d', 'all'].includes(range)) {
        return res.status(400).json({ error: 'Range must be "90d" or "all"' });
    }

    // Allow client to specify anchor date for timezone handling
    const clientDate = date;
    const todayStr = clientDate || new Date().toISOString().split('T')[0];
    const anchorDate = new Date(todayStr);

    // Mock mode if DB not connected
    if (!isReady) {
        const mockSeries = [];
        let cumulative = 0;
        for (let i = 89; i >= 0; i--) {
            const d = new Date(anchorDate);
            d.setDate(anchorDate.getDate() - i);
            const daily = Math.floor(Math.random() * 5) - 1; // -1 to 3
            cumulative += daily;
            mockSeries.push({
                date: d.toISOString().split('T')[0],
                cumulative,
                daily
            });
        }
        return res.json({
            series: mockSeries,
            summary: { totalSaved: cumulative, totalDays: 90, avgPerWeek: Math.round(cumulative / 13 * 10) / 10 },
            mode,
            range,
            hasTypicalWeek: true
        });
    }

    try {
        const stats = await calculateCumulativeStats(uid, mode, range, anchorDate);
        res.json(stats);
    } catch (error) {
        req.log.error({ err: error }, 'Error fetching cumulative stats');
        res.status(500).json({ error: 'Failed to fetch cumulative stats' });
    }
};

module.exports = { logDrink, getStats, updateLog, deleteLog, getStatsRange, getCumulativeStats };
