// backend/src/config/db.config.js
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'mysql.communities-platform.svc.cluster.local',
    user: process.env.DB_USER || 'appuser',
    password: process.env.DB_PASS || 'apppass',
    database: process.env.DB_NAME || 'community_platform',
    port: process.env.DB_PORT || 3306,
});

module.exports = connection;
