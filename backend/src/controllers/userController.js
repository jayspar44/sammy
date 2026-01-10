const { db } = require('../services/firebase');

const updateProfile = async (req, res) => {
    try {
        const { uid, email } = req.user;
        const { firstName } = req.body;

        if (!uid) {
            return res.status(400).json({ error: 'User ID missing from token' });
        }

        // Check if user exists to set registeredDate only on creation
        const userDoc = await db.collection('users').doc(uid).get();
        const userData = {
            email,
            updatedAt: new Date().toISOString()
        };

        if (!userDoc.exists) {
            userData.registeredDate = new Date().toISOString();
        }

        if (firstName !== undefined) {
            userData.firstName = firstName;
        }
        if (req.body.dailyGoal !== undefined) {
            const val = parseInt(req.body.dailyGoal);
            if (isNaN(val) || val < 0) return res.status(400).json({ error: 'Invalid daily goal' });
            userData.dailyGoal = val;
        }
        if (req.body.avgDrinkCost !== undefined) {
            const val = parseFloat(req.body.avgDrinkCost);
            if (isNaN(val) || val < 0) return res.status(400).json({ error: 'Invalid drink cost' });
            userData.avgDrinkCost = val;
        }
        if (req.body.avgDrinkCals !== undefined) {
            const val = parseInt(req.body.avgDrinkCals);
            if (isNaN(val) || val < 0) return res.status(400).json({ error: 'Invalid calories' });
            userData.avgDrinkCals = val;
        }
        if (req.body.chatHistoryEnabled !== undefined) {
            userData.chatHistoryEnabled = req.body.chatHistoryEnabled;
        }
        if (req.body.registeredDate !== undefined) {
            userData.registeredDate = req.body.registeredDate;
        }
        if (req.body.typicalWeek !== undefined) {
            const typicalWeek = req.body.typicalWeek;

            // Validate structure
            const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const weekData = {};

            for (const day of validDays) {
                if (typicalWeek[day] !== undefined) {
                    const val = parseInt(typicalWeek[day]);
                    if (isNaN(val) || val < 0 || val > 100) {
                        return res.status(400).json({ error: `Invalid value for ${day}` });
                    }
                    weekData[day] = val;
                }
            }

            // Allow clearing by passing null/empty object
            if (Object.keys(weekData).length > 0) {
                userData.typicalWeek = weekData;
            } else {
                userData.typicalWeek = null;
            }
        }

        await db.collection('users').doc(uid).set(userData, { merge: true });

        // If dailyGoal was updated, also update today's log to reflect this goal historically
        if (req.body.dailyGoal !== undefined) {
            // Use the client-provided date to avoid timezone mismatches
            const todayStr = req.body.date || new Date().toISOString().split('T')[0];
            const logRef = db.collection('users').doc(uid).collection('logs').doc(todayStr);

            // We use merge: true to create if not exists, or update if exists
            // We only update the goal in the habits structure
            await logRef.set({
                date: todayStr,
                userId: uid,
                habits: {
                    drinking: {
                        goal: parseInt(req.body.dailyGoal)
                    }
                }
            }, { merge: true });
        }

        res.json({ success: true, message: 'Profile updated' });
    } catch (error) {
        req.log.error({ err: error }, 'Error updating profile');
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

const getProfile = async (req, res) => {
    try {
        const { uid } = req.user;

        const doc = await db.collection('users').doc(uid).get();

        if (!doc.exists) {
            // Return basic info from token if DB record doesn't exist yet
            return res.json({
                firstName: '',
                email: req.user.email,
                chatHistoryEnabled: true,
                registeredDate: new Date().toISOString() // Return curr time as fallback/start
            });
        }

        const data = doc.data();
        res.json({
            firstName: data.firstName || '',
            email: data.email || req.user.email,
            dailyGoal: data.dailyGoal ?? 2,
            avgDrinkCost: data.avgDrinkCost ?? 10,
            avgDrinkCals: data.avgDrinkCals ?? 150,
            chatHistoryEnabled: data.chatHistoryEnabled !== undefined ? data.chatHistoryEnabled : true,
            registeredDate: data.registeredDate || data.updatedAt || new Date().toISOString(), // Fallback to updated or now
            typicalWeek: data.typicalWeek || null
        });

    } catch (error) {
        req.log.error({ err: error }, 'Error fetching profile');
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

module.exports = {
    updateProfile,
    getProfile
};
