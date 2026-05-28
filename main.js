// const { app, BrowserWindow } = require('electron');
// const path = require('path');
// const { fork } = require('child_process');

// let mainWindow;
// let backendProcess;

// function createWindow() {
//   mainWindow = new BrowserWindow({
//     width: 1280,
//     height: 800,
//     webPreferences: {
//       nodeIntegration: true,
//       contextIsolation: false,
//     },
//   });

//   if (!app.isPackaged) {
//     mainWindow.loadURL('http://localhost:5173');
//   } else {
//     mainWindow.loadFile(path.join(__dirname, 'JSchedulerW_frontend', 'dist', 'index.html'));
//   }
// }

// app.whenReady().then(() => {
//   // Lancement du backend uniquement en production (en dev, concurrently s'en charge)
//   if (app.isPackaged) {
//     const backendPath = path.join(__dirname, 'JSchedulerW_backend', 'server.js'); // Vérifie que c'est bien server.js !
    
//     backendProcess = fork(backendPath, [], {
//       cwd: path.join(__dirname, 'JSchedulerW_backend'),
//       env: { ...process.env, NODE_ENV: 'production' }
//     });

//     backendProcess.on('error', (err) => {
//       console.error('Erreur du backend en production:', err);
//     });
//   }

//   createWindow();

//   app.on('activate', function () {
//     if (BrowserWindow.getAllWindows().length === 0) createWindow();
//   });
// });

// app.on('window-all-closed', function () {
//   if (process.platform !== 'darwin') app.quit();
// });

// // Arrêter le backend quand l'utilisateur ferme l'appli
// app.on('before-quit', () => {
//   if (backendProcess) {
//     backendProcess.kill();
//   }
// });


const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'JSchedulerW_frontend', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  // Lancement du backend uniquement en production (en dev, concurrently s'en charge)
  if (app.isPackaged) {
    // 👇 MODIFICATION ICI : On remplace 'app.asar' par 'app.asar.unpacked' dans les chemins
    const unpackedDir = __dirname.replace('app.asar', 'app.asar.unpacked');
    const backendPath = path.join(unpackedDir, 'JSchedulerW_backend', 'server.js'); 
    
    backendProcess = fork(backendPath, [], {
      cwd: path.join(unpackedDir, 'JSchedulerW_backend'), // 👈 MODIFICATION ICI AUSSI
      env: { ...process.env, NODE_ENV: 'production' }
    });

    backendProcess.on('error', (err) => {
      console.error('Erreur du backend en production:', err);
    });
  }

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Arrêter le backend quand l'utilisateur ferme l'appli
app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});