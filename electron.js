const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')
const isDev = require('electron-is-dev')

let mainWindow

// הגדרות auto-updater
if (!isDev) {
  // הגדר את auto-updater רק בפרודקשן
  autoUpdater.checkForUpdatesAndNotify()
  
  // לוג עדכונים
  autoUpdater.logger = require('electron-log')
  autoUpdater.logger.transports.file.level = 'info'
  
  // אירועי עדכון
  autoUpdater.on('checking-for-update', () => {
    console.log('בודק עדכונים...')
  })
  
  autoUpdater.on('update-available', (info) => {
    console.log('עדכון זמין:', info.version)
    
    // הצג הודעה למשתמש
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'עדכון זמין',
      message: `גרסה חדשה זמינה: ${info.version}`,
      detail: 'העדכון יורד ברקע. תקבל הודעה כשיהיה מוכן להתקנה.',
      buttons: ['אישור']
    })
  })
  
  autoUpdater.on('update-not-available', (info) => {
    console.log('אין עדכונים זמינים')
  })
  
  autoUpdater.on('error', (err) => {
    console.log('שגיאה בעדכון:', err)
  })
  
  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "מהירות הורדה: " + progressObj.bytesPerSecond
    log_message = log_message + ' - הורד ' + progressObj.percent + '%'
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')'
    console.log(log_message)
  })
  
  autoUpdater.on('update-downloaded', (info) => {
    console.log('עדכון הורד:', info.version)
    
    // הצג הודעה עם אפשרות להפעיל מחדש
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'עדכון מוכן',
      message: `עדכון לגרסה ${info.version} הורד בהצלחה!`,
      detail: 'לחץ "הפעל מחדש" כדי להתקין את העדכון, או "מאוחר יותר" כדי להמשיך לעבוד.',
      buttons: ['הפעל מחדש', 'מאוחר יותר'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        // המשתמש בחר להפעיל מחדש
        autoUpdater.quitAndInstall()
      }
    })
  })
}

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
    show: false, // לא להציג עד שמוכן
    backgroundColor: '#87CEEB', // צבע רקע זהה לאפליקציה
    titleBarStyle: 'default',
    frame: true,
    transparent: false
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
    // המתן קצת יותר כדי לוודא שהתוכן נטען
    setTimeout(() => {
      mainWindow.show()
      
      // פתיחת DevTools רק במצב פיתוח
      if (isDev) {
        mainWindow.webContents.openDevTools()
      }
    }, 100)
  })

  // גם נוסיף אירוע נוסף לוודא שהתוכן נטען
  mainWindow.webContents.once('did-finish-load', () => {
    if (!mainWindow.isVisible()) {
      mainWindow.show()
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
          label: 'בדוק עדכונים',
          click: () => {
            checkForUpdates()
          }
        },
        { type: 'separator' },
        {
          label: 'אודות מערכת ניהול גמ"ח',
          click: () => {
            require('electron').dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'אודות',
              message: 'מערכת ניהול גמ"ח',
              detail: 'גרסה 2.5.1\nמערכת מקיפה לניהול גמילות חסדים\nכולל: הלוואות, פקדונות, תרומות ודוחות\nעם תמיכה מלאה בתאריכים עבריים\nועדכונים אוטומטיים!\nפותח עבור קהילת הגמ"חים בישראל 🇮🇱'
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

// פונקציה לבדיקת עדכונים ידנית
function checkForUpdates() {
  if (isDev) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'בדיקת עדכונים',
      message: 'בדיקת עדכונים זמינה רק בגרסת הפרודקשן',
      buttons: ['אישור']
    })
    return
  }
  
  autoUpdater.checkForUpdatesAndNotify()
  
  // הצג הודעה שהבדיקה התחילה
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'בדיקת עדכונים',
    message: 'בודק עדכונים...',
    detail: 'תקבל הודעה אם יימצא עדכון זמין.',
    buttons: ['אישור']
  })
}

// IPC handler לבדיקת עדכונים מהממשק
ipcMain.handle('check-for-updates', async () => {
  checkForUpdates()
  return { success: true }
})

// האפליקציה מוכנה
app.whenReady().then(() => {
  createWindow()
  
  // בדוק עדכונים בפתיחה (רק בפרודקשן)
  if (!isDev) {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify()
    }, 3000) // המתן 3 שניות אחרי פתיחה
  }
})

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