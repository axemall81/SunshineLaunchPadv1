const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 8000; // Use Render's provided PORT

// Setup multer for handling file uploads
const upload = multer({ dest: 'uploads/' });

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON bodies
app.use(express.json());

// Paths to Sunshine's configuration (use safer relative paths)
const SUNSHINE_DIR = 'C:\\Program Files\\Sunshine\\config';
const SUNSHINE_APPS_JSON = path.join(SUNSHINE_DIR, 'apps.json');
const SUNSHINE_IMAGE_DIR = 'C:\\Program Files\\Sunshine\\images';
const SUNSHINE_EXE = '"C:\\Program Files\\Sunshine\\sunshine.exe"';
const MOONLIGHT_EXE = '"C:\\Program Files\\Moonlight Game Streaming\\Moonlight.exe"';

// Ensure directories exist
if (!fs.existsSync(SUNSHINE_IMAGE_DIR)) {
    fs.mkdirSync(SUNSHINE_IMAGE_DIR, { recursive: true });
}

// Read Sunshine apps.json safely
function readSunshineConfig() {
    if (!fs.existsSync(SUNSHINE_APPS_JSON)) return { apps: [] };
    try {
        return JSON.parse(fs.readFileSync(SUNSHINE_APPS_JSON, 'utf8'));
    } catch (error) {
        console.error("Error reading Sunshine config:", error);
        return { apps: [] };
    }
}

// Write to Sunshine apps.json safely
function writeSunshineConfig(config) {
    try {
        fs.writeFileSync(SUNSHINE_APPS_JSON, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
        console.error("Error writing Sunshine config:", error);
    }
}

// List current games
app.get('/api/games', (req, res) => {
    try {
        const config = readSunshineConfig();
        res.json(config.apps);
    } catch (err) {
        console.error("Error reading games:", err);
        res.status(500).send(`Error reading config: ${err.message}`);
    }
});

// Add Steam Game
app.post('/api/add-steam-game', upload.single('steamImage'), (req, res) => {
    const { steamCommand, steamAppName } = req.body;
    if (!steamCommand || !steamAppName) {
        return res.status(400).send('Missing steamCommand or steamAppName');
    }
    try {
        const config = readSunshineConfig();
        if (config.apps.some(app => app.name === steamAppName || app.cmd === steamCommand)) {
            return res.status(400).send('This Steam game is already in Sunshine config');
        }

        let imagePath = req.file ? path.join(SUNSHINE_IMAGE_DIR, req.file.originalname) : '';
        if (req.file) fs.renameSync(req.file.path, imagePath);

        config.apps.push({
            name: steamAppName,
            cmd: steamCommand,
            'image-path': imagePath,
            detached: true
        });
        writeSunshineConfig(config);
        res.send(`Steam game "${steamAppName}" added successfully!`);
    } catch (err) {
        console.error("Error adding Steam game:", err);
        res.status(500).send(`Error adding Steam game: ${err.message}`);
    }
});

// Add Executable Game
app.post('/api/add-exe-game', upload.single('exeImage'), (req, res) => {
    const { exePath, exeName } = req.body;
    if (!exePath || !exeName) {
        return res.status(400).send('Missing exePath or exeName');
    }
    try {
        const config = readSunshineConfig();
        if (config.apps.some(app => app.name === exeName || app.cmd === exePath)) {
            return res.status(400).send('That .exe game is already in Sunshine config');
        }

        let imagePath = req.file ? path.join(SUNSHINE_IMAGE_DIR, req.file.originalname) : '';
        if (req.file) fs.renameSync(req.file.path, imagePath);

        config.apps.push({
            name: exeName,
            cmd: exePath,
            'image-path': imagePath,
            detached: true
        });
        writeSunshineConfig(config);
        res.send(`Executable game "${exeName}" added successfully!`);
    } catch (err) {
        console.error("Error adding exe game:", err);
        res.status(500).send(`Error adding exe game: ${err.message}`);
    }
});

// Remove a game
app.post('/api/remove-game', (req, res) => {
    const { gameName } = req.body;
    try {
        const config = readSunshineConfig();
        const initialLength = config.apps.length;
        config.apps = config.apps.filter(app => app.name !== gameName);
        if (initialLength === config.apps.length) {
            return res.status(404).send(`No game named "${gameName}" found`);
        }
        writeSunshineConfig(config);
        res.send(`Game "${gameName}" removed!`);
    } catch (err) {
        console.error("Error removing game:", err);
        res.status(500).send(`Error removing game: ${err.message}`);
    }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
});
