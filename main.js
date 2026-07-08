const { app, BrowserWindow, nativeImage, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const createServer = require('./JSchedulerW_backend/createServer');

let mainWindow;
let embeddedServer;

const PORT = 3000;

function getDbFolder() {
    return app.isPackaged
        ? app.getPath('userData')
        : path.join(__dirname, 'JSchedulerW_backend');
}

function getAppIcon() {
    const iconPath = app.isPackaged
        ? path.join(__dirname, 'JSchedulerW_frontend', 'dist', 'logo.png')
        : path.join(__dirname, 'JSchedulerW_frontend', 'public', 'logo.png');

    if (!fs.existsSync(iconPath)) return undefined;
    return nativeImage.createFromPath(iconPath);
}

async function startEmbeddedServer() {
    embeddedServer = createServer(getDbFolder());
    await embeddedServer.start(PORT);
}

function createApplicationMenu() {
    const template = [
        {
            label: 'Fichier',
            submenu: [
                {
                    label: 'Sauvegarder la base de données...',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: () => mainWindow?.webContents.send('menu-backup'),
                },
                {
                    label: 'Restaurer la base de données...',
                    click: () => mainWindow?.webContents.send('menu-restore'),
                },
                { type: 'separator' },
                { role: 'quit', label: 'Quitter' },
            ],
        },
        {
            label: 'Édition',
            submenu: [
                { role: 'undo', label: 'Annuler' },
                { role: 'redo', label: 'Rétablir' },
                { role: 'cut', label: 'Couper' },
                { role: 'copy', label: 'Copier' },
                { role: 'paste', label: 'Coller' },
                { role: 'selectAll', label: 'Tout sélectionner' },
            ],
        },
        {
            label: 'Affichage',
            submenu: [
                { role: 'reload', label: 'Recharger' },
                { role: 'toggleDevTools', label: 'Outils de développement' },
                { type: 'separator' },
                { role: 'resetZoom', label: 'Zoom par défaut' },
                { role: 'zoomIn', label: 'Zoom avant' },
                { role: 'zoomOut', label: 'Zoom arrière' },
            ],
        },
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function registerIpcHandlers() {
    ipcMain.handle('backup-database', async () => {
        if (!embeddedServer) return { ok: false, error: 'Serveur non démarré' };

        const dbPath = embeddedServer.getDbPath();
        if (!fs.existsSync(dbPath)) {
            return { ok: false, error: 'Base de données introuvable' };
        }

        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Sauvegarder la base de données',
            defaultPath: `jwscheduler-backup-${new Date().toISOString().slice(0, 10)}.db`,
            filters: [{ name: 'SQLite', extensions: ['db'] }],
        });

        if (canceled || !filePath) return { ok: false, canceled: true };

        fs.copyFileSync(dbPath, filePath);
        return { ok: true, filePath };
    });

    ipcMain.handle('restore-database', async () => {
        if (!embeddedServer) return { ok: false, error: 'Serveur non démarré' };

        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            title: 'Restaurer la base de données',
            filters: [{ name: 'SQLite', extensions: ['db'] }],
            properties: ['openFile'],
        });

        if (canceled || !filePaths?.length) return { ok: false, canceled: true };

        const backupPath = filePaths[0];
        const dbPath = embeddedServer.getDbPath();
        const safetyBackup = path.join(path.dirname(dbPath), `database-before-restore-${Date.now()}.db`);

        if (fs.existsSync(dbPath)) {
            fs.copyFileSync(dbPath, safetyBackup);
        }
        fs.copyFileSync(backupPath, dbPath);

        await embeddedServer.reopenDatabase();
        return { ok: true, safetyBackup };
    });
}

function createWindow() {
    const icon = getAppIcon();

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: 'JW Scheduler',
        ...(icon && { icon }),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    if (!app.isPackaged) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        const indexPath = path.join(__dirname, 'JSchedulerW_frontend', 'dist', 'index.html');
        mainWindow.loadFile(indexPath);
    }

    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
        console.error('Page load failed:', errorCode, errorDescription, validatedURL);
    });
}

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

app.whenReady().then(async () => {
    createApplicationMenu();
    registerIpcHandlers();
    await startEmbeddedServer();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
