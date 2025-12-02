# תכנית מעבר ל-API - התקדמות

## ✅ הושלם

### Infrastructure
- [x] Backend API רץ על Railway + Neon DB
- [x] Frontend רץ לוקלית
- [x] API Client נוצר (`src/api/client.ts`)
- [x] Data Service Layer נוצר (`src/api/dataService.ts`)
- [x] Login עובד דרך API

### Backend Endpoints
- [x] `/api/auth/login` - התחברות
- [x] `/api/borrowers` - CRUD לווים
- [x] `/api/loans` - CRUD הלוואות  
- [x] `/api/settings` - הגדרות
- [x] `/api/depositors` - CRUD מפקידים
- [x] `/api/deposits` - CRUD פיקדונות
- [x] `/api/donations` - CRUD תרומות

---

## 🚧 בתהליך

### Frontend Pages
- [ ] LoansPage - דף הלוואות
- [ ] DepositsPage - דף פיקדונות
- [ ] DonationsPage - דף תרומות
- [ ] BorrowerReportPage - דוח לווה
- [ ] StatisticsPage - סטטיסטיקות
- [ ] SettingsPage - הגדרות

---

## 📋 TODO - Backend Endpoints

### חסרים
- [ ] `/api/payments` - תשלומים
- [ ] `/api/guarantors` - ערבים
- [ ] `/api/expenses` - הוצאות
- [ ] `/api/stats` - סטטיסטיקות
- [ ] `/api/masav` - קבצי מסב

---

## 🎯 הצעד הבא

1. **לבדוק שהכל עובד לוקלית**
   - Backend רץ על `localhost:3002`
   - Frontend רץ על `localhost:5173`
   - Login עובד
   
2. **לבנות endpoint אחד אחד**
   - התחל עם Deposits (הכי פשוט)
   - המשך ל-Donations
   - אחר כך Payments
   
3. **לעדכן Frontend page אחד אחד**
   - כל דף שמשתמש ב-`db.something()` → `dataService.something()`

---

## 📝 הערות

- **Electron:** כל הקוד ישאר תואם! פשוט `VITE_USE_API=false`
- **Web:** `VITE_USE_API=true` ישתמש ב-API
- **אין קוד כפול:** אותו קוד עובד לשני המצבים!

---

**עודכן:** ${new Date().toLocaleDateString('he-IL')}
