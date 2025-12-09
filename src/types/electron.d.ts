// הגדרות TypeScript עבור Electron API

interface ElectronAPI {
  // פונקציות הדפסה
  printDocument: () => Promise<{ success: boolean; error?: string }>
  printToPDF: () => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>
  printReport: (htmlContent: string) => Promise<{ success: boolean; error?: string }>
  
  // פונקציות עדכון
  checkForUpdates: () => Promise<{ success: boolean }>
  
  
  // מידע על הסביבה
  isElectron: boolean
  platform: string
  onDOMReady: (callback: () => void) => void
  optimizeLoading: () => void
}

interface Window {
  electronAPI?: ElectronAPI
  electron?: ElectronAPI
}
