'use strict'
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  data: {
    load: () => ipcRenderer.invoke('data:load'),
    save: (data) => ipcRenderer.invoke('data:save', data),
  },
  system: {
    getInfo: () => ipcRenderer.invoke('system:getInfo'),
    pickFolder: () => ipcRenderer.invoke('system:pickFolder'),
    openPath: (p) => ipcRenderer.invoke('system:openPath', p),
    moveData: (oldPath, newPath) => ipcRenderer.invoke('system:moveData', oldPath, newPath),
  },
  templates: {
    load: (storagePath) => ipcRenderer.invoke('templates:load', storagePath),
    save: (storagePath, template) => ipcRenderer.invoke('templates:save', storagePath, template),
    delete: (storagePath, id) => ipcRenderer.invoke('templates:delete', storagePath, id),
  },
  themes: {
    load: (storagePath) => ipcRenderer.invoke('themes:load', storagePath),
    save: (storagePath, theme) => ipcRenderer.invoke('themes:save', storagePath, theme),
    delete: (storagePath, id) => ipcRenderer.invoke('themes:delete', storagePath, id),
  },
  notifications: {
    show: (opts) => ipcRenderer.send('notifications:show', opts),
  },
  attachments: {
    add: (noteId, filePaths) => ipcRenderer.invoke('attachments:add', noteId, filePaths),
    remove: (noteId, filename) => ipcRenderer.invoke('attachments:remove', noteId, filename),
    open: (noteId, filename) => ipcRenderer.send('attachments:open', noteId, filename),
    pickFiles: () => ipcRenderer.invoke('attachments:pickFiles'),
  },
  onNoteFocus: (callback) => {
    const handler = (_, noteId) => callback(noteId)
    ipcRenderer.on('note:focus', handler)
    return () => ipcRenderer.removeListener('note:focus', handler)
  },
  onSystemThemeChange: (callback) => {
    const handler = (_, theme) => callback(theme)
    ipcRenderer.on('system:themeChange', handler)
    return () => ipcRenderer.removeListener('system:themeChange', handler)
  },
})
