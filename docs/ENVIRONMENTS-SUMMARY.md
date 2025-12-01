# סביבות פיתוח וייצור - Environments Summary

## 🎯 למה צריך שתי סביבות?

### Development (פיתוח) - Dev
- **למה:** לבדוק שינויים לפני שמעלים ללקוחות
- **מי משתמש:** רק אתה (המפתח)
- **נתונים:** נתוני בדיקה (לא אמיתיים)
- **שגיאות:** לא נורא אם משהו נשבר

### Production (ייצור) - Prod
- **למה:** הגרסה האמיתית שהלקוחות משתמשים בה
- **מי משתמש:** המשתמשים הסופיים (הגמ"חים)
- **נתונים:** נתונים אמיתיים (לווים, הלוואות)
- **שגיאות:** חייב לעבוד תמיד!

---

## 📊 השוואה

| | Development | Production |
|---|---|---|
| **URL Frontend** | gemach-dev.vercel.app | gemach.vercel.app |
| **URL Backend** | backend-dev.railway.app | backend.railway.app |
| **Database** | Supabase Dev | Supabase Prod |
| **נתונים** | בדיקות | אמיתיים |
| **Git Branch** | `dev` | `main` |
| **Deploy** | כל push ל-dev | כל push ל-main |
| **Logs** | מפורטים | רק שגיאות |

---

## 🔄 תהליך עבודה טיפוסי

### 1. פיתוח תכונה חדשה

```bash
# צור branch חדש
git checkout -b feature/new-feature

# עבוד על התכונה
# ...

# commit
git add .
git commit -m "Add new feature"

# push ל-dev
git checkout dev
git merge feature/new-feature
git push origin dev
```

→ **Auto-deploy ל-Dev environment**

### 2. בדיקה ב-Dev

1. גש ל-`https://gemach-dev.vercel.app`
2. בדוק שהתכונה עובדת
3. בדוק שלא שברת משהו
4. בדוק עם נתוני בדיקה

### 3. העלאה ל-Production

```bash
# אם הכל עובד ב-dev:
git checkout main
git merge dev
git push origin main
```

→ **Auto-deploy ל-Production environment**

### 4. ניטור Production

1. בדוק שהכל עובד
2. עקוב אחרי logs ב-Railway
3. בדוק שאין שגיאות

---

## 🛠️ הגדרות לכל סביבה

### Development (.env.development)

```bash
NODE_ENV=development
DATABASE_URL=postgresql://...supabase-dev...
JWT_SECRET=dev-secret-not-secure
FRONTEND_URL=https://gemach-dev.vercel.app
```

**מאפיינים:**
- Logs מפורטים
- שגיאות מפורטות (עם stack trace)
- אין rate limiting קשוח
- אפשר לאפס DB בקלות

### Production (.env.production)

```bash
NODE_ENV=production
DATABASE_URL=postgresql://...supabase-prod...
JWT_SECRET=super-secure-random-string-xyz123
FRONTEND_URL=https://gemach.vercel.app
```

**מאפיינים:**
- Logs מינימליים
- שגיאות כלליות (בלי לחשוף מידע)
- Rate limiting מחמיר
- גיבויים אוטומטיים

---

## 🚨 כללי זהב

### ✅ DO (כן)
- תמיד בדוק ב-Dev לפני Production
- שמור סיסמאות שונות לכל סביבה
- עשה גיבוי לפני שינויים גדולים
- עקוב אחרי logs ב-Production

### ❌ DON'T (לא)
- אל תבדוק ישירות ב-Production
- אל תשתמש באותה סיסמה ל-Dev ו-Prod
- אל תמחק נתונים ב-Production בלי גיבוי
- אל תעלה קוד שלא נבדק

---

## 📱 גישה לסביבות

### Development
```
Frontend:  https://gemach-dev.vercel.app
Backend:   https://backend-dev.railway.app/health
Database:  Supabase Dashboard → gemach-dev project
```

### Production
```
Frontend:  https://gemach.vercel.app
Backend:   https://backend.railway.app/health
Database:  Supabase Dashboard → gemach-prod project
```

---

## 🔐 אבטחה

### Development
- סיסמאות פשוטות (לבדיקה)
- אפשר לשתף credentials עם צוות
- נתונים לא רגישים

### Production
- סיסמאות חזקות מאוד
- רק אנשים מורשים
- נתונים רגישים - חייב הצפנה

---

## 💡 טיפים

### מעבר מהיר בין סביבות

**בדיקה מקומית:**
```bash
# Dev
npm run dev

# Prod (מקומי)
NODE_ENV=production npm start
```

**בדיקת API:**
```bash
# Dev
curl https://backend-dev.railway.app/health

# Prod
curl https://backend.railway.app/health
```

### איפוס Dev Database

```bash
# ב-Supabase Dashboard:
# SQL Editor → Run:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# אחר כך ב-Railway:
npm run prisma:migrate:prod
```

**אזהרה:** אל תעשה את זה ב-Production!

---

## 🎓 לסיכום

**Development = מגרש אימונים**
- כאן אתה מתנסה
- כאן אתה טועה
- כאן אתה לומד

**Production = המשחק האמיתי**
- כאן הכל חייב לעבוד
- כאן הלקוחות משתמשים
- כאן אתה זהיר

**תמיד עבור דרך Dev לפני Production!**
