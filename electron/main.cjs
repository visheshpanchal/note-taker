const { app, BrowserWindow, ipcMain, shell, nativeTheme, dialog, Notification, protocol, net } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { v4: uuidv4 } = require('uuid')

// Must register custom schemes before app is ready
protocol.registerSchemesAsPrivileged([{
  scheme: 'attachment',
  privileges: { secure: true, standard: true, supportFetchAPI: true }
}])

const isDev = process.env.NODE_ENV === 'development'

function getDefaultStoragePath() {
  const platform = process.platform
  const base = platform === 'linux'
    ? path.join(os.homedir(), 'NoteTaker')
    : path.join(os.homedir(), 'Documents', 'NoteTaker')
  if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true })
  return base
}

// ─── Config: persists the active storage path across relaunches ──────────────
function getConfigPath() {
  try { return path.join(app.getPath('userData'), 'notetaker-config.json') }
  catch { return path.join(os.homedir(), '.notetaker-config.json') }
}

function readConfig() {
  try {
    const p = getConfigPath()
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'))
  } catch {}
  return {}
}

function writeConfig(patch) {
  try {
    const p = getConfigPath()
    const current = readConfig()
    fs.writeFileSync(p, JSON.stringify({ ...current, ...patch }, null, 2), 'utf-8')
  } catch {}
}

function getEffectiveStoragePath() {
  const cfg = readConfig()
  const custom = cfg.storagePath
  // Only use custom path if the directory actually exists
  if (custom && fs.existsSync(custom)) return custom
  const def = getDefaultStoragePath()
  writeConfig({ storagePath: def }) // seed config on first run
  return def
}

function getNotesFilePath(storagePath) {
  return path.join(storagePath, 'notes.json')
}

// ─── Subdirectory helpers ────────────────────────────────────────────────────
function getSubDir(storagePath, name) {
  const dir = path.join(storagePath, name)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function readJsonDir(dir) {
  try {
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) }
        catch { return null }
      })
      .filter(Boolean)
  } catch { return [] }
}

function writeJsonFile(dir, id, obj) {
  fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(obj, null, 2), 'utf-8')
}

function deleteJsonFile(dir, id) {
  const p = path.join(dir, `${id}.json`)
  if (fs.existsSync(p)) fs.unlinkSync(p)
}

// ─── Attachment helpers ──────────────────────────────────────────────────────
const ATTACHMENT_MAX_BYTES = 100 * 1024 * 1024

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase()
  const MAP = {
    '.pdf': 'application/pdf',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
    '.txt': 'text/plain', '.md': 'text/markdown',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.zip': 'application/zip', '.json': 'application/json',
  }
  return MAP[ext] || 'application/octet-stream'
}

function getAttachDir(storagePath, noteId) {
  const dir = path.join(storagePath, 'attachments', noteId)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function uniqueFilename(dir, filename) {
  const ext = path.extname(filename)
  const base = path.basename(filename, ext)
  let candidate = filename
  let i = 1
  while (fs.existsSync(path.join(dir, candidate))) {
    candidate = `${base} (${i})${ext}`
    i++
  }
  return candidate
}

// ─── Built-in Templates ──────────────────────────────────────────────────────
const BUILT_IN_TEMPLATES = [
  {
    id: 'built-in-productive-day', name: 'Productive Day', isBuiltIn: true,
    description: 'A balanced daily planning template with priorities, schedule, and habit tracking.',
    color: '#007aff',
    sections: [
      { key: 'intentions', label: '🌅 Morning Intentions', type: 'text', description: 'What matters most today?', config: {} },
      { key: 'priorities',  label: '🎯 Top 3 Priorities',  type: 'priorities', description: 'The three most important things.', config: { count: 3 } },
      { key: 'schedule',    label: '📅 Schedule',          type: 'timeblocks', description: 'Block out your day.', config: { startTime: '08:00', endTime: '21:00', interval: 60 } },
      { key: 'habits',      label: '✅ Daily Habits',      type: 'checklist',  description: 'Track your daily habits.', config: { defaultItems: ['Hydrate (8 glasses)','Exercise / Move','Meditate','Read (30 min)','No screens after 9 pm'] } },
      { key: 'notes',       label: '💡 Notes & Ideas',     type: 'text',       description: 'Capture thoughts and ideas.', config: {} },
      { key: 'review',      label: '🌙 Evening Review',    type: 'text',       description: 'What went well?', config: {} }
    ]
  },
  {
    id: 'built-in-deep-focus', name: 'Deep Focus', isBuiltIn: true,
    description: 'Minimal template for deep work sessions with time blocks and one clear goal.',
    color: '#ff9500',
    sections: [
      { key: 'main_goal',  label: '🏆 Main Goal',               type: 'text',       description: 'The one thing that will make today a success.', config: {} },
      { key: 'schedule',   label: '⏱ Time Blocks',              type: 'timeblocks', description: 'Plan focused work blocks.', config: { startTime: '09:00', endTime: '18:00', interval: 90 } },
      { key: 'blockers',   label: '🚧 Blockers & Distractions', type: 'checklist',  description: 'What might pull you off track.', config: { defaultItems: [] } },
      { key: 'wins',       label: '🎉 End-of-Day Wins',         type: 'priorities', description: 'What did you accomplish?', config: { count: 3 } }
    ]
  }
]

// ─── Built-in Themes ─────────────────────────────────────────────────────────
const BUILT_IN_THEMES = [
  {
    id: 'default-light', name: 'Default Light', mode: 'light', isBuiltIn: true,
    description: 'Clean white interface with indigo-blue accents',
    tokens: {
      '--bg-primary':'#ffffff','--bg-secondary':'#f4f4f8','--bg-tertiary':'#eaeaef',
      '--bg-hover':'#e0e0e8','--bg-sidebar':'#f0f0f5',
      '--text-primary':'#111118','--text-secondary':'#56565f','--text-muted':'#9898a8',
      '--border':'#e2e2ea','--border-strong':'#c8c8d4',
      '--accent':'#5b6af8','--accent-hover':'#4656e8','--accent-fg':'#ffffff',
      '--accent-soft':'rgba(91,106,248,0.10)',
      '--danger':'#ef4444','--danger-hover':'#dc2626','--success':'#22c55e','--warning':'#f59e0b',
      '--shadow-xs':'0 1px 2px rgba(0,0,0,0.04)',
      '--shadow-sm':'0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      '--shadow-md':'0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
      '--shadow-lg':'0 8px 28px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)'
    }
  },
  {
    id: 'default-dark', name: 'Default Dark', mode: 'dark', isBuiltIn: true,
    description: 'Sleek dark interface with purple-blue accents',
    tokens: {
      '--bg-primary':'#111113','--bg-secondary':'#18181c','--bg-tertiary':'#222228',
      '--bg-hover':'#2c2c35','--bg-sidebar':'#141418',
      '--text-primary':'#f0f0f8','--text-secondary':'#9090a0','--text-muted':'#55555f',
      '--border':'#2c2c38','--border-strong':'#404050',
      '--accent':'#7080ff','--accent-hover':'#8090ff','--accent-fg':'#ffffff',
      '--accent-soft':'rgba(112,128,255,0.14)',
      '--danger':'#f87171','--danger-hover':'#fc8181','--success':'#4ade80','--warning':'#fbbf24',
      '--shadow-xs':'0 1px 2px rgba(0,0,0,0.20)',
      '--shadow-sm':'0 1px 3px rgba(0,0,0,0.30)',
      '--shadow-md':'0 4px 12px rgba(0,0,0,0.40)',
      '--shadow-lg':'0 8px 28px rgba(0,0,0,0.50)'
    }
  },
  {
    id: 'midnight', name: 'Midnight', mode: 'dark', isBuiltIn: true,
    description: 'Deep blue-black with violet accents',
    tokens: {
      '--bg-primary':'#0a0a14','--bg-secondary':'#0f0f1e','--bg-tertiary':'#151528',
      '--bg-hover':'#1e1e38','--bg-sidebar':'#0d0d1a',
      '--text-primary':'#e8e8ff','--text-secondary':'#9090c0','--text-muted':'#505080',
      '--border':'#1e1e38','--border-strong':'#2a2a50',
      '--accent':'#a78bfa','--accent-hover':'#b99ffd','--accent-fg':'#ffffff',
      '--accent-soft':'rgba(167,139,250,0.14)',
      '--danger':'#f87171','--danger-hover':'#fc8181','--success':'#4ade80','--warning':'#fbbf24',
      '--shadow-xs':'0 1px 2px rgba(0,0,0,0.35)',
      '--shadow-sm':'0 1px 3px rgba(0,0,0,0.45)',
      '--shadow-md':'0 4px 12px rgba(0,0,0,0.55)',
      '--shadow-lg':'0 8px 28px rgba(0,0,0,0.65)'
    }
  },
  {
    id: 'sepia', name: 'Sepia', mode: 'light', isBuiltIn: true,
    description: 'Warm paper tones, easy on the eyes',
    tokens: {
      '--bg-primary':'#faf6f0','--bg-secondary':'#f5ede0','--bg-tertiary':'#ede2ce',
      '--bg-hover':'#e5d5ba','--bg-sidebar':'#f2e8d6',
      '--text-primary':'#2c1a0e','--text-secondary':'#6b4c2e','--text-muted':'#a0816a',
      '--border':'#e0d0b8','--border-strong':'#c8b090',
      '--accent':'#a0522d','--accent-hover':'#8b3d1a','--accent-fg':'#ffffff',
      '--accent-soft':'rgba(160,82,45,0.12)',
      '--danger':'#c0392b','--danger-hover':'#a93226','--success':'#27ae60','--warning':'#d68910',
      '--shadow-xs':'0 1px 2px rgba(80,40,0,0.06)',
      '--shadow-sm':'0 1px 3px rgba(80,40,0,0.10), 0 1px 2px rgba(80,40,0,0.06)',
      '--shadow-md':'0 4px 12px rgba(80,40,0,0.12), 0 2px 4px rgba(80,40,0,0.07)',
      '--shadow-lg':'0 8px 28px rgba(80,40,0,0.16), 0 4px 8px rgba(80,40,0,0.10)'
    }
  },
  {
    id: 'nord', name: 'Nord', mode: 'dark', isBuiltIn: true,
    description: 'Arctic north-bluish color palette',
    tokens: {
      '--bg-primary':'#2e3440','--bg-secondary':'#3b4252','--bg-tertiary':'#434c5e',
      '--bg-hover':'#4c566a','--bg-sidebar':'#252a33',
      '--text-primary':'#eceff4','--text-secondary':'#d8dee9','--text-muted':'#81a1c1',
      '--border':'#3b4252','--border-strong':'#4c566a',
      '--accent':'#88c0d0','--accent-hover':'#9ecfdf','--accent-fg':'#2e3440',
      '--accent-soft':'rgba(136,192,208,0.14)',
      '--danger':'#bf616a','--danger-hover':'#d0727b','--success':'#a3be8c','--warning':'#ebcb8b',
      '--shadow-xs':'0 1px 2px rgba(0,0,0,0.25)',
      '--shadow-sm':'0 1px 3px rgba(0,0,0,0.35)',
      '--shadow-md':'0 4px 12px rgba(0,0,0,0.45)',
      '--shadow-lg':'0 8px 28px rgba(0,0,0,0.55)'
    }
  },
  {
    id: 'forest', name: 'Forest', mode: 'dark', isBuiltIn: true,
    description: 'Deep green woodland tones',
    tokens: {
      '--bg-primary':'#0d1a0f','--bg-secondary':'#122015','--bg-tertiary':'#18291b',
      '--bg-hover':'#1f3323','--bg-sidebar':'#0f1c12',
      '--text-primary':'#d8f0d0','--text-secondary':'#88b880','--text-muted':'#4a7050',
      '--border':'#1f3323','--border-strong':'#2a4030',
      '--accent':'#4ade80','--accent-hover':'#65e895','--accent-fg':'#0d1a0f',
      '--accent-soft':'rgba(74,222,128,0.12)',
      '--danger':'#f87171','--danger-hover':'#fc8181','--success':'#4ade80','--warning':'#fbbf24',
      '--shadow-xs':'0 1px 2px rgba(0,0,0,0.30)',
      '--shadow-sm':'0 1px 3px rgba(0,0,0,0.40)',
      '--shadow-md':'0 4px 12px rgba(0,0,0,0.50)',
      '--shadow-lg':'0 8px 28px rgba(0,0,0,0.60)'
    }
  }
]

function seedBuiltInTemplates(dir) {
  for (const t of BUILT_IN_TEMPLATES) {
    const p = path.join(dir, `${t.id}.json`)
    if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(t, null, 2), 'utf-8')
  }
}

function seedBuiltInThemes(dir) {
  for (const t of BUILT_IN_THEMES) {
    const p = path.join(dir, `${t.id}.json`)
    if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(t, null, 2), 'utf-8')
  }
}

// ─── Notes storage ───────────────────────────────────────────────────────────
function createDefaultData(storagePath) {
  return {
    $schema: 'https://json-schema.org/draft-07/schema',
    version: 1,
    settings: { theme: 'system', storageLocation: storagePath },
    notes: [],
    customFields: {},
    metadata: { createdAt: new Date().toISOString(), lastModified: new Date().toISOString() }
  }
}

function loadData(storagePath) {
  const file = getNotesFilePath(storagePath)
  if (!fs.existsSync(file)) {
    const data = createDefaultData(storagePath)
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8')
    return data
  }
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')) }
  catch { return createDefaultData(storagePath) }
}

function saveData(storagePath, data) {
  const file = getNotesFilePath(storagePath)
  const updated = { ...data, metadata: { ...data.metadata, lastModified: new Date().toISOString() } }
  fs.writeFileSync(file, JSON.stringify(updated, null, 2), 'utf-8')
  return { success: true }
}

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 900, minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  if (isDev) mainWindow.loadURL('http://localhost:5173')
  else mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
}

// ─── IPC: Notes ──────────────────────────────────────────────────────────────
ipcMain.handle('data:load', () => {
  const sp = getEffectiveStoragePath()
  seedBuiltInTemplates(getSubDir(sp, 'templates'))
  seedBuiltInThemes(getSubDir(sp, 'themes'))
  return loadData(sp)
})

ipcMain.handle('data:save', (_, data) => {
  const sp = getEffectiveStoragePath()
  return saveData(sp, data)
})

ipcMain.handle('system:info', () => {
  const sp = getEffectiveStoragePath()
  return {
    platform: process.platform,
    locale: app.getLocale(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    storagePath: sp,
    notesFilePath: getNotesFilePath(sp),
    templatesPath: getSubDir(sp, 'templates'),
    themesPath: getSubDir(sp, 'themes'),
    homedir: os.homedir(),
    systemTheme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  }
})

ipcMain.handle('shell:openPath', (_, p) => shell.openPath(p))

ipcMain.handle('dialog:pickFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Choose storage location for NoteTaker'
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('data:move', (_, { oldPath, newPath }) => {
  if (!fs.existsSync(newPath)) fs.mkdirSync(newPath, { recursive: true })
  const oldFile = getNotesFilePath(oldPath)
  let data
  if (fs.existsSync(oldFile)) {
    try { data = JSON.parse(fs.readFileSync(oldFile, 'utf-8')) }
    catch { data = createDefaultData(newPath) }
  } else {
    data = createDefaultData(newPath)
  }
  data.settings = { ...data.settings, storageLocation: newPath }
  data.metadata = { ...data.metadata, lastModified: new Date().toISOString() }
  fs.writeFileSync(getNotesFilePath(newPath), JSON.stringify(data, null, 2), 'utf-8')
  if (oldPath !== newPath && fs.existsSync(oldFile)) fs.unlinkSync(oldFile)
  // Persist the new path so it survives app relaunches
  writeConfig({ storagePath: newPath })
  seedBuiltInTemplates(getSubDir(newPath, 'templates'))
  seedBuiltInThemes(getSubDir(newPath, 'themes'))
  return { success: true, data, newPath }
})

// ─── IPC: Templates ──────────────────────────────────────────────────────────
ipcMain.handle('templates:load', (_, storagePath) => {
  const sp = storagePath || getDefaultStoragePath()
  const dir = getSubDir(sp, 'templates')
  seedBuiltInTemplates(dir)
  return readJsonDir(dir)
})

ipcMain.handle('templates:save', (_, { storagePath, template }) => {
  const sp = storagePath || getDefaultStoragePath()
  const dir = getSubDir(sp, 'templates')
  writeJsonFile(dir, template.id, template)
  return { success: true }
})

ipcMain.handle('templates:delete', (_, { storagePath, id }) => {
  const sp = storagePath || getDefaultStoragePath()
  const dir = getSubDir(sp, 'templates')
  deleteJsonFile(dir, id)
  return { success: true }
})

// ─── IPC: Themes ─────────────────────────────────────────────────────────────
ipcMain.handle('themes:load', (_, storagePath) => {
  const sp = storagePath || getDefaultStoragePath()
  const dir = getSubDir(sp, 'themes')
  seedBuiltInThemes(dir)
  return readJsonDir(dir)
})

ipcMain.handle('themes:save', (_, { storagePath, theme }) => {
  const sp = storagePath || getDefaultStoragePath()
  const dir = getSubDir(sp, 'themes')
  writeJsonFile(dir, theme.id, theme)
  return { success: true }
})

ipcMain.handle('themes:delete', (_, { storagePath, id }) => {
  const sp = storagePath || getDefaultStoragePath()
  const dir = getSubDir(sp, 'themes')
  deleteJsonFile(dir, id)
  return { success: true }
})

// ─── Notifications ───────────────────────────────────────────────────────────
ipcMain.handle('notification:show', (_, { title, body, noteId }) => {
  if (!Notification.isSupported()) return { success: false }
  const n = new Notification({ title, body, silent: false })
  n.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
      mainWindow.webContents.send('note:focus', noteId)
    }
  })
  n.show()
  return { success: true }
})

// ─── IPC: Attachments ────────────────────────────────────────────────────────
ipcMain.handle('dialog:pickFiles', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    title: 'Attach files'
  })
  return result.canceled ? [] : result.filePaths
})

ipcMain.handle('attachments:add', (_, { noteId, filePaths }) => {
  const sp = getEffectiveStoragePath()
  const dir = getAttachDir(sp, noteId)
  const added = []
  for (const src of filePaths) {
    try {
      const stat = fs.statSync(src)
      if (stat.size > ATTACHMENT_MAX_BYTES) continue
      const originalName = path.basename(src)
      const filename = uniqueFilename(dir, originalName)
      fs.copyFileSync(src, path.join(dir, filename))
      added.push({
        id: uuidv4(), filename, originalName,
        mimeType: getMimeType(filename), size: stat.size,
        attachedAt: new Date().toISOString()
      })
    } catch (e) {
      console.error('[attachments:add] failed for', src, e.message)
    }
  }
  return { success: true, added }
})

ipcMain.handle('attachments:remove', (_, { noteId, filename }) => {
  const sp = getEffectiveStoragePath()
  const filePath = path.join(getAttachDir(sp, noteId), filename)
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    return { success: true }
  } catch (e) { return { success: false, error: e.message } }
})

ipcMain.handle('attachments:open', (_, { noteId, filename }) => {
  const sp = getEffectiveStoragePath()
  shell.openPath(path.join(getAttachDir(sp, noteId), filename))
  return { success: true }
})

// ─── Native theme ─────────────────────────────────────────────────────────────
nativeTheme.on('updated', () => {
  if (mainWindow) {
    mainWindow.webContents.send('theme:system-changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
  }
})

app.whenReady().then(() => {
  protocol.handle('attachment', (request) => {
    const url = new URL(request.url)
    const noteId = url.hostname
    const filename = decodeURIComponent(url.pathname.slice(1))
    const sp = getEffectiveStoragePath()
    const filePath = path.join(sp, 'attachments', noteId, filename)
    const fileUrl = process.platform === 'win32'
      ? `file:///${filePath.replace(/\\/g, '/')}`
      : `file://${filePath}`
    return net.fetch(fileUrl)
  })
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
