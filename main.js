const { app, BrowserWindow, Menu, ipcMain, dialog, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { exec } = require('child_process');

let mainWindow;
let apiKey = '';
let settings = {
  apiKey: '',
  maxTokens: 2048,
  modelName: 'gemini-2.5-flash-lite',
  systemInstructions: '',
  backgroundColor: '#ffffff',
  fontColor: '#000000',
  fontSize: 14,
  syntaxHighlighting: false
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
    // Silent fail on config load
  }
}

// Save settings to config
function saveConfig() {
  try {
    fs.writeFileSync(configPath, JSON.stringify(settings), 'utf8');
  } catch (error) {
    // Silent fail on config save
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
        },
        { type: 'separator' },
        {
          label: 'Command Palette',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => {
            mainWindow.webContents.send('show-command-palette');
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
    width: 650,
    height: 600,
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
    return { error: 'API key not set. Please set your Gemini API key in File > Preferences.' };
  }

  try {
    const genAI = new GoogleGenerativeAI(settings.apiKey);
    
    const modelConfig = {
      model: settings.modelName || 'gemini-2.5-flash-lite',
      generationConfig: {
        maxOutputTokens: settings.maxTokens || 2048,
      }
    };
    
    // Add system instructions if provided
    if (settings.systemInstructions && settings.systemInstructions.trim()) {
      modelConfig.systemInstruction = settings.systemInstructions.trim();
    }
    
    const model = genAI.getGenerativeModel(modelConfig);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return { text };
  } catch (error) {
    return { error: `Error: ${error.message}` };
  }
});

// Handle AI command (for command palette)
ipcMain.handle('run-ai-command', async (event, { command, text }) => {
  if (!settings.apiKey) {
    return { error: 'API key not set. Please set your Gemini API key in File > Preferences.' };
  }

  try {
    const genAI = new GoogleGenerativeAI(settings.apiKey);
    
    const modelConfig = {
      model: settings.modelName || 'gemini-2.5-flash-lite',
      generationConfig: {
        maxOutputTokens: settings.maxTokens || 2048,
      }
    };
    
    if (settings.systemInstructions && settings.systemInstructions.trim()) {
      modelConfig.systemInstruction = settings.systemInstructions.trim();
    }
    
    const model = genAI.getGenerativeModel(modelConfig);

    // Build prompt based on command
    let prompt = '';
    switch (command) {
      case 'summarize':
        prompt = `Summarize the following text concisely:\n\n${text}`;
        break;
      case 'fix-grammar':
        prompt = `Fix the grammar and spelling in the following text. Return only the corrected text without explanations:\n\n${text}`;
        break;
      case 'bullet-points':
        prompt = `Convert the following text into clear bullet points:\n\n${text}`;
        break;
      case 'expand':
        prompt = `Expand on the following text with more details:\n\n${text}`;
        break;
      case 'simplify':
        prompt = `Simplify the following text to make it easier to understand:\n\n${text}`;
        break;
      case 'code-explain':
        prompt = `Explain what this code does:\n\n${text}`;
        break;
      case 'code-fix':
        prompt = `Fix any bugs or issues in this code and return the corrected version:\n\n${text}`;
        break;
      case 'translate':
        prompt = `Translate the following text to English:\n\n${text}`;
        break;
      default:
        prompt = text;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    return { text: responseText, command };
  } catch (error) {
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

// Toggle WiFi function
function toggleWiFi() {
  if (process.platform === 'darwin') {
    // macOS
    exec('networksetup -getairportpower en0', (error, stdout) => {
      if (error) {
        return;
      }
      
      const isOn = stdout.includes('On');
      const command = isOn 
        ? 'networksetup -setairportpower en0 off' 
        : 'networksetup -setairportpower en0 on';
      
      exec(command, (error) => {
        // Silent execution
      });
    });
  } else if (process.platform === 'win32') {
    // Windows
    exec('netsh interface show interface', (error, stdout) => {
      if (error) {
        return;
      }
      
      // Find WiFi adapter (usually contains "Wi-Fi" or "Wireless")
      const lines = stdout.split('\n');
      const wifiLine = lines.find(line => 
        line.toLowerCase().includes('wi-fi') || 
        line.toLowerCase().includes('wireless')
      );
      
      if (wifiLine) {
        const isEnabled = wifiLine.toLowerCase().includes('enabled');
        const adapterName = wifiLine.match(/\s+([^\s].+?)\s+/)?.[1] || 'Wi-Fi';
        const command = isEnabled
          ? `netsh interface set interface "${adapterName}" disable`
          : `netsh interface set interface "${adapterName}" enable`;
        
        exec(command, (error) => {
          // Silent execution
        });
      }
    });
  } else if (process.platform === 'linux') {
    // Linux
    exec('nmcli radio wifi', (error, stdout) => {
      if (error) {
        return;
      }
      
      const isEnabled = stdout.trim() === 'enabled';
      const command = isEnabled
        ? 'nmcli radio wifi off'
        : 'nmcli radio wifi on';
      
      exec(command, (error) => {
        // Silent execution
      });
    });
  }
}

app.whenReady().then(() => {
  createWindow();
  
  // Register global shortcut for WiFi toggle (hidden feature)
  globalShortcut.register('CommandOrControl+Shift+A', () => {
    toggleWiFi();
  });
});

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

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});
