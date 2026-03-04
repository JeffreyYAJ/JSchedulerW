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
    } catch (error) {
        console.error("Failed to start server:", error);
    }
}

startServer();
