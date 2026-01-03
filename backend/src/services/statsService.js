const { db } = require('./firebase');

/**
 * Calculates user statistics including trends and insights.
 * @param {string} userId - The user's ID.
 * @param {Date} anchorDate - The date to anchor calculations from (usually "today").
 * @returns {Promise<Object>} Object containing today's stats, trends, and insights.
 */
const calculateStats = async (userId, anchorDate) => {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() : {};

    // Default global settings
    // Use nullish coalescing (??) instead of || to allow 0 as valid value
    const globalLimit = userData.dailyGoal ?? 2;
    const globalDrinkCost = userData.avgDrinkCost ?? 10;
    const globalDrinkCals = userData.avgDrinkCals ?? 150;

    // Fetch logs for last 30 days (includes today)
    const thirtyDaysAgo = new Date(anchorDate);
    thirtyDaysAgo.setDate(anchorDate.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    const todayStr = anchorDate.toISOString().split('T')[0];

    const logsSnapshot = await userRef.collection('logs')
        .where('date', '>=', thirtyDaysAgoStr)
        .get();

    const logsMap = {};
    const trendData = [];

    logsSnapshot.forEach(doc => {
        const data = doc.data();

        // Normalize data
        let count = 0;
        let limit = globalLimit;

        if (data.habits && data.habits.drinking) {
            count = data.habits.drinking.count || 0;
            if (data.habits.drinking.goal !== undefined) {
                limit = data.habits.drinking.goal;
            }
        } else if (data.count !== undefined) {
            count = data.count;
        }

        const unifiedData = {
            date: data.date,
            count,
            limit
        };

        logsMap[data.date] = unifiedData;
        trendData.push(unifiedData);
    });

    // Sort trends (newest first)
    trendData.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Get Today's specific data
    const todaysLog = logsMap[todayStr] || { count: 0, limit: globalLimit };

    // CALCULATE INSIGHTS
    let dryStreak = 0;
    let checkDate = new Date(anchorDate);

    // Check previous 30 days for streak
    for (let i = 0; i < 30; i++) {
        const dStr = checkDate.toISOString().split('T')[0];
        const log = logsMap[dStr];

        // If today has 0 drinks so far, it counts towards the streak. 
        // If today has > 0, streak is broken (or 0).
        // If no log exists for a day, we assume 0 drinks for streak purposes? 
        // Actually, let's be strict: NO log means NO data, but for this MVP 
        // usually users want "no entry" to mean "I didn't drink".
        // Let's assume missing log = 0 drinks for streak calculation to be generous.
        const count = log ? log.count : 0;

        if (count === 0) {
            dryStreak++;
        } else {
            break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
    }

    let moneySaved = 0;
    let calsCut = 0;

    for (let i = 0; i < 30; i++) {
        const d = new Date(anchorDate);
        d.setDate(anchorDate.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const log = logsMap[dStr];

        if (typeof log !== 'undefined') {
            const dayLimit = log.limit;
            const count = log.count;

            if (count < dayLimit) {
                const savedUnits = dayLimit - count;
                moneySaved += savedUnits * globalDrinkCost;
                calsCut += savedUnits * globalDrinkCals;
            }
        }
    }

    return {
        today: {
            count: todaysLog.count,
            limit: todaysLog.limit,  // Use the actual log's limit, not globalLimit
        },
        trends: trendData,
        insights: {
            moneySaved: Math.round(moneySaved),
            caloriesCut: Math.round(calsCut),
            dryStreak
        }
    };
};

/**
 * Generates a summary text of the user's recent performance for AI context.
 * @param {Object} stats - The stats object returned from calculateStats.
 * @returns {string} Summary string.
 */
const getContextSummary = (stats) => {
    const { today, insights, trends } = stats;

    // Last 7 days summary
    const last7Days = trends.slice(0, 7).map(t => `${t.date}: ${t.count}`).join(', ');

    return `
Current Status:
- Drinks Today: ${today.count} / ${today.limit}
- Dry Streak: ${insights.dryStreak} days
- Money Saved (30d): $${insights.moneySaved}
- Calories Saved (30d): ${insights.caloriesCut}
- Last 7 Days Log: [${last7Days}]
    `.trim();
};

module.exports = { calculateStats, getContextSummary };
