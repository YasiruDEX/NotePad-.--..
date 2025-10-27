const editor = document.getElementById('editor');

// Undo/Redo stack
const undoStack = [];
const redoStack = [];
let isUndoRedoAction = false;

// Save state for undo
function saveState() {
  if (isUndoRedoAction) return;
  
  undoStack.push({
    content: editor.value,
    selectionStart: editor.selectionStart,
    selectionEnd: editor.selectionEnd
  });
  
  // Limit stack size to 100 items
  if (undoStack.length > 100) {
    undoStack.shift();
  }
  
  // Clear redo stack when new action is performed
  redoStack.length = 0;
}

// Undo function
function undo() {
  if (undoStack.length === 0) return;
  
  isUndoRedoAction = true;
  
  // Save current state to redo stack
  redoStack.push({
    content: editor.value,
    selectionStart: editor.selectionStart,
    selectionEnd: editor.selectionEnd
  });
  
  // Restore previous state
  const state = undoStack.pop();
  editor.value = state.content;
  editor.selectionStart = state.selectionStart;
  editor.selectionEnd = state.selectionEnd;
  editor.focus();
  
  setTimeout(() => { isUndoRedoAction = false; }, 10);
}

// Redo function
function redo() {
  if (redoStack.length === 0) return;
  
  isUndoRedoAction = true;
  
  // Save current state to undo stack
  undoStack.push({
    content: editor.value,
    selectionStart: editor.selectionStart,
    selectionEnd: editor.selectionEnd
  });
  
  // Restore next state
  const state = redoStack.pop();
  editor.value = state.content;
  editor.selectionStart = state.selectionStart;
  editor.selectionEnd = state.selectionEnd;
  editor.focus();
  
  setTimeout(() => { isUndoRedoAction = false; }, 10);
}

// Track changes for undo/redo
let typingTimer;
editor.addEventListener('input', () => {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    saveState();
  }, 500); // Save state after 500ms of inactivity
});

// Load and apply settings
window.electronAPI.onLoadSettings((settings) => {
  if (settings.backgroundColor) {
    document.body.style.backgroundColor = settings.backgroundColor;
    editor.style.backgroundColor = settings.backgroundColor;
  }
  if (settings.fontColor) {
    editor.style.color = settings.fontColor;
  }
  if (settings.fontSize) {
    editor.style.fontSize = settings.fontSize + 'px';
  }
});

// Handle New File
window.electronAPI.onNewFile(() => {
  if (editor.value && confirm('Current content will be lost. Continue?')) {
    editor.value = '';
  } else if (!editor.value) {
    editor.value = '';
  }
});

// Handle Open File
window.electronAPI.onFileOpened((content) => {
  editor.value = content;
});

// Handle Save File
window.electronAPI.onSaveFile(async () => {
  const content = editor.value;
  const result = await window.electronAPI.saveFileDialog(content);
  
  if (result.error) {
    alert('Error saving file: ' + result.error);
  }
});

// Handle AI Request
async function triggerAI() {
  const allText = editor.value.trim();
  
  if (!allText) {
    alert('Please type something in the editor first.');
    return;
  }

  // Save state before AI modification
  saveState();
  
  try {
    // Call Gemini API with entire text
    const result = await window.electronAPI.askGemini(allText);
    
    if (result.error) {
      alert(result.error);
      console.error('Gemini error:', result.error);
    } else if (result.text) {
      // Insert AI response at the end of current text
      const response = '\n\n' + result.text;
      editor.value = allText + response;
      
      // Move cursor to end of inserted text
      editor.selectionStart = editor.value.length;
      editor.selectionEnd = editor.value.length;
      editor.focus();
      
      // Save state after AI modification
      setTimeout(() => saveState(), 100);
    }
  } catch (error) {
    alert('Failed to get response: ' + error.message);
    console.error('AI request error:', error);
  }
}

window.electronAPI.onTriggerAI(() => {
  triggerAI();
});

// Command Palette
function showCommandPalette() {
  const palette = document.getElementById('command-palette');
  if (!palette) {
    createCommandPalette();
  } else {
    palette.style.display = 'flex';
    document.getElementById('palette-input').focus();
    document.getElementById('palette-input').value = '';
    filterCommands('');
  }
}

function createCommandPalette() {
  const paletteHTML = `
    <div id="command-palette" class="command-palette">
      <div class="palette-container">
        <input type="text" id="palette-input" class="palette-input" placeholder="Type a command...">
        <div id="command-list" class="command-list"></div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', paletteHTML);
  
  const palette = document.getElementById('command-palette');
  const input = document.getElementById('palette-input');
  const commandList = document.getElementById('command-list');
  
  // Available commands
  const commands = [
    { id: 'summarize', name: 'Summarize', description: 'Create a concise summary' },
    { id: 'fix-grammar', name: 'Fix Grammar', description: 'Correct grammar and spelling' },
    { id: 'bullet-points', name: 'Convert to Bullet Points', description: 'Format as bullet points' },
    { id: 'expand', name: 'Expand Text', description: 'Add more details' },
    { id: 'simplify', name: 'Simplify', description: 'Make easier to understand' },
    { id: 'code-explain', name: 'Explain Code', description: 'Explain what the code does' },
    { id: 'code-fix', name: 'Fix Code', description: 'Fix bugs in code' },
    { id: 'translate', name: 'Translate to English', description: 'Translate text to English' }
  ];
  
  function filterCommands(query) {
    const filtered = commands.filter(cmd => 
      cmd.name.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase())
    );
    
    commandList.innerHTML = filtered.map((cmd, index) => `
      <div class="command-item" data-command="${cmd.id}" data-index="${index}">
        <div class="command-name">${cmd.name}</div>
        <div class="command-description">${cmd.description}</div>
      </div>
    `).join('');
    
    // Select first item
    if (filtered.length > 0) {
      commandList.querySelector('.command-item').classList.add('selected');
    }
  }
  
  async function executeCommand(commandId) {
    palette.style.display = 'none';
    
    const text = editor.value.trim();
    if (!text) {
      alert('Please type something in the editor first.');
      return;
    }
    
    // Save state before AI modification
    saveState();
    
    try {
      const result = await window.electronAPI.runAICommand(commandId, text);
      
      if (result.error) {
        alert(result.error);
      } else if (result.text) {
        // Replace entire content with AI result
        editor.value = result.text;
        editor.focus();
        
        // Save state after AI modification
        setTimeout(() => saveState(), 100);
      }
    } catch (error) {
      alert('Failed to execute command: ' + error.message);
    }
  }
  
  // Event listeners
  input.addEventListener('input', (e) => {
    filterCommands(e.target.value);
  });
  
  input.addEventListener('keydown', (e) => {
    const items = commandList.querySelectorAll('.command-item');
    const selected = commandList.querySelector('.selected');
    let currentIndex = selected ? parseInt(selected.dataset.index) : -1;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentIndex < items.length - 1) {
        if (selected) selected.classList.remove('selected');
        items[currentIndex + 1].classList.add('selected');
        items[currentIndex + 1].scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentIndex > 0) {
        if (selected) selected.classList.remove('selected');
        items[currentIndex - 1].classList.add('selected');
        items[currentIndex - 1].scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selected) {
        executeCommand(selected.dataset.command);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      palette.style.display = 'none';
    }
  });
  
  commandList.addEventListener('click', (e) => {
    const item = e.target.closest('.command-item');
    if (item) {
      executeCommand(item.dataset.command);
    }
  });
  
  palette.addEventListener('click', (e) => {
    if (e.target === palette) {
      palette.style.display = 'none';
    }
  });
  
  filterCommands('');
}

window.electronAPI.onShowCommandPalette(() => {
  showCommandPalette();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Undo: Ctrl+Z / Cmd+Z
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault();
    undo();
  }
  // Redo: Ctrl+Y / Cmd+Shift+Z
  else if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || 
           (e.ctrlKey && e.key === 'y')) {
    e.preventDefault();
    redo();
  }
  // Command Palette: Ctrl+Shift+P / Cmd+Shift+P
  else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
    e.preventDefault();
    showCommandPalette();
  }
});

// This is now handled by the menu shortcut, no need for duplicate handler

// Auto-focus editor on load
window.addEventListener('DOMContentLoaded', () => {
  editor.focus();
});
