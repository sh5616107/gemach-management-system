const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')
const isDev = require('electron-is-dev')

let mainWindow

// הגדרות auto-updater
if (!isDev) {
  // הגדר את auto-updater רק בפרודקשן (ללא בדיקה אוטומטית)
  
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
    
    // הצג הודעה מפורטת למשתמש
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '✅ המערכת מעודכנת',
      message: 'אין עדכונים זמינים',
      detail: `🎉 יש לך את הגרסה העדכנית ביותר!
      
📊 פרטי גרסה:
🏷️ גרסה נוכחית: ${require('./package.json').version}
📅 נבדק ב: ${new Date().toLocaleString('he-IL')}
🌐 שרת: GitHub Releases

המערכת שלך מעודכנת ומוכנה לשימוש.`,
      buttons: ['מעולה!']
    })
  })

  autoUpdater.on('error', (err) => {
    console.log('שגיאה בעדכון:', err)
    
    // הצג הודעת שגיאה מפורטת
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: '❌ שגיאה בבדיקת עדכונים',
      message: 'לא ניתן לבדוק עדכונים כרגע',
      detail: `🔧 פתרונות אפשריים:
      
🌐 בדוק את החיבור לאינטרנט
🔄 נסה שוב בעוד כמה דקות
🛡️ בדוק שהחומת אש לא חוסמת את התוכנה
📞 פנה לתמיכה אם הבעיה נמשכת

שגיאה טכנית: ${err.message}`,
      buttons: ['הבנתי']
    })
  })

  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent)
    const transferred = Math.round(progressObj.transferred / 1024 / 1024 * 100) / 100
    const total = Math.round(progressObj.total / 1024 / 1024 * 100) / 100
    const speed = Math.round(progressObj.bytesPerSecond / 1024 / 1024 * 100) / 100
    
    let log_message = `מהירות הורדה: ${speed} MB/s - הורד ${percent}% (${transferred}/${total} MB)`
    console.log(log_message)
    
    // עדכן את כותרת החלון עם התקדמות ההורדה
    if (mainWindow) {
      mainWindow.setTitle(`מערכת ניהול גמ"ח - מוריד עדכון ${percent}%`)
    }
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('עדכון הורד:', info.version)
    
    // החזר את כותרת החלון לרגיל
    if (mainWindow) {
      mainWindow.setTitle('מערכת ניהול גמ"ח')
    }

    // הצג הודעה מפורטת עם אפשרות להפעיל מחדש
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '🎉 עדכון מוכן להתקנה!',
      message: `עדכון לגרסה ${info.version} הורד בהצלחה`,
      detail: `✅ ההורדה הושלמה בהצלחה!
      
📊 פרטי העדכון:
🏷️ גרסה חדשה: ${info.version}
📅 הורד ב: ${new Date().toLocaleString('he-IL')}
💾 גודל: ${info.files ? info.files[0]?.size || 'לא ידוע' : 'לא ידוע'}

🔄 לחץ "התקן עכשיו" כדי להפעיל מחדש ולהתקין
⏰ או "התקן מאוחר יותר" כדי להמשיך לעבוד

💡 העדכון יותקן בפעם הבאה שתפתח את התוכנה`,
      buttons: ['התקן עכשיו', 'התקן מאוחר יותר'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        // המשתמש בחר להפעיל מחדש
        autoUpdater.quitAndInstall()
      } else {
        // הצג הודעה שהעדכון יותקן מאוחר יותר
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: '⏰ עדכון נדחה',
          message: 'העדכון יותקן בפעם הבאה',
          detail: 'העדכון נשמר ויותקן אוטומטית בפעם הבאה שתפתח את התוכנה.',
          buttons: ['הבנתי']
        })
      }
    })
  })
}

function createWindow() {
  // יצירת חלון הדפדפן
  // יצירת splash screen קודם
  let splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'assets/icon.png')
  })

  // טעינת splash screen
  splashWindow.loadFile(path.join(__dirname, 'splash.html')).catch(() => {
    // אם אין קובץ splash, צור אחד פשוט
    const splashHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: white;
          text-align: center;
        }
        .logo {
          font-size: 48px;
          margin-bottom: 20px;
          animation: pulse 2s infinite;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 16px;
          opacity: 0.8;
          margin-bottom: 30px;
        }
        .loading {
          width: 200px;
          height: 4px;
          background: rgba(255,255,255,0.3);
          border-radius: 2px;
          overflow: hidden;
        }
        .loading-bar {
          width: 0%;
          height: 100%;
          background: white;
          border-radius: 2px;
          animation: loading 3s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes loading {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="logo">🏛️</div>
      <div class="title">מערכת ניהול גמ"ח</div>
      <div class="subtitle">טוען את המערכת...</div>
      <div class="loading">
        <div class="loading-bar"></div>
      </div>
    </body>
    </html>
    `
    splashWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(splashHtml))
  })

  // יצירת החלון הראשי עם הגדרות משופרות
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
      backgroundThrottling: false, // מונע האטה ברקע
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    title: 'מערכת ניהול גמ"ח',
    show: false, // לא להציג עד שמוכן
    backgroundColor: '#87CEEB', // צבע רקע זהה לאפליקציה
    titleBarStyle: 'default',
    frame: true,
    transparent: false,
    webSecurity: true,
    // הגדרות נוספות למניעת הבהוב
    paintWhenInitiallyHidden: false,
    thickFrame: false
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

  // הצגת החלון כשמוכן עם טיפול ב-splash
  mainWindow.once('ready-to-show', () => {
    // המתן שהתוכן יטען לגמרי
    setTimeout(() => {
      // סגור את ה-splash screen
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close()
        splashWindow = null
      }
      
      // הצג את החלון הראשי
      mainWindow.show()
      mainWindow.focus()

      // פתיחת DevTools רק במצב פיתוח
      if (isDev) {
        mainWindow.webContents.openDevTools()
      }
    }, 1500) // זמן ארוך יותר כדי לוודא טעינה מלאה
  })

  // אירוע נוסף לוודא שהתוכן נטען - עם טיפול ב-splash
  mainWindow.webContents.once('did-finish-load', () => {
    // המתן עוד קצת לוודא שהכל מוכן
    setTimeout(() => {
      if (!mainWindow.isVisible()) {
        // סגור את ה-splash screen
        if (splashWindow && !splashWindow.isDestroyed()) {
          splashWindow.close()
          splashWindow = null
        }
        
        mainWindow.show()
        mainWindow.focus()
      }
    }, 1000)
  })

  // טיפול בסגירת splash אם החלון הראשי נסגר
  mainWindow.on('closed', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close()
    }
    mainWindow = null
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
        {
          label: 'הצג מיקום קבצי עדכון',
          click: () => {
            const { shell } = require('electron')
            const os = require('os')
            const path = require('path')
            
            const updatePath = path.join(os.homedir(), 'AppData', 'Local', 'gemach-management-system-updater')
            const logsPath = path.join(os.homedir(), 'AppData', 'Roaming', 'gemach-management-system', 'logs')
            
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '📁 מיקום קבצי עדכון',
              message: 'מיקומי קבצים במערכת',
              detail: `📂 קבצי עדכון:
${updatePath}

📋 קבצי לוג:
${logsPath}

💡 לחץ "פתח תיקיה" כדי לפתוח את מיקום קבצי העדכון`,
              buttons: ['פתח תיקיה', 'סגור'],
              defaultId: 0,
              cancelId: 1
            }).then((result) => {
              if (result.response === 0) {
                // פתח את תיקיית העדכונים
                shell.openPath(updatePath).catch(() => {
                  // אם התיקיה לא קיימת, פתח את התיקיה הראשית
                  shell.openPath(path.join(os.homedir(), 'AppData', 'Local'))
                })
              }
            })
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
              detail: 'גרסה 2.9.9\nמערכת מקיפה לניהול גמילות חסדים\nכולל: הלוואות, פקדונות, תרומות ודוחות\nעם ניהול ערבים, רשימה שחורה ומכתבי התראה\n\n🆕 חדש בגרסה 2.9.9:\n• מודל ברכה חדש - הצגת תכונות אופציונליות\n• שיפורים כלליים - אופטימיזציה של ביצועים\n• תיקוני באגים - שיפור יציבות המערכת\n\nהמערכת כוללת:\n✅ ניהול הלוואות, פקדונות ותרומות\n✅ ניהול ערבים ורשימה שחורה\n✅ תאריכים עבריים ולועזיים\n✅ דוחות וסטטיסטיקות מפורטים\n✅ הלוואות מחזוריות ופרעונות אוטומטיים\n\nפותח עבור קהילת הגמ"חים בישראל 🇮🇱'
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

// פונקציה לבדיקת עדכונים ידנית עם תצוגה מקדימה
function checkForUpdates() {
  if (isDev) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'בדיקת עדכונים',
      message: 'בדיקת עדכונים זמינה רק בגרסת הפרודקשן',
      detail: 'במצב פיתוח, העדכונים לא זמינים.\nבגרסת ה-EXE המוכנה, העדכונים יעבדו אוטומטית.',
      buttons: ['הבנתי']
    })
    return
  }

  // הצג חלונית תצוגה מקדימה של התהליך
  const progressDialog = dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: '🔍 בדיקת עדכונים',
    message: 'מתחיל בדיקת עדכונים...',
    detail: `📋 שלבי התהליך:
    
✅ 1. התחברות לשרת העדכונים
⏳ 2. בדיקת גרסה נוכחית (${require('./package.json').version})
⏳ 3. חיפוש גרסאות חדשות
⏳ 4. השוואת גרסאות
⏳ 5. הצגת תוצאות

אנא המתן...`,
    buttons: ['ביטול'],
    cancelId: 0
  })

  // התחל בדיקת עדכונים
  autoUpdater.checkForUpdatesAndNotify()

  // עדכן את ההודעה אחרי זמן קצר
  setTimeout(() => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '🔍 בדיקת עדכונים',
      message: 'בודק עדכונים ברקע...',
      detail: `📊 מידע נוכחי:
      
🏷️ גרסה נוכחית: ${require('./package.json').version}
🌐 שרת עדכונים: GitHub Releases
📅 בדיקה אחרונה: ${new Date().toLocaleString('he-IL')}

תקבל הודעה כשהבדיקה תסתיים.`,
      buttons: ['אישור']
    })
  }, 1500)
}

// IPC handler לבדיקת עדכונים מהממשק
ipcMain.handle('check-for-updates', async () => {
  checkForUpdates()
  return { success: true }
})

// האפליקציה מוכנה
app.whenReady().then(() => {
  createWindow()

  // בדיקת עדכונים רק ידנית - לא אוטומטית בפתיחה
  // המשתמש יכול לבדוק עדכונים דרך התפריט: עזרה -> בדוק עדכונים
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