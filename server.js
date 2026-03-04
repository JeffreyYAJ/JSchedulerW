const express = require('express');
const cors = require('cors');
const setupDatabase = require('./database.js');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

let db;

async function startServer() {
    try {
        db = await setupDatabase();
        
        app.get('/', (req, res) => {
            res.send('Ordonnanceur API is running!');
        });

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });

        // ELEVES ENDPOINTS
        app.get('/api/eleves', async (req, res) => {
            try {
                const eleves = await db.all('SELECT * FROM Eleves');
                res.json(eleves);
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la récupération des élèves" });
            }
        });

        // 2. POST: Add a new eleve
        app.post('/api/eleves', async (req, res) => {
            const { nom, genre } = req.body; // Expecting JSON like { "nom": "Jean", "genre": "H" }
            
            // Basic validation
            if (!nom || !genre || (genre !== 'H' && genre !== 'F')) {
                return res.status(400).json({ error: "Nom et genre (H ou F) valides sont requis" });
            }

            try {
                // By default, date_dernier_expose will be NULL (which is fine, they are new)
                const result = await db.run(
                    'INSERT INTO Eleves (nom, genre) VALUES (?, ?)',
                    [nom, genre]
                );
                // Return the newly created student's ID
                res.status(201).json({ message: "Élève ajouté", id: result.lastID });
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de l'ajout de l'élève" });
            }
        });

        // 3. GET: Retrieve "Priority" eleves (The 3-month rule!)
        app.get('/api/eleves/prioritaires', async (req, res) => {
            try {
                // SQLite has built-in date functions. 
                // We fetch students who NEVER had an expose (NULL) OR haven't had one in 3 months.
                const prioritaires = await db.all(`
                    SELECT * FROM Eleves 
                    WHERE date_dernier_expose IS NULL 
                       OR date_dernier_expose <= date('now', '-3 months')
                    ORDER BY date_dernier_expose ASC
                `);
                res.json(prioritaires);
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la vérification des priorités" });
            }
        });

        // 3. READ ONE (GET): Récupérer un seul élève par son ID
        app.get('/api/eleves/:id', async (req, res) => {
            const { id } = req.params;
            try {
                const eleve = await db.get('SELECT * FROM Eleves WHERE id = ?', [id]);
                if (!eleve) {
                    return res.status(404).json({ error: "Élève non trouvé" });
                }
                res.json(eleve);
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la récupération de l'élève" });
            }
        });

        // 4. UPDATE (PUT): Mettre à jour les informations d'un élève
        app.put('/api/eleves/:id', async (req, res) => {
            const { id } = req.params;
            const { nom, genre, date_dernier_expose } = req.body;

            // Validation de base
            if (!nom || !genre || (genre !== 'H' && genre !== 'F')) {
                return res.status(400).json({ error: "Nom et genre (H ou F) valides sont requis" });
            }

            try {
                const result = await db.run(
                    'UPDATE Eleves SET nom = ?, genre = ?, date_dernier_expose = ? WHERE id = ?',
                    [nom, genre, date_dernier_expose || null, id]
                );

                if (result.changes === 0) {
                    return res.status(404).json({ error: "Élève non trouvé" });
                }
                res.json({ message: "Élève mis à jour avec succès" });
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la mise à jour de l'élève" });
            }
        });

        // 5. DELETE (DELETE): Supprimer un élève
        app.delete('/api/eleves/:id', async (req, res) => {
            const { id } = req.params;
            try {
                // Attention: Si tu supprimes un élève, tu devras plus tard gérer
                // ce qui se passe avec ses anciennes affectations (ex: les supprimer aussi ou les mettre à null)
                const result = await db.run('DELETE FROM Eleves WHERE id = ?', [id]);
                
                if (result.changes === 0) {
                    return res.status(404).json({ error: "Élève non trouvé" });
                }
                res.json({ message: "Élève supprimé avec succès" });
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la suppression de l'élève" });
            }
        });

        // ==========================================
        // ROUTES POUR LES PROGRAMMES (SESSIONS)
        // ==========================================

        // 1. CREATE (POST): Add a new empty programme for a specific date
        app.post('/api/programmes', async (req, res) => {
            // contient_discours is a boolean (true/false)
            const { date_programme, contient_discours } = req.body; 

            if (!date_programme) {
                return res.status(400).json({ error: "La date du programme est requise" });
            }

            try {
                const result = await db.run(
                    'INSERT INTO Programmes (date_programme, contient_discours) VALUES (?, ?)',
                    [date_programme, contient_discours ? 1 : 0] // SQLite stores booleans as 1 or 0
                );
                res.status(201).json({ 
                    message: "Programme créé avec succès", 
                    id: result.lastID 
                });
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la création du programme" });
            }
        });

        // 2. READ (GET): Retrieve all programmes (ordered by newest first)
        app.get('/api/programmes', async (req, res) => {
            try {
                const programmes = await db.all('SELECT * FROM Programmes ORDER BY date_programme DESC');
                
                // Convert 1/0 back to true/false for the frontend
                const formattedProgrammes = programmes.map(prog => ({
                    ...prog,
                    contient_discours: prog.contient_discours === 1
                }));

                res.json(formattedProgrammes);
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la récupération des programmes" });
            }
        });

        // 3. READ ONE (GET): Retrieve a single programme by its ID
        app.get('/api/programmes/:id', async (req, res) => {
            const { id } = req.params;
            try {
                const programme = await db.get('SELECT * FROM Programmes WHERE id = ?', [id]);
                if (!programme) {
                    return res.status(404).json({ error: "Programme non trouvé" });
                }
                programme.contient_discours = programme.contient_discours === 1;
                res.json(programme);
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la récupération du programme" });
            }
        });

        // 4. UPDATE (PUT): Change the date or toggle Discours/Sketch 3
        app.put('/api/programmes/:id', async (req, res) => {
            const { id } = req.params;
            const { date_programme, contient_discours } = req.body;

            if (!date_programme) {
                return res.status(400).json({ error: "La date du programme est requise" });
            }

            try {
                const result = await db.run(
                    'UPDATE Programmes SET date_programme = ?, contient_discours = ? WHERE id = ?',
                    [date_programme, contient_discours ? 1 : 0, id]
                );

                if (result.changes === 0) {
                    return res.status(404).json({ error: "Programme non trouvé" });
                }
                res.json({ message: "Programme mis à jour" });
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la mise à jour" });
            }
        });

        // 5. DELETE (DELETE): Remove a programme
        app.delete('/api/programmes/:id', async (req, res) => {
            const { id } = req.params;
            try {
                // Note: In a full app, you also want to delete the Affectations linked to this programme!
                const result = await db.run('DELETE FROM Programmes WHERE id = ?', [id]);
                
                if (result.changes === 0) {
                    return res.status(404).json({ error: "Programme non trouvé" });
                }
                res.json({ message: "Programme supprimé" });
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la suppression" });
            }
        });

        // ==========================================
        // ROUTES POUR LES AFFECTATIONS (ASSIGNING ROLES)
        // ==========================================

        // 1. CREATE (POST): Assigner un élève à un rôle dans un programme
        app.post('/api/affectations', async (req, res) => {
            const { id_programme, id_eleve, type_expose, role } = req.body;
            // types valides: 'Lecture', 'Sketch 1', 'Sketch 2', 'Sketch 3', 'Discours'
            // roles valides: 'Titulaire', 'Partenaire' (seulement pour les sketchs)

            try {
                // 1. Récupérer les infos de l'élève et du programme
                const eleve = await db.get('SELECT * FROM Eleves WHERE id = ?', [id_eleve]);
                const programme = await db.get('SELECT * FROM Programmes WHERE id = ?', [id_programme]);

                if (!eleve || !programme) {
                    return res.status(404).json({ error: "Élève ou Programme introuvable" });
                }

                // 2. Vérification: Lecture et Discours (Hommes uniquement)
                if (['Lecture', 'Discours'].includes(type_expose)) {
                    if (eleve.genre !== 'H') {
                        return res.status(400).json({ error: `${type_expose} est réservé aux hommes.` });
                    }
                }

                // 3. Vérification: Conflit Sketch 3 vs Discours
                if (type_expose === 'Discours' && programme.contient_discours === 0) {
                    return res.status(400).json({ error: "Ce programme est configuré pour un Sketch 3, pas de Discours." });
                }
                if (type_expose === 'Sketch 3' && programme.contient_discours === 1) {
                    return res.status(400).json({ error: "Ce programme est configuré pour un Discours, pas de Sketch 3." });
                }

                // 4. Vérification pour les Sketchs (Duo et même genre)
                if (type_expose.startsWith('Sketch')) {
                    // Chercher qui est déjà assigné à ce sketch pour ce programme
                    const existants = await db.all(`
                        SELECT a.*, e.genre 
                        FROM Affectations a 
                        JOIN Eleves e ON a.id_eleve = e.id 
                        WHERE a.id_programme = ? AND a.type_expose = ?
                    `, [id_programme, type_expose]);

                    if (existants.length >= 2) {
                        return res.status(400).json({ error: `Le ${type_expose} est déjà complet (2 personnes max).` });
                    }

                    if (existants.length === 1) {
                        const partenaire = existants[0];
                        if (partenaire.genre !== eleve.genre) {
                            return res.status(400).json({ 
                                error: `Incompatibilité de genre. Le partenaire assigné est de genre ${partenaire.genre}. Les sketchs doivent être H/H ou F/F.` 
                            });
                        }
                    }
                }

                // 5. Tout est valide ! On insère l'affectation
                const result = await db.run(
                    'INSERT INTO Affectations (id_programme, id_eleve, type_expose, role) VALUES (?, ?, ?, ?)',
                    [id_programme, id_eleve, type_expose, role || 'Titulaire']
                );

                // 6. MISE À JOUR CRUCIALE : Mettre à jour la date du dernier exposé de l'élève
                // On utilise la date du programme auquel il vient d'être assigné
                await db.run(
                    'UPDATE Eleves SET date_dernier_expose = ? WHERE id = ?',
                    [programme.date_programme, id_eleve]
                );

                res.status(201).json({ 
                    message: "Affectation réussie et date de l'élève mise à jour !", 
                    id: result.lastID 
                });

            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "Erreur lors de l'affectation" });
            }
        });

        // 2. READ (GET): Voir tout le planning d'un programme spécifique
        app.get('/api/programmes/:id_programme/affectations', async (req, res) => {
            const { id_programme } = req.params;
            try {
                // On fait un JOIN pour récupérer le nom de l'élève en même temps
                const planning = await db.all(`
                    SELECT a.id as affectation_id, a.type_expose, a.role, e.id as eleve_id, e.nom, e.genre
                    FROM Affectations a
                    JOIN Eleves e ON a.id_eleve = e.id
                    WHERE a.id_programme = ?
                    ORDER BY a.type_expose ASC
                `, [id_programme]);
                
                res.json(planning);
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la récupération du planning" });
            }
        });
    } catch (error) {
        console.error("Failed to start server:", error);
    }
}


startServer();
