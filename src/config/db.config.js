// backend/src/config/db.config.js
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'community-platform-sg',
});

module.exports = connection;
