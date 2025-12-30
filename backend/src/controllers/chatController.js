const { db } = require('../services/firebase');
const { generateResponse } = require('../services/ai');

const chat = async (req, res) => {
    const { uid } = req.user;
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        // Fetch recent logs for context
        const logsSnapshot = await db.collection('users').doc(uid).collection('logs')
            .orderBy('date', 'desc').limit(5).get();

        const logs = logsSnapshot.docs.map(doc => doc.data());

        // Construct Prompt
        const context = `
    User Context:
    - Recent Logs: ${JSON.stringify(logs)}
    
    User Message: ${message}
    
    You are Sammy, a helpful and empathetic habit companion. 
    Review the user's logs and message. Provide supportive advice, insights, or just a listening ear. 
    Keep responses concise (under 150 words) and conversational.
    `;

        const response = await generateResponse(context);
        res.json({ response });

    } catch (error) {
        console.error('Error in chat:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
};

module.exports = { chat };
