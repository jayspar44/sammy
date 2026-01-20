const { db } = require('./firebase');
const { calculateAllTimeStats } = require('./statsService');

/**
 * Milestone definitions with thresholds and metadata.
 */
const MILESTONES = {
    // Dry streaks
    streak_7: { type: 'dry_streak', threshold: 7, label: '1 Week Dry', icon: 'flame' },
    streak_14: { type: 'dry_streak', threshold: 14, label: '2 Weeks Dry', icon: 'flame' },
    streak_30: { type: 'dry_streak', threshold: 30, label: '1 Month Dry', icon: 'trophy' },
    streak_60: { type: 'dry_streak', threshold: 60, label: '2 Months Dry', icon: 'trophy' },
    streak_90: { type: 'dry_streak', threshold: 90, label: '3 Months Dry', icon: 'crown' },

    // Drinks saved
    drinks_10: { type: 'drinks_saved', threshold: 10, label: '10 Drinks Saved', icon: 'star' },
    drinks_50: { type: 'drinks_saved', threshold: 50, label: '50 Drinks Saved', icon: 'star' },
    drinks_100: { type: 'drinks_saved', threshold: 100, label: '100 Drinks Saved', icon: 'medal' },
    drinks_500: { type: 'drinks_saved', threshold: 500, label: '500 Drinks Saved', icon: 'medal' },
    drinks_1000: { type: 'drinks_saved', threshold: 1000, label: '1K Drinks Saved', icon: 'crown' },

    // Money saved
    money_100: { type: 'money_saved', threshold: 100, label: '$100 Saved', icon: 'wallet' },
    money_500: { type: 'money_saved', threshold: 500, label: '$500 Saved', icon: 'wallet' },
    money_1000: { type: 'money_saved', threshold: 1000, label: '$1K Saved', icon: 'piggy-bank' },
};

/**
 * Calculates the current dry streak from logs.
 * @param {string} userId - The user's ID.
 * @param {Date} anchorDate - The date to calculate from.
 * @returns {Promise<number>} The current dry streak in days.
 */
const calculateDryStreak = async (userId, anchorDate) => {
    // Validate anchorDate
    if (!anchorDate || !(anchorDate instanceof Date) || isNaN(anchorDate.getTime())) {
        throw new Error('Invalid anchor date provided');
    }

    const userRef = db.collection('users').doc(userId);

    // Fetch recent logs (up to 365 days for streak calculation)
    const yearAgo = new Date(anchorDate);
    yearAgo.setDate(anchorDate.getDate() - 365);
    const yearAgoStr = yearAgo.toISOString().split('T')[0];

    const logsSnapshot = await userRef.collection('logs')
        .where('date', '>=', yearAgoStr)
        .limit(400) // Explicit limit (365 days + buffer)
        .get();

    const logsMap = {};
    logsSnapshot.forEach(doc => {
        const data = doc.data();
        let count = 0;

        if (data.habits && data.habits.drinking) {
            count = data.habits.drinking.count || 0;
        } else if (data.count !== undefined) {
            count = data.count;
        }

        if (data.date) {
            logsMap[data.date] = count;
        }
    });

    // Calculate streak using loop counter (avoid date mutation)
    let dryStreak = 0;

    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(anchorDate);
        checkDate.setDate(anchorDate.getDate() - i);
        const dStr = checkDate.toISOString().split('T')[0];
        const count = logsMap[dStr] ?? 0; // No log = assume 0 drinks

        if (count === 0) {
            dryStreak++;
        } else {
            break;
        }
    }

    return dryStreak;
};

/**
 * Calculates the longest dry streak ever achieved.
 * @param {string} userId - The user's ID.
 * @returns {Promise<number>} The longest dry streak in days.
 */
const calculateLongestDryStreak = async (userId) => {
    const userRef = db.collection('users').doc(userId);

    // Fetch logs from last 2 years (bounded query to prevent memory issues)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const twoYearsAgoStr = twoYearsAgo.toISOString().split('T')[0];

    const logsSnapshot = await userRef.collection('logs')
        .where('date', '>=', twoYearsAgoStr)
        .limit(800) // Explicit limit (730 days + buffer)
        .get();

    if (logsSnapshot.empty) {
        return 0;
    }

    // Build sorted array of dates with their counts
    const logs = [];
    logsSnapshot.forEach(doc => {
        const data = doc.data();
        let count = 0;

        if (data.habits && data.habits.drinking) {
            count = data.habits.drinking.count || 0;
        } else if (data.count !== undefined) {
            count = data.count;
        }

        if (data.date) {
            logs.push({ date: data.date, count });
        }
    });

    // Sort by date
    logs.sort((a, b) => a.date.localeCompare(b.date));

    // Find longest streak of consecutive 0-drink days
    let longestStreak = 0;
    let currentStreak = 0;

    for (const log of logs) {
        if (log.count === 0) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
        } else {
            currentStreak = 0;
        }
    }

    return longestStreak;
};

/**
 * Checks milestones and returns all milestones with their status.
 * @param {string} userId - The user's ID.
 * @param {Date} anchorDate - The date to anchor calculations from.
 * @returns {Promise<Object>} Object with milestones and current stats.
 */
const getMilestones = async (userId, anchorDate) => {
    // Get current stats
    const [allTimeStats, currentStreak, longestStreak] = await Promise.all([
        calculateAllTimeStats(userId, anchorDate),
        calculateDryStreak(userId, anchorDate),
        calculateLongestDryStreak(userId)
    ]);

    // Get user's unlocked milestones from profile
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const achievements = userData.achievements || { unlockedMilestones: [] };
    const unlockedMap = new Map(
        (achievements.unlockedMilestones || []).map(m => [m.id, m.unlockedAt])
    );

    // Build milestones array with status
    const milestones = [];
    const newlyUnlocked = [];

    for (const [id, def] of Object.entries(MILESTONES)) {
        let currentValue = 0;
        let isUnlocked = false;

        switch (def.type) {
            case 'dry_streak':
                // Use longest streak ever for unlock status, current streak for display
                currentValue = longestStreak;
                isUnlocked = longestStreak >= def.threshold;
                break;
            case 'drinks_saved':
                currentValue = allTimeStats.drinksSaved;
                isUnlocked = currentValue >= def.threshold;
                break;
            case 'money_saved':
                currentValue = allTimeStats.moneySaved;
                isUnlocked = currentValue >= def.threshold;
                break;
        }

        const wasUnlocked = unlockedMap.has(id);
        const unlockedAt = wasUnlocked ? unlockedMap.get(id) : null;

        // Track newly unlocked milestones
        if (isUnlocked && !wasUnlocked) {
            newlyUnlocked.push({ id, unlockedAt: new Date().toISOString() });
        }

        const progress = Math.min(Math.round((currentValue / def.threshold) * 100), 100);

        milestones.push({
            id,
            ...def,
            currentValue,
            progress,
            isUnlocked: isUnlocked || wasUnlocked,
            unlockedAt: isUnlocked ? (unlockedAt || new Date().toISOString()) : null
        });
    }

    // Update user profile with newly unlocked milestones using transaction to prevent race conditions
    if (newlyUnlocked.length > 0) {
        await db.runTransaction(async (transaction) => {
            const freshUserDoc = await transaction.get(userRef);
            const existingAchievements = freshUserDoc.exists
                ? (freshUserDoc.data().achievements || { unlockedMilestones: [] })
                : { unlockedMilestones: [] };

            // Filter out any milestones that were already unlocked by a concurrent request
            const existingIds = new Set((existingAchievements.unlockedMilestones || []).map(m => m.id));
            const trulyNew = newlyUnlocked.filter(m => !existingIds.has(m.id));

            if (trulyNew.length > 0) {
                const updatedMilestones = [
                    ...(existingAchievements.unlockedMilestones || []),
                    ...trulyNew
                ];

                transaction.set(userRef, {
                    achievements: {
                        unlockedMilestones: updatedMilestones,
                        stats: {
                            longestDryStreak: longestStreak,
                            totalDrinksSaved: allTimeStats.drinksSaved,
                            totalMoneySaved: allTimeStats.moneySaved
                        }
                    }
                }, { merge: true });
            }
        });
    }

    return {
        milestones,
        newlyUnlocked: newlyUnlocked.map(m => ({
            ...MILESTONES[m.id],
            id: m.id,
            unlockedAt: m.unlockedAt
        })),
        stats: {
            currentStreak,
            longestStreak,
            drinksSaved: allTimeStats.drinksSaved,
            moneySaved: allTimeStats.moneySaved,
            caloriesCut: allTimeStats.caloriesCut
        }
    };
};

module.exports = { MILESTONES, getMilestones, calculateDryStreak, calculateLongestDryStreak };
