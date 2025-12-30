const { db } = require('../services/firebase');

const getLogs = async (req, res) => {
    const { uid } = req.user;
    const { startDate, endDate } = req.query;

    try {
        let query = db.collection('users').doc(uid).collection('logs');

        if (startDate) query = query.where('date', '>=', startDate);
        if (endDate) query = query.where('date', '<=', endDate);

        const snapshot = await query.orderBy('date', 'desc').get();
        const logs = snapshot.docs.map(doc => doc.data());

        res.json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
};

const upsertLog = async (req, res) => {
    const { uid } = req.user;
    const { date, habits, mood, notes } = req.body;

    if (!date) {
        return res.status(400).json({ error: 'Date is required' });
    }

    try {
        await db.collection('users').doc(uid).collection('logs').doc(date).set({
            date,
            habits: habits || {},
            mood: mood || '',
            notes: notes || '',
            updatedAt: new Date().toISOString()
        }, { merge: true });

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving log:', error);
        res.status(500).json({ error: 'Failed to save log' });
    }
};

module.exports = { getLogs, upsertLog };
