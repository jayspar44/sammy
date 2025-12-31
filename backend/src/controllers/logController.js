const { db, isReady } = require('../services/firebase');
const { calculateStats } = require('../services/statsService');
const admin = require('firebase-admin');

const logDrink = async (req, res) => {
    const { uid } = req.user;
    const { date, count, type } = req.body; // Date is YYYY-MM-DD

    if (!date || count === undefined) {
        return res.status(400).json({ error: 'Date and count are required' });
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
            const dailyGoal = userData.dailyGoal || 2;
            const costPerDrink = userData.avgDrinkCost || 10;
            const calsPerDrink = userData.avgDrinkCals || 150;

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
        console.error('Error logging drink:', error);
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
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

module.exports = { logDrink, getStats };
