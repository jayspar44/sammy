const { db, isReady } = require('../services/firebase');
const { generateChatResponse } = require('../services/ai');
const admin = require('firebase-admin');

/**
 * Get the Monday of the current week (or a given date's week)
 * @param {Date} date - The reference date
 * @returns {Date} Monday of that week at midnight
 */
const getMondayOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    // Sunday = 0, Monday = 1, etc.
    // If Sunday, go back 6 days; otherwise go back (day - 1) days
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/**
 * Calculate which days to project targets to (from today through Sunday)
 * @param {Date} monday - Monday of the current week
 * @param {object} targets - { monday: number, ..., sunday: number }
 * @returns {Array<{date: string, day: string, target: number}>}
 */
const getDaysToProject = (monday, targets) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;

    const daysToProject = [];
    for (let i = todayDayIndex; i < 7; i++) {
        const projectDate = new Date(monday);
        projectDate.setDate(monday.getDate() + i);
        daysToProject.push({
            date: projectDate.toISOString().split('T')[0],
            day: DAY_ORDER[i],
            target: targets[DAY_ORDER[i]]
        });
    }
    return daysToProject;
};

/**
 * POST /api/user/weekly-plan
 * Set weekly targets and project them to daily log documents
 */
const setWeeklyPlan = async (req, res) => {
    const { uid } = req.user;
    const { targets, weekStartDate, isRecurring = true } = req.body;

    // Validate targets object
    if (!targets || typeof targets !== 'object') {
        return res.status(400).json({ error: 'Targets object is required' });
    }

    for (const day of DAY_ORDER) {
        if (targets[day] === undefined) {
            return res.status(400).json({ error: `Target for ${day} is required` });
        }
        if (typeof targets[day] !== 'number' || targets[day] < 0 || !Number.isInteger(targets[day])) {
            return res.status(400).json({ error: `Target for ${day} must be a non-negative integer` });
        }
        if (targets[day] > 50) {
            return res.status(400).json({ error: `Target for ${day} exceeds maximum (50)` });
        }
    }

    if (!isReady) {
        return res.status(503).json({ error: 'Database not connected' });
    }

    try {
        const userRef = db.collection('users').doc(uid);
        const logsRef = userRef.collection('logs');

        // Get Monday of current week
        const monday = getMondayOfWeek(new Date());
        const mondayStr = monday.toISOString().split('T')[0];
        const targetWeekStart = weekStartDate || mondayStr;

        // Calculate which days to project and week total
        const daysToProject = getDaysToProject(monday, targets);
        const weekTotal = DAY_ORDER.reduce((sum, day) => sum + targets[day], 0);

        // Batch write: update user profile and create/update daily logs
        const batch = db.batch();

        // Update user profile with template
        batch.update(userRef, {
            weeklyPlanTemplate: {
                ...targets,
                isActive: isRecurring,
                lastApplied: targetWeekStart
            }
        });

        // Create/update daily log documents for projected days
        for (const { date, target } of daysToProject) {
            const logRef = logsRef.doc(date);

            // Use set with merge to preserve any existing data (like actual counts)
            batch.set(logRef, {
                userId: uid,
                date,
                habits: {
                    drinking: {
                        goal: target,
                        goalSetAt: admin.firestore.FieldValue.serverTimestamp(),
                        goalSource: 'weekly_plan'
                    }
                },
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }

        await batch.commit();

        req.log.info({ uid, daysProjected: daysToProject.length, weekTotal }, 'Weekly plan saved');

        res.json({
            success: true,
            weekTotal,
            daysProjected: daysToProject.length,
            weekStartDate: targetWeekStart
        });

    } catch (error) {
        req.log.error({ err: error }, 'Error setting weekly plan');
        res.status(500).json({ error: 'Failed to set weekly plan' });
    }
};

/**
 * GET /api/user/weekly-plan
 * Get current week's plan and template
 */
const getWeeklyPlan = async (req, res) => {
    const { uid } = req.user;
    const { date } = req.query;

    if (!isReady) {
        return res.status(503).json({ error: 'Database not connected' });
    }

    try {
        const userRef = db.collection('users').doc(uid);
        const logsRef = userRef.collection('logs');

        // Get user data for template
        const userDoc = await userRef.get();
        const userData = userDoc.exists ? userDoc.data() : {};
        const template = userData.weeklyPlanTemplate || null;
        const globalLimit = userData.dailyGoal ?? 2;

        // Get current week's dates
        const today = date ? new Date(date + 'T00:00:00') : new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        const monday = getMondayOfWeek(today);
        const mondayStr = monday.toISOString().split('T')[0];

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const sundayStr = sunday.toISOString().split('T')[0];

        // Fetch logs for current week
        const logsSnapshot = await logsRef
            .where('date', '>=', mondayStr)
            .where('date', '<=', sundayStr)
            .get();

        const logsMap = {};
        logsSnapshot.forEach(doc => {
            const data = doc.data();
            logsMap[data.date] = data;
        });

        // Build days array
        const days = [];
        let totalGoal = 0;
        let totalCount = 0;
        let daysLogged = 0;

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(monday);
            dayDate.setDate(monday.getDate() + i);
            const dateStr = dayDate.toISOString().split('T')[0];
            const dayName = DAY_ORDER[i];

            const log = logsMap[dateStr];
            let goal = null;
            let count = null;
            let status = 'future';

            if (log && log.habits?.drinking) {
                goal = log.habits.drinking.goal ?? null;
                count = log.habits.drinking.count ?? null;
            }

            // Fall back to template if no specific goal
            if (goal === null && template && template[dayName] !== undefined) {
                goal = template[dayName];
            }

            // Fall back to global limit
            if (goal === null) {
                goal = globalLimit;
            }

            // Determine status
            if (dateStr < todayStr) {
                // Past day
                if (count === null) {
                    status = 'missed';
                } else if (count <= goal) {
                    status = 'under';
                } else {
                    status = 'over';
                }
                if (count !== null) {
                    daysLogged++;
                }
            } else if (dateStr === todayStr) {
                // Today
                status = count === null ? 'today' : (count <= goal ? 'under' : 'over');
                if (count !== null) {
                    daysLogged++;
                }
            } else {
                // Future
                status = 'future';
            }

            totalGoal += goal;
            if (count !== null) {
                totalCount += count;
            }

            days.push({
                date: dateStr,
                day: dayName,
                goal,
                count,
                status
            });
        }

        res.json({
            template,
            currentWeek: {
                startDate: mondayStr,
                endDate: sundayStr,
                days,
                totalGoal,
                totalCount,
                daysLogged
            },
            hasPlan: template !== null && template.isActive !== false
        });

    } catch (error) {
        req.log.error({ err: error }, 'Error getting weekly plan');
        res.status(500).json({ error: 'Failed to get weekly plan' });
    }
};

/**
 * GET /api/stats/weekly-summary
 * Get last 7 days with totals and optional AI summary
 */
const getWeeklySummary = async (req, res) => {
    const { uid } = req.user;
    const { date, includeAI } = req.query;

    if (!isReady) {
        return res.status(503).json({ error: 'Database not connected' });
    }

    try {
        const userRef = db.collection('users').doc(uid);
        const logsRef = userRef.collection('logs');

        // Get user data
        const userDoc = await userRef.get();
        const userData = userDoc.exists ? userDoc.data() : {};
        const globalLimit = userData.dailyGoal ?? 2;
        const avgDrinkCost = userData.avgDrinkCost ?? 10;

        // Calculate date range (last 7 days including today)
        const today = date ? new Date(date + 'T00:00:00') : new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

        // Fetch logs for last 7 days
        const logsSnapshot = await logsRef
            .where('date', '>=', sevenDaysAgoStr)
            .where('date', '<=', todayStr)
            .get();

        const logsMap = {};
        logsSnapshot.forEach(doc => {
            const data = doc.data();
            logsMap[data.date] = data;
        });

        // Build days array
        const days = [];
        let totalDrinks = 0;
        let totalTarget = 0;
        let dryDays = 0;
        let daysUnderTarget = 0;

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(sevenDaysAgo);
            dayDate.setDate(sevenDaysAgo.getDate() + i);
            const dateStr = dayDate.toISOString().split('T')[0];

            const log = logsMap[dateStr];
            let count = null;
            let goal = globalLimit;

            if (log && log.habits?.drinking) {
                count = log.habits.drinking.count ?? null;
                goal = log.habits.drinking.goal ?? globalLimit;
            }

            const isDry = count === 0;
            if (isDry) dryDays++;
            if (count !== null) {
                totalDrinks += count;
                if (count <= goal) daysUnderTarget++;
            }
            totalTarget += goal;

            days.push({
                date: dateStr,
                count,
                goal,
                isDry
            });
        }

        // Calculate money saved (drinks under target * cost)
        const drinksSaved = Math.max(0, totalTarget - totalDrinks);
        const moneySaved = drinksSaved * avgDrinkCost;

        const response = {
            days,
            totalDrinks,
            totalTarget,
            dryDays,
            daysUnderTarget,
            moneySaved
        };

        // Generate AI summary if requested
        if (includeAI === 'true') {
            try {
                const aiSummary = await generateWeeklySummary(days, totalDrinks, totalTarget, dryDays, userData);
                response.aiSummary = aiSummary;
            } catch (aiError) {
                req.log.error({ err: aiError }, 'Failed to generate AI summary');
                // Continue without AI summary
            }
        }

        res.json(response);

    } catch (error) {
        req.log.error({ err: error }, 'Error getting weekly summary');
        res.status(500).json({ error: 'Failed to get weekly summary' });
    }
};

/**
 * Generate an AI summary of the week's performance
 */
const generateWeeklySummary = async (days, totalDrinks, totalTarget, dryDays, _userData) => {

    // Build context for AI
    const dayBreakdown = days.map(d => {
        const dateObj = new Date(d.date + 'T00:00:00');
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        if (d.count === null) {
            return `${dayName}: no log`;
        }
        const status = d.count <= d.goal ? 'under' : 'over';
        return `${dayName}: ${d.count}/${d.goal} (${status})`;
    }).join(', ');

    const _underTargetDays = days.filter(d => d.count !== null && d.count <= d.goal).length;
    const _overTargetDays = days.filter(d => d.count !== null && d.count > d.goal).length;

    const prompt = `Give a brief, warm 1-2 sentence reflection on this person's week. Be their supportive coach - acknowledge effort, note what's working, gently mention challenges if relevant.

Week: ${dayBreakdown}
Total: ${totalDrinks} drinks / ${totalTarget} target
Dry days: ${dryDays}

Keep it conversational and encouraging. If they did well, celebrate simply. If they struggled, be understanding and forward-looking. No questions, just a quick supportive observation.`;

    const systemInstruction = `You're a supportive coach giving brief weekly check-ins. Be warm and genuine, not clinical. 1-2 sentences max.`;

    const response = await generateChatResponse(systemInstruction, [], prompt, null);

    if (response.type === 'text') {
        return response.text;
    }

    return null;
};

/**
 * Internal function to set weekly targets (called from chat function)
 * @param {string} uid - User ID
 * @param {object} targets - { monday: number, ..., sunday: number }
 * @param {boolean} isRecurring - Whether to repeat weekly
 * @param {object} logger - Pino logger instance
 */
const executeSetWeeklyTargets = async (uid, targets, isRecurring, logger) => {
    // Validate and round all days
    for (const day of DAY_ORDER) {
        if (targets[day] === undefined) {
            return { success: false, error: `Target for ${day} is missing` };
        }
        const value = Math.round(targets[day]);
        if (value < 0 || value > 50) {
            return { success: false, error: `Target for ${day} must be between 0 and 50` };
        }
        targets[day] = value;
    }

    try {
        const userRef = db.collection('users').doc(uid);
        const logsRef = userRef.collection('logs');

        const monday = getMondayOfWeek(new Date());
        const mondayStr = monday.toISOString().split('T')[0];

        const daysToProject = getDaysToProject(monday, targets);
        const weekTotal = DAY_ORDER.reduce((sum, day) => sum + targets[day], 0);

        // Batch write
        const batch = db.batch();

        batch.update(userRef, {
            weeklyPlanTemplate: {
                ...targets,
                isActive: isRecurring !== false,
                lastApplied: mondayStr
            }
        });

        for (const { date, target } of daysToProject) {
            const logRef = logsRef.doc(date);
            batch.set(logRef, {
                userId: uid,
                date,
                habits: {
                    drinking: {
                        goal: target,
                        goalSetAt: admin.firestore.FieldValue.serverTimestamp(),
                        goalSource: 'weekly_plan'
                    }
                },
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }

        await batch.commit();

        logger.info({ uid, daysProjected: daysToProject.length, weekTotal }, 'Weekly plan set via chat');

        return {
            success: true,
            weekTotal,
            daysProjected: daysToProject.length,
            weekStartDate: mondayStr
        };

    } catch (error) {
        logger.error({ err: error }, 'Error setting weekly plan via chat');
        return { success: false, error: 'Failed to save weekly plan' };
    }
};

module.exports = {
    setWeeklyPlan,
    getWeeklyPlan,
    getWeeklySummary,
    executeSetWeeklyTargets
};
