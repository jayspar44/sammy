const { db } = require('../services/firebase');

const updateProfile = async (req, res) => {
    try {
        const { uid, email } = req.user;
        const { firstName } = req.body;

        if (!uid) {
            return res.status(400).json({ error: 'User ID missing from token' });
        }

        // Store/Update user data
        // We always ensure email is sync'd from the token in case it changed or wasn't set
        const userData = {
            email,
            updatedAt: new Date().toISOString()
        };

        if (firstName !== undefined) {
            userData.firstName = firstName;
        }
        if (req.body.dailyGoal !== undefined) {
            userData.dailyGoal = parseInt(req.body.dailyGoal);
        }
        if (req.body.avgDrinkCost !== undefined) {
            userData.avgDrinkCost = parseFloat(req.body.avgDrinkCost);
        }
        if (req.body.avgDrinkCals !== undefined) {
            userData.avgDrinkCals = parseInt(req.body.avgDrinkCals);
        }
        if (req.body.chatHistoryEnabled !== undefined) {
            userData.chatHistoryEnabled = req.body.chatHistoryEnabled;
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
        console.error('Error updating profile:', error);
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
                chatHistoryEnabled: true
            });
        }

        const data = doc.data();
        res.json({
            firstName: data.firstName || '',
            email: data.email || req.user.email,
            dailyGoal: data.dailyGoal ?? 2,
            avgDrinkCost: data.avgDrinkCost ?? 10,
            avgDrinkCals: data.avgDrinkCals ?? 150,
            chatHistoryEnabled: data.chatHistoryEnabled !== undefined ? data.chatHistoryEnabled : true
        });

    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

module.exports = {
    updateProfile,
    getProfile
};
