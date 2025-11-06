// backend/src/controllers/auth.controller.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connection = require('../config/db.config');
const secret = process.env.JWT_SECRET || 'token-for-join';

const saltRounds = 10;

exports.register = (req, res) => {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        if (err) {
            return res.json({ status: 'error', message: err });
        }
        connection.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [req.body.name, req.body.email, hash],
            function (err, results, fields) {
                if (err) {
                    return res.json({ status: 'error', message: err });
                }
                res.json({ status: 'ok' });
            }
        );
    });
};

exports.login = (req, res) => {
    connection.execute(
        'SELECT * FROM users WHERE email=?',
        [req.body.email],
        function (err, user) {
            if (err) {
                return res.json({ status: 'error', message: err });
            }
            if (user.length == 0) {
                return res.json({ status: 'error', message: 'no user found' });
            }
            bcrypt.compare(req.body.password, user[0].password, function (err, isLogin) {
                if (isLogin) {
                    var id_user = user[0].user_id;
                    var email = user[0].email;
                    var created = user[0].created_at;
                    var avatar_url = user[0].avatar_url;
                    var name = user[0].name
                    var token = jwt.sign({ email: user[0].email }, secret, { expiresIn: '1h' });
                    res.json({ status: 'ok', message: 'login success', token, id_user, email, created, avatar_url, name });
                } else {
                    res.json({ status: 'error', message: 'wrong password' });
                }
            });
        }
    );
};
