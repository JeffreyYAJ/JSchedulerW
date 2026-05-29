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
const { fork, spawn } = require('child_process');


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
  // Lancement du backend uniquement en production
  if (app.isPackaged) {
    const { utilityProcess } = require('electron');
    
    const unpackedDir = __dirname.replace('app.asar', 'app.asar.unpacked');
    const backendPath = path.join(unpackedDir, 'JSchedulerW_backend', 'server.js'); 
    
    // Dossier d'écriture sécurisé fourni par Electron (Ex: ~/.config/JWScheduler-desktop/ sur Linux)
    const secureDataPath = app.getPath('userData');

    console.log("=== LANCEMENT DU BACKEND ===");
    console.log("Dossier de stockage BDD sécurisé :", secureDataPath);
    console.log("Backend path:", backendPath);

    try {
      // Utiliser utilityProcess.fork() avec les paramètres corrects
      backendProcess = utilityProcess.fork(backendPath, [secureDataPath]);

      backendProcess.on('spawn', () => {
        console.log('✅ Le processus Backend est actif et sécurisé !');
      });

      backendProcess.on('exit', (code) => {
        console.log(`ℹ️ Le backend s'est arrêté. Code de sortie: ${code}`);
      });

      backendProcess.on('error', (err) => {
        console.error('❌ Erreur du backend en production:', err);
      });

      backendProcess.on('message', (msg) => {
        console.log('Backend message:', msg);
      });
    } catch (err) {
      console.error('❌ Erreur lors du lancement du backend:', err);
    }
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