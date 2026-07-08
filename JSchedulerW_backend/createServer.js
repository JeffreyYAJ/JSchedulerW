const express = require('express');
const cors = require('cors');
const path = require('path');
const setupDatabase = require('./database');
const createLogger = require('./logger');
const registerElevesRoutes = require('./routes/eleves');
const registerProgrammesRoutes = require('./routes/programmes');
const registerAffectationsRoutes = require('./routes/affectations');
const registerAdminRoutes = require('./routes/admin');

function createServer(dbFolder) {
    const { logToFile } = createLogger(dbFolder);
    const app = express();
    const apiRouter = express.Router();

    let db = null;
    const dbPath = () => path.join(dbFolder, 'database.db');

    app.use(express.json());
    app.use(cors());
    app.use('/api', apiRouter);

    apiRouter.get('/', (req, res) => {
        res.send('Ordonnanceur API is running!');
    });

    async function initDatabase() {
        db = await setupDatabase(dbFolder);
        logToFile('Database setup complete');
        return db;
    }

    async function reopenDatabase() {
        if (db) {
            await db.close();
        }
        db = await setupDatabase(dbFolder);
        logToFile('Database reopened after restore');
        return db;
    }

    function registerRoutes() {
        registerElevesRoutes(apiRouter, db);
        registerProgrammesRoutes(apiRouter, db);
        registerAffectationsRoutes(apiRouter, db);
        registerAdminRoutes(apiRouter, dbPath, reopenDatabase);
    }

    async function start(port = 3000) {
        logToFile('=== Backend starting in EMBEDDED mode ===');
        logToFile('customDbFolder:', dbFolder);

        await initDatabase();
        registerRoutes();

        return new Promise((resolve) => {
            const server = app.listen(port, () => {
                const msg = `Server is running embedded on http://localhost:${port}`;
                console.log(msg);
                logToFile(msg);
                resolve(server);
            });
        });
    }

    return {
        app,
        start,
        getDbPath: dbPath,
        reopenDatabase,
        logToFile,
    };
}

module.exports = createServer;
