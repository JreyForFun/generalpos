const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const log = require('electron-log');
const { initDatabase } = require('../database/db');
const { registerAllIpcHandlers } = require('./ipc');
const { clearSession } = require('./utils/session');

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

let mainWindow = null;
let db = null;

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    frame: false,          // Frameless for custom titlebar
    titleBarStyle: 'hidden',
    backgroundColor: '#0D0F12', // --bg-primary
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,       // Required for better-sqlite3 via preload
    },
    icon: path.join(__dirname, '..', 'public', 'icons', 'icon.png'),
    show: false,
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools(); // Uncomment for debugging
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Window control IPC handlers
  ipcMain.on('window:minimize', () => mainWindow?.minimize());
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window:close', () => mainWindow?.close());
  ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized());

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximized-change', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximized-change', false);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  log.info('FlexPOS starting...');

  // Initialize database
  try {
    db = initDatabase();
    log.info('Database initialized successfully');
  } catch (err) {
    log.error('Database initialization failed:', err);
    app.quit();
    return;
  }

  // Register all IPC handlers
  registerAllIpcHandlers(db);

  // Create main window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Auto-backup database on close
  try {
    if (db) {
      const backupDir = path.join(app.getPath('userData'), 'backups');
      const fs = require('fs');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `flexpos-backup-${timestamp}.db`);
      db.backup(backupPath)
        .then(() => log.info(`Database backed up to ${backupPath}`))
        .catch((err) => log.error('Backup failed:', err));
    }
  } catch (err) {
    log.error('Backup error:', err);
  }

  clearSession();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (db) {
    db.close();
    log.info('Database connection closed');
  }
});
