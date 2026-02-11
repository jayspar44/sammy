const { db } = require('../services/firebase');
const { generateChatResponse, sendFunctionResults } = require('../services/ai');
const { calculateStats, getContextSummary } = require('../services/statsService');
const { updateLog } = require('./logController');

const admin = require('firebase-admin');

// Function calling tools for AI-driven log updates
const LOG_TOOLS = [
    {
        name: 'update_log',
        description: 'Updates drink count for a specific date. Use when user wants to correct, change, or log drinks for any date.',
        parameters: {
            type: 'OBJECT',
            properties: {
                date: { type: 'STRING', description: 'Date in YYYY-MM-DD format' },
                count: { type: 'NUMBER', description: 'New drink count (0 or positive integer)' }
            },
            required: ['date', 'count']
        }
    },
    {
        name: 'get_log',
        description: 'Get current log value for a date. Use to check existing value before updating.',
        parameters: {
            type: 'OBJECT',
            properties: {
                date: { type: 'STRING', description: 'Date in YYYY-MM-DD format' }
            },
            required: ['date']
        }
    }
];

/**
 * Execute update_log function - updates or creates a drink log for a date
 * @param {string} uid - User ID
 * @param {object} args - { date: 'YYYY-MM-DD', count: number }
 * @param {object} logger - Pino logger instance
 */
async function executeUpdateLog(uid, { date, count }, logger) {
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return { success: false, error: 'Invalid date format. Use YYYY-MM-DD.' };
    }

    // Validate count is non-negative integer with reasonable upper bound
    if (typeof count !== 'number' || count < 0 || !Number.isInteger(count)) {
        return { success: false, error: 'Count must be a non-negative integer.' };
    }
    if (count > 100) {
        return { success: false, error: 'Count exceeds maximum allowed value (100).' };
    }

    // Check if trying to update a future date
    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
        return { success: false, error: 'Cannot update logs for future dates.' };
    }

    return new Promise((resolve) => {
        const mockReq = {
            user: { uid },
            body: { date, newCount: count, source: 'ai_chat' },
            log: logger
        };
        const mockRes = {
            json: (data) => {
                if (data.success) {
                    resolve({ success: true, date, count });
                } else {
                    resolve({ success: false, error: data.error || 'Update failed' });
                }
            },
            status: () => ({
                json: (data) => resolve({ success: false, error: data.error || 'Update failed' })
            })
        };
        updateLog(mockReq, mockRes).catch((err) => {
            resolve({ success: false, error: err.message });
        });
    });
}

/**
 * Execute get_log function - retrieves drink log for a date
 * @param {string} uid - User ID
 * @param {string} date - Date in YYYY-MM-DD format
 */
async function executeGetLog(uid, date) {
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return { exists: false, error: 'Invalid date format. Use YYYY-MM-DD.' };
    }

    const doc = await db.collection('users').doc(uid)
        .collection('logs').doc(date).get();

    if (!doc.exists) {
        return { exists: false, date };
    }

    const data = doc.data();
    return {
        exists: true,
        date,
        count: data.habits?.drinking?.count ?? null
    };
}

const handleMessage = async (req, res) => {
    const { uid } = req.user;
    // Allow client to specify 'today' date to ensure context matches user's local day
    const { message, date, context } = req.body;

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

        // 0. Save User Message IMMEDIATELY (Only if enabled and not a special message)
        // Skip saving the special __MORNING_CHECKIN_INIT__ message
        if (chatHistoryEnabled && message !== '__MORNING_CHECKIN_INIT__') {
            const expireAt = new Date();
            expireAt.setDate(expireAt.getDate() + 7); // 7 Day TTL

            await messagesRef.add({
                text: message,
                sender: 'user',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                createdAt: new Date().toISOString(),
                expireAt: expireAt
            });
        } else if (message === '__MORNING_CHECKIN_INIT__') {
            req.log.info({ uid }, 'Skipping save for special __MORNING_CHECKIN_INIT__ message');
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
        let stats = null;
        try {
            stats = await calculateStats(uid, anchorDate);
            contextSummary = getContextSummary(stats);
        } catch (err) {
            req.log.error({ err }, 'Failed to load stats for chat context');
        }

        const currentDayName = anchorDate.toLocaleDateString('en-US', { weekday: 'long' });

        // Handle morning_checkin context
        let morningCheckinContext = "";
        let yesterdayDate = null;
        let yesterdayCount = null;
        if (context === 'morning_checkin') {
            // Calculate yesterday's date
            yesterdayDate = new Date(anchorDate);
            yesterdayDate.setDate(anchorDate.getDate() - 1);
            const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

            // Fetch yesterday's log
            try {
                const yesterdayLogRef = db.collection('users').doc(uid).collection('logs').doc(yesterdayStr);
                const yesterdayLog = await yesterdayLogRef.get();

                if (yesterdayLog.exists) {
                    const logData = yesterdayLog.data();
                    if (logData.habits && logData.habits.drinking) {
                        yesterdayCount = logData.habits.drinking.count;
                    }
                }

                // Handle initial greeting request
                if (message === '__MORNING_CHECKIN_INIT__') {
                    // Format yesterday's date for clear display (e.g., "Friday, January 17")
                    const yesterdayFormatted = yesterdayDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                    });

                    let greetingMessage;
                    if (yesterdayCount !== null && yesterdayCount !== undefined) {
                        greetingMessage = `Good morning! ☀️ I have ${yesterdayCount} drink${yesterdayCount !== 1 ? 's' : ''} logged for ${yesterdayFormatted}. Is that correct, or would you like to update it? Just tell me the number.`;
                    } else {
                        greetingMessage = `Good morning! ☀️ I don't have a log for ${yesterdayFormatted} yet. How many drinks did you have? Just tell me the number and I'll log it for you.`;
                    }

                    // Save the greeting to chat history
                    if (chatHistoryEnabled) {
                        const expireAt = new Date();
                        expireAt.setDate(expireAt.getDate() + 7);

                        await messagesRef.add({
                            text: greetingMessage,
                            sender: 'sammy',
                            timestamp: admin.firestore.FieldValue.serverTimestamp(),
                            createdAt: new Date().toISOString(),
                            expireAt: expireAt
                        });
                    }

                    return res.json({ text: greetingMessage, sender: 'sammy', timestamp: new Date() });
                }

                // Format date for the AI prompt
                const yesterdayFormattedForPrompt = yesterdayDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                });

                // Extract key stats for coaching context
                const dailyGoal = userData.dailyGoal ?? 2;
                const dryStreak = stats?.insights?.dryStreak ?? 0;
                const thisWeekTotal = stats?.trends?.slice(0, 7).reduce((sum, d) => sum + d.count, 0) ?? 0;
                const lastWeekTotal = stats?.trends?.slice(7, 14).reduce((sum, d) => sum + d.count, 0) ?? 0;
                const yesterdayDayName = yesterdayDate.toLocaleDateString('en-US', { weekday: 'long' });
                const typicalForYesterday = userData.typicalWeek ? userData.typicalWeek[yesterdayDayName.toLowerCase()] : null;

                morningCheckinContext = `
MORNING CHECK-IN MODE:
**DATE CONTEXT:**
- TODAY is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
- You are logging YESTERDAY: ${yesterdayFormattedForPrompt} (${yesterdayStr})

**LOG STATUS:**
${yesterdayCount !== null && yesterdayCount !== undefined ? `- Yesterday has ${yesterdayCount} drink${yesterdayCount !== 1 ? 's' : ''} logged` : `- No log exists yet for yesterday`}

**COACHING CONTEXT (use this to personalize your response):**
- User's daily goal: ${dailyGoal} drinks
- Current dry streak: ${dryStreak} days${dryStreak > 0 ? ' (will continue if yesterday was 0)' : ''}
- This week so far: ${thisWeekTotal} drinks
- Last week total: ${lastWeekTotal} drinks${typicalForYesterday !== null ? `\n- Typical ${yesterdayDayName}: ${typicalForYesterday} drinks` : ''}

**YOUR TASK:**
- Parse the user's response to extract the drink count
- Numbers can be digits ("2") or words ("two", "zero", "none")
- "none", "zero", "0", "didn't drink" all mean 0 drinks
- If they confirm the existing count, use that count
- Your message should be COACHING: celebrate wins, ask thoughtful questions, notice patterns

**CRITICAL - STRUCTURED OUTPUT MODE:**
You MUST respond with ONLY a JSON object. No other text.

FORMAT: {"count": NUMBER_OR_NULL, "message": "YOUR_COACHING_MESSAGE"}

COACHING RESPONSE EXAMPLES (adapt based on context above):

If count is under goal:
User: "2" → {"count": 2, "message": "Logged 2 for ${yesterdayFormattedForPrompt} - under your goal. What helped you stay on track?"}

If count is 0 and extends streak:
User: "none" → {"count": 0, "message": "Zero for ${yesterdayFormattedForPrompt} - that's ${dryStreak + 1} dry days now. How are you feeling?"}

If count is 0 (no streak):
User: "0" → {"count": 0, "message": "A dry ${yesterdayDayName} - nice. What made the difference?"}

If count is over goal:
User: "5" → {"count": 5, "message": "Logged 5 for ${yesterdayFormattedForPrompt}. No judgment - what was going on?"}

If count is less than typical for that day:
User: "2" → {"count": 2, "message": "2 for ${yesterdayFormattedForPrompt} - less than your usual ${yesterdayDayName}. What shifted?"}

If confirming and doing well vs last week:
User: "that's right" → {"count": ${yesterdayCount || 0}, "message": "Confirmed. You're at ${thisWeekTotal + (yesterdayCount || 0)} this week vs ${lastWeekTotal} last week. ${thisWeekTotal + (yesterdayCount || 0) < lastWeekTotal ? 'Solid progress.' : 'How are you feeling about that?'}"}

If user doesn't remember:
User: "I don't remember" → {"count": null, "message": "No worries - let me know when you do."}

WRONG FORMAT (never do this):
\`\`\`json{"count": 2, "message": "..."}\`\`\`
Here's my response: {"count": 2, "message": "..."}
`;
            } catch (err) {
                req.log.error({ err }, 'Failed to fetch yesterday log for morning checkin');
            }
        }

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
            .limit(100) // Cap at 100 messages for AI context to control costs
            .get();

        const history = [];
        historySnapshot.forEach(doc => {
            const data = doc.data();
            // Don't include the current message in history - it will be sent separately
            if (data.text !== message) {
                history.push({
                    sender: data.sender,
                    text: data.text
                });
            }
        });

        // 3. Construct System Instruction (history and current message are handled separately)
        const contextInfo = `
CONTEXT:${userName ? `\nUser: ${userName}` : ''}
Today: ${currentDayName}, ${todayStr}${typicalWeekContext}

STATS & INSIGHTS:
${contextSummary}
        `.trim();

        // Tool guidance only for regular chat (not morning_checkin which uses structured JSON)
        const toolGuidance = context !== 'morning_checkin' ? `
TOOL USAGE:
- You can update drink logs when asked (e.g., "update yesterday to 3", "Friday was 2 drinks", "log 1 for last Tuesday")
- Use get_log first if you want to confirm current value before updating
- ONLY confirm updates AFTER receiving success response from update_log
- If update fails, apologize and suggest using the calendar UI
- Parse dates naturally: "yesterday", "Friday", "last Tuesday", "3 days ago"
- Today is ${todayStr}
- NEVER update future dates - they will fail validation
` : '';

        const systemInstruction = `
You are Sammy, a compassionate, intelligent AI habit companion helping users reduce alcohol consumption.
${morningCheckinContext}${toolGuidance}
IDENTITY & TONE:
- You're a supportive habit coach - warm but substantive.
- Talk like a real person, not a cheerleader or motivational poster.
- Non-judgmental and curious. NEVER patronizing.
- Use emojis sparingly (0-1 per message max), only when natural.
- Avoid excessive exclamation marks (1-2 max per message).

COACHING APPROACH:
Your role is to help users reflect, celebrate progress, and build awareness. ALWAYS engage meaningfully - never just acknowledge.

ENGAGE WITH THE DATA:
- Notice patterns: "I see Fridays tend to be tougher - what's different about them?"
- Celebrate milestones: "That's 5 days under goal - you're building momentum."
- Acknowledge struggles without judgment: "Sounds like a hard week. What do you think triggered it?"
- Connect to progress: "You're averaging 2/day this week vs 4 last week. That's real change."

ASK THOUGHTFUL QUESTIONS:
- After wins: "What helped you stick with it?"
- After struggles: "What was going on that day?"
- To build awareness: "How did you feel the next morning?"
- To explore strategies: "What do you think would help on days like that?"

VARY YOUR APPROACH BASED ON CONTEXT:
- Wins → Celebrate + ask what worked
- Struggles → Empathy + gentle question about context
- Neutral → Share an observation + invite reflection
- User asks question → Answer directly, may follow up with a question

AVOID THESE PATTERNS:
- Just acknowledging without engaging ("Got it!", "Thanks for sharing!")
- Starting messages with "Hey [Name]" repeatedly
- Commenting on question quality ("good question", "great question")
- Starting with pleasantries ("Thanks for asking", "I appreciate you asking")
- Asking questions that feel like interrogation
- Lecturing or giving unsolicited advice

SAFETY GUARDRAILS (CRITICAL):
- DO NOT provide medical advice.
- If a user mentions physical withdrawal symptoms (shaking, seizures, hallucinations, severe nausea) or self-harm, you MUST strongly suggest they seek professional medical help immediately.

${contextInfo}

INSTRUCTIONS:
- ${history.length > 0 ? '**Continuing conversation.** Maintain context from previous messages. Don\'t re-introduce yourself.' : '**New conversation.** You can introduce yourself naturally if appropriate.'}
- Use the stats and history to personalize responses - reference specific numbers, patterns, and progress.
- **Typical Week Baseline**: ${typicalWeek ? 'The user has a typical week baseline set. Compare their actual drinking to their typical pattern - this shows meaningful change.' : 'No typical week baseline set. You might mention they can set one in Settings.'}
- If asked about something off-topic, briefly acknowledge and gently redirect, or chat casually if appropriate.
- **Name Usage**: ${userName ? `User's name is ${userName}. Use occasionally, not every message.` : 'User hasn\'t shared their name. Address them directly without placeholder names.'}
        `.trim();

        // 4. Call AI with structured chat API
        // Only use tools for regular chat, NOT morning_checkin (which uses structured JSON)
        const tools = context === 'morning_checkin' ? null : LOG_TOOLS;

        req.log.info({
            context,
            message,
            messageLength: message.length,
            hasMorningCheckinContext: morningCheckinContext.length > 0,
            hasTools: tools !== null,
            systemInstructionPreview: systemInstruction.substring(systemInstruction.length - 500)
        }, 'Calling AI with system instruction');

        let aiResponse = await generateChatResponse(systemInstruction, history, message, tools);

        // 4.1. Handle function calling loop (for regular chat with tools)
        const MAX_FUNCTION_ITERATIONS = 3;
        let iteration = 0;

        while (aiResponse.type === 'function_calls' && iteration < MAX_FUNCTION_ITERATIONS) {
            iteration++;
            const functionResults = [];

            req.log.info({
                iteration,
                functionCalls: aiResponse.functionCalls.map(fn => ({ name: fn.name, args: fn.args }))
            }, 'Processing function calls from AI');

            for (const fn of aiResponse.functionCalls) {
                try {
                    let result;
                    if (fn.name === 'update_log') {
                        result = await executeUpdateLog(uid, fn.args, req.log);
                        req.log.info({ functionName: fn.name, args: fn.args, result }, 'Function executed');
                    } else if (fn.name === 'get_log') {
                        result = await executeGetLog(uid, fn.args.date);
                        req.log.info({ functionName: fn.name, args: fn.args, result }, 'Function executed');
                    } else {
                        result = { error: `Unknown function: ${fn.name}` };
                        req.log.warn({ functionName: fn.name }, 'Unknown function requested');
                    }
                    functionResults.push({ id: fn.id, name: fn.name, response: result });
                } catch (err) {
                    req.log.error({ err, functionName: fn.name }, 'Function execution failed');
                    functionResults.push({ id: fn.id, name: fn.name, response: { error: err.message } });
                }
            }

            // Send results back to Gemini for final response
            aiResponse = await sendFunctionResults(aiResponse.chat, functionResults);
        }

        // Extract text from final response
        let aiResponseText = aiResponse.type === 'text' ? aiResponse.text :
            'Sorry, I had trouble processing that request. You can try using the calendar to update your logs directly.';

        // 4.5. Handle morning_checkin auto-logging
        let _loggedCount = null;
        if (context === 'morning_checkin' && yesterdayDate) {
            try {
                req.log.info({ aiResponseLength: aiResponseText.length, aiResponsePreview: aiResponseText.substring(0, 300) }, 'Morning checkin AI response (raw)');

                // Strip potential markdown code blocks (```json ... ``` or ``` ... ```)
                let cleanedResponse = aiResponseText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();

                req.log.info({ cleanedResponse }, 'After stripping markdown');

                // Try to parse JSON response from AI using JSON.parse for robustness
                let parsedJson = null;
                try {
                    // Extract JSON object from response (handles any field order)
                    const jsonStart = cleanedResponse.indexOf('{');
                    const jsonEnd = cleanedResponse.lastIndexOf('}');
                    if (jsonStart !== -1 && jsonEnd > jsonStart) {
                        const jsonStr = cleanedResponse.substring(jsonStart, jsonEnd + 1);
                        parsedJson = JSON.parse(jsonStr);
                    }
                } catch (jsonErr) {
                    req.log.warn({ jsonErr: jsonErr.message, cleanedResponse: cleanedResponse.substring(0, 200) }, 'Failed to parse JSON from AI response');
                }

                if (parsedJson && typeof parsedJson === 'object' && 'count' in parsedJson && 'message' in parsedJson) {
                    const parsedCount = parsedJson.count === null ? null : parseInt(parsedJson.count, 10);
                    const userMessage = parsedJson.message;

                    req.log.info({ parsedCount, yesterdayCount }, 'Morning checkin: parsed AI response');

                    if (parsedCount !== null && !isNaN(parsedCount)) {
                        // Log the drink count for yesterday using shared executor
                        const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
                        req.log.info({ yesterdayStr, parsedCount }, 'Updating log via shared executor');

                        const result = await executeUpdateLog(uid, { date: yesterdayStr, count: parsedCount }, req.log);
                        if (result.success) {
                            _loggedCount = parsedCount;
                            req.log.info({ uid, date: yesterdayStr, count: parsedCount, loggedCount: _loggedCount }, 'Morning checkin auto-logged successfully');
                        } else {
                            req.log.error({ result }, 'Morning checkin log update failed');
                        }

                        aiResponseText = userMessage; // Use the clean message without JSON
                    } else {
                        // Count is null, AI is asking for clarification
                        req.log.info({ parsedCount }, 'Morning checkin: AI asking for clarification (count is null or NaN)');
                        aiResponseText = userMessage;
                    }
                } else {
                    req.log.warn({
                        cleanedResponse: cleanedResponse.substring(0, 300),
                        originalResponse: aiResponseText.substring(0, 300)
                    }, 'Morning checkin: No JSON match found in AI response');
                }
            } catch (err) {
                req.log.error({
                    err,
                    errorMessage: err.message,
                    errorStack: err.stack,
                    aiResponseText: aiResponseText?.substring(0, 300)
                }, 'Failed to auto-log from morning checkin');
                // Continue with original AI response even if logging fails
            }
        }

        req.log.info({
            context,
            hadMorningCheckin: context === 'morning_checkin',
            loggedCount: _loggedCount,
            finalResponsePreview: aiResponseText.substring(0, 100)
        }, 'About to save and return AI response');

        // 5. Save AI Response (Only if enabled)
        if (chatHistoryEnabled) {
            const expireAt = new Date();
            expireAt.setDate(expireAt.getDate() + 7);

            await messagesRef.add({
                text: aiResponseText,
                sender: 'sammy',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                createdAt: new Date().toISOString(),
                expireAt: expireAt
            });
        }

        // 6. Return (include loggedCount if morning checkin)
        const response = { text: aiResponseText, sender: 'sammy', timestamp: new Date() };
        if (_loggedCount !== null) {
            response.loggedCount = _loggedCount;
        }
        res.json(response);

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

        // Delete in batches of 500 (Firestore batch limit)
        const BATCH_SIZE = 500;
        let totalDeleted = 0;

        while (true) {
            const snapshot = await messagesRef.limit(BATCH_SIZE).get();

            if (snapshot.empty) break;

            const batch = db.batch();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            totalDeleted += snapshot.size;

            // Exit if we got fewer than batch size (no more docs)
            if (snapshot.size < BATCH_SIZE) break;
        }

        req.log.info({ totalDeleted }, 'Chat history cleared');
        res.json({ success: true, message: 'Chat history cleared', deleted: totalDeleted });
    } catch (error) {
        req.log.error({ err: error }, 'Error clearing chat history');
        res.status(500).json({ error: 'Failed to clear history' });
    }
};

module.exports = { handleMessage, getChatHistory, deleteChatHistory };
