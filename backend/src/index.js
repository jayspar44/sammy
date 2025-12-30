require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pino } = require('pino');

const app = express();
const logger = pino();

const apiRoutes = require('./routes/api');

// Middleware
app.use(cors());
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
