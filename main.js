const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

let mainWindow;
let apiKey = '';
let settings = {
  apiKey: '',
  maxTokens: 2048,
  modelName: 'gemini-2.5-flash-lite',
  backgroundColor: '#ffffff',
  fontColor: '#000000',
  fontSize: 14
};
const configPath = path.join(app.getPath('userData'), 'config.json');

// Load settings from config
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      settings = { ...settings, ...config };
      apiKey = settings.apiKey || '';
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
}

// Save settings to config
function saveConfig() {
  try {
    fs.writeFileSync(configPath, JSON.stringify(settings), 'utf8');
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

function createWindow() {
  loadConfig();

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 400,
    minHeight: 300,
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Send settings to renderer
    mainWindow.webContents.send('load-settings', settings);
  });

  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('new-file');
          }
        },
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'Text Files', extensions: ['txt'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            });

            if (!result.canceled && result.filePaths.length > 0) {
              const content = fs.readFileSync(result.filePaths[0], 'utf8');
              mainWindow.webContents.send('file-opened', content);
            }
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('save-file');
          }
        },
        { type: 'separator' },
        {
          label: 'Preferences',
          click: () => {
            showPreferences();
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'AI',
      submenu: [
        {
          label: 'Ask Gemini',
          accelerator: 'CmdOrCtrl+Shift+G',
          click: () => {
            mainWindow.webContents.send('trigger-ai');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About & Shortcuts',
          click: () => {
            showAbout();
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function showPreferences() {
  const preferencesWindow = new BrowserWindow({
    width: 600,
    height: 500,
    parent: mainWindow,
    modal: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  preferencesWindow.loadFile('preferences.html');
  preferencesWindow.setMenuBarVisibility(false);

  preferencesWindow.webContents.on('did-finish-load', () => {
    preferencesWindow.webContents.send('load-settings', settings);
  });
}

function showAbout() {
  const aboutWindow = new BrowserWindow({
    width: 500,
    height: 400,
    parent: mainWindow,
    modal: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  aboutWindow.loadFile('about.html');
  aboutWindow.setMenuBarVisibility(false);
}

// Handle settings save
ipcMain.on('save-settings', (event, newSettings) => {
  console.log('Saving settings:', newSettings);
  settings = { ...settings, ...newSettings };
  apiKey = settings.apiKey; // Keep apiKey in sync
  saveConfig();
  event.reply('settings-saved');
  // Update main window with new settings
  if (mainWindow) {
    mainWindow.webContents.send('load-settings', settings);
  }
});

// Handle AI request
ipcMain.handle('ask-gemini', async (event, prompt) => {
  if (!settings.apiKey) {
    console.error('API key not set');
    return { error: 'API key not set. Please set your Gemini API key in File > Preferences.' };
  }

  try {
    console.log('Making Gemini request with prompt:', prompt.substring(0, 100));
    const genAI = new GoogleGenerativeAI(settings.apiKey);
    const model = genAI.getGenerativeModel({ 
      model: settings.modelName || 'gemini-2.5-flash-lite',
      generationConfig: {
        maxOutputTokens: settings.maxTokens || 2048,
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Gemini response received:', text.substring(0, 100));
    return { text };
  } catch (error) {
    console.error('Gemini API error:', error);
    return { error: `Error: ${error.message}` };
  }
});

// Handle file save
ipcMain.handle('save-file-dialog', async (event, content) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePath) {
    try {
      fs.writeFileSync(result.filePath, content, 'utf8');
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  return { canceled: true };
});

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
