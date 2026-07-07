const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// IMPORTS DU BACKEND EMBARQUÉ
const express = require('express');
const cors = require('cors');
const setupDatabase = require('database.js');

let mainWindow;

function startEmbeddedServer() {
    const serverApp = express();
    const PORT = 3000;

    serverApp.use(express.json());
    serverApp.use(cors());

    let db;

    // Détermination du dossier d'écriture sécurisé (userData sous Linux/Windows/Mac)
    const customDbFolder = app.isPackaged ? app.getPath('userData') : __dirname;

    // Setup logging
    const logFile = path.join(customDbFolder, 'backend.log');
    function logToFile(...args) {
        if (!logFile) return;
        const msg = `[${new Date().toISOString()}] ` + args.map(a => (typeof a === 'string' ? a : JSON.stringify(a, null, 2))).join(' ') + '\n';
        try { fs.appendFileSync(logFile, msg); } catch (e) { /* ignore */ }
    }

    logToFile('=== Backend starting in EMBEDDED mode ===');
    logToFile('customDbFolder:', customDbFolder);

    // Initialisation de la BDD et des routes
    setupDatabase(customDbFolder).then((database) => {
        db = database;
        logToFile('Database setup complete');

        serverApp.get('/', (req, res) => {
            res.send('Ordonnanceur API is running!');
        });

        // ==========================================
        // ELEVES ENDPOINTS
        // ==========================================
        serverApp.get('/api/eleves', async (req, res) => {
            try {
                const eleves = await db.all('SELECT * FROM Eleves');
                res.json(eleves);
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la récupération des élèves" });
            }
        });

        serverApp.post('/api/eleves', async (req, res) => {
            const { nom, genre } = req.body;
            if (!nom || !genre || (genre !== 'H' && genre !== 'F')) {
                return res.status(400).json({ error: "Nom et genre (H ou F) valides sont requis" });
            }
            try {
                const result = await db.run('INSERT INTO Eleves (nom, genre) VALUES (?, ?)', [nom, genre]);
                res.status(201).json({ message: "Élève ajouté", id: result.lastID });
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de l'ajout de l'élève" });
            }
        });

        serverApp.get('/api/eleves/prioritaires', async (req, res) => {
            const { genre } = req.query;
            try {
                let sqlQuery = `
                    SELECT * FROM Eleves
                    WHERE (date_dernier_expose IS NULL OR date_dernier_expose <= date('now', '-3 months'))
                `;
                let params = [];
                if (genre === 'H' || genre === 'F') {
                    sqlQuery += ` AND genre = ?`;
                    params.push(genre);
                }
                sqlQuery += ` ORDER BY date_dernier_expose ASC`;

                const prioritaires = await db.all(sqlQuery, params);
                res.json(prioritaires);
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la vérification des priorités" });
            }
        });

        serverApp.get('/api/eleves/:id', async (req, res) => {
            const { id } = req.params;
            try {
                const eleve = await db.get('SELECT * FROM Eleves WHERE id = ?', [id]);
                if (!eleve) return res.status(404).json({ error: "Élève non trouvé" });
                res.json(eleve);
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la récupération de l'élève" });
            }
        });

        serverApp.put('/api/eleves/:id', async (req, res) => {
            const { id } = req.params;
            const { nom, genre, date_dernier_expose } = req.body;
            if (!nom || !genre || (genre !== 'H' && genre !== 'F')) {
                return res.status(400).json({ error: "Nom et genre (H ou F) valides sont requis" });
            }
            try {
                const result = await db.run(
                    'UPDATE Eleves SET nom = ?, genre = ?, date_dernier_expose = ? WHERE id = ?',
                    [nom, genre, date_dernier_expose || null, id]
                );
                if (result.changes === 0) return res.status(404).json({ error: "Élève non trouvé" });
                res.json({ message: "Élève mis à jour avec succès" });
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la mise à jour de l'élève" });
            }
        });

        serverApp.delete('/api/eleves/:id', async (req, res) => {
            const { id } = req.params;
            try {
                const result = await db.run('DELETE FROM Eleves WHERE id = ?', [id]);
                if (result.changes === 0) return res.status(404).json({ error: "Élève non trouvé" });
                res.json({ message: "Élève supprimé avec succès" });
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la suppression de l'élève" });
            }
        });

        // ==========================================
        // ROUTES POUR LES PROGRAMMES (SESSIONS)
        // ==========================================
        serverApp.post('/api/programmes', async (req, res) => {
            const { date_debut_semaine, date_fin_semaine, contient_discours } = req.body;
            if (!date_debut_semaine || !date_fin_semaine) {
                return res.status(400).json({ error: "Les dates de début et de fin de semaine sont requises." });
            }
            try {
                const result = await db.run(
                    'INSERT INTO Programmes (date_debut_semaine, date_fin_semaine, contient_discours) VALUES (?, ?, ?)',
                    [date_debut_semaine, date_fin_semaine, contient_discours ? 1 : 0]
                );
                res.status(201).json({ id: result.lastID });
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la création du programme" });
            }
        });

        serverApp.get('/api/programmes', async (req, res) => {
            try {
                const programmes = await db.all('SELECT * FROM Programmes ORDER BY date_debut_semaine DESC');
                res.json(programmes);
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la récupération des programmes" });
            }
        });

        serverApp.get('/api/programmes/:id', async (req, res) => {
            const { id } = req.params;
            try {
                const programme = await db.get('SELECT * FROM Programmes WHERE id = ?', [id]);
                if (!programme) return res.status(404).json({ error: "Programme non trouvé" });
                programme.contient_discours = programme.contient_discours === 1;
                res.json(programme);
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la récupération du programme" });
            }
        });

        serverApp.put('/api/programmes/:id', async (req, res) => {
            const { id } = req.params;
            const { date_programme, contient_discours } = req.body;
            if (!date_programme) return res.status(400).json({ error: "La date du programme est requise" });
            try {
                const result = await db.run(
                    'UPDATE Programmes SET date_programme = ?, contient_discours = ? WHERE id = ?',
                    [date_programme, contient_discours ? 1 : 0, id]
                );
                if (result.changes === 0) return res.status(404).json({ error: "Programme non trouvé" });
                res.json({ message: "Programme mis à jour" });
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la mise à jour" });
            }
        });

        serverApp.delete('/api/programmes/:id', async (req, res) => {
            const { id } = req.params;
            try {
                const result = await db.run('DELETE FROM Programmes WHERE id = ?', [id]);
                if (result.changes === 0) return res.status(404).json({ error: "Programme non trouvé" });
                res.json({ message: "Programme supprimé" });
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la suppression" });
            }
        });

        // ==========================================
        // ROUTES POUR LES AFFECTATIONS (ASSIGNING ROLES)
        // ==========================================
        serverApp.post('/api/affectations', async (req, res) => {
            const { id_programme, id_eleve, type_expose, role } = req.body;
            try {
                const eleve = await db.get('SELECT * FROM Eleves WHERE id = ?', [id_eleve]);
                const programme = await db.get('SELECT * FROM Programmes WHERE id = ?', [id_programme]);

                if (!eleve || !programme) return res.status(404).json({ error: "Élève ou Programme introuvable" });

                const dejaAssigne = await db.get(
                    'SELECT type_expose FROM Affectations WHERE id_programme = ? AND id_eleve = ?',
                    [id_programme, id_eleve]
                );
                if (dejaAssigne) return res.status(400).json({ error: `${eleve.nom} est déjà assigné(e) à un(e) ${dejaAssigne.type_expose} pour ce programme !` });

                if (['Lecture', 'Discours'].includes(type_expose)) {
                    if (eleve.genre !== 'H') return res.status(400).json({ error: `${type_expose} est réservé aux hommes.` });
                }

                if (type_expose === 'Discours' && programme.contient_discours === 0) {
                    return res.status(400).json({ error: "Ce programme est configuré pour un Sketch 3, pas de Discours." });
                }
                if (type_expose === 'Sketch 3' && programme.contient_discours === 1) {
                    return res.status(400).json({ error: "Ce programme est configuré pour un Discours, pas de Sketch 3." });
                }

                if (type_expose.startsWith('Sketch')) {
                    const existants = await db.all(`
                        SELECT a.*, e.genre
                        FROM Affectations a
                        JOIN Eleves e ON a.id_eleve = e.id
                        WHERE a.id_programme = ? AND a.type_expose = ?
                    `, [id_programme, type_expose]);

                    if (existants.length >= 2) return res.status(400).json({ error: `Le ${type_expose} est déjà complet (2 personnes max).` });
                    if (existants.length === 1) {
                        const partenaire = existants[0];
                        if (partenaire.genre !== eleve.genre) {
                            return res.status(400).json({ error: `Incompatibilité de genre. Le partenaire assigné est de genre ${partenaire.genre}. Les sketchs doivent être H/H ou F/F.` });
                        }
                    }
                }

                const result = await db.run(
                    'INSERT INTO Affectations (id_programme, id_eleve, type_expose, role) VALUES (?, ?, ?, ?)',
                    [id_programme, id_eleve, type_expose, role || 'Titulaire']
                );
                await db.run(
                    'UPDATE Eleves SET date_dernier_expose = ? WHERE id = ?',
                    [programme.date_debut_semaine, id_eleve]
                );

                res.status(201).json({ message: "Affectation réussie et date de l'élève mise à jour !", id: result.lastID });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "Erreur lors de l'affectation" });
            }
        });

        serverApp.get('/api/programmes/:id_programme/affectations', async (req, res) => {
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
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la récupération du planning" });
            }
        });

        // ==========================================
        // ROUTE DE GÉNÉRATION AUTOMATIQUE (AUTO-SCHEDULER)
        // ==========================================
        serverApp.post('/api/programmes/generer', async (req, res) => {
            const { date_debut, nombre_semaines = 8 } = req.body;
            if (!date_debut) return res.status(400).json({ error: "La date de début (YYYY-MM-DD) est requise." });

            let dateCourante = new Date(date_debut);
            let semainesGenerees = 0;

            try {
                for (let i = 0; i < nombre_semaines; i++) {
                    const dateDebutStr = dateCourante.toISOString().split('T')[0];
                    let dateFin = new Date(dateCourante);
                    dateFin.setDate(dateFin.getDate() + 6);
                    const dateFinStr = dateFin.toISOString().split('T')[0];

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

                    let hommes = elevesDispos.filter(e => e.genre === 'H');
                    let femmes = elevesDispos.filter(e => e.genre === 'F');

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
                        const duoSketch3 = piocherEleves(listeChoisie.length >= 2 ? listeChoisie : (hommes.length >= 2 ? hommes : femmes), 2);
                        if (duoSketch3) {
                            affectationsASauvegarder.push({ id_eleve: duoSketch3[0].id, type: 'Sketch 3', role: 'Titulaire' });
                            affectationsASauvegarder.push({ id_eleve: duoSketch3[1].id, type: 'Sketch 3', role: 'Partenaire' });
                        }
                    }

                    let listeSketch1 = (Math.random() < 0.5 && femmes.length >= 2) ? femmes : hommes;
                    const duoSketch1 = piocherEleves(listeSketch1.length >= 2 ? listeSketch1 : (femmes.length >= 2 ? femmes : hommes), 2);
                    if (duoSketch1) {
                        affectationsASauvegarder.push({ id_eleve: duoSketch1[0].id, type: 'Sketch 1', role: 'Titulaire' });
                        affectationsASauvegarder.push({ id_eleve: duoSketch1[1].id, type: 'Sketch 1', role: 'Partenaire' });
                    }

                    let listeSketch2 = (Math.random() < 0.5 && hommes.length >= 2) ? hommes : femmes;
                    const duoSketch2 = piocherEleves(listeSketch2.length >= 2 ? listeSketch2 : (hommes.length >= 2 ? hommes : femmes), 2);
                    if (duoSketch2) {
                        affectationsASauvegarder.push({ id_eleve: duoSketch2[0].id, type: 'Sketch 2', role: 'Titulaire' });
                        affectationsASauvegarder.push({ id_eleve: duoSketch2[1].id, type: 'Sketch 2', role: 'Partenaire' });
                    }

                    for (let aff of affectationsASauvegarder) {
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

                res.status(201).json({ message: `${semainesGenerees} semaines générées avec succès !` });

            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "Erreur lors de la génération automatique." });
            }
        });

        // Démarrage serveur Express
        serverApp.listen(PORT, () => {
            const msg = `Server is running embedded on http://localhost:${PORT}`;
            console.log(msg);
            logToFile(msg);
        });

    }).catch((error) => {
        console.error("Failed to start embedded server:", error);
        logToFile('Failed to start server:', error);
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    if (!app.isPackaged) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, 'JSchedulerW_frontend', 'dist', 'index.html'));
    }
}

// Handle uncaught exceptions globaux
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Handle unhandled promise rejections globaux
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// INITIALISATION D'ELECTRON
app.whenReady().then(() => {
    // IMPORTANT : On démarre l'API ici, car app.getPath('userData') n'est disponible qu'après le ready !
    startEmbeddedServer();
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
