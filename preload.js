const { contextBridge, ipcRenderer } = require('electron')

// חשיפת API בטוח לחלון הראשי
contextBridge.exposeInMainWorld('electronAPI', {
  // פונקציות הדפסה
  printDocument: () => ipcRenderer.invoke('print-document'),
  printToPDF: () => ipcRenderer.invoke('print-to-pdf'),
  
  // פונקציות עדכון
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  
  // מידע על הסביבה
  isElectron: true,
  platform: process.platform,
  
  // פונקציה לטעינה מהירה יותר
  onDOMReady: (callback) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback)
    } else {
      callback()
    }
  },
  
  // אופטימיזציה לטעינה
  optimizeLoading: () => {
    // הסר אנימציות מיותרות בזמן טעינה
    const style = document.createElement('style')
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-delay: -0.01ms !important;
        transition-duration: 0.01ms !important;
        transition-delay: 0.01ms !important;
      }
    `
    document.head.appendChild(style)
    
    // הסר את הסטיל אחרי טעינה
    setTimeout(() => {
      if (style.parentNode) {
        style.parentNode.removeChild(style)
      }
    }, 2000)
  }
})

// אופטימיזציה אוטומטית בטעינה
document.addEventListener('DOMContentLoaded', () => {
  // הסתר גלילה עד שהכל נטען
  document.body.style.overflow = 'hidden'
  
  // החזר גלילה אחרי טעינה
  setTimeout(() => {
    document.body.style.overflow = ''
  }, 1000)
})

// מניעת הבהוב בעת טעינת תמונות
window.addEventListener('load', () => {
  // וודא שכל התמונות נטענו
  const images = document.querySelectorAll('img')
  let loadedImages = 0
  
  if (images.length === 0) {
    // אין תמונות, סיים מיד
    document.body.classList.add('loaded')
    return
  }
  
  images.forEach(img => {
    if (img.complete) {
      loadedImages++
    } else {
      img.addEventListener('load', () => {
        loadedImages++
        if (loadedImages === images.length) {
          document.body.classList.add('loaded')
        }
      })
      
      img.addEventListener('error', () => {
        loadedImages++
        if (loadedImages === images.length) {
          document.body.classList.add('loaded')
        }
      })
    }
  })
  
  if (loadedImages === images.length) {
    document.body.classList.add('loaded')
  }
})