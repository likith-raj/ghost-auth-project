const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const activeWin = require('active-win');
const psList = require('node-process-list');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png') // optional
  });

  // Load your existing dashboard
  mainWindow.loadFile('dashboard.html');
  
  // Open DevTools for debugging (remove in production)
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Real monitoring functions
ipcMain.handle('get-active-window', async () => {
  try {
    const result = await activeWin();
    return result;
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('get-running-processes', async () => {
  try {
    const processes = await psList.getProcesses();
    return processes.slice(0, 20); // Return top 20 processes
  } catch (error) {
    return { error: error.message };
  }
});

// Monitor active window every 5 seconds
setInterval(async () => {
  if (mainWindow) {
    try {
      const activeWindow = await activeWin();
      if (activeWindow) {
        mainWindow.webContents.send('active-window-update', {
          app: activeWindow.owner.name,
          title: activeWindow.title,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.log('Monitoring error:', error);
    }
  }
}, 5000);