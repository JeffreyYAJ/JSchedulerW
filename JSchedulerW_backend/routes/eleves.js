function registerElevesRoutes(router, db) {
    router.get('/eleves', async (req, res) => {
        try {
            const eleves = await db.all('SELECT * FROM Eleves');
            res.json(eleves);
        } catch {
            res.status(500).json({ error: 'Erreur lors de la récupération des élèves' });
        }
    });

    router.get('/eleves/prioritaires', async (req, res) => {
        const { genre } = req.query;
        try {
            let sqlQuery = `
                SELECT * FROM Eleves
                WHERE (date_dernier_expose IS NULL OR date_dernier_expose <= date('now', '-3 months'))
            `;
            const params = [];
            if (genre === 'H' || genre === 'F') {
                sqlQuery += ' AND genre = ?';
                params.push(genre);
            }
            sqlQuery += ' ORDER BY date_dernier_expose ASC';

            const prioritaires = await db.all(sqlQuery, params);
            res.json(prioritaires);
        } catch {
            res.status(500).json({ error: 'Erreur lors de la vérification des priorités' });
        }
    });

    router.get('/eleves/:id/historique', async (req, res) => {
        const { id } = req.params;
        try {
            const historique = await db.all(`
                SELECT a.id as affectation_id, a.type_expose, a.role,
                       p.date_debut_semaine, p.date_fin_semaine
                FROM Affectations a
                JOIN Programmes p ON a.id_programme = p.id
                WHERE a.id_eleve = ?
                ORDER BY p.date_debut_semaine DESC
            `, [id]);
            res.json(historique);
        } catch {
            res.status(500).json({ error: "Erreur lors de la récupération de l'historique" });
        }
    });

    router.get('/eleves/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const eleve = await db.get('SELECT * FROM Eleves WHERE id = ?', [id]);
            if (!eleve) return res.status(404).json({ error: 'Élève non trouvé' });
            res.json(eleve);
        } catch {
            res.status(500).json({ error: "Erreur lors de la récupération de l'élève" });
        }
    });

    router.post('/eleves', async (req, res) => {
        const { nom, genre, date_dernier_expose } = req.body;
        if (!nom || !genre || (genre !== 'H' && genre !== 'F')) {
            return res.status(400).json({ error: 'Nom et genre (H ou F) valides sont requis' });
        }
        try {
            const result = await db.run(
                'INSERT INTO Eleves (nom, genre, date_dernier_expose) VALUES (?, ?, ?)',
                [nom, genre, date_dernier_expose || null]
            );
            res.status(201).json({ message: 'Élève ajouté', id: result.lastID });
        } catch {
            res.status(500).json({ error: "Erreur lors de l'ajout de l'élève" });
        }
    });

    router.put('/eleves/:id', async (req, res) => {
        const { id } = req.params;
        const { nom, genre, date_dernier_expose } = req.body;
        if (!nom || !genre || (genre !== 'H' && genre !== 'F')) {
            return res.status(400).json({ error: 'Nom et genre (H ou F) valides sont requis' });
        }
        try {
            const result = await db.run(
                'UPDATE Eleves SET nom = ?, genre = ?, date_dernier_expose = ? WHERE id = ?',
                [nom, genre, date_dernier_expose || null, id]
            );
            if (result.changes === 0) return res.status(404).json({ error: 'Élève non trouvé' });
            res.json({ message: 'Élève mis à jour avec succès' });
        } catch {
            res.status(500).json({ error: "Erreur lors de la mise à jour de l'élève" });
        }
    });

    router.delete('/eleves/:id', async (req, res) => {
        const { id } = req.params;
        try {
            await db.run('DELETE FROM Affectations WHERE id_eleve = ?', [id]);
            const result = await db.run('DELETE FROM Eleves WHERE id = ?', [id]);
            if (result.changes === 0) return res.status(404).json({ error: 'Élève non trouvé' });
            res.json({ message: 'Élève supprimé avec succès' });
        } catch {
            res.status(500).json({ error: "Erreur lors de la suppression de l'élève" });
        }
    });
}

module.exports = registerElevesRoutes;
