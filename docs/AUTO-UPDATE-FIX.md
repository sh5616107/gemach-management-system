# 🔄 תיקון עדכון אוטומטי - מאגר פרטי

## ❌ הבעיה

כשהמאגר פרטי:
- ❌ משתמשים מקבלים 404 בהורדת Releases
- ❌ העדכון האוטומטי לא עובד
- ❌ electron-updater לא יכול לגשת ל-GitHub

## ✅ הפתרון: מאגר נפרד ל-Releases

### שלב 1: צור מאגר ציבורי חדש

1. GitHub → New Repository
2. שם: `gemach-releases`
3. תיאור: `Gemach Management System - Public Releases`
4. סוג: **Public** ✅
5. אל תוסף README/LICENSE
6. Create repository

### שלב 2: עדכן את package.json

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "sh5616107",
      "repo": "gemach-releases",
      "private": false
    }
  }
}
```

### שלב 3: עדכן את electron.js

הוסף בתחילת הקובץ:

```javascript
// הגדרות עדכון אוטומטי
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'sh5616107',
  repo: 'gemach-releases',
  private: false
})
```

### שלב 4: בנה ופרסם

```bash
# בנה את ה-EXE
.\build-exe.bat

# העלה ידנית למאגר gemach-releases
# GitHub → gemach-releases → Releases → New Release
# Tag: v2.9.56
# Upload: gemach-management-system-setup-2.9.56.exe
```

---

## 🤖 אוטומציה (אופציונלי)

אם אתה רוצה שזה יהיה אוטומטי:

### 1. צור GitHub Token

1. GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token
4. שם: `GEMACH_RELEASES_TOKEN`
5. הרשאות:
   - ✅ `repo` (כל ההרשאות)
   - ✅ `write:packages`
6. Generate token
7. **העתק את ה-Token!** (לא תראה אותו שוב)

### 2. הוסף Secret למאגר הפרטי

1. GitHub → gemach-management-system (הפרטי)
2. Settings → Secrets and variables → Actions
3. New repository secret
4. שם: `RELEASES_TOKEN`
5. Value: הדבק את ה-Token
6. Add secret

### 3. עדכן את GitHub Actions

עדכן את `.github/workflows/build-release.yml`:

```yaml
- name: Release
  uses: softprops/action-gh-release@v1
  with:
    files: dist-electron/*.exe
    draft: false
    prerelease: false
    make_latest: true
    repository: sh5616107/gemach-releases  # ← המאגר הציבורי!
  env:
    GITHUB_TOKEN: ${{ secrets.RELEASES_TOKEN }}  # ← ה-Token החדש!
```

---

## 📦 התוצאה

```
┌─────────────────────────────────────┐
│ gemach-management-system (Private)  │
│ - הקוד שלך (מוסתר)                 │
│ - רק אתה רואה                      │
└─────────────┬───────────────────────┘
              │
              ↓ GitHub Actions
              │
┌─────────────────────────────────────┐
│ gemach-releases (Public)            │
│ - רק קבצי EXE                      │
│ - כולם יכולים להוריד               │
│ - עדכונים אוטומטיים עובדים         │
└─────────────────────────────────────┘
```

---

## 🧪 בדיקה

### בדוק שהעדכון עובד:

1. התקן גרסה ישנה
2. פרסם גרסה חדשה ל-`gemach-releases`
3. פתח את האפליקציה
4. אמור לראות הודעה: "גרסה חדשה זמינה!"
5. לחץ "עדכן"
6. האפליקציה תתעדכן אוטומטית

---

## 🎯 סיכום

**מה צריך לעשות:**

1. ✅ צור מאגר `gemach-releases` (ציבורי)
2. ✅ עדכן `package.json` להצביע על המאגר החדש
3. ✅ העלה את ה-EXE למאגר החדש
4. ✅ (אופציונלי) הגדר GitHub Actions לאוטומציה

**תוצאה:**
- ✅ הקוד נשאר פרטי
- ✅ משתמשים יכולים להוריד
- ✅ עדכונים אוטומטיים עובדים
- ✅ אין 404!

---

## 🚀 מדריכים נוספים

- **מדריך מהיר (5 דקות):** `docs/QUICK-SETUP-RELEASES.md`
- **מדריך מפורט:** `docs/CREATE-RELEASES-REPO.md`
- **סקריפט אוטומטי:** הרץ `setup-releases-repo.bat`

---

**מוכן להתחיל? יש לך את כל הכלים! 🎉**
