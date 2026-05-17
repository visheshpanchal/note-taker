const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  data: {
    load: () => ipcRenderer.invoke('data:load'),
    save: (data) => ipcRenderer.invoke('data:save', data)
  },
  system: {
    getInfo: () => ipcRenderer.invoke('system:info'),
    openPath: (p) => ipcRenderer.invoke('shell:openPath', p),
    pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
    moveData: (oldPath, newPath) => ipcRenderer.invoke('data:move', { oldPath, newPath })
  },
  templates: {
    load: (storagePath) => ipcRenderer.invoke('templates:load', storagePath),
    save: (storagePath, template) => ipcRenderer.invoke('templates:save', { storagePath, template }),
    delete: (storagePath, id) => ipcRenderer.invoke('templates:delete', { storagePath, id })
  },
  themes: {
    load: (storagePath) => ipcRenderer.invoke('themes:load', storagePath),
    save: (storagePath, theme) => ipcRenderer.invoke('themes:save', { storagePath, theme }),
    delete: (storagePath, id) => ipcRenderer.invoke('themes:delete', { storagePath, id })
  },
  notifications: {
    show: (payload) => ipcRenderer.invoke('notification:show', payload)
  },
  attachments: {
    pickFiles: () => ipcRenderer.invoke('dialog:pickFiles'),
    add: (noteId, filePaths) => ipcRenderer.invoke('attachments:add', { noteId, filePaths }),
    remove: (noteId, filename) => ipcRenderer.invoke('attachments:remove', { noteId, filename }),
    open: (noteId, filename) => ipcRenderer.invoke('attachments:open', { noteId, filename })
  },
  onNoteFocus: (callback) => {
    ipcRenderer.on('note:focus', (_, noteId) => callback(noteId))
    return () => ipcRenderer.removeAllListeners('note:focus')
  },
  onSystemThemeChange: (callback) => {
    ipcRenderer.on('theme:system-changed', (_, theme) => callback(theme))
    return () => ipcRenderer.removeAllListeners('theme:system-changed')
  }
})
