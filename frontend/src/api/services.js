import client from './client';
import { logger } from '../utils/logger';
import axios from 'axios';

const IS_SPOOF_DB = () => localStorage.getItem('sammy_pref_spoofDb') === 'true';

// Mock Data
// Helper to generate mock trends relative to a date
const generateMockTrends = (baseDateStr) => {
    const trends = [];
    const baseDate = new Date(baseDateStr);

    for (let i = 0; i < 30; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        // Random count between 0 and 5
        trends.push({
            date: dateStr,
            count: Math.floor(Math.random() * 6),
            limit: 2
        });
    }
    return trends;
};

// Helper to generate mock range stats
const generateMockRangeStats = (startDate, endDate) => {
    const mockData = {};
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        mockData[dateStr] = {
            today: { count: Math.floor(Math.random() * 5), limit: 2 },
            hasRecord: Math.random() > 0.3,
            trends: [{ date: dateStr, count: Math.floor(Math.random() * 5) }]
        };
    }
    return mockData;
};

const MOCK_STATS_BASE = {
    today: { count: 3, limit: 12 }, // Fixed today count
    insights: {
        moneySaved: 124,
        caloriesCut: 4500,
        dryStreak: 5
    }
};

const MOCK_PROFILE = {
    firstName: 'DevUser',
    email: 'dev@spoof.local',
    avgDrinkCost: 10,
    avgDrinkCals: 150,
    typicalWeek: {
        monday: 3,
        tuesday: 2,
        wednesday: 2,
        thursday: 4,
        friday: 6,
        saturday: 5,
        sunday: 1
    }
};

export const api = {
    // User Profile
    getUserProfile: async () => {
        if (IS_SPOOF_DB()) {
            logger.spoof('Getting User Profile', MOCK_PROFILE);
            return MOCK_PROFILE;
        }
        const response = await client.get('/user/profile');
        return response.data;
    },

    updateUserProfile: async (data) => {
        if (IS_SPOOF_DB()) {
            logger.spoof('Updating Profile', data);
            return { success: true };
        }
        const response = await client.post('/user/profile', data);
        return response.data;
    },

    // Logs
    logDrink: async (date, count) => {
        if (IS_SPOOF_DB()) {
            logger.spoof(`Log Drink: ${date} - ${count}`);
            return { success: true };
        }
        const response = await client.post('/log', { date, count });
        return response.data;
    },

    updateHistoricCount: async (date, newCountOrPayload) => {
        if (IS_SPOOF_DB()) {
            logger.spoof(`Update Historic: ${date}`, newCountOrPayload);
            return { success: true };
        }

        let payload = { date };
        if (typeof newCountOrPayload === 'object') {
            payload = { ...payload, ...newCountOrPayload };
        } else {
            payload.newCount = newCountOrPayload;
        }

        const response = await client.put('/log', payload);
        return response.data;
    },

    deleteLog: async (date) => {
        if (IS_SPOOF_DB()) {
            logger.spoof(`Delete Log: ${date}`);
            return { success: true };
        }
        const response = await client.delete('/log', { params: { date } });
        return response.data;
    },

    getStats: async (date) => {
        let dateStr = date;
        if (!dateStr) {
            dateStr = new Date().toISOString().split('T')[0];
        }

        if (IS_SPOOF_DB()) {
            logger.spoof(`Get Stats for ${dateStr}`);
            const trends = generateMockTrends(dateStr);
            // Calculate dynamic streak for accurate spoofing
            let dryStreak = 0;
            // Mock trends are generated [Today, Yesterday, ...] or similar order?
            // generateMockTrends creates 30 days. Let's assume order doesn't matter for find but does for streak.
            // Actually generateMockTrends pushes: Today, Yesterday... in order?
            // "d.setDate(baseDate.getDate() - i)" -> i=0 is Today.
            // So trends[0] is Today.

            for (const day of trends) {
                if (day.count === 0) {
                    dryStreak++;
                } else {
                    break;
                }
            }

            return {
                ...MOCK_STATS_BASE,
                trends,
                insights: {
                    ...MOCK_STATS_BASE.insights,
                    dryStreak
                }
            };
        }

        const response = await client.get(`/stats?date=${dateStr}`);
        return response.data;
    },

    getStatsRange: async (startDate, endDate) => {
        if (IS_SPOOF_DB()) {
            logger.spoof(`Get Stats Range ${startDate} to ${endDate}`);
            return generateMockRangeStats(startDate, endDate);
        }
        const response = await client.get(`/stats/range`, { params: { startDate, endDate } });
        return response.data;
    },

    // Chat
    getChatHistory: async () => {
        if (IS_SPOOF_DB()) {
            logger.spoof('Getting Chat History');
            return [];
        }
        const response = await client.get('/chat/history');
        return response.data;
    },

    clearChatHistory: async () => {
        if (IS_SPOOF_DB()) {
            logger.spoof('Clearing Chat History');
            return { success: true };
        }
        const response = await client.delete('/chat/history');
        return response.data;
    },

    sendMessage: async (message, date) => {
        if (IS_SPOOF_DB()) {
            logger.spoof(`Chat Message: ${message}`);
            return { reply: "I'm in Developer Mode! I can't really think right now, but you look great!" };
        }

        const dateStr = date || new Date().toISOString().split('T')[0];
        const response = await client.post('/chat', { message, date: dateStr });
        return response.data;
    },

    // Backend Health/Version
    getBackendHealth: async () => {
        if (IS_SPOOF_DB()) {
            logger.spoof('Getting Backend Health');
            return { status: 'ok', version: '0.10.9-spoof', timestamp: new Date().toISOString() };
        }
        // Use axios directly since /health is public (no auth needed)
        const baseURL = import.meta.env.VITE_API_URL || '/api';
        const response = await axios.get(`${baseURL}/health`);
        return response.data;
    },
};
