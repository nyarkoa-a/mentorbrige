const express = require('express');

const router = express.Router();

// Fallback when .env is not configured (matches public/js/firebase-config.js)
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAu7PoqMlQhTX06GQPjpxvns7_FI1lf2fU',
  authDomain: 'mentorbridge-f551b.firebaseapp.com',
  projectId: 'mentorbridge-f551b',
  storageBucket: 'mentorbridge-f551b.firebasestorage.app',
  messagingSenderId: '642326772429',
  appId: '1:642326772429:web:74a10c3d81d6ef1876c784',
  measurementId: 'G-05NWWSDQGW'
};

router.get('/firebase', (_req, res) => {
  const config = {
    apiKey: process.env.FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
    projectId: process.env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
    appId: process.env.FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId
  };

  res.json(config);
});

module.exports = router;
