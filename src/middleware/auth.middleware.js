// backend/src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'token-for-join';

exports.authenticate = (req, res) => {
    console.log('\n=== [AUTH MIDDLEWARE] Authenticate Called ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Authorization Header:', req.headers.authorization ? 'Present' : 'Missing');
    
    try {
        const token = req.headers.authorization.split(' ')[1];
        console.log('[AUTH MIDDLEWARE] Token extracted:', token.substring(0, 20) + '...');
        
        const decoded = jwt.verify(token, secret);
        console.log('[AUTH MIDDLEWARE] ✓ Token verified successfully');
        console.log('[AUTH MIDDLEWARE] Decoded payload:', decoded);
        console.log('=== [AUTH MIDDLEWARE] Authentication Complete ===\n');
        res.json({ status: 'ok', decoded });
    } catch (err) {
        console.log('[AUTH MIDDLEWARE] ❌ Token verification failed:', err.message);
        console.log('=== [AUTH MIDDLEWARE] Authentication Failed ===\n');
        res.json({ status: 'error', message: err.message });
    }
};

