const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    backupDatabase: () => ipcRenderer.invoke('backup-database'),
    restoreDatabase: () => ipcRenderer.invoke('restore-database'),
    onMenuBackup: (callback) => {
        ipcRenderer.on('menu-backup', callback);
        return () => ipcRenderer.removeListener('menu-backup', callback);
    },
    onMenuRestore: (callback) => {
        ipcRenderer.on('menu-restore', callback);
        return () => ipcRenderer.removeListener('menu-restore', callback);
    },
});
