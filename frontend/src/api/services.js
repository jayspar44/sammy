import axios from 'axios';
import client from './client';
import { logger } from '../utils/logger';

const IS_SPOOF_DB = () => localStorage.getItem('sammy_pref_spoofDb') === 'true';

// Public API client (no auth required) - used for health endpoint before Firebase init
const publicClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 5000,
});

/**
 * Get backend health info (public endpoint, no auth required)
 * @returns {Promise<{status: string, version: string, serverStartTime: string}|null>}
 */
export const getHealth = async () => {
    try {
        const response = await publicClient.get('/health');
        return response.data;
    } catch {
        return null;
    }
};

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

// Helper to generate mock cumulative stats
const generateMockCumulativeStats = (baseDateStr, range) => {
    const days = range === 'all' ? 180 : 90;
    const series = [];
    const baseDate = new Date(baseDateStr);
    let cumulative = 0;

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        // Random daily savings between -2 and 3
        const daily = Math.floor(Math.random() * 6) - 2;
        cumulative += daily;
        series.push({ date: dateStr, cumulative, daily });
    }

    const weeks = days / 7;
    return {
        series,
        summary: {
            totalSaved: cumulative,
            totalDays: days,
            avgPerWeek: Math.round((cumulative / weeks) * 10) / 10
        },
        mode: 'target',
        range,
        hasTypicalWeek: true
    };
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

    sendMessage: async (message, date, context = null) => {
        if (IS_SPOOF_DB()) {
            logger.spoof(`Chat Message: ${message}`, { context });
            return { text: "I'm in Developer Mode! I can't really think right now, but you look great!" };
        }

        const dateStr = date || new Date().toISOString().split('T')[0];
        const payload = { message, date: dateStr };
        if (context) {
            payload.context = context;
        }
        const response = await client.post('/chat', payload);
        return response.data;
    },

    getCumulativeStats: async (mode = 'target', range = '90d', date) => {
        let dateStr = date;
        if (!dateStr) {
            dateStr = new Date().toISOString().split('T')[0];
        }

        if (IS_SPOOF_DB()) {
            logger.spoof(`Get Cumulative Stats: mode=${mode}, range=${range}`);
            return generateMockCumulativeStats(dateStr, range);
        }

        const response = await client.get('/stats/cumulative', {
            params: { mode, range, date: dateStr }
        });
        return response.data;
    },

    getAllTimeStats: async (date) => {
        let dateStr = date;
        if (!dateStr) {
            dateStr = new Date().toISOString().split('T')[0];
        }

        if (IS_SPOOF_DB()) {
            logger.spoof('Get All-Time Stats');
            return {
                moneySaved: 2500,
                caloriesCut: 37500,
                drinksSaved: 250,
                totalDays: 180,
                registeredDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
            };
        }

        const response = await client.get('/stats/all-time', {
            params: { date: dateStr }
        });
        return response.data;
    },

    getMilestones: async (date) => {
        let dateStr = date;
        if (!dateStr) {
            dateStr = new Date().toISOString().split('T')[0];
        }

        if (IS_SPOOF_DB()) {
            logger.spoof('Get Milestones');
            return {
                milestones: [
                    { id: 'streak_7', type: 'dry_streak', threshold: 7, label: '1 Week Dry', icon: 'flame', currentValue: 10, progress: 100, isUnlocked: true, unlockedAt: new Date().toISOString() },
                    { id: 'streak_14', type: 'dry_streak', threshold: 14, label: '2 Weeks Dry', icon: 'flame', currentValue: 10, progress: 71, isUnlocked: false, unlockedAt: null },
                    { id: 'streak_30', type: 'dry_streak', threshold: 30, label: '1 Month Dry', icon: 'trophy', currentValue: 10, progress: 33, isUnlocked: false, unlockedAt: null },
                    { id: 'drinks_10', type: 'drinks_saved', threshold: 10, label: '10 Drinks Saved', icon: 'star', currentValue: 50, progress: 100, isUnlocked: true, unlockedAt: new Date().toISOString() },
                    { id: 'drinks_50', type: 'drinks_saved', threshold: 50, label: '50 Drinks Saved', icon: 'star', currentValue: 50, progress: 100, isUnlocked: true, unlockedAt: new Date().toISOString() },
                    { id: 'drinks_100', type: 'drinks_saved', threshold: 100, label: '100 Drinks Saved', icon: 'medal', currentValue: 50, progress: 50, isUnlocked: false, unlockedAt: null },
                    { id: 'money_100', type: 'money_saved', threshold: 100, label: '$100 Saved', icon: 'wallet', currentValue: 500, progress: 100, isUnlocked: true, unlockedAt: new Date().toISOString() },
                    { id: 'money_500', type: 'money_saved', threshold: 500, label: '$500 Saved', icon: 'wallet', currentValue: 500, progress: 100, isUnlocked: true, unlockedAt: new Date().toISOString() },
                    { id: 'money_1000', type: 'money_saved', threshold: 1000, label: '$1K Saved', icon: 'piggy-bank', currentValue: 500, progress: 50, isUnlocked: false, unlockedAt: null },
                ],
                newlyUnlocked: [],
                stats: { currentStreak: 10, longestStreak: 10, drinksSaved: 50, moneySaved: 500, caloriesCut: 7500 }
            };
        }

        const response = await client.get('/user/milestones', {
            params: { date: dateStr }
        });
        return response.data;
    },
};
