// backend/src/config/db.config.js
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'lmag6s0zwmcswp5w.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    user: 'm7o5775w8sxklp9m',
    password: 'jvrkixkgcha2jpom',
    database: 't4en7l6c7ymoemy2',
});

module.exports = connection;
