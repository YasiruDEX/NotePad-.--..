const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  onNewFile: (callback) => ipcRenderer.on('new-file', callback),
  onFileOpened: (callback) => ipcRenderer.on('file-opened', (event, content) => callback(content)),
  onSaveFile: (callback) => ipcRenderer.on('save-file', callback),
  saveFileDialog: (content) => ipcRenderer.invoke('save-file-dialog', content),
  
  // AI operations
  onTriggerAI: (callback) => ipcRenderer.on('trigger-ai', callback),
  askGemini: (prompt) => ipcRenderer.invoke('ask-gemini', prompt),
  runAICommand: (command, text) => ipcRenderer.invoke('run-ai-command', { command, text }),
  onShowCommandPalette: (callback) => ipcRenderer.on('show-command-palette', callback),
  
  // Settings
  saveSettings: (settings) => ipcRenderer.send('save-settings', settings),
  onSettingsSaved: (callback) => ipcRenderer.on('settings-saved', callback),
  onLoadSettings: (callback) => ipcRenderer.on('load-settings', (event, settings) => callback(settings))
});
