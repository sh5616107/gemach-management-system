const { contextBridge, ipcRenderer } = require('electron')

// חשיפת API בטוח לאפליקציה
contextBridge.exposeInMainWorld('electronAPI', {
  // פונקציות הדפסה
  print: () => ipcRenderer.invoke('print-document'),
  printToPDF: () => ipcRenderer.invoke('print-to-pdf'),

  // פונקציות עדכון
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  // בדיקה אם זה Electron
  isElectron: () => true,

  // מידע על הפלטפורמה
  platform: process.platform,

  // גרסת Electron
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
})