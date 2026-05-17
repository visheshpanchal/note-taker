# Build Guide

NoteTaker is an Electron 41 + React 19 + Vite 8 + TypeScript application.  
The renderer (React) is built by Vite; the desktop wrapper is packaged by electron-builder.

---

## Prerequisites

### All platforms

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18 LTS or later | 20 LTS recommended |
| npm | 9 or later | ships with Node |
| Git | any | for cloning |

Install dependencies once after cloning:

```bash
npm install
```

---

### macOS

| Requirement | Notes |
|---|---|
| macOS 11 Big Sur or later | Required for arm64 / universal builds |
| Xcode Command Line Tools | `xcode-select --install` |
| Apple Developer ID (optional) | Required only for notarised distribution outside the App Store |

To sign and notarise, set these environment variables before running `npm run dist:mac`:

```bash
export CSC_LINK=/path/to/Developer-ID-Application.p12
export CSC_KEY_PASSWORD=yourpassword
export APPLE_ID=you@example.com
export APPLE_ID_PASSWORD=app-specific-password   # from appleid.apple.com
export APPLE_TEAM_ID=XXXXXXXXXX
```

Skip signing for local / CI builds by setting:

```bash
export CSC_IDENTITY_AUTO_DISCOVERY=false
```

---

### Windows

| Requirement | Notes |
|---|---|
| Windows 10 64-bit or later | |
| Visual Studio Build Tools 2019+ | `npm install --global windows-build-tools` or install via VS Installer |
| Python 3.x | Required by native module compilation (node-gyp) |

electron-builder produces an **NSIS installer** (`.exe`).  
Code signing requires a `.pfx` certificate:

```bash
set CSC_LINK=C:\path\to\cert.pfx
set CSC_KEY_PASSWORD=yourpassword
```

---

### Linux

| Requirement | Notes |
|---|---|
| Ubuntu 20.04 / Debian 11 or equivalent | |
| `libgtk-3-dev`, `libnss3`, `libxss1` | `sudo apt install libgtk-3-dev libnss3 libxss1` |
| `rpm` (optional) | Only needed if targeting RPM packages |
| `snapcraft` (optional) | Only needed if targeting Snap packages |

electron-builder produces an **AppImage** (`.AppImage`) which is portable and runs on any modern distro without installation.

---

## Development

Start the renderer (Vite dev server on port 5173) and Electron simultaneously:

```bash
npm run dev
```

Under the hood this runs:

```
concurrently:
  npm run dev:renderer   →  vite (hot-reload on :5173)
  npm run dev:electron   →  electron . (waits for :5173 via wait-on)
```

Electron loads `http://localhost:5173` in dev mode and hot-reloads the renderer on file changes.  
Main-process changes (`electron/main.cjs`, `electron/preload.cjs`) require a manual restart.

---

## Running Tests

```bash
npm test           # single run
npm run test:watch # watch mode
```

Vitest runs in jsdom environment with React Testing Library.  
Tests do **not** require Electron; they test renderer logic only.

---

## Production Build

### Step 1 — Build the renderer

```bash
npm run build
```

Vite compiles the React app into `dist/` with `base: './'` so assets resolve correctly from Electron's `loadFile`.

Output:

```
dist/
  index.html
  assets/
    index-[hash].js
    index-[hash].css
    ...
```

### Step 2 — Package with electron-builder

Run one of the platform-specific commands or the auto-detect command:

| Command | Platform | Output |
|---|---|---|
| `npm run dist` | auto-detect current OS | see platform column |
| `npm run dist:mac` | macOS | `.dmg` (arm64 + x64) |
| `npm run dist:win` | Windows | `.exe` NSIS installer (x64) |
| `npm run dist:linux` | Linux | `.AppImage` (x64) |
| `npm run dist:all` | all three | all of the above |

All artefacts are written to the `release/` directory.

---

## Platform-specific Output

### macOS — `npm run dist:mac`

```
release/
  NoteTaker-1.0.0-arm64.dmg    ← Apple Silicon
  NoteTaker-1.0.0-x64.dmg      ← Intel
  mac-arm64/NoteTaker.app
  mac/NoteTaker.app
```

- Targets: `dmg` for both `arm64` and `x64`
- App category: `public.app-category.productivity`
- Title bar: `hiddenInset` (traffic lights inset into app chrome)
- Minimum macOS: 10.13 (electron-builder default for Electron 41)

To produce a universal binary (runs natively on both architectures):

```bash
npx electron-builder --mac --universal
```

---

### Windows — `npm run dist:win`

```
release/
  NoteTaker Setup 1.0.0.exe    ← NSIS installer
  win-unpacked/                ← unpacked app (for portable use)
```

- Target: `nsis` (x64)
- The installer includes an uninstaller and Start Menu / Desktop shortcuts
- Minimum Windows: Windows 10 (electron-builder default for Electron 41)

For a portable `.exe` (no installer):

```bash
npx electron-builder --win portable
```

---

### Linux — `npm run dist:linux`

```
release/
  NoteTaker-1.0.0.AppImage     ← portable, runs without installation
```

- Target: `AppImage` (x64)
- Desktop category: `Office`
- Make it executable before first run: `chmod +x NoteTaker-*.AppImage`

For additional targets (deb, rpm, snap):

```bash
npx electron-builder --linux deb rpm
```

---

## App Metadata

Defined in `scripts/build.js`:

| Field | Value |
|---|---|
| `appId` | `com.notetaker.app` |
| `productName` | `NoteTaker` |
| Output directory | `release/` |
| Packaged files | `dist/**/*`, `electron/**/*` |

To change the version, update `"version"` in `package.json`.

---

## Data & Storage

At runtime the app stores data in the OS user-data directory:

| Platform | Default storage path |
|---|---|
| macOS | `~/Library/Application Support/NoteTaker/notes/` |
| Windows | `%APPDATA%\NoteTaker\notes\` |
| Linux | `~/.config/NoteTaker/notes/` |

Files written:

| File | Contents |
|---|---|
| `notes.json` | All notes, folders, tags, notebooks, categories, settings |
| `templates.json` | Custom Day Plan templates |
| `themes.json` | Custom visual themes |
| `attachments/{noteId}/` | Per-note file attachments |

The user can relocate the storage directory via Settings → Storage — files are copied automatically.

---

## Cross-compilation

electron-builder can cross-compile on macOS for Linux and vice-versa, but Windows targets must be built on Windows (NSIS installer requires the Windows environment). For CI/CD:

- Use a **macOS runner** for `dist:mac`
- Use a **Windows runner** for `dist:win`
- Use a **Linux runner** (or macOS with Wine) for `dist:linux`

Example GitHub Actions matrix:

```yaml
strategy:
  matrix:
    os: [macos-latest, windows-latest, ubuntu-latest]
    include:
      - os: macos-latest
        script: dist:mac
      - os: windows-latest
        script: dist:win
      - os: ubuntu-latest
        script: dist:linux
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with: { node-version: 20 }
  - run: npm ci
  - run: npm run build
  - run: npm run ${{ matrix.script }}
```

---

## Troubleshooting

### `Cannot find module 'electron'`
Run `npm install` — Electron is a devDependency and must be installed before any script.

### `Error: ENOENT … dist/index.html`
Run `npm run build` before `npm run dist`. The packager expects the renderer to be compiled first.

### `uuid` or other ESM-only packages fail in Electron main
`electron/main.cjs` and `electron/preload.cjs` are CommonJS (`.cjs`). Use Node built-ins (`crypto.randomUUID()`) or CJS-compatible packages instead of ESM-only modules.

### App window is blank in production
Ensure `base: './'` is set in `vite.config.ts`. Without a relative base, asset paths resolve against the filesystem root and fail when loaded via `file://`.

### macOS Gatekeeper blocks the app
The `.dmg` / `.app` must be signed and notarised for distribution. For local testing, right-click → Open to bypass Gatekeeper, or set `CSC_IDENTITY_AUTO_DISCOVERY=false` to skip signing during development builds.

### Windows antivirus flags the installer
Unsigned NSIS installers are commonly flagged. Sign the app with an EV certificate or submit it to Microsoft for reputation-building via the Windows Defender Security Intelligence portal.
