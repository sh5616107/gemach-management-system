# Gemach Backend API

Backend API למערכת ניהול גמ"ח

## התקנה

### דרישות מקדימות
- Node.js 18+ 
- PostgreSQL 15+
- npm או yarn

### שלבי התקנה

1. **התקן תלויות:**
```bash
cd backend
npm install
```

2. **הגדר משתני סביבה:**
```bash
cp .env.example .env
```

ערוך את `.env` והגדר:
- `DATABASE_URL` - כתובת PostgreSQL
- `JWT_SECRET` - מפתח סודי ל-JWT
- שאר ההגדרות לפי הצורך

3. **הרץ מיגרציות:**
```bash
npm run prisma:migrate
```

4. **צור את Prisma Client:**
```bash
npm run prisma:generate
```

5. **הרץ את השרת:**
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - התחברות
- `POST /api/auth/set-password` - הגדרת סיסמה

### Borrowers (לווים)
- `GET /api/borrowers` - קבל את כל הלווים
- `GET /api/borrowers/:id` - קבל לווה ספציפי
- `POST /api/borrowers` - צור לווה חדש
- `PUT /api/borrowers/:id` - עדכן לווה
- `DELETE /api/borrowers/:id` - מחק לווה
- `GET /api/borrowers/id-number/:idNumber` - חיפוש לפי מספר זהות

### Loans (הלוואות)
- `GET /api/loans` - קבל את כל ההלוואות
- `GET /api/loans/overdue` - קבל הלוואות באיחור
- `POST /api/loans` - צור הלוואה חדשה
- `PUT /api/loans/:id` - עדכן הלוואה
- `DELETE /api/loans/:id` - מחק הלוואה

### Settings (הגדרות)
- `GET /api/settings` - קבל הגדרות
- `PUT /api/settings` - עדכן הגדרות

## Prisma Studio

לניהול מסד הנתונים בממשק גרפי:
```bash
npm run prisma:studio
```

## פיתוח

### מבנה התיקיות
```
backend/
├── prisma/
│   └── schema.prisma      # סכמת מסד נתונים
├── src/
│   ├── routes/            # נתיבי API
│   ├── services/          # לוגיקה עסקית
│   ├── middleware/        # Middleware (אימות וכו')
│   ├── utils/             # פונקציות עזר
│   └── main.ts            # נקודת כניסה
├── .env                   # משתני סביבה
└── package.json
```

## שגיאות נפוצות

### "Can't reach database server"
- ודא ש-PostgreSQL רץ
- בדוק את `DATABASE_URL` ב-.env

### "JWT must be provided"
- הוסף header: `Authorization: Bearer <token>`

## הערות אבטחה

- **אל תשתף את `.env`** - הוא מכיל מידע רגיש
- שנה את `JWT_SECRET` לערך אקראי חזק
- השתמש ב-HTTPS בפרודקשן
- הגדר Rate Limiting מתאים לצרכים שלך
