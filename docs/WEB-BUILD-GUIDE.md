# מדריך בניית גרסת Web

## ✅ הגדרות הושלמו!

הפרויקט מוכן לבניית גרסת Web וגרסת Electron במקביל.

---

## 📁 קבצי הגדרות

### `.env` - לפיתוח ו-Electron
```bash
VITE_USE_API=false          # משתמש ב-LocalStorage
VITE_API_URL=http://localhost:3002
```

### `.env.production` - לגרסת Web
```bash
VITE_USE_API=true           # משתמש ב-API
VITE_API_URL=https://gemach-management-system-production.up.railway.app
```

---

## 🚀 פקודות בנייה

### בניית גרסת Web
```bash
npm run build
```
זה יוצר תיקיית `dist/` עם קבצים סטטיים לWeb.

### בניית גרסת Electron (EXE)
```bash
npm run build-electron
```
זה יוצר קובץ התקנה ב-`dist-electron/`.

---

## 🌐 העלאה ל-Vercel

### אופציה 1: דרך CLI
```bash
# התקן את Vercel CLI
npm install -g vercel

# העלה לפרודקשן
vercel --prod
```

### אופציה 2: דרך האתר
1. לך ל-https://vercel.com
2. לחץ על "New Project"
3. חבר את ה-GitHub repository
4. הגדר:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. הוסף משתני סביבה:
   - `VITE_USE_API` = `true`
   - `VITE_API_URL` = `https://gemach-management-system-production.up.railway.app`
6. לחץ Deploy!

---

## 🔄 תהליך העבודה

### פיתוח מקומי
```bash
npm run dev
```
רץ עם LocalStorage (Electron mode)

### בדיקת Web לוקלית
```bash
# שנה ב-.env:
VITE_USE_API=true

# הרץ
npm run dev
```

### בדיקת Build לפני העלאה
```bash
npm run build
npm run preview
```

---

## 📊 השוואה

| תכונה | Electron (EXE) | Web (Vercel) |
|-------|---------------|--------------|
| נתונים | LocalStorage | API + Database |
| אינטרנט | לא נדרש | נדרש |
| התקנה | קובץ .exe | דפדפן |
| עדכונים | ידני | אוטומטי |
| גישה | מחשב אחד | מכל מקום |

---

## ✅ מה הבא?

1. **בדוק שהכל עובד:**
   ```bash
   npm run build
   npm run preview
   ```

2. **העלה ל-Vercel:**
   ```bash
   vercel --prod
   ```

3. **בדוק שה-API עובד:**
   - פתח את האתר
   - נסה להתחבר
   - בדוק שהנתונים נשמרים

4. **המשך לבנות EXE:**
   ```bash
   npm run build-electron
   ```

---

## 🎉 סיימנו!

עכשיו יש לך:
- ✅ גרסת Web מוכנה להעלאה
- ✅ גרסת Electron ממשיכה לעבוד
- ✅ אותו קוד לשני המצבים
- ✅ קל לתחזק ולעדכן

**תיקיית `web/` נמחקה** - לא צריך אותה יותר!
