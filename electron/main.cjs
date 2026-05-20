'use strict'
const { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme, Notification } = require('electron')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

const isDev = process.env.NODE_ENV === 'development'

// ─── Storage paths ────────────────────────────────────────────────────────────

function getDefaultStoragePath() {
  return path.join(app.getPath('userData'), 'notes')
}

function notesFilePath(storagePath) {
  return path.join(storagePath, 'notes.json')
}

function templatesFilePath(storagePath) {
  return path.join(storagePath, 'templates', 'templates.json')
}

function themesFilePath(storagePath) {
  return path.join(storagePath, 'themes', 'themes.json')
}

function attachmentsDir(storagePath, noteId) {
  return path.join(storagePath, 'attachments', noteId)
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
}

// Tracks the user's chosen storage location across IPC calls
let currentStoragePath = null

function getStoragePtrFile() {
  return path.join(app.getPath('userData'), 'storage-location.txt')
}

function initStoragePath() {
  try {
    const f = getStoragePtrFile()
    if (fs.existsSync(f)) {
      const saved = fs.readFileSync(f, 'utf8').trim()
      if (saved && saved !== getDefaultStoragePath() && fs.existsSync(path.join(saved, 'notes.json'))) {
        currentStoragePath = saved
      }
    }
  } catch {}
}

function persistStoragePath(p) {
  try { fs.writeFileSync(getStoragePtrFile(), p, 'utf8') } catch {}
}

function resolveStoragePath(data) {
  return data?.settings?.storageLocation || currentStoragePath || getDefaultStoragePath()
}

// ─── Window ───────────────────────────────────────────────────────────────────

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.on('closed', () => { mainWindow = null })
}

// ─── IPC: data ────────────────────────────────────────────────────────────────

ipcMain.handle('data:load', () => {
  const storagePath = currentStoragePath || getDefaultStoragePath()
  return readJson(notesFilePath(storagePath))
})

ipcMain.handle('data:save', (_, data) => {
  try {
    const storagePath = resolveStoragePath(data)
    if (data?.settings?.storageLocation) currentStoragePath = data.settings.storageLocation
    ensureDir(storagePath)
    writeJson(notesFilePath(storagePath), data)
    return { success: true }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

// ─── IPC: system ──────────────────────────────────────────────────────────────

ipcMain.handle('system:getInfo', () => {
  const storagePath = currentStoragePath || getDefaultStoragePath()
  return {
    storagePath,
    notesFilePath: notesFilePath(storagePath),
    templatesPath: templatesFilePath(storagePath),
    themesPath: themesFilePath(storagePath),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
})

ipcMain.handle('system:pickFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('system:openPath', (_, p) => shell.openPath(p))

ipcMain.handle('system:moveData', async (_, oldPath, newPath) => {
  try {
    ensureDir(newPath)
    const notesSrc = path.join(oldPath, 'notes.json')
    if (fs.existsSync(notesSrc)) fs.copyFileSync(notesSrc, path.join(newPath, 'notes.json'))
    for (const dir of ['templates', 'themes', 'attachments']) {
      const src = path.join(oldPath, dir)
      if (fs.existsSync(src)) fs.cpSync(src, path.join(newPath, dir), { recursive: true })
    }
    currentStoragePath = newPath
    persistStoragePath(newPath)
    const data = readJson(notesFilePath(newPath))
    if (data) {
      data.settings = { ...data.settings, storageLocation: newPath }
      writeJson(notesFilePath(newPath), data)
    }
    return { success: true, data }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

// ─── IPC: templates ───────────────────────────────────────────────────────────

ipcMain.handle('templates:load', (_, storagePath) => {
  return readJson(templatesFilePath(storagePath)) ?? []
})

ipcMain.handle('templates:save', (_, storagePath, template) => {
  ensureDir(storagePath)
  const fp = templatesFilePath(storagePath)
  const list = readJson(fp) ?? []
  const idx = list.findIndex(t => t.id === template.id)
  if (idx >= 0) list[idx] = template
  else list.push(template)
  writeJson(fp, list)
})

ipcMain.handle('templates:delete', (_, storagePath, id) => {
  const fp = templatesFilePath(storagePath)
  const list = readJson(fp) ?? []
  writeJson(fp, list.filter(t => t.id !== id))
})

// ─── IPC: themes ──────────────────────────────────────────────────────────────

ipcMain.handle('themes:load', (_, storagePath) => {
  return readJson(themesFilePath(storagePath)) ?? []
})

ipcMain.handle('themes:save', (_, storagePath, theme) => {
  ensureDir(storagePath)
  const fp = themesFilePath(storagePath)
  const list = readJson(fp) ?? []
  const idx = list.findIndex(t => t.id === theme.id)
  if (idx >= 0) list[idx] = theme
  else list.push(theme)
  writeJson(fp, list)
})

ipcMain.handle('themes:delete', (_, storagePath, id) => {
  const fp = themesFilePath(storagePath)
  const list = readJson(fp) ?? []
  writeJson(fp, list.filter(t => t.id !== id))
})

// ─── IPC: notifications ───────────────────────────────────────────────────────

ipcMain.on('notifications:show', (_, opts) => {
  if (!Notification.isSupported()) return
  const notif = new Notification({ title: opts.title, body: opts.body })
  notif.on('click', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
      mainWindow.webContents.send('note:focus', opts.noteId)
    }
  })
  notif.show()
})

// ─── IPC: attachments ─────────────────────────────────────────────────────────

function mimeType(ext) {
  const map = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf', '.txt': 'text/plain', '.md': 'text/markdown',
    '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
    '.zip': 'application/zip',
  }
  return map[ext.toLowerCase()] || 'application/octet-stream'
}

ipcMain.handle('attachments:pickFiles', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
  })
  return result.canceled ? [] : result.filePaths
})

ipcMain.handle('attachments:add', (_, noteId, filePaths) => {
  const storagePath = currentStoragePath || getDefaultStoragePath()
  const dir = attachmentsDir(storagePath, noteId)
  ensureDir(dir)
  const added = []
  for (const src of filePaths) {
    try {
      const originalName = path.basename(src)
      const ext = path.extname(originalName)
      const stem = path.basename(originalName, ext)
      const filename = `${stem}-${crypto.randomUUID().slice(0, 8)}${ext}`
      const dst = path.join(dir, filename)
      fs.copyFileSync(src, dst)
      const { size } = fs.statSync(dst)
      added.push({ id: crypto.randomUUID(), filename, originalName, mimeType: mimeType(ext), size })
    } catch (e) {
      console.error('Failed to copy attachment:', e)
    }
  }
  return { success: true, added }
})

ipcMain.handle('attachments:remove', (_, noteId, filename) => {
  const storagePath = currentStoragePath || getDefaultStoragePath()
  const fp = path.join(attachmentsDir(storagePath, noteId), filename)
  if (fs.existsSync(fp)) fs.unlinkSync(fp)
})

ipcMain.on('attachments:open', (_, noteId, filename) => {
  const storagePath = currentStoragePath || getDefaultStoragePath()
  shell.openPath(path.join(attachmentsDir(storagePath, noteId), filename))
})

// ─── System theme events ──────────────────────────────────────────────────────

nativeTheme.on('updated', () => {
  if (mainWindow) {
    mainWindow.webContents.send(
      'system:themeChange',
      nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    )
  }
})

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  initStoragePath()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
