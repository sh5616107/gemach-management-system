# 🚀 מדריך יצירת מאגר נפרד לעדכונים

## 🎯 למה צריך מאגר נפרד?

1. **הקוד שלך נשאר פרטי** ✅
2. **Releases יהיו ציבוריים** ✅  
3. **עדכונים אוטומטיים יעבדו** ✅
4. **משתמשים יוכלו להוריד** (לא עוד 404) ✅

---

## 📋 שלב 1: יצירת המאגר החדש ב-GitHub

1. **גש ל-GitHub** → https://github.com/new

2. **מלא את הפרטים:**
   - **Repository name:** `gemach-releases`
   - **Description:** `Public releases for Gemach Management System`
   - **Visibility:** ✅ **Public** (חשוב!)
   - **Initialize:** אל תסמן שום דבר (מאגר ריק)

3. **לחץ על "Create repository"**

---

## 📋 שלב 2: הגדרת המאגר החדש

אחרי שיצרת את המאגר, תראה מסך עם הוראות. **אל תעשה כלום שם עדיין!**

במקום זה, תריץ את הפקודות הבאות **במחשב שלך** (בתיקיית הפרויקט):

```bash
# צור תיקייה זמנית למאגר החדש
cd ..
mkdir gemach-releases
cd gemach-releases

# אתחל git
git init

# צור README בסיסי
echo "# Gemach Management System - Releases" > README.md
echo "" >> README.md
echo "This repository contains public releases for the Gemach Management System." >> README.md
echo "" >> README.md
echo "## Download Latest Version" >> README.md
echo "" >> README.md
echo "Go to [Releases](https://github.com/sh5616107/gemach-releases/releases) to download the latest version." >> README.md

# הוסף ל-git
git add README.md
git commit -m "Initial commit"

# קשר למאגר ב-GitHub
git remote add origin https://github.com/sh5616107/gemach-releases.git

# דחוף למאגר
git branch -M main
git push -u origin main
```

---

## 📋 שלב 3: עדכון הפרויקט הראשי

חזור לתיקיית הפרויקט הראשי:

```bash
cd ../gemach-management-system
```

עכשיו נעדכן את הקבצים הבאים:

### 1️⃣ עדכן `package.json`

שנה את חלק ה-`publish`:

```json
"publish": {
  "provider": "github",
  "owner": "sh5616107",
  "repo": "gemach-releases"
}
```

### 2️⃣ עדכן `electron.js`

חפש את השורה:

```javascript
repo: 'gemach-management-system'
```

ושנה ל:

```javascript
repo: 'gemach-releases'
```

---

## 📋 שלב 4: יצירת GitHub Action חדש

צור קובץ חדש: `.github/workflows/publish-release.yml`

זה workflow שידחוף releases למאגר הציבורי.

---

## 📋 שלב 5: הגדרת GitHub Token

1. **גש להגדרות GitHub:**
   - https://github.com/settings/tokens

2. **לחץ על "Generate new token" → "Generate new token (classic)"**

3. **מלא את הפרטים:**
   - **Note:** `Gemach Releases Publisher`
   - **Expiration:** `No expiration` (או לפי העדפתך)
   - **Select scopes:**
     - ✅ `repo` (כל ה-checkboxes תחתיו)
     - ✅ `workflow`

4. **לחץ "Generate token"**

5. **העתק את ה-Token** (תראה אותו רק פעם אחת!)

6. **הוסף ל-Secrets:**
   - גש למאגר הפרטי: https://github.com/sh5616107/gemach-management-system/settings/secrets/actions
   - לחץ "New repository secret"
   - **Name:** `RELEASES_TOKEN`
   - **Value:** הדבק את ה-Token
   - לחץ "Add secret"

---

## 📋 שלב 6: בדיקה

1. **Commit והעלה את השינויים:**

```bash
git add .
git commit -m "Switch to public releases repository"
git push
```

2. **צור גרסה חדשה:**

```bash
git tag v2.9.57
git push origin v2.9.57
```

3. **בדוק ב-GitHub Actions:**
   - המאגר הפרטי: https://github.com/sh5616107/gemach-management-system/actions
   - המאגר הציבורי: https://github.com/sh5616107/gemach-releases/releases

---

## ✅ מה קורה עכשיו?

1. **הקוד נשאר פרטי** במאגר `gemach-management-system`
2. **Releases מתפרסמים אוטומטית** למאגר `gemach-releases`
3. **משתמשים יכולים להוריד** מ-`gemach-releases` (ציבורי)
4. **עדכונים אוטומטיים עובדים** כי האפליקציה מחפשת ב-`gemach-releases`

---

## 🔍 בדיקת עדכונים

אחרי שיש לך release במאגר הציבורי:

1. פתח את האפליקציה
2. לך להגדרות → בדוק עדכונים
3. אמור לראות את הגרסה החדשה!

---

## 🆘 פתרון בעיות

### בעיה: "Resource not accessible by integration"
**פתרון:** ודא שה-Token כולל את ההרשאות `repo` ו-`workflow`

### בעיה: "404 Not Found"
**פתרון:** ודא שהמאגר `gemach-releases` הוא **Public**

### בעיה: "No releases found"
**פתרון:** ודא שיש לפחות release אחד במאגר הציבורי

---

## 📝 הערות חשובות

- המאגר הפרטי (`gemach-management-system`) - כאן הקוד שלך
- המאגר הציבורי (`gemach-releases`) - כאן רק ה-releases
- ה-Token צריך להישאר סודי!
- אפשר למחוק releases ישנים מהמאגר הציבורי אם רוצה

---

**מוכן להתחיל? בוא נעשה את זה! 🚀**
