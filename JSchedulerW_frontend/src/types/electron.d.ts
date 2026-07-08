export interface ElectronAPI {
  backupDatabase: () => Promise<{ ok: boolean; filePath?: string; canceled?: boolean; error?: string }>;
  restoreDatabase: () => Promise<{ ok: boolean; safetyBackup?: string; canceled?: boolean; error?: string }>;
  onMenuBackup: (callback: () => void) => () => void;
  onMenuRestore: (callback: () => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
