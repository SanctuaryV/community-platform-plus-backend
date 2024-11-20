// backend/src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const secret = 'token-for-join';

exports.authenticate = (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, secret);
        res.json({ status: 'ok', decoded });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
};

