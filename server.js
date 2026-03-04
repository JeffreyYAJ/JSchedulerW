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
    } catch (error) {
        console.error("Failed to start server:", error);
    }
}


startServer();
