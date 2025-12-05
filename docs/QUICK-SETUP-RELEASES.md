# ⚡ מדריך מהיר - הגדרת מאגר Releases

## 🎯 מה עושים?

יוצרים מאגר ציבורי נפרד ל-releases, כך שהקוד נשאר פרטי אבל המשתמשים יכולים להוריד עדכונים.

---

## 📝 רשימת משימות (Checklist)

### ☐ שלב 1: יצירת מאגר ב-GitHub (2 דקות)

1. גש ל: https://github.com/new
2. **Repository name:** `gemach-releases`
3. **Visibility:** ✅ **Public**
4. לחץ "Create repository"

### ☐ שלב 2: הרצת הסקריפט (1 דקה)

```bash
setup-releases-repo.bat
```

הסקריפט יעשה הכל בשבילך:
- יצור תיקייה חדשה
- יאתחל git
- יצור README
- ידחוף למאגר הציבורי

### ☐ שלב 3: יצירת GitHub Token (2 דקות)

1. גש ל: https://github.com/settings/tokens
2. לחץ "Generate new token" → "Generate new token (classic)"
3. **Note:** `Gemach Releases Publisher`
4. **Scopes:** ✅ `repo` + ✅ `workflow`
5. לחץ "Generate token"
6. **העתק את ה-Token!** (תראה אותו רק פעם אחת)

### ☐ שלב 4: הוספת Token ל-Secrets (1 דקה)

1. גש ל: https://github.com/sh5616107/gemach-management-system/settings/secrets/actions
2. לחץ "New repository secret"
3. **Name:** `RELEASES_TOKEN`
4. **Value:** הדבק את ה-Token
5. לחץ "Add secret"

### ☐ שלב 5: עדכון package.json (30 שניות)

פתח `package.json` ושנה:

```json
"publish": {
  "provider": "github",
  "owner": "sh5616107",
  "repo": "gemach-releases"
}
```

### ☐ שלב 6: עדכון electron.js (30 שניות)

פתח `electron.js` ושנה:

```javascript
repo: 'gemach-releases'
```

### ☐ שלב 7: Commit והעלאה (1 דקה)

```bash
git add .
git commit -m "Switch to public releases repository"
git push
```

### ☐ שלב 8: בדיקה - יצירת גרסה חדשה (2 דקות)

```bash
git tag v2.9.57
git push origin v2.9.57
```

אחרי כמה דקות, בדוק:
- המאגר הפרטי: https://github.com/sh5616107/gemach-management-system/actions
- המאגר הציבורי: https://github.com/sh5616107/gemach-releases/releases

---

## ✅ סיימת!

עכשיו:
- ✅ הקוד שלך פרטי
- ✅ Releases ציבוריים
- ✅ עדכונים אוטומטיים עובדים
- ✅ משתמשים יכולים להוריד

---

## 🔍 בדיקה מהירה

פתח את האפליקציה → הגדרות → בדוק עדכונים

אמור לראות את הגרסה החדשה!

---

## 🆘 בעיות?

ראה את המדריך המפורט: `docs/CREATE-RELEASES-REPO.md`
