# Required icon files

Place the following files in this directory before building:

| File | Size | Platform |
|------|------|----------|
| `icon.icns` | multi-res | macOS |
| `icon.ico` | 256×256 multi-res | Windows |
| `icon.png` | 512×512 px | Linux |
| `512x512.png` | 512×512 px | Linux (fallback) |

## Generating from a single PNG

If you have a 1024×1024 source PNG:

```bash
# Install icon generator
npm install -g electron-icon-maker

# Generate all formats from source.png
electron-icon-maker --input=source.png --output=./build
```

Or use https://www.electron.build/icons for an online converter.

Without icons, electron-builder falls back to the default Electron icon.
