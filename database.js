const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function setupDatabase() {
    const db = await open({
        filename: './database.db',
        driver: sqlite3.Database
    });

    
    await db.exec(`
        CREATE TABLE IF NOT EXISTS Eleves (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT NOT NULL,
            genre TEXT NOT NULL CHECK(genre IN ('H', 'F')),
            date_dernier_expose DATE
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS Programmes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date_programme DATE NOT NULL,
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
