const fs = require('fs');
const path = require('path');

function createLogger(logFolder) {
    const logFile = path.join(logFolder, 'backend.log');

    function logToFile(...args) {
        const msg = `[${new Date().toISOString()}] `
            + args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a, null, 2))).join(' ')
            + '\n';
        try {
            fs.appendFileSync(logFile, msg);
        } catch {
            /* ignore */
        }
    }

    return { logFile, logToFile };
}

module.exports = createLogger;
