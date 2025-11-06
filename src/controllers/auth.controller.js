// backend/src/controllers/auth.controller.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connection = require('../config/db.config');
const secret = process.env.JWT_SECRET || 'token-for-join';

const saltRounds = 10;

exports.register = (req, res) => {
    console.log('\n=== [AUTH] Register API Called ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request Body:', { name: req.body.name, email: req.body.email, password: '***' });
    
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        if (err) {
            console.log('[AUTH] ❌ Password hashing failed:', err.message);
            return res.json({ status: 'error', message: err });
        }
        console.log('[AUTH] ✓ Password hashed successfully');
        
        connection.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [req.body.name, req.body.email, hash],
            function (err, results, fields) {
                if (err) {
                    console.log('[AUTH] ❌ Database insert failed:', err.message);
                    return res.json({ status: 'error', message: err });
                }
                console.log('[AUTH] ✓ User registered successfully, ID:', results.insertId);
                console.log('=== [AUTH] Register Complete ===\n');
                res.json({ status: 'ok' });
            }
        );
    });
};

exports.login = (req, res) => {
    console.log('\n=== [AUTH] Login API Called ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request Body:', { email: req.body.email, password: '***' });
    
    connection.execute(
        'SELECT * FROM users WHERE email=?',
        [req.body.email],
        function (err, user) {
            if (err) {
                console.log('[AUTH] ❌ Database query failed:', err.message);
                return res.json({ status: 'error', message: err });
            }
            if (user.length == 0) {
                console.log('[AUTH] ❌ No user found with email:', req.body.email);
                return res.json({ status: 'error', message: 'no user found' });
            }
            console.log('[AUTH] ✓ User found:', { email: user[0].email, name: user[0].name });
            
            bcrypt.compare(req.body.password, user[0].password, function (err, isLogin) {
                if (isLogin) {
                    var id_user = user[0].user_id;
                    var email = user[0].email;
                    var created = user[0].created_at;
                    var avatar_url = user[0].avatar_url;
                    var name = user[0].name
                    var token = jwt.sign({ email: user[0].email }, secret, { expiresIn: '1h' });
                    console.log('[AUTH] ✓ Password verified successfully');
                    console.log('[AUTH] ✓ JWT token generated');
                    console.log('[AUTH] User data:', { id_user, email, name });
                    console.log('=== [AUTH] Login Complete ===\n');
                    res.json({ status: 'ok', message: 'login success', token, id_user, email, created, avatar_url, name });
                } else {
                    console.log('[AUTH] ❌ Password verification failed');
                    console.log('=== [AUTH] Login Failed ===\n');
                    res.json({ status: 'error', message: 'wrong password' });
                }
            });
        }
    );
};
