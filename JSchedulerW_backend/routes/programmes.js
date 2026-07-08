function formatLocal(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function registerProgrammesRoutes(router, db) {
    router.post('/programmes', async (req, res) => {
        const { date_debut_semaine, date_fin_semaine, contient_discours } = req.body;
        if (!date_debut_semaine || !date_fin_semaine) {
            return res.status(400).json({ error: 'Les dates de début et de fin de semaine sont requises.' });
        }
        try {
            const result = await db.run(
                'INSERT INTO Programmes (date_debut_semaine, date_fin_semaine, contient_discours) VALUES (?, ?, ?)',
                [date_debut_semaine, date_fin_semaine, contient_discours ? 1 : 0]
            );
            res.status(201).json({ id: result.lastID });
        } catch {
            res.status(500).json({ error: 'Erreur lors de la création du programme' });
        }
    });

    router.get('/programmes', async (req, res) => {
        try {
            const programmes = await db.all('SELECT * FROM Programmes ORDER BY date_debut_semaine DESC');
            res.json(programmes);
        } catch {
            res.status(500).json({ error: 'Erreur lors de la récupération des programmes' });
        }
    });

    router.get('/programmes/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const programme = await db.get('SELECT * FROM Programmes WHERE id = ?', [id]);
            if (!programme) return res.status(404).json({ error: 'Programme non trouvé' });
            programme.contient_discours = programme.contient_discours === 1;
            res.json(programme);
        } catch {
            res.status(500).json({ error: 'Erreur lors de la récupération du programme' });
        }
    });

    router.put('/programmes/:id', async (req, res) => {
        const { id } = req.params;
        const { date_debut_semaine, date_fin_semaine, contient_discours } = req.body;
        if (!date_debut_semaine || !date_fin_semaine) {
            return res.status(400).json({ error: 'Les dates de début et de fin sont requises' });
        }
        try {
            const result = await db.run(
                'UPDATE Programmes SET date_debut_semaine = ?, date_fin_semaine = ?, contient_discours = ? WHERE id = ?',
                [date_debut_semaine, date_fin_semaine, contient_discours ? 1 : 0, id]
            );
            if (result.changes === 0) return res.status(404).json({ error: 'Programme non trouvé' });
            res.json({ message: 'Programme mis à jour' });
        } catch {
            res.status(500).json({ error: 'Erreur lors de la mise à jour' });
        }
    });

    router.delete('/programmes/:id', async (req, res) => {
        const { id } = req.params;
        try {
            await db.run('DELETE FROM Affectations WHERE id_programme = ?', [id]);
            const result = await db.run('DELETE FROM Programmes WHERE id = ?', [id]);
            if (result.changes === 0) return res.status(404).json({ error: 'Programme non trouvé' });
            res.json({ message: 'Programme supprimé' });
        } catch {
            res.status(500).json({ error: 'Erreur lors de la suppression' });
        }
    });

    router.get('/programmes/:id_programme/affectations', async (req, res) => {
        const { id_programme } = req.params;
        try {
            const planning = await db.all(`
                SELECT a.id as affectation_id, a.type_expose, a.role, e.id as eleve_id, e.nom, e.genre
                FROM Affectations a
                JOIN Eleves e ON a.id_eleve = e.id
                WHERE a.id_programme = ?
                ORDER BY a.type_expose ASC
            `, [id_programme]);
            res.json(planning);
        } catch {
            res.status(500).json({ error: 'Erreur lors de la récupération du planning' });
        }
    });

    router.post('/programmes/generer', async (req, res) => {
        const { date_debut, nombre_semaines = 8 } = req.body;
        if (!date_debut) return res.status(400).json({ error: 'La date de début (YYYY-MM-DD) est requise.' });

        let dateCourante = new Date(date_debut + 'T12:00:00');
        let semainesGenerees = 0;

        try {
            await db.run('BEGIN TRANSACTION');

            for (let i = 0; i < nombre_semaines; i++) {
                const dateDebutStr = formatLocal(dateCourante);
                const dateFin = new Date(dateCourante);
                dateFin.setDate(dateFin.getDate() + 6);
                const dateFinStr = formatLocal(dateFin);

                const contient_discours = Math.random() < 0.5 ? 1 : 0;

                const progResult = await db.run(
                    'INSERT INTO Programmes (date_debut_semaine, date_fin_semaine, contient_discours) VALUES (?, ?, ?)',
                    [dateDebutStr, dateFinStr, contient_discours]
                );
                const id_programme = progResult.lastID;

                const elevesDispos = await db.all(`
                    SELECT * FROM Eleves
                    ORDER BY date_dernier_expose IS NOT NULL, date_dernier_expose ASC
                `);

                let hommes = elevesDispos.filter((e) => e.genre === 'H');
                let femmes = elevesDispos.filter((e) => e.genre === 'F');

                const piocherEleves = (liste, nombre) => {
                    if (liste.length < nombre) return null;
                    return liste.splice(0, nombre);
                };

                const affectationsASauvegarder = [];

                const lecteur = piocherEleves(hommes, 1);
                if (lecteur) affectationsASauvegarder.push({ id_eleve: lecteur[0].id, type: 'Lecture', role: 'Titulaire' });

                if (contient_discours) {
                    const orateur = piocherEleves(hommes, 1);
                    if (orateur) affectationsASauvegarder.push({ id_eleve: orateur[0].id, type: 'Discours', role: 'Titulaire' });
                } else {
                    const listeChoisie = (Math.random() < 0.5 && hommes.length >= 2) ? hommes : femmes;
                    const duoSketch3 = piocherEleves(
                        listeChoisie.length >= 2 ? listeChoisie : (hommes.length >= 2 ? hommes : femmes),
                        2
                    );
                    if (duoSketch3) {
                        affectationsASauvegarder.push({ id_eleve: duoSketch3[0].id, type: 'Sketch 3', role: 'Titulaire' });
                        affectationsASauvegarder.push({ id_eleve: duoSketch3[1].id, type: 'Sketch 3', role: 'Partenaire' });
                    }
                }

                const listeSketch1 = (Math.random() < 0.5 && femmes.length >= 2) ? femmes : hommes;
                const duoSketch1 = piocherEleves(
                    listeSketch1.length >= 2 ? listeSketch1 : (femmes.length >= 2 ? femmes : hommes),
                    2
                );
                if (duoSketch1) {
                    affectationsASauvegarder.push({ id_eleve: duoSketch1[0].id, type: 'Sketch 1', role: 'Titulaire' });
                    affectationsASauvegarder.push({ id_eleve: duoSketch1[1].id, type: 'Sketch 1', role: 'Partenaire' });
                }

                const listeSketch2 = (Math.random() < 0.5 && hommes.length >= 2) ? hommes : femmes;
                const duoSketch2 = piocherEleves(
                    listeSketch2.length >= 2 ? listeSketch2 : (hommes.length >= 2 ? hommes : femmes),
                    2
                );
                if (duoSketch2) {
                    affectationsASauvegarder.push({ id_eleve: duoSketch2[0].id, type: 'Sketch 2', role: 'Titulaire' });
                    affectationsASauvegarder.push({ id_eleve: duoSketch2[1].id, type: 'Sketch 2', role: 'Partenaire' });
                }

                for (const aff of affectationsASauvegarder) {
                    await db.run(
                        'INSERT INTO Affectations (id_programme, id_eleve, type_expose, role) VALUES (?, ?, ?, ?)',
                        [id_programme, aff.id_eleve, aff.type, aff.role]
                    );
                    await db.run(
                        'UPDATE Eleves SET date_dernier_expose = ? WHERE id = ?',
                        [dateDebutStr, aff.id_eleve]
                    );
                }

                dateCourante.setDate(dateCourante.getDate() + 7);
                semainesGenerees++;
            }

            await db.run('COMMIT');
            res.status(201).json({ message: `${semainesGenerees} semaines générées avec succès !` });
        } catch (error) {
            await db.run('ROLLBACK').catch(() => {});
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de la génération automatique.' });
        }
    });
}

module.exports = registerProgrammesRoutes;
