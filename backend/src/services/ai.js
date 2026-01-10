const { GoogleGenAI } = require('@google/genai');
const logger = require('../logger');

let client;

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    logger.fatal('GEMINI_API_KEY is not set in backend/.env');
}

// Initialize the new SDK client
client = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Generates a chat response using structured chat API.
 * @param {string} systemInstruction - The system prompt/instructions
 * @param {Array} history - Array of message objects: [{sender: 'user'|'sammy', text: '...'}]
 * @param {string} message - The current user message
 * @returns {Promise<string>} The AI's response text
 */
const generateChatResponse = async (systemInstruction, history, message) => {
    if (!client) {
        throw new Error('Gemini API Key is missing or invalid. Check backend logs.');
    }

    try {
        // Create chat session with structured history
        const chat = client.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction
            },
            history: history.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }))
        });

        // Send the current message
        const result = await chat.sendMessage({ message });
        return result.text;
    } catch (error) {
        logger.error({ err: error }, 'Error generating chat response');
        throw error;
    }
};

module.exports = { generateChatResponse };
