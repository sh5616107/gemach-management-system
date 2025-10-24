const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const path = require('path')
const isDev = require('electron-is-dev')

let mainWindow

function createWindow() {
  // יצירת חלון הדפדפן
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js') // נוסיף preload script
    },
    icon: path.join(__dirname, 'assets/icon.png'), // אייקון האפליקציה
    title: 'מערכת ניהול גמ"ח',
    show: false // לא להציג עד שמוכן
  })

  // טעינת האפליקציה
  let startUrl
  if (isDev) {
    startUrl = 'http://localhost:5173'
  } else {
    // נסה כמה נתיבים אפשריים
    const possiblePaths = [
      path.join(__dirname, 'dist/index.html'),
      path.join(__dirname, '../dist/index.html'),
      path.join(process.resourcesPath, 'dist/index.html'),
      path.join(process.resourcesPath, 'app/dist/index.html')
    ]

    for (const testPath of possiblePaths) {
      if (require('fs').existsSync(testPath)) {
        startUrl = `file://${testPath}`
        break
      }
    }

    if (!startUrl) {
      startUrl = `file://${path.join(__dirname, 'dist/index.html')}`
    }
  }

  console.log('Loading URL:', startUrl)

  mainWindow.loadURL(startUrl)

  // הצגת החלון כשמוכן
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()

    // פתיחת DevTools רק במצב פיתוח
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })

  // סגירת האפליקציה כשסוגרים את החלון
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // הגדרת תפריט בעברית
  const template = [
    {
      label: 'קובץ',
      submenu: [
        {
          label: 'רענון',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload()
          }
        },
        { type: 'separator' },
        {
          label: 'הדפס',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            // הדפסה עם הגדרות מתקדמות
            mainWindow.webContents.print({
              silent: false,
              printBackground: true,
              color: false,
              margins: {
                marginType: 'printableArea'
              },
              landscape: false,
              scaleFactor: 100
            }, (success, failureReason) => {
              if (!success) {
                console.log('Print failed:', failureReason)
              }
            })
          }
        },
        {
          label: 'הדפס ל-PDF',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: async () => {
            try {
              const result = await dialog.showSaveDialog(mainWindow, {
                title: 'שמירה כ-PDF',
                defaultPath: 'document.pdf',
                filters: [
                  { name: 'PDF Files', extensions: ['pdf'] }
                ]
              })

              if (!result.canceled && result.filePath) {
                const data = await mainWindow.webContents.printToPDF({
                  printBackground: true,
                  margins: {
                    marginType: 'printableArea'
                  },
                  landscape: false,
                  scaleFactor: 100
                })

                require('fs').writeFileSync(result.filePath, data)

                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'הצלחה',
                  message: 'הקובץ נשמר בהצלחה!',
                  detail: `הקובץ נשמר ב: ${result.filePath}`
                })
              }
            } catch (error) {
              dialog.showErrorBox('שגיאה', 'שגיאה בשמירת הקובץ: ' + error.message)
            }
          }
        },
        { type: 'separator' },
        {
          label: 'יציאה',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'עריכה',
      submenu: [
        { label: 'בטל', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'בצע שוב', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'גזור', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'העתק', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'הדבק', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: 'תצוגה',
      submenu: [
        { label: 'מסך מלא', accelerator: 'F11', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'הגדל', accelerator: 'CmdOrCtrl+Plus', role: 'zoomin' },
        { label: 'הקטן', accelerator: 'CmdOrCtrl+-', role: 'zoomout' },
        { label: 'גודל רגיל', accelerator: 'CmdOrCtrl+0', role: 'resetzoom' }
      ]
    },
    {
      label: 'עזרה',
      submenu: [
        {
          label: 'אודות מערכת ניהול גמ"ח',
          click: () => {
            require('electron').dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'אודות',
              message: 'מערכת ניהול גמ"ח',
              detail: 'גרסה 2.1.0\nמערכת מקיפה לניהול גמילות חסדים\nכולל: הלוואות, פקדונות, תרומות ודוחות\nפותח עבור קהילת הגמ"חים בישראל 🇮🇱'
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// IPC handlers להדפסה
ipcMain.handle('print-document', async () => {
  try {
    await mainWindow.webContents.print({
      silent: false,
      printBackground: true,
      color: false,
      margins: {
        marginType: 'printableArea'
      },
      landscape: false,
      scaleFactor: 100
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('print-to-pdf', async () => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'שמירה כ-PDF',
      defaultPath: 'document.pdf',
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] }
      ]
    })

    if (!result.canceled && result.filePath) {
      const data = await mainWindow.webContents.printToPDF({
        printBackground: true,
        margins: {
          marginType: 'printableArea'
        },
        landscape: false,
        scaleFactor: 100
      })

      require('fs').writeFileSync(result.filePath, data)
      return { success: true, filePath: result.filePath }
    }

    return { success: false, canceled: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// האפליקציה מוכנה
app.whenReady().then(createWindow)

// יציאה כשכל החלונות נסגרו
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// אבטחה - מניעת ניווט לאתרים חיצוניים
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationUrl) => {
    navigationEvent.preventDefault()
  })

  contents.on('will-navigate', (navigationEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)

    if (parsedUrl.origin !== 'http://localhost:5173' && parsedUrl.origin !== 'file://') {
      navigationEvent.preventDefault()
    }
  })
})