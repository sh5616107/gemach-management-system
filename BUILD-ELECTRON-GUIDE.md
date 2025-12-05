# 🔨 מדריך בניית גרסת Electron

## ⚠️ בעיה נוכחית

הבנייה נכשלת כי `vite` לא מותקן. הסיבה: node_modules לא מכיל את כל התלויות.

## ✅ פתרון מהיר

### שלב 1: התקן את כל התלויות

```bash
npm install --legacy-peer-deps
```

או אם זה לא עובד:

```bash
# מחק node_modules
rmdir /s /q node_modules

# התקן מחדש
npm install --legacy-peer-deps
```

### שלב 2: בנה את האלקטרון

```bash
.\build-exe.bat
```

## 🔍 בדיקה שהכל תקין

לפני הבנייה, בדוק ש-vite מותקן:

```bash
npx vite --version
```

אם זה עובד - אתה מוכן לבנות!

## 📦 מה הקובץ build-exe.bat עושה?

1. **גיבוי .env.production** - שומר את ההגדרות של Web
2. **העתקת .env.electron** - משתמש בהגדרות של Electron (LocalStorage)
3. **בניית React** - `npm run build`
4. **שחזור .env.production** - מחזיר את ההגדרות של Web
5. **התקנת תלויות** - `npm install`
6. **בניית EXE** - `npm run dist`

## 🎯 התוצאה

הקובץ יהיה ב:
```
dist-electron\gemach-management-system-setup-2.9.56.exe
```

## 🚨 אם יש בעיות

### בעיה: "vite is not recognized"
**פתרון:** הרץ `npm install --legacy-peer-deps`

### בעיה: "electron-builder is not recognized"
**פתרון:** הרץ `npm install --save-dev electron-builder`

### בעיה: "Cannot remove node_modules"
**פתרון:** סגור את כל התהליכים (npm run dev) ונסה שוב

## 📝 הערות חשובות

- ✅ הגרסה החדשה (2.9.56) תוקנה לשמור נתונים ב-LocalStorage
- ✅ App.tsx בוחר את דף ההתחברות הנכון לפי VITE_USE_API
- ✅ build-exe.bat משתמש ב-.env.electron (VITE_USE_API=false)
- ✅ כל מספרי הגרסה עודכנו ל-2.9.56

## 🎉 אחרי הבנייה

1. העלה את הקובץ ל-GitHub Releases
2. פרסם הודעה על התיקון הדחוף
3. המשתמשים יוכלו להוריד ולהתקין מעל הגרסה הקודמת
