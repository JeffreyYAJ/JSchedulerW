const fs = require('fs');
const path = require('path');

function registerAdminRoutes(router, getDbPath, reopenDatabase) {
    router.get('/admin/backup', (req, res) => {
        try {
            const dbPath = getDbPath();
            if (!fs.existsSync(dbPath)) {
                return res.status(404).json({ error: 'Base de données introuvable' });
            }
            const filename = `jwscheduler-backup-${new Date().toISOString().slice(0, 10)}.db`;
            res.download(dbPath, filename);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
        }
    });

    router.post('/admin/restore', async (req, res) => {
        try {
            const { backupPath } = req.body;
            if (!backupPath || !fs.existsSync(backupPath)) {
                return res.status(400).json({ error: 'Fichier de sauvegarde invalide' });
            }

            const dbPath = getDbPath();
            const backupCopy = path.join(path.dirname(dbPath), `database-before-restore-${Date.now()}.db`);
            if (fs.existsSync(dbPath)) {
                fs.copyFileSync(dbPath, backupCopy);
            }
            fs.copyFileSync(backupPath, dbPath);

            await reopenDatabase();
            res.json({ message: 'Base de données restaurée avec succès', safetyBackup: backupCopy });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de la restauration' });
        }
    });
}

module.exports = registerAdminRoutes;
