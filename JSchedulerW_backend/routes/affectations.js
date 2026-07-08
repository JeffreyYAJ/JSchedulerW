const { validateAffectation, recalculateEleveDate } = require('../affectationRules');

function registerAffectationsRoutes(router, db) {
    router.post('/affectations', async (req, res) => {
        const { id_programme, id_eleve, type_expose, role } = req.body;
        try {
            const validation = await validateAffectation(db, { id_programme, id_eleve, type_expose, role });
            if (!validation.ok) {
                return res.status(validation.status).json({ error: validation.error });
            }

            const { programme, role: resolvedRole } = validation;
            const result = await db.run(
                'INSERT INTO Affectations (id_programme, id_eleve, type_expose, role) VALUES (?, ?, ?, ?)',
                [id_programme, id_eleve, type_expose, resolvedRole]
            );
            await db.run(
                'UPDATE Eleves SET date_dernier_expose = ? WHERE id = ?',
                [programme.date_debut_semaine, id_eleve]
            );

            res.status(201).json({
                message: "Affectation réussie et date de l'élève mise à jour !",
                id: result.lastID,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Erreur lors de l'affectation" });
        }
    });

    router.put('/affectations/:id', async (req, res) => {
        const { id } = req.params;
        const { id_eleve } = req.body;

        if (!id_eleve) {
            return res.status(400).json({ error: 'id_eleve est requis pour modifier une affectation.' });
        }

        try {
            const existing = await db.get('SELECT * FROM Affectations WHERE id = ?', [id]);
            if (!existing) return res.status(404).json({ error: 'Affectation non trouvée' });

            const oldEleveId = existing.id_eleve;
            const validation = await validateAffectation(
                db,
                {
                    id_programme: existing.id_programme,
                    id_eleve,
                    type_expose: existing.type_expose,
                    role: existing.role,
                },
                parseInt(id, 10)
            );

            if (!validation.ok) {
                return res.status(validation.status).json({ error: validation.error });
            }

            const { programme } = validation;
            await db.run('UPDATE Affectations SET id_eleve = ? WHERE id = ?', [id_eleve, id]);

            await recalculateEleveDate(db, oldEleveId);
            await db.run(
                'UPDATE Eleves SET date_dernier_expose = ? WHERE id = ?',
                [programme.date_debut_semaine, id_eleve]
            );

            res.json({ message: 'Affectation modifiée avec succès' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Erreur lors de la modification de l'affectation" });
        }
    });

    router.delete('/affectations/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const existing = await db.get('SELECT * FROM Affectations WHERE id = ?', [id]);
            if (!existing) return res.status(404).json({ error: 'Affectation non trouvée' });

            await db.run('DELETE FROM Affectations WHERE id = ?', [id]);
            await recalculateEleveDate(db, existing.id_eleve);

            res.json({ message: 'Affectation supprimée' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Erreur lors de la suppression de l'affectation" });
        }
    });
}

module.exports = registerAffectationsRoutes;
