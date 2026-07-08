export async function backupDatabase(): Promise<{ ok: boolean; message: string }> {
  if (window.electronAPI) {
    const result = await window.electronAPI.backupDatabase();
    if (result.canceled) return { ok: false, message: 'Sauvegarde annulée' };
    if (!result.ok) return { ok: false, message: result.error || 'Erreur de sauvegarde' };
    return { ok: true, message: `Sauvegarde enregistrée : ${result.filePath}` };
  }

  const response = await fetch('http://localhost:3000/api/admin/backup');
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Erreur de sauvegarde');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `jwscheduler-backup-${new Date().toISOString().slice(0, 10)}.db`;
  link.click();
  URL.revokeObjectURL(url);
  return { ok: true, message: 'Sauvegarde téléchargée' };
}

export async function restoreDatabase(): Promise<{ ok: boolean; message: string; reload?: boolean }> {
  if (window.electronAPI) {
    const confirmed = window.confirm(
      'Restaurer une sauvegarde remplacera toutes les données actuelles. Continuer ?'
    );
    if (!confirmed) return { ok: false, message: 'Restauration annulée' };

    const result = await window.electronAPI.restoreDatabase();
    if (result.canceled) return { ok: false, message: 'Restauration annulée' };
    if (!result.ok) return { ok: false, message: result.error || 'Erreur de restauration' };
    return { ok: true, message: 'Base de données restaurée avec succès', reload: true };
  }

  return {
    ok: false,
    message: 'La restauration nécessite l\'application desktop Electron (menu Fichier > Restaurer).',
  };
}
