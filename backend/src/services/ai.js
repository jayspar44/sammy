const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../logger');

let model;

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    logger.fatal('GEMINI_API_KEY is not set in backend/.env');
}

const genAI = new GoogleGenerativeAI(apiKey || 'dummy_key');
// Initialize strictly if key exists, otherwise model remains undefined but we logged the error.
model = apiKey ? genAI.getGenerativeModel({ model: "gemini-2.5-flash" }) : null;

const generateResponse = async (prompt) => {
    if (!model) throw new Error('Gemini API Key is missing or invalid. Check backend logs.');

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        logger.error({ err: error }, 'Error generating AI response');
        throw error;
    }
};

module.exports = { generateResponse };
