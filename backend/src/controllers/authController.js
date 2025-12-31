const { auth, isReady } = require('../services/firebase');

const verifyToken = async (req, res, next) => {
    // DEV/OFFLINE MODE: If Firebase isn't ready or we are in dev without a token, mock the user
    if (!isReady || (process.env.NODE_ENV !== 'production' && !req.headers.authorization)) {
        req.user = { uid: 'dev-user', email: 'dev@example.com' };
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = { verifyToken };
