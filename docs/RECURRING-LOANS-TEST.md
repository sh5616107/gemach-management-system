# 🧪 מדריך בדיקת הלוואות מחזוריות

## 🎯 מטרה
לוודא שהלוואות מחזוריות נוצרות אוטומטית כל חודש.

---

## 📋 תרחיש בדיקה 1: הלוואה מחזורית חדשה

### שלב 1: צור הלוואה מחזורית
1. פתח את המערכת
2. לך ל"הלוואות" → "הלוואה חדשה"
3. מלא פרטים:
   - לווה: בחר לווה קיים
   - סכום: 1000 ש"ח
   - תקופה: 1 חודש
   - **סמן:** ✅ הלוואה מחזורית
   - **יום בחודש:** 15 (למשל)
   - **מספר חודשים:** 3
4. שמור

### שלב 2: בדוק שההלוואה נוצרה
1. לך ל"הלוואות"
2. תראה הלוואה אחת עם הסימון "מחזורית"

### שלב 3: סימולציה - שנה תאריך במערכת
**⚠️ זה לא אפשרי במערכת הנוכחית - צריך לחכות לחודש הבא**

### שלב 4: חכה לחודש הבא
1. ביום ה-15 של החודש הבא, פתח את המערכת
2. **אמור לראות התראה** בדף הבית: "יש הלוואות מחזוריות ממתינות"
3. לחץ "אשר" → הלוואה חדשה תיווצר אוטומטית

---

## 📋 תרחיש בדיקה 2: בדיקה מיידית (עם קונסול)

### שלב 1: פתח את הקונסול
1. פתח את המערכת
2. לחץ F12 (DevTools)
3. לך ל-Console

### שלב 2: הרץ את הקוד הבא
```javascript
// בדוק הלוואות מחזוריות קיימות
const db = window.db || JSON.parse(localStorage.getItem('gemach_data'))
const recurringLoans = db.loans.filter(l => l.isRecurring)
console.log('הלוואות מחזוריות:', recurringLoans)

// בדוק כמה הלוואות נוצרו מכל הלוואה מחזורית
recurringLoans.forEach(loan => {
  const relatedLoans = db.loans.filter(l => 
    l.borrowerId === loan.borrowerId && 
    l.amount === loan.amount &&
    l.notes && l.notes.includes('מחזורית')
  )
  console.log(`הלוואה ${loan.id} (${loan.borrowerName}):`, {
    original: loan.loanDate,
    lastRecurring: loan.lastRecurringDate,
    totalCreated: relatedLoans.length,
    maxMonths: loan.recurringMonths
  })
})
```

### שלב 3: בדוק את התוצאות
- `totalCreated` - כמה הלוואות נוצרו עד כה
- `maxMonths` - כמה הלוואות אמורות להיווצר בסך הכל
- `lastRecurringDate` - מתי נוצרה ההלוואה האחרונה

---

## 📋 תרחיש בדיקה 3: סימולציה ידנית

### שלב 1: שנה תאריך ידנית בקוד
**⚠️ זה רק לבדיקה - אל תעשה זאת בסביבת ייצור!**

1. פתח את הקונסול (F12)
2. הרץ:
```javascript
// שמור את התאריך המקורי
const originalDate = Date.now
const originalDateConstructor = Date

// שנה את התאריך ל-15 בחודש הבא
Date = class extends originalDateConstructor {
  constructor(...args) {
    if (args.length === 0) {
      const nextMonth = new originalDateConstructor()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      nextMonth.setDate(15)
      super(nextMonth)
    } else {
      super(...args)
    }
  }
  
  static now() {
    const nextMonth = new originalDateConstructor()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    nextMonth.setDate(15)
    return nextMonth.getTime()
  }
}

// עכשיו רענן את הדף
location.reload()
```

3. אחרי הרענון, בדוק אם יש התראה על הלוואות מחזוריות

### שלב 2: החזר את התאריך
```javascript
// החזר את התאריך המקורי
Date = originalDateConstructor
location.reload()
```

---

## ✅ מה אמור לקרות?

### בחודש הראשון:
- ✅ הלוואה 1 נוצרת ידנית
- ✅ `lastRecurringDate` = null

### בחודש השני (ביום 15):
- ✅ התראה בדף הבית
- ✅ לחיצה על "אשר" → הלוואה 2 נוצרת
- ✅ `lastRecurringDate` = תאריך החודש השני

### בחודש השלישי (ביום 15):
- ✅ התראה בדף הבית
- ✅ לחיצה על "אשר" → הלוואה 3 נוצרת
- ✅ `lastRecurringDate` = תאריך החודש השלישי

### בחודש הרביעי (ביום 15):
- ❌ אין התראה (כי הגענו ל-3 חודשים)
- ✅ ההלוואה המקורית נשארת עם `isRecurring: true` אבל לא יוצרת יותר הלוואות

---

## 🐛 בעיות אפשריות

### בעיה 1: לא מופיעה התראה
**פתרון:**
1. בדוק שההלוואה מסומנת כ-`isRecurring: true`
2. בדוק ש-`recurringDay` מוגדר
3. בדוק שהתאריך הנוכחי הוא אחרי `recurringDay`

### בעיה 2: נוצרות יותר מדי הלוואות
**פתרון:**
1. בדוק את `recurringMonths` - אולי הוגדר מספר גבוה מדי
2. בדוק את `lastRecurringDate` - אולי לא מתעדכן

### בעיה 3: לא נוצרות הלוואות בכלל
**פתרון:**
1. בדוק שההגדרה `enableRecurringLoans` מופעלת
2. בדוק שהפונקציה `processRecurringLoans()` נקראת ב-`init()`
3. בדוק את הקונסול לשגיאות

---

## 📊 לוג בדיקה

תעד את הבדיקה שלך:

| תאריך | הלוואה מקורית | הלוואות שנוצרו | הערות |
|-------|---------------|----------------|-------|
| 15/12/2024 | #123 | 1 | הלוואה ראשונה |
| 15/01/2025 | #123 | 2 | הלוואה שנייה ✅ |
| 15/02/2025 | #123 | 3 | הלוואה שלישית ✅ |
| 15/03/2025 | #123 | 3 | לא נוצרה (הגענו למקסימום) ✅ |

---

## 🎉 סיכום

אם כל הבדיקות עברו בהצלחה:
- ✅ הלוואות מחזוריות עובדות!
- ✅ ההתראות מופיעות בזמן
- ✅ ההלוואות נוצרות אוטומטית
- ✅ המערכת עוצרת אחרי המספר המקסימלי

**הכל עובד מצוין! 🚀**
