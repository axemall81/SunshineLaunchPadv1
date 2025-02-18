// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;

// Start the Express server from server.js
// We spawn a child process so that the Express server runs on port 3000.
function startServer() {
  const serverProcess = spawn('node', [path.join(__dirname, 'server.js')], {
    stdio: 'inherit'
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the Express server's URL
  mainWindow.loadURL('http://localhost:3000');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startServer();
  // Wait briefly to let the Express server start
  setTimeout(createWindow, 1000);
});

app.on('window-all-closed', () => {
  // On macOS apps usually stay open until explicitly closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
