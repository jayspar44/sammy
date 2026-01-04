const pino = require('pino');

// Default to pretty-print unless explicitly in production
const isProd = process.env.NODE_ENV === 'production';

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    ...(!isProd && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                ignore: 'pid,hostname',
                translateTime: 'HH:MM:ss'
            }
        }
    }),
    // Minimal output in production
    ...(isProd && {
        formatters: {
            level: (label) => ({ level: label })
        },
        timestamp: () => `,"time":"${new Date().toISOString()}"`
    })
});

module.exports = logger;
