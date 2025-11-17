# תיקון בעיית הדפסה כפולה

## הבעיה שתוקנה
בדוח המפורט של מפקיד, כאשר לוחצים על "הדפס", הדף היה מודפס פעמיים - פעם אחת עם הרקע האפור והמודל, ופעם שנייה עם התוכן בלבד.

## הפתרון

### 1. תיקון CSS להדפסה בדפדפן
הוספנו כללי CSS מתקדמים ב-`@media print`:
- הסתרת כל האלמנטים מלבד תוכן הדוח
- הצגת הדוח בלבד ללא רקע אפור
- מיקום מוחלט של הדוח בעמוד

```css
@media print {
  /* הסתר את כל האלמנטים */
  body * {
    visibility: hidden;
  }
  
  /* הצג רק את הדוח */
  .report-content,
  .report-content * {
    visibility: visible;
  }
  
  .report-content {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
}
```

### 2. תמיכה מלאה ב-Electron

#### preload.js
הוספנו פונקציה חדשה:
```javascript
printReport: (htmlContent) => ipcRenderer.invoke('print-report', htmlContent)
```

#### electron.js
יצרנו handler חדש שפותח חלון זמני להדפסה:
```javascript
ipcMain.handle('print-report', async (event, htmlContent) => {
  // יוצר חלון זמני
  // טוען את תוכן הדוח
  // מדפיס
  // סוגר את החלון
})
```

#### DepositorDetailedReport.tsx
הקומפוננטה מזהה אם רצה ב-Electron ומשתמשת ב-API המתאים:
```typescript
if (window.electronAPI && window.electronAPI.printReport) {
  // הדפסה ב-Electron
  await window.electronAPI.printReport(reportContent.innerHTML)
} else {
  // הדפסה בדפדפן רגיל
  window.print()
}
```

## יתרונות הפתרון

### בדפדפן:
✅ הדפסה נקייה ללא רקע אפור
✅ רק תוכן הדוח מודפס
✅ ללא כפילויות

### ב-Electron:
✅ חלון הדפסה ייעודי
✅ שליטה מלאה על פורמט ההדפסה
✅ תמיכה בצבעים ורקעים
✅ שוליים מותאמים אישית
✅ ביצועים טובים יותר

## שימוש
1. פתח דוח מפורט של מפקיד
2. לחץ על כפתור "🖨️ הדפס"
3. בחר מדפסת ואפשרויות הדפסה
4. הדוח יודפס בצורה נקייה ומקצועית

## קבצים ששונו
- `src/components/DepositorDetailedReport.tsx` - תיקון CSS והוספת תמיכה ב-Electron
- `preload.js` - הוספת פונקציית printReport
- `electron.js` - הוספת handler להדפסת דוחות
- `src/types/electron.d.ts` - הגדרות TypeScript (חדש)
