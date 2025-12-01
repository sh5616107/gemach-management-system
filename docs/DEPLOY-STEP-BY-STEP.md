# פריסה צעד אחר צעד - Let's Deploy!

## ✅ Checklist - לפני שמתחילים

- [ ] יש לך חשבון GitHub
- [ ] הקוד שלך ב-Git repository
- [ ] יש לך כרטיס אשראי (לא יחויב - רק לאימות)

---

## 🗄️ שלב 1: Supabase - Database (5 דקות)

### 1.1 הרשמה

1. **פתח:** https://supabase.com
2. **לחץ:** "Start your project"
3. **Sign in with GitHub**
4. **אשר את החיבור**

### 1.2 יצירת פרויקט Dev

1. **לחץ:** "New Project"
2. **מלא:**
   - Name: `gemach-dev`
   - Database Password: `GemachDev2024!` (שמור את זה!)
   - Region: `Europe (Frankfurt)` או הכי קרוב אליך
   - Pricing Plan: `Free`
3. **לחץ:** "Create new project"
4. **המתן** ~2 דקות עד שהפרויקט מוכן

### 1.3 העתקת Connection String

1. **לחץ על:** Settings (⚙️) בצד שמאל
2. **לחץ על:** Database
3. **גלול ל:** Connection string
4. **בחר:** URI
5. **לחץ:** Copy

זה ייראה כך:
```
postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

6. **שמור את זה בקובץ טקסט זמני!**

### 1.4 יצירת פרויקט Production

**חזור על אותו תהליך:**
- Name: `gemach-prod`
- Password: `GemachProd2024!` (שונה!)
- שמור גם את ה-Connection String הזה

---

## 🚂 שלב 2: Railway - Backend Server (10 דקות)

### 2.1 הרשמה

1. **פתח:** https://railway.app
2. **לחץ:** "Login"
3. **Sign in with GitHub**
4. **אשר את החיבור**

### 2.2 יצירת פרויקט

1. **לחץ:** "New Project"
2. **בחר:** "Deploy from GitHub repo"
3. **אם זו הפעם הראשונה:**
   - לחץ "Configure GitHub App"
   - בחר את ה-repository שלך
   - אשר
4. **בחר את ה-repository:** `gemach-management-system`

### 2.3 הגדרת Backend

1. **Railway יזהה את הקוד אוטומטית**
2. **לחץ על השירות שנוצר**
3. **לחץ על:** Settings
4. **הגדר:**
   - Root Directory: `backend`
   - Build Command: `npm install && npm run prisma:generate && npm run build`
   - Start Command: `npm run start:prod`

### 2.4 הוספת משתני סביבה (Variables)

1. **לחץ על:** Variables (בתפריט העליון)
2. **לחץ:** "New Variable"
3. **הוסף אחד אחד:**

```bash
NODE_ENV=production
DATABASE_URL=<הדבק את ה-URL מ-Supabase Prod>
JWT_SECRET=<צור מפתח - ראה למטה>
PORT=3000
FRONTEND_URL=https://your-app.vercel.app
```

**ליצירת JWT_SECRET:**
- פתח Terminal/CMD
- הרץ:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
- העתק את התוצאה

4. **לחץ:** "Deploy" (למעלה מימין)

### 2.5 המתן ל-Deploy

1. **לחץ על:** "Deployments"
2. **צפה ב-logs**
3. **המתן עד:** ✅ "Success"

### 2.6 קבל את ה-URL

1. **לחץ על:** Settings
2. **גלול ל:** Domains
3. **לחץ:** "Generate Domain"
4. **תקבל URL כמו:** `gemach-backend-production.up.railway.app`
5. **שמור את זה!**

### 2.7 בדיקה

פתח דפדפן וגש ל:
```
https://gemach-backend-production.up.railway.app/health
```

אמור להחזיר:
```json
{
  "status": "ok",
  "timestamp": "2025-12-01T..."
}
```

✅ **אם רואה את זה - Backend עובד!**

---

## 🌐 שלב 3: Vercel - Frontend (5 דקות)

### 3.1 הרשמה

1. **פתח:** https://vercel.com
2. **לחץ:** "Sign Up"
3. **Continue with GitHub**
4. **אשר**

### 3.2 יצירת פרויקט

1. **לחץ:** "Add New..." → "Project"
2. **Import Git Repository**
3. **בחר:** `gemach-management-system`
4. **לחץ:** "Import"

### 3.3 הגדרות

1. **Framework Preset:** Vite (אמור לזהות אוטומטית)
2. **Root Directory:** `.` (שורש - השאר כמו שזה)
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`

### 3.4 Environment Variables

**לחץ על:** "Environment Variables"

**הוסף:**
```bash
VITE_API_URL=https://gemach-backend-production.up.railway.app
```

(הדבק את ה-URL מ-Railway)

### 3.5 Deploy!

1. **לחץ:** "Deploy"
2. **המתן** ~2-3 דקות
3. **תראה:** 🎉 Congratulations!

### 3.6 קבל את ה-URL

תקבל URL כמו:
```
https://gemach-management-system.vercel.app
```

---

## 🔗 שלב 4: חיבור הכל (2 דקות)

### 4.1 עדכן CORS ב-Railway

1. **חזור ל-Railway**
2. **לחץ על הפרויקט**
3. **Variables**
4. **ערוך את:** `FRONTEND_URL`
5. **שנה ל:** `https://gemach-management-system.vercel.app`
   (ה-URL שקיבלת מ-Vercel)
6. **שמור**
7. **Railway יעשה redeploy אוטומטית**

---

## 🎉 שלב 5: בדיקה סופית!

### 5.1 פתח את האפליקציה

גש ל: `https://gemach-management-system.vercel.app`

### 5.2 בדוק שהכל עובד

1. **האתר נטען?** ✅
2. **אין שגיאות ב-Console?** (F12)
3. **נסה להתחבר** (אם אין סיסמה - אמור להיכנס)
4. **נסה להוסיף לווה**

---

## 🐛 Troubleshooting

### "Failed to fetch" או "Network Error"

**בעיה:** Frontend לא מצליח להתחבר ל-Backend

**פתרון:**
1. בדוק ש-`VITE_API_URL` ב-Vercel נכון
2. בדוק ש-`FRONTEND_URL` ב-Railway נכון
3. ודא שאין `/` בסוף ה-URLs

### "CORS Error"

**בעיה:** Backend חוסם את Frontend

**פתרון:**
1. ב-Railway Variables
2. ודא ש-`FRONTEND_URL` תואם בדיוק ל-URL של Vercel
3. Redeploy

### "Can't reach database server"

**בעיה:** Backend לא מצליח להתחבר ל-Supabase

**פתרון:**
1. ב-Railway Variables
2. בדוק את `DATABASE_URL`
3. ודא שהסיסמה נכונה (אין רווחים)
4. נסה להעתיק שוב מ-Supabase

### "Module not found"

**בעיה:** Build נכשל

**פתרון:**
1. ב-Railway Settings
2. Build Command: `npm install && npm run prisma:generate && npm run build`
3. Redeploy

---

## 📊 סיכום - מה יש לך עכשיו

```
✅ Database:  Supabase (500MB חינם)
✅ Backend:   Railway (חינם)
✅ Frontend:  Vercel (חינם)
✅ HTTPS:     אוטומטי (חינם)
✅ Deploy:    אוטומטי מ-GitHub
```

### ה-URLs שלך:

```
Frontend:  https://gemach-management-system.vercel.app
Backend:   https://gemach-backend-production.up.railway.app
Database:  Supabase Dashboard
```

---

## 🎓 מה הלאה?

### עכשיו אתה יכול:

1. **לשתף את ה-URL** עם אנשים אחרים
2. **לגשת מכל מקום** (מחשב, טלפון, טאבלט)
3. **לעדכן את הקוד** - push ל-GitHub → auto-deploy!

### צעדים הבאים:

1. **הוסף משתמשים** - צור מערכת משתמשים
2. **הוסף routes נוספים** - deposits, donations
3. **הוסף התראות** - SMS/Email
4. **הוסף גיבויים** - אוטומטיים

---

## 💰 עלויות

| שירות | חינם עד | אחר כך |
|-------|---------|--------|
| Supabase | 500MB | $25/חודש |
| Railway | $5 credit | $5/חודש |
| Vercel | 100GB | $20/חודש |

**למערכת קטנה-בינונית:** חינם לחלוטין!

---

## 🎉 מזל טוב!

המערכת שלך באוויר! 🚀

**זמן שלקח:** ~20-30 דקות
**עלות:** ₪0
**תוצאה:** מערכת מקצועית נגישה מכל מקום!
