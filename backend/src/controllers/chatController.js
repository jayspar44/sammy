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
        req.log.error({ err: error }, 'Error checking chat limit');
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
            req.log.info({ uid }, 'Chat history disabled for user');
        }

        // 1. Gather Context
        // userDoc/userData already fetched above
        const userName = userData.firstName || null;

        const todayStr = date || new Date().toISOString().split('T')[0];
        const anchorDate = new Date(todayStr);

        // Get rich stats
        let contextSummary = "Stats unavailable.";
        try {
            const stats = await calculateStats(uid, anchorDate);
            contextSummary = getContextSummary(stats);
        } catch (err) {
            req.log.error({ err }, 'Failed to load stats for chat context');
        }

        const currentDayName = anchorDate.toLocaleDateString('en-US', { weekday: 'long' });

        // Gather typical week baseline if set
        const typicalWeek = userData.typicalWeek || null;
        let typicalWeekContext = "";
        if (typicalWeek) {
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const weekString = days.map((day, idx) => `${dayLabels[idx]}: ${typicalWeek[day] || 0}`).join(', ');
            const weekTotal = days.reduce((sum, day) => sum + (typicalWeek[day] || 0), 0);
            typicalWeekContext = `\nTypical Week Baseline: ${weekString} (Total: ${weekTotal}/week)`;
        }

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
- Talk like a real person, not a cheerleader or motivational poster.
- Be supportive but casual - more like a thoughtful friend than a life coach.
- Non-judgmental and warm, but don't overdo the enthusiasm.
- Use emojis sparingly (0-1 per message max), and only when they fit naturally.
- Avoid excessive exclamation marks (use 1-2 max per message).
- Don't force every conversation back to drinking stats - sometimes just chat.
- NEVER patronizing. You are a partner, not a parent.

AVOID THESE PATTERNS (they sound robotic):
- Don't start messages with "Hey [Name]" repeatedly - vary your openings or skip the greeting
- Never say "that's a good/great question" - just answer the question directly
- Don't say "really well" or "really good" in every message - be more specific or matter-of-fact
- Be encouraging when appropriate, but do it naturally - mix acknowledgment with facts rather than cheerleading in every message

SAFETY GUARDRAILS (CRITICAL):
- DO NOT provide medical advice.
- If a user mentions physical withdrawal symptoms (shaking, seizures, hallucinations, severe nausea) or self-harm, you MUST strongly suggest they seek professional medical help immediately.

CONTEXT:${userName ? `\nUser: ${userName}` : ''}
Today: ${currentDayName}, ${todayStr}${typicalWeekContext}

STATS & INSIGHTS:
${contextSummary}

RECENT CONVERSATION HISTORY (Last 7 Days):
${conversationHistory}

INSTRUCTIONS:
- Use stats and history to personalize responses, but don't force it into every message.
- Reference past conversations when relevant, but keep it natural.
- **Typical Week Baseline**: ${typicalWeek ? 'The user has set a typical week baseline. Use this to provide context for their progress - are they drinking more or less than their typical pattern? This helps track meaningful change, not just arbitrary goals.' : 'The user has not set a typical week baseline yet. If relevant, you might gently mention they can set one in Settings to help track their progress.'}
- Ask questions when genuinely curious or it makes sense, not as a formula.
- Vary your style - sometimes brief (1-2 sentences), sometimes longer (3-4), rarely more.
- If asked about something off-topic (weather, sports, etc.), it's okay to briefly acknowledge you can't help with that, then gently pivot OR just chat casually if appropriate. Don't force awkward transitions.
- Don't end every message with a question - mix it up.
- **Name Usage**: ${userName ? `The user's name is ${userName}. Use it occasionally, not in every message.` : 'The user has not shared their name. Address them directly without using placeholder names.'}

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
        req.log.error({ err: error }, 'Error in chat handler');
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
        req.log.error({ err: error }, 'Error fetching chat history');
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
        req.log.error({ err: error }, 'Error clearing chat history');
        res.status(500).json({ error: 'Failed to clear history' });
    }
};

module.exports = { handleMessage, getChatHistory, deleteChatHistory };
