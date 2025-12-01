# פריסה לשרת חינמי - Deploy to Free Server

## 🎯 המטרה
להעלות את המערכת לשרת אמיתי **בחינם** עם סביבות Dev ו-Production נפרדות.

---

## 📋 תוכנית הפריסה

```
Development (פיתוח):
├── Backend: Railway Dev
├── Database: Supabase Dev Project
└── Frontend: Vercel Preview

Production (ייצור):
├── Backend: Railway Production
├── Database: Supabase Production Project
└── Frontend: Vercel Production
```

---

## 🚀 שלב 1: הכנת הקוד

### 1.1 עדכן .gitignore

ודא שהקובץ `.gitignore` בשורש הפרויקט כולל:

```gitignore
# Environment files
.env
.env.local
.env.development
.env.production
backend/.env
backend/.env.local
backend/.env.development
backend/.env.production

# Dependencies
node_modules/
backend/node_modules/

# Build
dist/
backend/dist/
dist-electron/

# Logs
*.log
```

### 1.2 Commit והעלה ל-GitHub

```bash
git add .
git commit -m "Add backend with dev/prod environments"
git push origin main
```

---

## 🗄️ שלב 2: הקמת Databases (Supabase)

### 2.1 Dev Database

1. **היכנס ל-https://supabase.com**
2. **צור פרויקט חדש:**
   - שם: `gemach-dev`
   - סיסמה: שמור אותה!
   - Region: בחר הכי קרוב (Europe West)
3. **העתק Connection String:**
   - Settings → Database → Connection String
   - בחר "URI"
   - העתק את הכתובת

דוגמה:
```
postgresql://postgres.xxxxx:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

### 2.2 Production Database

חזור על אותו תהליך עם שם `gemach-prod`

**חשוב:** שמור את שני ה-Connection Strings!

---

## 🖥️ שלב 3: הקמת Backend (Railway)

### 3.1 הרשמה ל-Railway

1. **היכנס ל-https://railway.app**
2. **Sign up with GitHub**
3. **אשר את החיבור**

### 3.2 יצירת Dev Environment

1. **New Project → Deploy from GitHub repo**
2. **בחר את ה-repository שלך**
3. **הגדרות:**
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

4. **הוסף Variables (משתני סביבה):**

לחץ על Variables והוסף:

```bash
NODE_ENV=development
DATABASE_URL=<הדבק את ה-URL מ-Supabase Dev>
JWT_SECRET=dev-jwt-secret-change-this-123456
FRONTEND_URL=https://your-app-dev.vercel.app
PORT=3000
```

5. **Deploy!**

Railway יתן לך URL כמו: `https://gemach-backend-dev.up.railway.app`

### 3.3 יצירת Production Environment

**באותו פרויקט:**

1. **Environments → New Environment → "production"**
2. **הוסף Variables שונים:**

```bash
NODE_ENV=production
DATABASE_URL=<הדבק את ה-URL מ-Supabase Prod>
JWT_SECRET=<צור מפתח חזק - ראה למטה>
FRONTEND_URL=https://your-app.vercel.app
PORT=3000
```

**ליצירת JWT_SECRET חזק:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

3. **Deploy Production**

תקבל URL נפרד: `https://gemach-backend-prod.up.railway.app`

### 3.4 הרץ Migrations

**ב-Railway Dashboard:**

1. לך ל-Settings → Deploy Logs
2. פתח Terminal (אם יש)
3. או הוסף Custom Start Command:

```bash
npm run prisma:migrate:prod && npm start
```

---

## 🌐 שלב 4: הקמת Frontend (Vercel)

### 4.1 הרשמה ל-Vercel

1. **היכנס ל-https://vercel.com**
2. **Sign up with GitHub**

### 4.2 Deploy Frontend

1. **New Project → Import Git Repository**
2. **בחר את ה-repository**
3. **הגדרות:**
   - Framework Preset: Vite
   - Root Directory: `.` (שורש)
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Environment Variables:**

**Production:**
```bash
VITE_API_URL=https://gemach-backend-prod.up.railway.app
```

**Preview (Dev):**
```bash
VITE_API_URL=https://gemach-backend-dev.up.railway.app
```

5. **Deploy!**

תקבל:
- Production: `https://gemach-system.vercel.app`
- Preview: `https://gemach-system-git-dev.vercel.app`

---

## 🔄 שלב 5: חיבור הכל ביחד

### 5.1 עדכן CORS ב-Backend

חזור ל-Railway ועדכן את `FRONTEND_URL`:

**Dev:**
```bash
FRONTEND_URL=https://gemach-system-git-dev.vercel.app
```

**Production:**
```bash
FRONTEND_URL=https://gemach-system.vercel.app
```

### 5.2 בדיקה

**Dev:**
1. גש ל-`https://gemach-system-git-dev.vercel.app`
2. נסה להתחבר
3. בדוק שהכל עובד

**Production:**
1. גש ל-`https://gemach-system.vercel.app`
2. נסה להתחבר
3. בדוק שהכל עובד

---

## 📊 סיכום - מה יש לך עכשיו

### Development (פיתוח):
```
Frontend:  https://gemach-system-git-dev.vercel.app
Backend:   https://gemach-backend-dev.up.railway.app
Database:  Supabase Dev (500MB חינם)
```

### Production (ייצור):
```
Frontend:  https://gemach-system.vercel.app
Backend:   https://gemach-backend-prod.up.railway.app
Database:  Supabase Prod (500MB חינם)
```

### תהליך עבודה:
1. **פיתוח** - עובד על branch `dev`, push → auto-deploy ל-Dev
2. **בדיקה** - בודק ב-Dev environment
3. **ייצור** - merge ל-`main` → auto-deploy ל-Production

---

## 💰 עלויות

| שירות | Dev | Production | סה"ך |
|-------|-----|------------|------|
| Supabase | חינם (500MB) | חינם (500MB) | ₪0 |
| Railway | חינם ($5 credit) | חינם ($5 credit) | ₪0 |
| Vercel | חינם | חינם | ₪0 |
| **סה"ך** | | | **₪0/חודש** |

**הגבלות:**
- Supabase: 500MB לכל DB
- Railway: $5 credit/חודש (מספיק לשרת קטן)
- Vercel: 100GB bandwidth

---

## 🔧 Troubleshooting

### "Can't connect to database"
```bash
# בדוק את DATABASE_URL ב-Railway Variables
# ודא שהוא מתחיל ב-postgresql://
```

### "CORS error"
```bash
# עדכן FRONTEND_URL ב-Railway
# ודא שאין / בסוף
```

### "Module not found"
```bash
# ב-Railway Settings:
# Build Command: npm install && npm run prisma:generate && npm run build
```

### "Database schema out of sync"
```bash
# הרץ migrations:
# ב-Railway Terminal או דרך Custom Start Command:
npm run prisma:migrate:prod && npm start
```

---

## 🎉 זהו! המערכת שלך באוויר

עכשיו יש לך:
- ✅ שתי סביבות נפרדות
- ✅ Deploy אוטומטי מ-GitHub
- ✅ SSL חינם (HTTPS)
- ✅ גיבויים אוטומטיים (Supabase)
- ✅ Monitoring (Railway Dashboard)

**זמן משוער:** 30-45 דקות להקמה מלאה
