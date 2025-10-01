// backend/src/config/db.config.js
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'community-platform-sg',
    port: process.env.DB_PORT || 3306,
});

module.exports = connection;
