require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { pino } = require('pino');

const app = express();
const logger = pino();

const apiRoutes = require('./routes/api');

// Security Middleware
app.use(helmet());

// Global Rate Limiting (DDoS protection)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// CORS Configuration
app.use(cors({
    origin: [
        'https://sammy-658.ue.r.appspot.com',
        'https://dev-dot-sammy-658.ue.r.appspot.com',
        'capacitor://localhost',
        'http://localhost:4000', // Local frontend dev
        'http://localhost:5173'  // Vite local default
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    logger.info({ method: req.method, url: req.url }, 'Request received');
    next();
});

// Routes
app.use('/api', apiRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send('Sammy Backend Running');
});

// Start server
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    console.log(`Server running on port ${PORT}`);
});
