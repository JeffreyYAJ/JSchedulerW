const { app, BrowserWindow } = require('electron');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // On charge le frontend Vite qui tourne déjà grâce à concurrently
  mainWindow.loadURL('http://localhost:5173'); 
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// const { app, BrowserWindow } = require('electron');
// const path = require('path');
// const { fork } = require('child_process');
// 
// let mainWindow;
// let serverProcess;
// 
// function createWindow() {
//   mainWindow = new BrowserWindow({
//     width: 1280,
//     height: 800,
//     webPreferences: {
//       nodeIntegration: true,
//       contextIsolation: false,
//     },
//   });
// 
//   const isDev = !app.isPackaged;
// 
//   if (isDev) {
//     mainWindow.loadURL('http://localhost:5173'); 
//   } else {
//     mainWindow.loadFile(path.join(__dirname, 'JSchedulerW_frontend', 'dist', 'index.html')); 
//   }
// }
// 
// app.whenReady().then(() => {
//   // 1. DÉMARRER LE BACKEND (On pointe vers le sous-dossier 'backend')
//   const backendPath = path.join(__dirname, 'JSchedulerW_backend', 'server.js'); s
//   
//   // On lance le backend avec fork
//   serverProcess = fork(backendPath, [], {
//     cwd: path.join(__dirname, 'JSchedulerW'), // Très important: définit le dossier de travail du backend
//     env: process.env 
//   });
// 
//   serverProcess.on('error', (err) => {
//     console.error('Erreur de démarrage du backend:', err);
//   });
// 
//   // 2. CRÉER LA FENÊTRE
//   createWindow();
// 
//   app.on('activate', function () {
//     if (BrowserWindow.getAllWindows().length === 0) createWindow();
//   });
// });
// 
// app.on('window-all-closed', function () {
//   if (process.platform !== 'darwin') app.quit();
// });
// app.on('before-quit', () => {
//   if (serverProcess) {
//     serverProcess.kill();
//   }
// });
