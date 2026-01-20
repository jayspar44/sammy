const { GoogleGenAI } = require('@google/genai');
const logger = require('../logger');

let client;

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    logger.fatal('GEMINI_API_KEY is not set in backend/.env');
    process.exit(1); // Stop the server if API key is missing
}

// Initialize the new SDK client
client = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Generates a chat response using structured chat API.
 * @param {string} systemInstruction - The system prompt/instructions
 * @param {Array} history - Array of message objects: [{sender: 'user'|'sammy', text: '...'}]
 * @param {string} message - The current user message
 * @param {Array|null} tools - Optional function declarations for Gemini function calling
 * @returns {Promise<{type: 'text', text: string}|{type: 'function_calls', functionCalls: Array, chat: object}>}
 */
const generateChatResponse = async (systemInstruction, history, message, tools = null) => {
    if (!client) {
        throw new Error('Gemini API Key is missing or invalid. Check backend logs.');
    }

    try {
        // Create chat session with structured history using correct API
        const chat = client.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction,
                tools: tools ? [{ functionDeclarations: tools }] : undefined,
                toolConfig: tools ? {
                    functionCallingConfig: {
                        mode: 'AUTO'
                    }
                } : undefined
            },
            history: history.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }))
        });

        // Send the current message with correct API
        const response = await chat.sendMessage({ message });

        // Return function calls if present, otherwise text
        if (response.functionCalls && response.functionCalls.length > 0) {
            return { type: 'function_calls', functionCalls: response.functionCalls, chat };
        }
        return { type: 'text', text: response.text };
    } catch (error) {
        logger.error({ err: error }, 'Error generating chat response');
        throw error;
    }
};

/**
 * Continue a chat session with function results.
 * @param {object} chat - The chat session object from generateChatResponse
 * @param {Array} functionResults - Array of {id: string, name: string, response: object} objects
 * @returns {Promise<{type: 'text', text: string}|{type: 'function_calls', functionCalls: Array, chat: object}>}
 */
const sendFunctionResults = async (chat, functionResults) => {
    try {
        // Format function results as FunctionResponse parts
        const parts = functionResults.map(r => ({
            functionResponse: {
                id: r.id,
                name: r.name,
                response: r.response
            }
        }));

        const response = await chat.sendMessage({
            message: parts
        });

        if (response.functionCalls && response.functionCalls.length > 0) {
            return { type: 'function_calls', functionCalls: response.functionCalls, chat };
        }
        return { type: 'text', text: response.text };
    } catch (error) {
        logger.error({ err: error }, 'Error sending function results');
        throw error;
    }
};

module.exports = { generateChatResponse, sendFunctionResults };
