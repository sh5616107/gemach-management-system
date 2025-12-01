# התקנה מהירה - Quick Start

## שלב 1: התקן תלויות

```bash
cd backend
npm install
```

זה יתקין את כל החבילות הנדרשות:
- express
- prisma
- bcrypt
- jsonwebtoken
- ועוד...

## שלב 2: הגדר PostgreSQL

### אופציה א': Supabase (מומלץ - חינם!)

1. היכנס ל-https://supabase.com
2. צור פרויקט חדש
3. לך ל-Settings → Database
4. העתק את ה-Connection String (URI)
5. הדבק ב-`.env`:

```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"
```

### אופציה ב': PostgreSQL מקומי

```bash
# Windows (עם Chocolatey):
choco install postgresql

# או הורד מ:
https://www.postgresql.org/download/windows/

# אחרי ההתקנה:
DATABASE_URL="postgresql://postgres:password@localhost:5432/gemach"
```

## שלב 3: צור קובץ .env

```bash
# העתק את הדוגמה
copy .env.example .env

# ערוך את .env והגדר:
DATABASE_URL="<מהשלב הקודם>"
JWT_SECRET="your-super-secret-key-123456"
```

## שלב 4: הרץ מיגרציות

```bash
npm run prisma:migrate
```

זה יצור את כל הטבלאות במסד הנתונים.

## שלב 5: הפעל את השרת

```bash
# Development (עם hot reload)
npm run dev

# Production
npm run build
npm start
```

השרת ירוץ על: http://localhost:3000

## בדיקה

פתח דפדפן וגש ל:
```
http://localhost:3000/health
```

אמור להחזיר:
```json
{
  "status": "ok",
  "timestamp": "2025-12-01T..."
}
```

## שגיאות נפוצות

### "Can't reach database server"
- ודא ש-PostgreSQL רץ
- בדוק את DATABASE_URL ב-.env
- אם Supabase - ודא שהסיסמה נכונה

### "Module not found"
```bash
npm install
```

### "Prisma Client not generated"
```bash
npm run prisma:generate
```

## צעדים הבאים

1. ✅ השרת רץ
2. 📱 עכשיו צריך לחבר את ה-Frontend
3. 🚀 או לפרוס לשרת (Railway/Render)

ראה `DEPLOYMENT-OPTIONS.md` לאפשרויות פריסה.
