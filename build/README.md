# Build Icons

To build the application properly, you need to add icon files to this directory:

## Required Files:

1. **icon.icns** - macOS app icon
   - Format: ICNS
   - Recommended size: 1024x1024 PNG source

2. **icon.ico** - Windows app icon
   - Format: ICO
   - Recommended size: 256x256 PNG source

## How to Create Icons:

### Option 1: Use Online Tools
- Go to https://cloudconvert.com/png-to-icns (for macOS)
- Go to https://cloudconvert.com/png-to-ico (for Windows)
- Upload a 1024x1024 PNG image
- Download the converted files

### Option 2: Use Command Line Tools

**For macOS (.icns):**
```bash
# Create iconset directory
mkdir icon.iconset

# Add different sizes (you can use ImageMagick or similar)
cp icon-1024.png icon.iconset/icon_512x512@2x.png
# ... add other sizes

# Convert to icns
iconutil -c icns icon.iconset
```

**For Windows (.ico):**
Use ImageMagick:
```bash
magick convert icon-256.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

## Simple Design Idea:

Create a simple notepad icon with "AI" text or a neural network symbol overlaid on a notepad/document icon.

## Build Without Icons:

The build will work without icons, but your app will use default Electron icons.
