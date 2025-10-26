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

## Usage

1. Start the application:

```bash
npm start
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

| Action        | Windows/Linux | macOS       |
| ------------- | ------------- | ----------- |
| New File      | Ctrl+N        | Cmd+N       |
| Open File     | Ctrl+O        | Cmd+O       |
| Save File     | Ctrl+S        | Cmd+S       |
| Exit          | Ctrl+Q        | Cmd+Q       |
| Ask Gemini AI | Ctrl+Shift+G  | Cmd+Shift+G |
| Undo          | Ctrl+Z        | Cmd+Z       |
| Redo          | Ctrl+Y        | Cmd+Shift+Z |
| Cut           | Ctrl+X        | Cmd+X       |
| Copy          | Ctrl+C        | Cmd+C       |
| Paste         | Ctrl+V        | Cmd+V       |
| Select All    | Ctrl+A        | Cmd+A       |

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

- **Ask Gemini**: Trigger AI response for your text

### Help

- **About & Shortcuts**: View all available keyboard shortcuts

## How It Works

When you press the AI shortcut:

1. The app takes the last line of text before your cursor
2. Sends it to Google Gemini API
3. Returns the AI response
4. Inserts the response below your original text

## License

MIT
