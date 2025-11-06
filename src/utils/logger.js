// backend/src/utils/logger.js
// Logging utility for API calls and function tracking

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

class Logger {
    static apiStart(module, endpoint, data = {}) {
        console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
        console.log(`${colors.bright}[${module}] ${endpoint} API Called${colors.reset}`);
        console.log(`${colors.dim}Timestamp: ${new Date().toISOString()}${colors.reset}`);
        if (Object.keys(data).length > 0) {
            console.log(`${colors.blue}Request Data:${colors.reset}`, JSON.stringify(data, null, 2));
        }
    }

    static apiEnd(module, endpoint) {
        console.log(`${colors.bright}[${module}] ${endpoint} Complete${colors.reset}`);
        console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
    }

    static success(module, message, data = null) {
        console.log(`${colors.green}[${module}] ✓ ${message}${colors.reset}`);
        if (data) {
            console.log(`${colors.dim}${JSON.stringify(data)}${colors.reset}`);
        }
    }

    static error(module, message, error = null) {
        console.log(`${colors.red}[${module}] ❌ ${message}${colors.reset}`);
        if (error) {
            console.log(`${colors.red}Error:${colors.reset}`, error.message || error);
        }
    }

    static info(module, message, data = null) {
        console.log(`${colors.blue}[${module}] ℹ ${message}${colors.reset}`);
        if (data) {
            console.log(`${colors.dim}${JSON.stringify(data)}${colors.reset}`);
        }
    }

    static warn(module, message, data = null) {
        console.log(`${colors.yellow}[${module}] ⚠ ${message}${colors.reset}`);
        if (data) {
            console.log(`${colors.dim}${JSON.stringify(data)}${colors.reset}`);
        }
    }

    static query(sql, params = []) {
        console.log(`${colors.magenta}[DATABASE] Executing Query:${colors.reset}`);
        console.log(`${colors.dim}${sql}${colors.reset}`);
        if (params.length > 0) {
            console.log(`${colors.magenta}Parameters:${colors.reset}`, params);
        }
    }

    static socket(event, data = null) {
        console.log(`${colors.cyan}[SOCKET.IO] Event: ${event}${colors.reset}`);
        if (data) {
            console.log(`${colors.dim}${JSON.stringify(data)}${colors.reset}`);
        }
    }
}

module.exports = Logger;
