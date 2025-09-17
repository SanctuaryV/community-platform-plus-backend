// backend/src/config/db.config.js
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'host.docker.internal',
    user: 'root',
    password: 'root',
    database: 'community-platform-sg',
});

module.exports = connection;
