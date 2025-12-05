@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🚀 הגדרת מאגר Releases ציבורי
echo ========================================
echo.

REM בדיקה אם git מותקן
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ שגיאה: Git לא מותקן במערכת
    echo.
    echo אנא התקן Git מ: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo 📋 שלב 1: יצירת תיקייה זמנית
echo.

REM שמור את התיקייה הנוכחית
set ORIGINAL_DIR=%CD%

REM עלה רמה אחת ויצור תיקייה חדשה
cd ..
if exist gemach-releases (
    echo ⚠️  התיקייה gemach-releases כבר קיימת
    echo האם למחוק ולהתחיל מחדש? (Y/N)
    set /p CONFIRM=
    if /i "%CONFIRM%"=="Y" (
        rmdir /s /q gemach-releases
        echo ✅ התיקייה נמחקה
    ) else (
        echo ❌ ביטול
        cd "%ORIGINAL_DIR%"
        pause
        exit /b 1
    )
)

mkdir gemach-releases
cd gemach-releases

echo ✅ תיקייה נוצרה
echo.

echo 📋 שלב 2: אתחול Git
echo.

git init
if %ERRORLEVEL% NEQ 0 (
    echo ❌ שגיאה באתחול Git
    cd "%ORIGINAL_DIR%"
    pause
    exit /b 1
)

echo ✅ Git אותחל
echo.

echo 📋 שלב 3: יצירת README
echo.

(
echo # Gemach Management System - Releases
echo.
echo This repository contains public releases for the Gemach Management System.
echo.
echo ## 📥 Download Latest Version
echo.
echo Go to [Releases](https://github.com/sh5616107/gemach-releases/releases^) to download the latest version.
echo.
echo ## 🏛️ About
echo.
echo Gemach Management System is a comprehensive solution for managing:
echo - 💰 Loans and repayments
echo - 🏦 Deposits and withdrawals
echo - 🎁 Donations with receipt printing
echo - 📊 Reports and statistics
echo - 🛠️ Administrative tools
echo.
echo ## 🔧 Installation
echo.
echo 1. Download the latest `gemach-management-system-setup-X.X.X.exe` from [Releases](https://github.com/sh5616107/gemach-releases/releases^)
echo 2. Run the installer
echo 3. Follow the installation wizard
echo 4. Launch the application
echo.
echo ## 🆕 Updates
echo.
echo The application includes automatic update checking. You'll be notified when a new version is available.
echo.
echo ## 📝 License
echo.
echo MIT License
echo.
echo ---
echo **Developed for the Gemach community in Israel 🇮🇱**
) > README.md

echo ✅ README נוצר
echo.

echo 📋 שלב 4: Commit ראשון
echo.

git add README.md
git commit -m "Initial commit"

if %ERRORLEVEL% NEQ 0 (
    echo ❌ שגיאה ב-commit
    cd "%ORIGINAL_DIR%"
    pause
    exit /b 1
)

echo ✅ Commit נוצר
echo.

echo 📋 שלב 5: חיבור למאגר ב-GitHub
echo.
echo ⚠️  לפני שממשיכים, ודא שיצרת את המאגר ב-GitHub:
echo    https://github.com/new
echo.
echo    שם המאגר: gemach-releases
echo    Visibility: Public ✅
echo.
echo האם המאגר נוצר ב-GitHub? (Y/N)
set /p GITHUB_READY=

if /i not "%GITHUB_READY%"=="Y" (
    echo.
    echo ⏸️  בסדר, צור את המאגר ב-GitHub ואז הרץ את הפקודות הבאות:
    echo.
    echo    cd gemach-releases
    echo    git remote add origin https://github.com/sh5616107/gemach-releases.git
    echo    git branch -M main
    echo    git push -u origin main
    echo.
    cd "%ORIGINAL_DIR%"
    pause
    exit /b 0
)

git remote add origin https://github.com/sh5616107/gemach-releases.git
git branch -M main

echo.
echo 📋 שלב 6: דחיפה ל-GitHub
echo.
echo ⚠️  תתבקש להזין את פרטי ההתחברות ל-GitHub
echo.

git push -u origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ שגיאה בדחיפה ל-GitHub
    echo.
    echo אפשר לנסות שוב ידנית:
    echo    cd gemach-releases
    echo    git push -u origin main
    echo.
    cd "%ORIGINAL_DIR%"
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ המאגר הציבורי הוגדר בהצלחה!
echo ========================================
echo.
echo 📋 השלבים הבאים:
echo.
echo 1. צור GitHub Token:
echo    https://github.com/settings/tokens
echo    - Generate new token (classic^)
echo    - Select: repo, workflow
echo    - Copy the token
echo.
echo 2. הוסף את ה-Token ל-Secrets:
echo    https://github.com/sh5616107/gemach-management-system/settings/secrets/actions
echo    - Name: RELEASES_TOKEN
echo    - Value: [paste token]
echo.
echo 3. חזור לפרויקט הראשי ועדכן את הקבצים:
echo    - package.json (publish.repo^)
echo    - electron.js (repo^)
echo.
echo 4. בדוק את המדריך המלא:
echo    docs/CREATE-RELEASES-REPO.md
echo.

cd "%ORIGINAL_DIR%"
pause
