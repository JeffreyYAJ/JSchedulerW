const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function setupDatabase() {
    const db = await open({
        filename: './database.db', // C'est lui le coupable !
        driver: sqlite3.Database
    });

    // 🚨 On force la suppression des anciennes tables pour appliquer la nouvelle structure
    await db.exec(`DROP TABLE IF EXISTS Affectations;`);
    await db.exec(`DROP TABLE IF EXISTS Programmes;`);
    // Décommente la ligne ci-dessous si tu veux aussi vider la table Eleves
    // await db.exec(`DROP TABLE IF EXISTS Eleves;`); 
    
    await db.exec(`
        CREATE TABLE IF NOT EXISTS Eleves (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT NOT NULL,
            genre TEXT NOT NULL CHECK(genre IN ('H', 'F')),
            date_dernier_expose DATE
        )
    `);

    // 👇 LA MODIFICATION EST ICI : Les deux nouvelles colonnes
    await db.exec(`
        CREATE TABLE IF NOT EXISTS Programmes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date_debut_semaine DATE NOT NULL,
            date_fin_semaine DATE NOT NULL,
            contient_discours BOOLEAN NOT NULL DEFAULT 0 
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS Affectations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_programme INTEGER,
            id_eleve INTEGER,
            type_expose TEXT NOT NULL, 
            role TEXT, 
            FOREIGN KEY (id_programme) REFERENCES Programmes(id),
            FOREIGN KEY (id_eleve) REFERENCES Eleves(id)
        )
    `);

    console.log("Database and tables are set up!");
    return db;
}

module.exports = setupDatabase;