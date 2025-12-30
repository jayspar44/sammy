const admin = require('firebase-admin');

if (!admin.apps.length) {
    try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
            : {};

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin initialized successfully');
    } catch (error) {
        console.error('Firebase Admin initialization failed:', error.message);
        console.warn('Backend will start but Firebase features will fail.');
    }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
