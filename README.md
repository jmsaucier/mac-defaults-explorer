# Defaults Explorer

Defaults Explorer is a desktop app for browsing and searching macOS user defaults domains and keys. It wraps the `defaults` command-line tool in an Electron + React interface so you can inspect values in a structured tree view and check key types quickly.

## Features

- Lists available defaults domains (`defaults domains`)
- Reads a selected domain as raw output and structured data
- Displays nested keys and values in an expandable tree
- Filters domains and tree nodes in the UI
- Shows `defaults read-type` results for selected keys
- Supports text search with `defaults find`
- Uses a hardened IPC boundary (`contextIsolation` with preload API)

## Tech Stack

- Electron (main process + IPC)
- React (renderer UI)
- esbuild (renderer bundling)
- `plist` parser (converts exported domain data into objects)

## Prerequisites

- macOS (this app relies on the built-in `defaults` command)
- Node.js 18+ and npm

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the app in development:

   ```bash
   npm start
   ```

`npm start` runs `prestart`, which builds the renderer bundle before launching Electron.

## Available Scripts

- `npm run build:renderer` - Bundle `src/renderer/main.jsx` into `src/renderer.bundle.js`
- `npm start` - Build renderer, then launch Electron Forge in dev mode
- `npm run package` - Build renderer, then package the app
- `npm run make` - Build renderer, then create distributables
- `npm run publish` - Build renderer, then publish via Electron Forge

## Project Structure

```text
src/
  index.js                 # Electron entry point and IPC handlers
  preload.js               # Safe API exposed to renderer (window.defaultsApi)
  main/defaults-service.js # Wraps calls to the macOS defaults CLI
  shared/tree-model.js     # Converts parsed domain object into UI tree nodes
  renderer/App.jsx         # Main React UI
  renderer/main.jsx        # React bootstrap
  index.html               # Renderer host page
  index.css                # App styles
```

## Security Notes

- User inputs passed to `defaults` are validated against a safe character allowlist before command execution.
- The app uses `contextIsolation: true` and does not enable `nodeIntegration` in the renderer.
- Renderer actions go through explicit IPC handlers and a narrow preload bridge.

## Limitations

- The app is macOS-only because it depends on `defaults`.
- Some domains may not export cleanly to plist; when parsing fails, raw output is still shown with an error message.

## License

MIT
