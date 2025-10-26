const editor = document.getElementById('editor');

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

  const cursorPosition = editor.selectionStart;
  
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
    }
  } catch (error) {
    alert('Failed to get response: ' + error.message);
    console.error('AI request error:', error);
  }
}

window.electronAPI.onTriggerAI(() => {
  triggerAI();
});

// This is now handled by the menu shortcut, no need for duplicate handler

// Auto-focus editor on load
window.addEventListener('DOMContentLoaded', () => {
  editor.focus();
});
