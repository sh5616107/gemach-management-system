@echo off
echo ========================================
echo    בניית קובץ EXE למערכת ניהול גמ"ח
echo ========================================
echo.

echo שלב 1: בניית אפליקציית React...
call npm run build
if %errorlevel% neq 0 (
    echo שגיאה בבניית React!
    pause
    exit /b 1
)

echo.
echo שלב 2: הכנת קבצי Electron...
echo הקבצים כבר מוכנים...
echo.
echo הערה: אם אין אייקון, פתח את assets\create-icon.html ליצירת אייקון

echo.
echo שלב 3: התקנת תלויות Electron...
call npm install
if %errorlevel% neq 0 (
    echo שגיאה בהתקנת תלויות!
    pause
    exit /b 1
)

echo.
echo שלב 4: בניית קובץ EXE...
call npm run dist
if %errorlevel% neq 0 (
    echo שגיאה בבניית EXE!
    pause
    exit /b 1
)

echo.
echo ========================================
echo           בנייה הושלמה בהצלחה!
echo ========================================
echo.
echo קובץ ההתקנה נמצא ב: dist-electron\
echo שם הקובץ: מערכת ניהול גמ"ח Setup.exe
echo.
echo לחץ על מקש כלשהו לסיום...
pause >nul