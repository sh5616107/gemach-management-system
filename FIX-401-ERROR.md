# 🔧 תיקון שגיאה 401

## מה קרה?

האתר מנסה לטעון נתונים מה-API **לפני** שהמשתמש התחבר.

זה קורה כי הקוד ב-`App.tsx` מנסה לקרוא ל-`db.getSettings()` כדי לבדוק אם יש סיסמה, אבל ב-Web זה קורא ל-API שדורש התחברות.

---

## 🎯 הפתרון

צריך לשנות את הלוגיקה:
1. **תמיד** להראות דף התחברות קודם
2. רק **אחרי** התחברות - לטעון נתונים

---

## 📝 מה צריך לשנות

### אופציה 1: פשוטה - תמיד דרוש התחברות

שנה את `App.tsx` כך שתמיד יראה את דף ההתחברות קודם:

```typescript
useEffect(() => {
  const sessionToken = sessionStorage.getItem('gemach_session')
  
  // בדוק רק אם יש טוקן סשן
  if (sessionToken === 'authenticated') {
    setIsLoggedIn(true)
  }
  
  setIsCheckingAuth(false)
}, [])
```

### אופציה 2: מתקדמת - בדוק אם צריך סיסמה

צריך endpoint חדש ב-Backend:
```
GET /api/auth/check-password-required
```

שמחזיר:
```json
{
  "passwordRequired": true/false
}
```

ואז ב-Frontend:
```typescript
useEffect(() => {
  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/check-password-required`)
      const data = await response.json()
      
      if (!data.passwordRequired) {
        setIsLoggedIn(true)
      }
    } catch (error) {
      // אם יש שגיאה, דרוש התחברות
    }
    setIsCheckingAuth(false)
  }
  
  checkAuth()
}, [])
```

---

## 🚀 מה לעשות עכשיו?

### בינתיים - פתרון זמני:

פשוט **תתחבר** באתר:
1. לך לדף ההתחברות
2. הזן סיסמה (אם יש)
3. או לחץ "התחבר" (אם אין סיסמה)

זה אמור לעבוד!

### לטווח ארוך:

צריך לתקן את הקוד כדי שלא ינסה לטעון נתונים לפני התחברות.

---

## 💡 למה זה קרה?

ב-**Electron** (LocalStorage):
- `db.getSettings()` קורא מ-LocalStorage
- זה לא דורש התחברות
- זה עובד מיד

ב-**Web** (API):
- `db.getSettings()` קורא מה-API
- ה-API דורש טוקן
- אין טוקן = שגיאה 401

---

## ✅ מה הלאה?

1. **נסה להתחבר** באתר - זה אמור לעבוד
2. אם זה עובד - מעולה! נתקן את הקוד מאוחר יותר
3. אם זה לא עובד - תגיד לי ונמשיך לחקור

---

**רוצה שאתקן את הקוד עכשיו?** או שנבדוק קודם אם ההתחברות עובדת?
