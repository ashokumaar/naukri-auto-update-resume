const fs = require('fs');
const path = require('path');

const logFilePath = path.resolve(__dirname, '../application.log');
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

function setupLogger() {
    const separatorCount = 200;
    const separator = '='.repeat(separatorCount) + '\n';
    fs.appendFileSync(logFilePath, separator, 'utf8');

    const logToFile = (level, ...args) => {
        const timestamp = new Date().toISOString();
        const message = args.map(arg => {
            if (typeof arg === 'object' && arg !== null) {
                return JSON.stringify(arg);
            }
            return String(arg);
        }).join(' ');
        const logEntry = `${timestamp} [${level.toUpperCase()}] ${message}\n`;

        fs.appendFileSync(logFilePath, logEntry, 'utf8');
    };

    console.log = (...args) => {
        originalConsoleLog(...args);
        logToFile('info', ...args);
    };

    console.error = (...args) => {
        originalConsoleError(...args);
        logToFile('error', ...args);
    };

    console.warn = (...args) => {
        originalConsoleWarn(...args);
        logToFile('warn', ...args);
    };

    originalConsoleLog(`Logger initialized. All console output will also be saved to: ${logFilePath}`);
}

module.exports = { setupLogger };
