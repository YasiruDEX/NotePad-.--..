# NotePad .- ..

A simple, Windows Notepad-like text editor with Google Gemini AI integration built with Electron.

## Features

- **Simple Text Editor**: Clean, minimalist interface like Windows Notepad
- **AI Integration**: Ask questions and get AI responses directly in your text using Google Gemini
- **Keyboard Shortcuts**: Full keyboard support for all operations
- **File Operations**: New, Open, Save with standard shortcuts
- **Resizable**: Fully resizable window with minimum size constraints

## Installation

1. Install dependencies:

```bash
npm install
```

2. Get your Gemini API key:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create or sign in to your Google account
   - Generate an API key

## Quick Start

Use the provided startup script to install dependencies and start the app in one command:

```bash
chmod +x run.sh
./run.sh
```

## Usage

1. Start the application manually:

```bash
npm start
```

   Or use the quick start script:
   ```bash
   ./run.sh
   ```

2. Set your API key:

   - Go to **File → Preferences**
   - Enter your Gemini API key
   - Click Save

3. Use the AI feature:
   - Type a question or prompt in the editor
   - Press **Ctrl+Shift+G** (or **Cmd+Shift+G** on Mac)
   - The AI response will appear below your text

## Keyboard Shortcuts

| Action           | Windows/Linux | macOS       |
| ---------------- | ------------- | ----------- |
| New File         | Ctrl+N        | Cmd+N       |
| Open File        | Ctrl+O        | Cmd+O       |
| Save File        | Ctrl+S        | Cmd+S       |
| Exit             | Ctrl+Q        | Cmd+Q       |
| Ask Gemini AI    | Ctrl+Shift+G  | Cmd+Shift+G |
| Undo             | Ctrl+Z        | Cmd+Z       |
| Redo             | Ctrl+Y        | Cmd+Shift+Z |
| Command Palette  | Ctrl+Shift+P  | Cmd+Shift+P |
| Toggle WiFi      | Ctrl+Shift+A  | Cmd+Shift+A |
| Cut              | Ctrl+X        | Cmd+X       |
| Copy             | Ctrl+C        | Cmd+C       |
| Paste            | Ctrl+V        | Cmd+V       |
| Select All       | Ctrl+A        | Cmd+A       |

## Menu Options

### File

- **New**: Create a new file
- **Open**: Open an existing text file
- **Save**: Save current content to a file
- **Preferences**: Set your Gemini API key
- **Exit**: Close the application

### Edit

- Standard editing operations (Undo, Redo, Cut, Copy, Paste, Select All)

### AI

- **Ask Gemini**: Trigger AI response for your text (Ctrl+Shift+G / Cmd+Shift+G)
- **Command Palette**: Access preset AI commands like Summarize, Fix Grammar, etc. (Ctrl+Shift+P / Cmd+Shift+P)

### Help

- **About & Shortcuts**: View all available keyboard shortcuts and feature details

## How It Works

### Direct AI Chat (Ctrl+Shift+G)

When you press the AI shortcut:

1. The entire editor content is sent to Google Gemini API
2. Returns the AI response
3. Inserts the response below your text

### Command Palette (Ctrl+Shift+P)

Quick access to AI-powered commands:

- **Summarize**: Create a concise summary of your text
- **Fix Grammar**: Correct grammatical errors
- **Convert to Bullet Points**: Format text as bullet points
- **Expand Text**: Add more detail and context
- **Simplify Text**: Make text easier to understand
- **Explain Code**: Explain what code does
- **Fix Code**: Find and fix code issues
- **Translate to Spanish**: Translate text to Spanish

### System Instructions

Customize AI behavior by setting system-level instructions in **File → Preferences**. This guides how the AI responds across all interactions.

### Configuration

In **Preferences**, you can customize:

- **Gemini API Key**: Your API authentication
- **Model Name**: Choose different Gemini models
- **Max Tokens**: Control response length
- **System Instructions**: Custom AI behavior guidance
- **Appearance**: Background color, font color, and font size

## License

MIT
