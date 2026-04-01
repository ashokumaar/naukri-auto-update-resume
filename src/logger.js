const fs = require('fs');
const path = require('path');

const logFilePath = path.resolve(__dirname, '../application.log');
const currentRunLogFilePath = path.resolve(__dirname, '../current_run.log');
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

function setupLogger() {
    const separatorCount = 200;
    const separator = '='.repeat(separatorCount) + '\n';

    const executionStartTime = new Date().toLocaleString();

    fs.appendFileSync(logFilePath, separator, 'utf8');

    fs.writeFileSync(currentRunLogFilePath, `--- Execution Started: ${executionStartTime} ---\n`, 'utf8');

    const logToFile = (level, ...args) => {
        const timestamp = new Date().toLocaleString();
        const message = args.map(arg => {
            if (typeof arg === 'object' && arg !== null) {
                return JSON.stringify(arg);
            }
            return String(arg);
        }).join(' ');
        const logEntry = `${timestamp} [${level.toUpperCase()}] ${message}\n`;

        // Append to main historical log
        fs.appendFileSync(logFilePath, logEntry, 'utf8');
        // Append to current execution log
        fs.appendFileSync(currentRunLogFilePath, logEntry, 'utf8');
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

    originalConsoleLog(`Logger initialized. All console output will also be saved to: ${logFilePath} and ${currentRunLogFilePath}`);
}

function getCurrentRunLogPath() {
    return currentRunLogFilePath;
}

module.exports = { setupLogger, getCurrentRunLogPath };
