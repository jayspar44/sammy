const { db } = require('../services/firebase');
const { generateResponse } = require('../services/ai');
const { calculateStats, getContextSummary } = require('../services/statsService');

const admin = require('firebase-admin');

const handleMessage = async (req, res) => {
    const { uid } = req.user;
    // Allow client to specify 'today' date to ensure context matches user's local day
    const { message, date } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    // DAILY USAGE LIMIT CHECK (25 messages/day)
    const todayStr = date || new Date().toISOString().split('T')[0];
    const userLogRef = db.collection('users').doc(uid).collection('logs').doc(todayStr);

    let allowed = false;
    try {
        await db.runTransaction(async (t) => {
            const doc = await t.get(userLogRef);
            const data = doc.exists ? doc.data() : {};
            const currentCount = data.chatCount || 0;

            if (currentCount < 25) {
                t.set(userLogRef, { chatCount: currentCount + 1 }, { merge: true });
                allowed = true;
            }
        });
    } catch (error) {
        console.error('Error checking chat limit:', error);
        // Default to allowed on error to avoid blocking valid users during glitches
        allowed = true;
    }

    if (!allowed) {
        return res.json({
            text: "I've reached my daily energy limit for chatting today (25 messages). I'll be fully recharged and ready to talk again tomorrow! 🌙",
            sender: 'sammy',
            timestamp: new Date()
        });
    }

    try {
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        const userData = userDoc.exists ? userDoc.data() : {};
        const chatHistoryEnabled = userData.chatHistoryEnabled !== undefined ? userData.chatHistoryEnabled : true;

        const messagesRef = userRef.collection('messages');

        // 0. Save User Message IMMEDIATELY (Only if enabled)
        if (chatHistoryEnabled) {
            const expireAt = new Date();
            expireAt.setDate(expireAt.getDate() + 7); // 7 Day TTL

            await messagesRef.add({
                text: message,
                sender: 'user',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                createdAt: new Date().toISOString(),
                expireAt: expireAt
            });
        } else {
            console.log('Chat history disabled for user', uid);
        }

        // 1. Gather Context
        // userDoc/userData already fetched above
        const userName = userData.firstName || 'Friend';

        const todayStr = date || new Date().toISOString().split('T')[0];
        const anchorDate = new Date(todayStr);

        // Get rich stats
        let contextSummary = "Stats unavailable.";
        try {
            const stats = await calculateStats(uid, anchorDate);
            contextSummary = getContextSummary(stats);
        } catch (err) {
            console.error("Failed to load stats for chat context:", err);
        }

        const currentDayName = anchorDate.toLocaleDateString('en-US', { weekday: 'long' });

        // 2. Fetch Chat History (Last 7 Days)
        const sevenDaysAgo = new Date(anchorDate);
        sevenDaysAgo.setDate(anchorDate.getDate() - 7);

        const historySnapshot = await messagesRef
            .where('timestamp', '>', sevenDaysAgo)
            .orderBy('timestamp', 'asc')
            .get();

        let conversationHistory = "";
        historySnapshot.forEach(doc => {
            const data = doc.data();
            // Skip the message we just saved to avoid duplication interpretation in some cases, 
            // OR include it. Usually omitting the very last "User says" line from history 
            // is better since it's injected explicitly at the end. 
            // Let's include everything EXCLUDING the current message if possible, but 
            // simpler to just dump it all and let the prompt handle "User says" recurrence 
            // or just ensure we don't double print.
            // Actually, we'll format it as a log.
            if (data.text !== message) { // Simple dedupe for the exact current message frame
                conversationHistory += `${data.sender === 'user' ? 'User' : 'Sammy'}: ${data.text}\n`;
            }
        });

        // 3. Construct Prompt
        const systemInternal = `
You are Sammy, a compassionate, intelligent AI habit companion helping users reduce alcohol consumption.

IDENTITY & TONE:
- Optimistic, non-judgmental, warm, and supportive.
- Conversational and natural. Avoid sounding robotic or repetitive.
- Uses emojis naturally but not excessively. 🐇
- NEVER patronizing. You are a partner, not a parent.

SAFETY GUARDRAILS (CRITICAL):
- DO NOT provide medical advice.
- If a user mentions physical withdrawal symptoms (shaking, seizures, hallucinations, severe nausea) or self-harm, you MUST strongly suggest they seek professional medical help immediately.

CONTEXT:
User: ${userName}
Today: ${currentDayName}, ${todayStr}

STATS & INSIGHTS:
${contextSummary}

RECENT CONVERSATION HISTORY (Last 7 Days):
${conversationHistory}

INSTRUCTIONS:
- Use the provided context stats AND conversation history to personalize your response.
- Reference past topics if relevant (e.g., "How is that stressful project going?" if they mentioned it yesterday).
- **Engagement**: Ask open-ended follow-up questions.
- **Diversity**: varying your sentence structure.
- **Length**: Keep it concise (2-4 sentences) usually.

User says: "${message}"
        `;

        // 4. Call AI
        const aiResponse = await generateResponse(systemInternal);

        // 5. Save AI Response (Only if enabled)
        if (chatHistoryEnabled) {
            const expireAt = new Date();
            expireAt.setDate(expireAt.getDate() + 7);

            await messagesRef.add({
                text: aiResponse,
                sender: 'sammy',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                createdAt: new Date().toISOString(),
                expireAt: expireAt
            });
        }

        // 6. Return
        res.json({ text: aiResponse, sender: 'sammy', timestamp: new Date() });

    } catch (error) {
        console.error('Error in chat handler:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
};

const getChatHistory = async (req, res) => {
    const { uid } = req.user;
    try {
        // Check if history is enabled
        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        const chatHistoryEnabled = userData.chatHistoryEnabled !== undefined ? userData.chatHistoryEnabled : true;

        if (!chatHistoryEnabled) {
            return res.json([]);
        }

        const snapshot = await db.collection('users').doc(uid).collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(50) // Limit to 50 for UI initial load
            .get();

        const messages = [];
        snapshot.forEach(doc => {
            messages.push({ id: doc.id, ...doc.data() });
        });

        // Reverse so oldest is first for UI chat flow
        res.json(messages.reverse());
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};

const deleteChatHistory = async (req, res) => {
    const { uid } = req.user;
    try {
        const messagesRef = db.collection('users').doc(uid).collection('messages');
        const snapshot = await messagesRef.get();

        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        res.json({ success: true, message: 'Chat history cleared' });
    } catch (error) {
        console.error('Error clearing chat history:', error);
        res.status(500).json({ error: 'Failed to clear history' });
    }
};

module.exports = { handleMessage, getChatHistory, deleteChatHistory };
