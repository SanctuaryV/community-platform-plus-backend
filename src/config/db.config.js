// backend/src/config/db.config.js
const mysql = require('mysql2');

// Use connection pool instead of single connection
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql.communities-platform.svc.cluster.local',
    user: process.env.DB_USER || 'appuser',
    password: process.env.DB_PASS || 'apppass',
    database: process.env.DB_NAME || 'community_platform',
    port: process.env.DB_PORT || 3306,
    // Pool configuration
    waitForConnections: true,
    connectionLimit: 10,           // Max 10 connections
    maxIdle: 10,                   // Max idle connections
    idleTimeout: 60000,            // Close idle connections after 60s
    queueLimit: 0,                 // No limit on queued requests
    enableKeepAlive: true,         // Keep connections alive
    keepAliveInitialDelay: 0
});

// Handle pool errors
pool.on('error', (err) => {
    console.error('[DB] Pool error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('[DB] Connection lost, pool will recreate');
    }
});

module.exports = pool;
