const createServer = require('./createServer');

const dbFolder = process.env.JWSCHEDULER_DB_FOLDER || __dirname;
const PORT = process.env.PORT || 3000;

createServer(dbFolder).start(PORT).catch((err) => {
    console.error('Failed to start standalone server:', err);
    process.exit(1);
});
