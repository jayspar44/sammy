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

    // Fetch logs for last 90 days (includes today)
    const ninetyDaysAgo = new Date(anchorDate);
    ninetyDaysAgo.setDate(anchorDate.getDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];
    const todayStr = anchorDate.toISOString().split('T')[0];

    const logsSnapshot = await userRef.collection('logs')
        .where('date', '>=', ninetyDaysAgoStr)
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

    // Check previous 90 days for streak
    for (let i = 0; i < 90; i++) {
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

    for (let i = 0; i < 90; i++) {
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

    // Ensure we have 90 days
    const last90Days = trends.slice(0, 90);

    // 1. Daily breakdown (last 28 days / 4 weeks)
    const last28Days = last90Days.slice(0, 28);
    const dailyBreakdown = last28Days.map(day => {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        return `  ${day.date} (${dayName}): ${day.count} drinks`;
    });

    // 2. Weekly summaries (13 weeks)
    const weekSummaries = [];
    for (let i = 0; i < last90Days.length; i += 7) {
        const week = last90Days.slice(i, i + 7);
        const weekTotal = week.reduce((sum, day) => sum + day.count, 0);
        const weekStart = week[0]?.date || 'N/A';
        const weekEnd = week[week.length - 1]?.date || 'N/A';
        weekSummaries.push(`  ${weekStart} to ${weekEnd}: ${weekTotal} drinks`);
    }

    // 2. Monthly summaries (last 3 calendar months)
    const monthlyTotals = new Map();
    last90Days.forEach(day => {
        if (!day.date) return;
        const monthKey = day.date.substring(0, 7); // "YYYY-MM"
        monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + day.count);
    });
    const monthlySummaries = Array.from(monthlyTotals.entries())
        .sort((a, b) => b[0].localeCompare(a[0])) // Most recent first
        .slice(0, 3)
        .map(([month, total]) => `  ${month}: ${total} drinks`);

    // 3. Period aggregations
    const last30Days = last90Days.slice(0, 30).reduce((sum, d) => sum + d.count, 0);
    const last60Days = last90Days.slice(0, 60).reduce((sum, d) => sum + d.count, 0);
    const last90Total = last90Days.reduce((sum, d) => sum + d.count, 0);

    // Calculate "last month" (previous calendar month)
    const now = new Date();
    const lastMonthKey = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        .toISOString().substring(0, 7);
    const lastMonthTotal = monthlyTotals.get(lastMonthKey) || 0;

    // Calculate "last 2 months" (2 previous calendar months)
    const twoMonthsAgoKey = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        .toISOString().substring(0, 7);
    const last2MonthsTotal = (monthlyTotals.get(lastMonthKey) || 0) +
                             (monthlyTotals.get(twoMonthsAgoKey) || 0);

    return `
Current Status:
- Drinks Today: ${today.count} / ${today.limit}
- Dry Streak: ${insights.dryStreak} days
- Money Saved (90d): $${insights.moneySaved}
- Calories Saved (90d): ${insights.caloriesCut}

Daily Breakdown (Last 28 Days):
${dailyBreakdown.join('\n')}

Weekly Summary (Last 90 Days):
${weekSummaries.join('\n')}

Monthly Summary (Last 3 Months):
${monthlySummaries.join('\n')}

Period Totals:
- Last 30 days: ${last30Days} drinks
- Last calendar month (${lastMonthKey}): ${lastMonthTotal} drinks
- Last 60 days: ${last60Days} drinks
- Last 2 calendar months: ${last2MonthsTotal} drinks
- Last 90 days: ${last90Total} drinks
- Last 3 calendar months: ${Array.from(monthlyTotals.values()).reduce((a, b) => a + b, 0)} drinks
    `.trim();
};

/**
 * Calculates cumulative drinks saved over time.
 * @param {string} userId - The user's ID.
 * @param {string} mode - 'target' (vs daily goal) or 'benchmark' (vs typical week).
 * @param {string} range - '90d' or 'all'.
 * @param {Date} anchorDate - The date to anchor calculations from (usually "today").
 * @returns {Promise<Object>} Object containing series data and summary.
 */
const calculateCumulativeStats = async (userId, mode, range, anchorDate) => {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() : {};

    // User settings
    const globalLimit = userData.dailyGoal ?? 2;
    const typicalWeek = userData.typicalWeek || null;
    const registeredDate = userData.registeredDate
        ? new Date(userData.registeredDate)
        : null;

    // Determine start date based on range
    let startDate;
    if (range === 'all' && registeredDate) {
        startDate = new Date(registeredDate);
        startDate.setHours(0, 0, 0, 0);
    } else {
        // Default to 90 days
        startDate = new Date(anchorDate);
        startDate.setDate(anchorDate.getDate() - 89); // 90 days including today
    }

    const startDateStr = startDate.toISOString().split('T')[0];

    // Fetch all logs from start date
    const logsSnapshot = await userRef.collection('logs')
        .where('date', '>=', startDateStr)
        .get();

    // Build logs map
    const logsMap = {};
    logsSnapshot.forEach(doc => {
        const data = doc.data();
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

        logsMap[data.date] = { count, limit };
    });

    // Day of week mapping for typicalWeek
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    // Build cumulative series
    const series = [];
    let cumulativeSaved = 0;
    let totalDays = 0;

    // Iterate from start date to anchor date
    const currentDate = new Date(startDate);
    while (currentDate <= anchorDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const log = logsMap[dateStr];

        let dailySaved = 0;

        if (log !== undefined) {
            // We have data for this day
            const actualDrinks = log.count;
            let comparison;

            if (mode === 'benchmark' && typicalWeek) {
                const dayOfWeek = dayNames[currentDate.getDay()];
                comparison = typicalWeek[dayOfWeek] ?? globalLimit;
            } else {
                // Target mode: use the day's logged goal or global limit
                comparison = log.limit;
            }

            dailySaved = comparison - actualDrinks; // Can be negative
        }
        // If no log, dailySaved stays 0 (neutral for missing data)

        cumulativeSaved += dailySaved;
        totalDays++;

        series.push({
            date: dateStr,
            cumulative: cumulativeSaved,
            daily: dailySaved
        });

        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate summary stats
    const totalSaved = cumulativeSaved;
    const weeks = totalDays / 7;
    const avgPerWeek = weeks > 0 ? Math.round((totalSaved / weeks) * 10) / 10 : 0;

    return {
        series,
        summary: {
            totalSaved,
            totalDays,
            avgPerWeek
        },
        mode,
        range,
        hasTypicalWeek: typicalWeek !== null
    };
};

module.exports = { calculateStats, getContextSummary, calculateCumulativeStats };
