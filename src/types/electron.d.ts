// הגדרות TypeScript עבור Electron API

interface ElectronAPI {
  printDocument: () => Promise<{ success: boolean; error?: string }>
  printToPDF: () => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>
  printReport: (htmlContent: string) => Promise<{ success: boolean; error?: string }>
  checkForUpdates: () => Promise<{ success: boolean }>
  isElectron: boolean
  platform: string
  onDOMReady: (callback: () => void) => void
  optimizeLoading: () => void
}

interface Window {
  electronAPI?: ElectronAPI
  electron?: ElectronAPI
}
