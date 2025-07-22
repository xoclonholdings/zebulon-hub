const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let serverProcess;
const PORT = 5000;
const isDev = process.env.NODE_ENV === 'development';
const appPath = isDev ? path.join(__dirname, '..') : path.join(process.resourcesPath, 'app');

// Check if server is running
function checkServer() {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.request({ port: PORT, path: '/api/health' }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

// Start the Express server
function startServer() {
  return new Promise((resolve, reject) => {
    // Check if built files exist
    const distPath = path.join(appPath, 'dist');
    if (!fs.existsSync(distPath)) {
      reject(new Error('Application not built. Please run npm run build first.'));
      return;
    }

    console.log('Starting Zebulon server...');
    
    serverProcess = spawn('node', [path.join(distPath, 'index.js')], {
      cwd: appPath,
      env: { 
        ...process.env, 
        NODE_ENV: 'production',
        PORT: PORT.toString(),
        ELECTRON_APP: 'true'
      },
      stdio: 'inherit'
    });

    serverProcess.on('error', (err) => {
      console.error('Failed to start server:', err);
      reject(err);
    });

    // Wait for server to be ready
    let attempts = 0;
    const checkInterval = setInterval(async () => {
      attempts++;
      if (await checkServer()) {
        clearInterval(checkInterval);
        console.log('Zebulon server is ready!');
        resolve();
      } else if (attempts > 30) { // 15 seconds timeout
        clearInterval(checkInterval);
        reject(new Error('Server failed to start within 15 seconds'));
      }
    }, 500);
  });
}

// Create the main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'icon.png'), // You can add an icon file
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    titleBarStyle: 'default',
    show: false // Don't show until ready
  });

  // Remove default menu bar
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'Zebulon AI',
      submenu: [
        {
          label: 'About Zebulon AI',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Zebulon AI',
              message: 'Zebulon AI System',
              detail: 'Next-generation personal AI ecosystem\nVersion 1.0.0\n\nComplete offline AI capabilities\nAdmin controls and real-time communication'
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Admin Panel',
          click: () => {
            mainWindow.loadURL(`http://localhost:${PORT}/#admin`);
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ]));

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus the window
    if (process.platform === 'darwin') {
      app.dock.show();
    }
    mainWindow.focus();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App event handlers
app.whenReady().then(async () => {
  try {
    // Start the server first
    await startServer();
    
    // Create the window
    createWindow();
    
    // Load the application
    mainWindow.loadURL(`http://localhost:${PORT}`);
    
    // Show a loading message while the app loads
    mainWindow.webContents.once('dom-ready', () => {
      mainWindow.webContents.insertCSS(`
        body::before {
          content: "🚀 Zebulon AI Loading...";
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 24px;
          font-weight: bold;
          color: #4F46E5;
          z-index: 9999;
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
      `);
      
      // Remove loading message after 3 seconds
      setTimeout(() => {
        mainWindow.webContents.insertCSS(`
          body::before { display: none !important; }
        `);
      }, 3000);
    });
    
  } catch (error) {
    console.error('Failed to start Zebulon:', error);
    
    // Show error dialog
    dialog.showErrorBox(
      'Zebulon AI - Startup Error',
      `Failed to start the application:\n\n${error.message}\n\nPlease ensure the application is properly built by running:\nnpm run build`
    );
    
    app.quit();
  }
});

// Handle all windows closed
app.on('window-all-closed', () => {
  // Kill the server process
  if (serverProcess) {
    serverProcess.kill();
  }
  
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app activation (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle app quit
app.on('before-quit', () => {
  // Kill the server process
  if (serverProcess) {
    console.log('Stopping Zebulon server...');
    serverProcess.kill();
  }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}