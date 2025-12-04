# 🎯 הגדרה סופית לגרסת Web

## הבעיה שמצאת
`.env.production` לא נטען אוטומטית ב-build רגיל.

## הפתרון הנכון ✅

**אל תסמוך על `.env.production` - תשתמש ב-Vercel Environment Variables!**

---

## שלבים להעלאה ל-Vercel

### 1. בנה את הפרויקט (לא משנה איזה mode)
```bash
npm run build
```

### 2. העלה ל-Vercel

#### אופציה A: דרך CLI
```bash
npm install -g vercel
vercel
```

#### אופציה B: דרך האתר (מומלץ)
1. לך ל-https://vercel.com
2. New Project
3. Import מ-GitHub
4. בחר את הrepo: `gemach-management-system`

### 3. הגדרות ב-Vercel (חשוב!)

**Build & Development Settings:**
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

**Environment Variables** (זה החלק החשוב!):
```
VITE_USE_API = true
VITE_API_URL = https://gemach-management-system-production.up.railway.app
```

### 4. Deploy!

לחץ על "Deploy" וזהו!

---

## למה זה עובד?

Vercel מזריק את ה-Environment Variables **בזמן הבנייה**.  
זה אומר שכש-Vite בונה את הקוד, הוא רואה:
- `import.meta.env.VITE_USE_API` = `"true"`
- `import.meta.env.VITE_API_URL` = `"https://..."`

והקוד נבנה עם הערכים האלה!

---

## בדיקה

אחרי ה-deploy, פתח את האתר ובדוק בקונסול (F12):
```
🔧 Data Service Mode: API (Web)
```

אם אתה רואה את זה - **זה עובד!** 🎉

---

## לפיתוח מקומי

### Electron Mode (LocalStorage):
```bash
npm run dev
```
משתמש ב-`.env` → `VITE_USE_API=false`

### Web Mode (API) - לבדיקה:
```bash
# ערוך את .env זמנית:
VITE_USE_API=true
VITE_API_URL=https://gemach-management-system-production.up.railway.app

# הרץ:
npm run dev
```

---

## סיכום

| מצב | פקודה | משתני סביבה | מקור נתונים |
|-----|-------|-------------|-------------|
| **פיתוח Electron** | `npm run dev` | `.env` | LocalStorage |
| **בניית Electron** | `npm run build-electron` | `.env` | LocalStorage |
| **פיתוח Web** | `npm run dev` (עם .env ידני) | `.env` | API |
| **בניית Web** | `npm run build` | **Vercel Env Vars** | API |

---

## הצעד הבא

1. **העלה ל-Vercel** עם ההגדרות למעלה
2. **בדוק שזה עובד** - פתח את האתר ובדוק את הקונסול
3. **נסה להתחבר** - וודא שה-API עובד
4. **המשך לבנות EXE** - `npm run build-electron` ממשיך לעבוד!

---

**תאריך:** ${new Date().toLocaleDateString('he-IL')}
