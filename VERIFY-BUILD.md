# בדיקת Build - האם משתמש ב-API?

## איך לבדוק

### 1. הרץ את ה-preview
```bash
npm run preview
```

### 2. פתח את הדפדפן
לך ל-http://localhost:4173/

### 3. פתח את הקונסול (F12)
חפש את השורה:
```
🔧 Data Service Mode: API (Web)
```

או:
```
🔧 Data Service Mode: Local DB (Electron)
```

---

## מה אמור להיות?

### אם בנית עם `npm run build:web`:
✅ אמור להדפיס: **"API (Web)"**  
✅ VITE_USE_API = true  
✅ VITE_API_URL = https://gemach-management-system-production.up.railway.app

### אם בנית עם `npm run build`:
❌ אמור להדפיס: **"Local DB (Electron)"**  
❌ VITE_USE_API = false  
❌ VITE_API_URL = http://localhost:3002

---

## הבעיה

Vite לא טוען את `.env.production` אוטומטית כש-`--mode` לא מצוין.

### הפתרון

**לבניית Web - תמיד השתמש ב:**
```bash
npm run build:web
```

**לבניית Electron - השתמש ב:**
```bash
npm run build
```

---

## בדיקה מהירה

הרץ את זה ותראה מה מודפס:
```bash
npm run build:web
npm run preview
```

פתח http://localhost:4173/ ובדוק את הקונסול!

---

## אם זה לא עובד

אפשר להעביר את המשתנים ישירות:
```bash
# Windows PowerShell
$env:VITE_USE_API="true"; $env:VITE_API_URL="https://gemach-management-system-production.up.railway.app"; npm run build

# Linux/Mac
VITE_USE_API=true VITE_API_URL=https://gemach-management-system-production.up.railway.app npm run build
```

---

## ל-Vercel

ב-Vercel, הגדר את המשתנים בממשק:
- `VITE_USE_API` = `true`
- `VITE_API_URL` = `https://gemach-management-system-production.up.railway.app`

ו-Build Command:
```
npm run build:web
```
