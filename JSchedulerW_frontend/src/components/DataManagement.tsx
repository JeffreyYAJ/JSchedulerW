import { useState, useEffect } from 'react';
import { Database, HardDriveDownload, HardDriveUpload } from 'lucide-react';
import { backupDatabase, restoreDatabase } from '../lib/backup';

const DataManagement = () => {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState<'backup' | 'restore' | null>(null);

  useEffect(() => {
    if (!window.electronAPI) return;

    const unsubBackup = window.electronAPI.onMenuBackup(() => handleBackup());
    const unsubRestore = window.electronAPI.onMenuRestore(() => handleRestore());

    return () => {
      unsubBackup();
      unsubRestore();
    };
  }, []);

  const handleBackup = async () => {
    setLoading('backup');
    setMessage(null);
    try {
      const result = await backupDatabase();
      setMessage({ type: result.ok ? 'success' : 'error', text: result.message });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erreur' });
    } finally {
      setLoading(null);
    }
  };

  const handleRestore = async () => {
    setLoading('restore');
    setMessage(null);
    try {
      const result = await restoreDatabase();
      setMessage({ type: result.ok ? 'success' : 'error', text: result.message });
      if (result.reload) {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erreur' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="pt-6 border-t border-slate-100">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Database size={14} /> Données
      </p>

      {message && (
        <p className={`text-xs mb-2 ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {message.text}
        </p>
      )}

      <div className="space-y-1">
        <button
          onClick={handleBackup}
          disabled={loading !== null}
          className="w-full flex items-center gap-3 text-slate-500 font-semibold p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm disabled:opacity-50"
        >
          <HardDriveDownload size={16} />
          {loading === 'backup' ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
        <button
          onClick={handleRestore}
          disabled={loading !== null}
          className="w-full flex items-center gap-3 text-slate-500 font-semibold p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm disabled:opacity-50"
        >
          <HardDriveUpload size={16} />
          {loading === 'restore' ? 'Restauration...' : 'Restaurer'}
        </button>
      </div>
    </div>
  );
};

export default DataManagement;
