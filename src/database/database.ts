// מסד נתונים מקומי עם קובץ JSON

export interface DatabaseBorrower {
  id: number
  firstName: string
  lastName: string
  city: string
  phone: string
  phone2?: string // טלפון נוסף (אופציונלי)
  address: string
  email: string
  idNumber: string // מספר זהות - שדה חובה ויחודי
  notes?: string // הערות על הלווה (אופציונלי)
  
  // פרטי בנק למס"ב (אופציונלי)
  bankCode?: string              // קוד בנק (2 ספרות)
  branchNumber?: string          // מספר סניף (3 ספרות)
  accountNumber?: string         // מספר חשבון (9 ספרות)
}

export interface DatabaseLoan {
  id: number
  borrowerId: number
  amount: number
  loanDate: string // תאריך מתן ההלוואה בפועל
  returnDate: string
  createdDate: string // תאריך רישום ההלוואה במערכת
  loanType: 'fixed' | 'flexible' // קבוע או גמיש
  reminderSent?: string // תאריך שליחת התראה אחרונה
  isRecurring?: boolean // האם הלוואה מחזורית
  recurringDay?: number // יום בחודש להלוואה מחזורית (1-31)
  recurringMonths?: number // כמה חודשים ההלוואה המחזורית תמשך
  autoPayment?: boolean // פרעון אוטומטי
  autoPaymentAmount?: number // סכום פרעון אוטומטי
  autoPaymentDay?: number // יום בחודש לפרעון אוטומטי
  autoPaymentStartDate?: string // תאריך תחילת פרעון אוטומטי
  autoPaymentFrequency?: number // תדירות פרעון בחודשים (1=כל חודש, 2=כל חודשיים וכו')
  loanPaymentMethod?: 'cash' | 'transfer' | 'check' | 'credit' | 'other' // אמצעי מתן ההלוואה
  loanPaymentDetails?: string // פרטי אמצעי התשלום (JSON string)
  paymentDetailsComplete?: boolean // האם פרטי התשלום הושלמו (למעקב אמצעי תשלום)
  notes: string
  guarantor1: string           // שמירה לתאימות לאחור
  guarantor2: string           // שמירה לתאימות לאחור
  guarantor1Id?: number        // ID ערב ראשון (חדש)
  guarantor2Id?: number        // ID ערב שני (חדש)
  status: 'active' | 'completed' | 'overdue' | 'reminder_sent'
  transferredToGuarantors?: boolean    // האם הועברה לערבים
  transferDate?: string                // תאריך העברה
  transferredBy?: string               // מי ביצע את ההעברה
  transferNotes?: string               // הערות על ההעברה
}

// פרטי אמצעי תשלום
export interface CheckDetails {
  checkNumber: string
  bank?: string // שדה ישן לתאימות לאחור
  bankCode?: string // קוד בנק חדש
  bankName?: string // שם בנק חדש
  branch: string
  dueDate: string
}

export interface TransferDetails {
  referenceNumber: string
  bankCode: string
  bankName: string
  branchNumber: string
  accountNumber: string
  transferDate: string
}

export interface CreditDetails {
  lastFourDigits: string
  transactionNumber: string
}

export interface OtherDetails {
  description: string
}

export interface DatabasePayment {
  id: number
  loanId: number
  amount: number
  date: string
  type: 'loan' | 'payment'
  paymentMethod?: 'cash' | 'transfer' | 'check' | 'credit' | 'other' // אמצעי התשלום
  paymentDetails?: string // פרטי אמצעי התשלום (JSON string)
  paymentDetailsComplete?: boolean // האם פרטי התשלום הושלמו (למעקב אמצעי תשלום)
  notes: string
  guarantorDebtId?: number  // קישור לחוב ערב (אם רלוונטי)
  paidBy?: 'borrower' | 'guarantor'  // מי שילם - לווה או ערב
  guarantorId?: number  // ID של הערב ששילם (אם רלוונטי)
  guarantorName?: string  // שם הערב ששילם (לשמירה מהירה)
}

export interface DatabaseDeposit {
  id: number
  depositorId?: number // קישור למפקיד (אופציונלי לתאימות לאחור)
  depositorName: string // שמור לתאימות לאחור
  idNumber: string // מספר זהות - שדה חובה ויחודי (שמור לתאימות לאחור)
  amount: number
  depositDate: string
  depositPeriod: number
  reminderDays?: number // כמה ימים לפני תום תקופת ההפקדה להתריע
  phone: string // שמור לתאימות לאחור
  notes: string
  status: 'active' | 'withdrawn'
  withdrawnAmount?: number // סכום כולל שנמשך (לתאימות לאחור)
  withdrawnDate?: string // תאריך משיכה אחרונה (לתאימות לאחור)
  depositPaymentMethod?: 'cash' | 'transfer' | 'check' | 'credit' | 'other' // אמצעי קבלת ההפקדה
  depositPaymentDetails?: string // פרטי אמצעי התשלום (JSON string)
  withdrawalPaymentMethod?: 'cash' | 'transfer' | 'check' | 'credit' | 'other' // אמצעי משיכה אחרונה (לתאימות לאחור)
  withdrawalPaymentDetails?: string // פרטי אמצעי התשלום למשיכה אחרונה (לתאימות לאחור)
  
  // הפקדות מחזוריות
  isRecurring?: boolean // האם הפקדה מחזורית
  recurringDay?: number // יום בחודש להפקדה מחזורית (1-31)
  recurringMonths?: number // כמה חודשים ההפקדה המחזורית תמשך
  recurringEndDate?: string // תאריך סיום הפקדות מחזוריות
  lastRecurringDate?: string // תאריך ההפקדה המחזורית האחרונה שנוצרה
}

export interface DatabaseWithdrawal {
  id: number
  depositId: number // קישור להפקדה
  amount: number
  date: string
  paymentMethod?: 'cash' | 'transfer' | 'check' | 'credit' | 'other' // אמצעי התשלום
  paymentDetails?: string // פרטי אמצעי התשלום (JSON string)
  paymentDetailsComplete?: boolean // האם פרטי התשלום הושלמו
  notes?: string
}

export interface DatabaseDepositor {
  id: number
  name: string                  // שם מלא
  idNumber: string              // מספר זהות (חובה/אופציונלי לפי הגדרות)
  phone: string                 // טלפון
  notes?: string                // הערות
  
  // פרטי בנק (אופציונלי - למס"ב עתידי)
  bankCode?: string             // קוד בנק (2 ספרות)
  branchNumber?: string         // מספר סניף (3 ספרות)
  accountNumber?: string        // מספר חשבון (עד 9 ספרות)
}

export interface DatabaseGuarantor {
  id: number
  firstName: string
  lastName: string
  idNumber: string              // מספר זהות (חובה אם מופעל בהגדרות)
  phone: string                 // טלפון (חובה)
  email?: string               // אימייל (אופציונלי)
  address?: string             // כתובת (אופציונלי)
  notes?: string               // הערות (אופציונלי)
  status: 'active' | 'blacklisted' | 'at_risk'
  blacklistReason?: string     // סיבת חסימה
  blacklistDate?: string       // תאריך חסימה
  blacklistBy?: string         // מי חסם
  createdDate: string          // תאריך יצירה
  lastUpdated: string          // תאריך עדכון אחרון
  activeGuarantees: number     // מספר ערבויות פעילות (מחושב)
  totalRisk: number           // סיכון כולל בש"ח (מחושב)
  
  // פרטי בנק למס"ב (אופציונלי)
  bankCode?: string              // קוד בנק (2 ספרות)
  branchNumber?: string          // מספר סניף (3 ספרות)
  accountNumber?: string         // מספר חשבון (9 ספרות)
}

export interface DatabaseBlacklistEntry {
  id: number
  type: 'borrower' | 'guarantor'
  personId: number             // ID של הלווה או הערב
  reason: string               // סיבת החסימה
  blockedDate: string          // תאריך חסימה
  blockedBy: string           // מי חסם
  removedDate?: string        // תאריך הסרה (אם הוסר)
  removedBy?: string          // מי הסיר
  removalReason?: string      // סיבת הסרה
  isActive: boolean           // האם החסימה פעילה
}

export interface DatabaseWarningLetter {
  id: number
  loanId: number              // הלוואה שעליה המכתב
  type: 'borrower' | 'guarantor' | 'both'
  recipientType: 'borrower' | 'guarantor'
  recipientId: number         // ID של הנמען
  content: string             // תוכן המכתב
  sentDate: string           // תאריך שליחה
  sentBy: string             // מי שלח
  method: 'print' | 'email' | 'sms' | 'phone'
  notes?: string             // הערות נוספות
}

export interface DatabaseDonation {
  id: number
  donorName: string
  donorLastName: string
  amount: number
  donationDate: string
  method: 'cash' | 'transfer' | 'check' | 'credit' | 'other'
  paymentDetails?: string // פרטי אמצעי התשלום (JSON string)
  phone: string
  address: string
  notes: string
  needsReceipt: boolean
}

export interface DatabaseGuarantorDebt {
  id: number
  originalLoanId: number          // קישור להלוואה המקורית
  guarantorId: number             // ID הערב שחויב
  originalBorrowerId: number      // ID הלווה המקורי
  amount: number                  // סכום החוב
  transferDate: string            // תאריך העברה
  transferredBy: string           // מי ביצע את ההעברה
  paymentType: 'single' | 'installments'  // סוג תשלום
  installmentsCount?: number      // מספר תשלומים (אם רלוונטי)
  installmentAmount?: number      // סכום כל תשלום
  installmentDates?: string[]     // תאריכי פירעון לכל תשלום
  status: 'active' | 'paid' | 'overdue'
  notes?: string
}

export interface DatabaseBlacklistEntry {
  id: number
  type: 'borrower' | 'guarantor'
  personId: number             // ID של הלווה או הערב
  reason: string               // סיבת החסימה
  blockedDate: string          // תאריך חסימה
  blockedBy: string           // מי חסם
  removedDate?: string        // תאריך הסרה (אם הוסר)
  removedBy?: string          // מי הסיר
  removalReason?: string      // סיבת הסרה
  isActive: boolean           // האם החסימה פעילה
}

export interface DatabaseWarningLetter {
  id: number
  loanId: number              // הלוואה שעליה המכתב
  type: 'borrower' | 'guarantor' | 'both'
  recipientType: 'borrower' | 'guarantor'
  recipientId: number         // ID של הנמען
  content: string             // תוכן המכתב
  sentDate: string           // תאריך שליחה
  sentBy: string             // מי שלח
  method: 'print' | 'email' | 'sms' | 'phone'
  notes?: string             // הערות נוספות
}

// ממשקים למערכת מס"ב
export interface MasavSettings {
  institutionCode: string        // קוד מוסד/נושא (8 ספרות)
  senderCode: string             // מספר מוסד שולח (5 ספרות)
  institutionName: string        // שם המוסד (30 תווים)
  lastReferenceNumber: number    // מספר אסמכתא אחרון
}

export interface MasavCharge {
  borrowerId: number
  borrowerName: string
  idNumber: string
  bankCode: string
  branchNumber: string
  accountNumber: string
  amount: number                 // בשקלים (כולל אגורות)
  referenceNumber: string        // מספר אסמכתא (20 תווים)
  chargeDate: string            // תאריך חיוב
  loanId?: number               // קישור להלוואה (אופציונלי)
}

export interface MasavFileRecord {
  id: number
  creationDate: string
  chargeDate: string
  totalAmount: number
  chargesCount: number
  charges: MasavCharge[]
  fileName: string
  fileContent: string           // תוכן הקובץ לשמירה
  status: 'pending' | 'confirmed' | 'cancelled'
}

export interface DatabaseSettings {
  currency: 'ILS' | 'USD'
  currencySymbol: string
  autoExport: boolean
  exportFrequency: 'daily' | 'weekly' | 'monthly'
  showOverdueWarnings: boolean
  defaultLoanPeriod: number // בחודשים
  theme: 'light' | 'dark' | 'custom'
  customBackgroundColor: string // צבע רקע מותאם
  headerTitle: string // כותרת עליונה
  footerText: string // טקסט תחתון
  contactText: string // טקסט יצירת קשר
  // הגדרות פונקציות מתקדמות
  enableRecurringLoans: boolean // הפעלת הלוואות מחזוריות
  enableRecurringPayments: boolean // הפעלת פרעונות מחזוריים
  requireIdNumber: boolean // האם מספר זהות חובה לכל לווה
  // הגדרות תאריכים עבריים
  showHebrewDates: boolean // הצגת תאריכים עבריים
  showDateWarnings: boolean // הצגת אזהרות חגים ושבתות
  // הגדרות מעקב אמצעי תשלום
  trackPaymentMethods: boolean // מעקב אחרי אמצעי תשלום
  // הגדרות כפתורי פעולות מהירות
  quickActions: string[] // רשימת כפתורי הפעולות המהירות שיוצגו
  // הגדרות מס"ב
  enableMasav: boolean // הפעלת מערכת מס"ב לגביית תשלומים
  // הגדרות אבטחה
  appPassword: string // סיסמה להתחברות למערכת
}

interface DatabaseFile {
  borrowers: DatabaseBorrower[]
  loans: DatabaseLoan[]
  deposits: DatabaseDeposit[]
  depositors: DatabaseDepositor[] // טבלת מפקידים חדשה
  donations: DatabaseDonation[]
  payments: DatabasePayment[]
  withdrawals: DatabaseWithdrawal[] // טבלת משיכות חדשה
  guarantors: DatabaseGuarantor[] // טבלת ערבים חדשה
  blacklist: DatabaseBlacklistEntry[] // טבלת רשימה שחורה
  warningLetters: DatabaseWarningLetter[] // טבלת מכתבי התראה
  guarantorDebts: DatabaseGuarantorDebt[] // טבלת חובות ערבים
  masavSettings?: MasavSettings // הגדרות מס"ב
  masavFiles: MasavFileRecord[] // קבצי מס"ב
  lastUpdated: string
  gemachName: string
  settings: DatabaseSettings
}

class GemachDatabase {
  private dataFile: DatabaseFile = {
    borrowers: [],
    loans: [],
    masavFiles: [],
    deposits: [],
    depositors: [],
    donations: [],
    payments: [],
    withdrawals: [],
    guarantorDebts: [],
    guarantors: [],
    blacklist: [],
    warningLetters: [],
    lastUpdated: new Date().toISOString(),
    gemachName: 'נר שרה',
    settings: {
      currency: 'ILS',
      currencySymbol: '₪',
      autoExport: false,
      exportFrequency: 'weekly',
      showOverdueWarnings: true,
      defaultLoanPeriod: 12,
      theme: 'light',
      customBackgroundColor: '#87CEEB',
      headerTitle: 'מערכת ניהול גמח',
      footerText: 'אמר רבי אבא אמר רבי שמעון בן לקיש גדול המלוה יותר מן העושה צדקה (שבת סג.)',
      contactText: 'ניתן להפצה לזיכוי הרבים\n⭐ עולם חסד יבנה',
      // פונקציות מתקדמות - מופעלות כברירת מחדל
      enableRecurringLoans: true,
      enableRecurringPayments: true,
      requireIdNumber: false, // כברירת מחדל לא חובה - מתאים לשימוש אישי
      showHebrewDates: false,
      showDateWarnings: true,
      trackPaymentMethods: true,
      quickActions: ['loans', 'deposits', 'donations', 'statistics', 'borrower-report', 'admin-tools'],
      enableMasav: false, // כבוי כברירת מחדל
      appPassword: '' // ריק כברירת מחדל - יוגדר בכניסה ראשונה
    }
  }

  constructor() {
    this.loadData()
    this.migrateOldData()
    this.migrateLoanDates()
    this.migrateBorrowersIdNumbers()
    this.migrateDepositsIdNumbers()
    this.migrateDepositsToDepositors() // המרת הפקדות למבנה חדש עם מפקידים
    this.cleanupTemporaryIdNumbers() // נקה מספרי זהות זמניים אם לא חובה
    this.migrateRequireIdNumberSetting()
    this.updateTextsToNewDefaults() // עדכון טקסטים לברירות מחדל חדשות
    this.migrateLoansToGuarantors() // מיגרציה של ערבים מהלוואות קיימות
    this.processRecurringDeposits() // עיבוד הפקדות מחזוריות אוטומטיות
  }

  private loadData(): void {
    try {
      // נסה לטעון מ-localStorage
      const borrowers = localStorage.getItem('gemach_borrowers')
      const loans = localStorage.getItem('gemach_loans')
      const deposits = localStorage.getItem('gemach_deposits')
      const depositors = localStorage.getItem('gemach_depositors')
      const donations = localStorage.getItem('gemach_donations')
      const payments = localStorage.getItem('gemach_payments')
      const withdrawals = localStorage.getItem('gemach_withdrawals')
      const guarantors = localStorage.getItem('gemach_guarantors')
      const blacklist = localStorage.getItem('gemach_blacklist')
      const warningLetters = localStorage.getItem('gemach_warning_letters')
      const guarantorDebts = localStorage.getItem('gemach_guarantor_debts')

      const gemachName = localStorage.getItem('gemach_name')
      const settings = localStorage.getItem('gemach_settings')
      const masavSettings = localStorage.getItem('gemach_masav_settings')

      this.dataFile = {
        borrowers: borrowers ? JSON.parse(borrowers) : [],
        loans: loans ? JSON.parse(loans) : [],
        deposits: deposits ? JSON.parse(deposits) : [],
        depositors: depositors ? JSON.parse(depositors) : [],
        donations: donations ? JSON.parse(donations) : [],
        payments: payments ? JSON.parse(payments) : [],
        withdrawals: withdrawals ? JSON.parse(withdrawals) : [],
        guarantors: guarantors ? JSON.parse(guarantors) : [],
        blacklist: blacklist ? JSON.parse(blacklist) : [],
        warningLetters: warningLetters ? JSON.parse(warningLetters) : [],
        guarantorDebts: guarantorDebts ? JSON.parse(guarantorDebts) : [],
        masavFiles: [],
        masavSettings: masavSettings ? JSON.parse(masavSettings) : undefined,
        lastUpdated: new Date().toISOString(),
        gemachName: gemachName || 'נר שרה',
        settings: (settings && settings !== 'undefined') ? JSON.parse(settings) : {
          currency: 'ILS',
          currencySymbol: '₪',
          autoExport: false,
          exportFrequency: 'weekly',
          showOverdueWarnings: true,
          defaultLoanPeriod: 12,
          theme: 'light',
          customBackgroundColor: '#87CEEB',
          headerTitle: 'מערכת לניהול גמ"ח כספים',
          footerText: 'אמר רבי אבא אמר רבי שמעון בן לקיש גדול המלוה יותר מן העושה צדקה (שבת סג.)',
          contactText: 'ניתן להפצה לזיכוי הרבים\n⭐ עולם חסד יבנה',
          enableRecurringLoans: false,
          enableRecurringPayments: false,
          requireIdNumber: false,
          showHebrewDates: false,
          showDateWarnings: true,
          trackPaymentMethods: false,
          quickActions: ['loans', 'deposits', 'donations', 'statistics', 'borrower-report', 'admin-tools'],
          enableMasav: false,
          appPassword: ''
        }
      }

      console.log('נתונים נטענו:', {
        borrowers: this.dataFile.borrowers.length,
        loans: this.dataFile.loans.length,
        deposits: this.dataFile.deposits.length,
        donations: this.dataFile.donations.length,
        payments: this.dataFile.payments.length
      })
    } catch (error) {
      console.error('שגיאה בטעינת נתונים:', error)
    }
  }

  private saveData(): void {
    this.dataFile.lastUpdated = new Date().toISOString()
    try {
      // שמור ב-localStorage
      localStorage.setItem('gemach_borrowers', JSON.stringify(this.dataFile.borrowers))
      localStorage.setItem('gemach_loans', JSON.stringify(this.dataFile.loans))
      localStorage.setItem('gemach_deposits', JSON.stringify(this.dataFile.deposits))
      localStorage.setItem('gemach_depositors', JSON.stringify(this.dataFile.depositors))
      localStorage.setItem('gemach_donations', JSON.stringify(this.dataFile.donations))
      localStorage.setItem('gemach_payments', JSON.stringify(this.dataFile.payments))
      localStorage.setItem('gemach_withdrawals', JSON.stringify(this.dataFile.withdrawals))
      localStorage.setItem('gemach_guarantors', JSON.stringify(this.dataFile.guarantors))
      localStorage.setItem('gemach_blacklist', JSON.stringify(this.dataFile.blacklist))
      localStorage.setItem('gemach_warning_letters', JSON.stringify(this.dataFile.warningLetters))
      localStorage.setItem('gemach_guarantor_debts', JSON.stringify(this.dataFile.guarantorDebts))
      localStorage.setItem('gemach_name', this.dataFile.gemachName)
      localStorage.setItem('gemach_settings', JSON.stringify(this.dataFile.settings))
      localStorage.setItem('gemach_masav_settings', JSON.stringify(this.dataFile.masavSettings))

      // גם שמור את הקובץ המלא ב-localStorage לייצוא
      localStorage.setItem('gemach_full_data', JSON.stringify(this.dataFile))

      console.log('נתונים נשמרו:', {
        borrowers: this.dataFile.borrowers.length,
        loans: this.dataFile.loans.length,
        deposits: this.dataFile.deposits.length,
        depositors: this.dataFile.depositors.length,
        donations: this.dataFile.donations.length,
        payments: this.dataFile.payments.length,
        withdrawals: this.dataFile.withdrawals.length,
        guarantors: this.dataFile.guarantors.length,
        blacklist: this.dataFile.blacklist.length,
        warningLetters: this.dataFile.warningLetters.length,
        guarantorDebts: this.dataFile.guarantorDebts.length
      })
    } catch (error) {
      console.error('שגיאה בשמירת נתונים:', error)
    }
  }



  private getNextId(items: any[]): number {
    return items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1
  }

  // ייצוא נתונים לקובץ JSON
  exportData(): string {
    return JSON.stringify(this.dataFile, null, 2)
  }

  // ייבוא נתונים מקובץ JSON
  importData(jsonData: string): boolean {
    try {
      const importedData = JSON.parse(jsonData)
      this.dataFile = {
        borrowers: importedData.borrowers || [],
        loans: importedData.loans || [],
        deposits: importedData.deposits || [],
        depositors: importedData.depositors || [],
        donations: importedData.donations || [],
        payments: importedData.payments || [],
        withdrawals: importedData.withdrawals || [],
        guarantors: importedData.guarantors || [],
        blacklist: importedData.blacklist || [],
        warningLetters: importedData.warningLetters || [],
        guarantorDebts: importedData.guarantorDebts || [],
        masavFiles: importedData.masavFiles || [],
        lastUpdated: new Date().toISOString(),
        gemachName: importedData.gemachName || 'נר שרה',
        settings: importedData.settings || {
          currency: 'ILS',
          currencySymbol: '₪',
          autoExport: false,
          exportFrequency: 'weekly',
          showOverdueWarnings: true,
          defaultLoanPeriod: 12,
          theme: 'light',
          customBackgroundColor: '#87CEEB',
          headerTitle: 'מערכת לניהול גמ"ח כספים',
          footerText: 'אמר רבי אבא אמר רבי שמעון בן לקיש גדול המלוה יותר מן העושה צדקה (שבת סג.)',
          contactText: 'ניתן להפצה לזיכוי הרבים\n⭐ עולם חסד יבנה',
          enableRecurringLoans: false,
          enableRecurringPayments: false,
          requireIdNumber: false,
          showHebrewDates: false,
          showDateWarnings: true,
          trackPaymentMethods: false,
          quickActions: ['loans', 'deposits', 'donations', 'statistics', 'borrower-report', 'admin-tools'],
          enableMasav: false,
          appPassword: ''
        }
      }
      // הוספת הגדרה חדשה למעקב אמצעי תשלום
      if (this.dataFile.settings.trackPaymentMethods === undefined) {
        this.dataFile.settings.trackPaymentMethods = false
      }
      // הוספת הגדרה חדשה למס"ב
      if (this.dataFile.settings.enableMasav === undefined) {
        this.dataFile.settings.enableMasav = false
      }
      this.saveData()
      return true
    } catch (error) {
      console.error('שגיאה בייבוא נתונים:', error)
      return false
    }
  }

  // פונקציה לבדיקת תקינות מספר זהות ישראלי
  validateIsraeliId(id: string): boolean {
    // הסר רווחים ומקפים
    const cleanId = id.replace(/[\s-]/g, '')

    // בדוק שהמספר מכיל רק ספרות ואורכו 9
    if (!/^\d{9}$/.test(cleanId)) {
      return false
    }

    // בדיקת ספרת ביקורת
    let sum = 0
    for (let i = 0; i < 9; i++) {
      let digit = parseInt(cleanId[i])
      if (i % 2 === 1) {
        digit *= 2
        if (digit > 9) {
          digit = Math.floor(digit / 10) + (digit % 10)
        }
      }
      sum += digit
    }

    return sum % 10 === 0
  }

  // פונקציה לבדיקה אם מספר זהות כבר קיים
  private isIdNumberExists(idNumber: string): boolean {
    const cleanId = idNumber.replace(/[\s-]/g, '')
    return this.dataFile.borrowers.some(borrower =>
      borrower.idNumber.replace(/[\s-]/g, '') === cleanId
    )
  }

  // לווים
  addBorrower(borrower: Omit<DatabaseBorrower, 'id'>): DatabaseBorrower | { error: string } {
    const settings = this.getSettings()

    // בדוק אם מספר זהות חובה
    if (settings.requireIdNumber) {
      // בדוק שמספר הזהות לא ריק
      if (!borrower.idNumber || borrower.idNumber.trim() === '') {
        return { error: 'מספר זהות הוא שדה חובה (ניתן לשנות בהגדרות)' }
      }

      // בדוק תקינות מספר הזהות
      if (!this.validateIsraeliId(borrower.idNumber)) {
        return { error: 'מספר זהות לא תקין' }
      }

      // בדוק אם מספר הזהות כבר קיים
      if (this.isIdNumberExists(borrower.idNumber)) {
        const existingBorrower = this.dataFile.borrowers.find(b =>
          b.idNumber.replace(/[\s-]/g, '') === borrower.idNumber.replace(/[\s-]/g, '')
        )
        return {
          error: `לווה עם מספר זהות זה כבר קיים במערכת: ${existingBorrower?.firstName} ${existingBorrower?.lastName}`
        }
      }
    } else {
      // אם מספר זהות לא חובה, אבל אם הוזן - בדוק תקינות
      if (borrower.idNumber && borrower.idNumber.trim() !== '') {
        if (!this.validateIsraeliId(borrower.idNumber)) {
          return { error: 'מספר זהות לא תקין (או השאר ריק)' }
        }

        if (this.isIdNumberExists(borrower.idNumber)) {
          const existingBorrower = this.dataFile.borrowers.find(b =>
            b.idNumber.replace(/[\s-]/g, '') === borrower.idNumber.replace(/[\s-]/g, '')
          )
          return {
            error: `לווה עם מספר זהות זה כבר קיים במערכת: ${existingBorrower?.firstName} ${existingBorrower?.lastName}`
          }
        }
      } else {
        // בדוק כפילות שם אם אין מספר זהות
        const fullName = `${borrower.firstName.trim()} ${borrower.lastName.trim()}`
        const existingBorrower = this.dataFile.borrowers.find(b =>
          `${b.firstName.trim()} ${b.lastName.trim()}`.toLowerCase() === fullName.toLowerCase()
        )
        if (existingBorrower) {
          return { error: `לווה בשם "${fullName}" כבר קיים במערכת. הוסף מספר זהות כדי להבדיל בינם.` }
        }
      }
    }

    // נקה את מספר הזהות (הסר רווחים ומקפים) אם קיים
    const cleanIdNumber = borrower.idNumber ? borrower.idNumber.replace(/[\s-]/g, '') : ''

    const newBorrower: DatabaseBorrower = {
      ...borrower,
      idNumber: cleanIdNumber,
      id: this.getNextId(this.dataFile.borrowers)
    }
    this.dataFile.borrowers.push(newBorrower)
    this.saveData()
    return newBorrower
  }

  getBorrowers(): DatabaseBorrower[] {
    return this.dataFile.borrowers
  }

  // חיפוש לווה על פי מספר זהות
  getBorrowerByIdNumber(idNumber: string): DatabaseBorrower | null {
    const cleanId = idNumber.replace(/[\s-]/g, '')
    return this.dataFile.borrowers.find(b =>
      b.idNumber.replace(/[\s-]/g, '') === cleanId
    ) || null
  }

  // פורמט יפה למספר זהות (XXX-XX-XXXX)
  formatIdNumber(idNumber: string): string {
    const cleanId = idNumber.replace(/[\s-]/g, '')
    if (cleanId.length === 9) {
      return `${cleanId.slice(0, 3)}-${cleanId.slice(3, 5)}-${cleanId.slice(5)}`
    }
    return cleanId
  }

  // המרת נתונים ישנים - הוספת מספרי זהות זמניים ללווים ישנים (רק אם מספר זהות חובה)
  private migrateBorrowersIdNumbers(): void {
    // אל תוסיף מספרי זהות זמניים אם מספר זהות לא חובה
    if (!this.dataFile.settings.requireIdNumber) {
      return
    }

    let needsSave = false

    this.dataFile.borrowers.forEach((borrower, index) => {
      if (!borrower.idNumber || borrower.idNumber.trim() === '') {
        // צור מספר זהות זמני (לא תקין אבל ייחודי)
        const tempId = `000000${(index + 1).toString().padStart(3, '0')}`
          ; (borrower as any).idNumber = tempId
        needsSave = true
        console.log(`הוסף מספר זהות זמני ללווה ${borrower.firstName} ${borrower.lastName}: ${tempId}`)
      }
    })

    if (needsSave) {
      this.saveData()
      console.log('הושלמה המרת נתונים - נוספו מספרי זהות זמניים')
    }
  }

  // המרת הגדרות - הוספת הגדרת requireIdNumber
  private migrateRequireIdNumberSetting(): void {
    if (this.dataFile.settings.requireIdNumber === undefined) {
      ; (this.dataFile.settings as any).requireIdNumber = false
      this.saveData()
      console.log('הוספה הגדרת requireIdNumber (כבוי כברירת מחדל)')
    }
  }

  // ניקוי מספרי זהות זמניים אם מספר זהות לא חובה
  private cleanupTemporaryIdNumbers(): void {
    // אם מספר זהות חובה, אל תנקה
    if (this.dataFile.settings.requireIdNumber) {
      return
    }

    let needsSave = false

    // נקה מספרי זהות זמניים מלווים
    this.dataFile.borrowers.forEach(borrower => {
      if (borrower.idNumber && borrower.idNumber.match(/^000000\d{3}$/)) {
        borrower.idNumber = ''
        needsSave = true
        console.log(`נוקה מספר זהות זמני מלווה ${borrower.firstName} ${borrower.lastName}`)
      }
    })

    // נקה מספרי זהות זמניים מהפקדות
    this.dataFile.deposits.forEach(deposit => {
      if (deposit.idNumber && deposit.idNumber.match(/^000000\d{3}$/)) {
        deposit.idNumber = ''
        needsSave = true
        console.log(`נוקה מספר זהות זמני מהפקדה של ${deposit.depositorName}`)
      }
    })

    if (needsSave) {
      this.saveData()
      console.log('הושלם ניקוי מספרי זהות זמניים')
    }
  }

  // המרת נתונים ישנים - הוספת מספרי זהות זמניים להפקדות ישנות (רק אם מספר זהות חובה)
  private migrateDepositsIdNumbers(): void {
    // אל תוסיף מספרי זהות זמניים אם מספר זהות לא חובה
    if (!this.dataFile.settings.requireIdNumber) {
      return
    }

    let needsSave = false

    this.dataFile.deposits.forEach((deposit, index) => {
      if (!deposit.idNumber || deposit.idNumber.trim() === '') {
        // צור מספר זהות זמני (לא תקין אבל ייחודי)
        const tempId = `000000${(index + 100).toString().padStart(3, '0')}`
          ; (deposit as any).idNumber = tempId
        needsSave = true
        console.log(`הוסף מספר זהות זמני למפקיד ${deposit.depositorName}: ${tempId}`)
      }
    })

    if (needsSave) {
      this.saveData()
      console.log('הושלמה המרת נתונים - נוספו מספרי זהות זמניים להפקדות')
    }
  }

  // המרת הפקדות ישנות למבנה חדש עם מפקידים
  private migrateDepositsToDepositors(): void {
    // בדוק אם כבר בוצעה המרה
    const migrated = localStorage.getItem('gemach_deposits_migrated')
    if (migrated === 'true') {
      return
    }

    // בדוק אם יש הפקדות ישנות ללא depositorId
    const oldDeposits = this.dataFile.deposits.filter(d => !d.depositorId)
    if (oldDeposits.length === 0) {
      // אין הפקדות ישנות, סמן כמומר
      localStorage.setItem('gemach_deposits_migrated', 'true')
      return
    }

    console.log(`🔄 מתחיל המרת ${oldDeposits.length} הפקדות למבנה חדש...`)

    let depositorsCreated = 0
    let depositsUpdated = 0

    // מפה לעקוב אחרי מפקידים שכבר נוצרו (לפי מספר זהות)
    const depositorsByIdNumber = new Map<string, number>()

    for (const deposit of oldDeposits) {
      let depositorId: number

      // בדוק אם כבר יצרנו מפקיד עם מספר זהות זה
      const cleanIdNumber = deposit.idNumber ? deposit.idNumber.replace(/[\s-]/g, '') : ''
      
      if (cleanIdNumber && depositorsByIdNumber.has(cleanIdNumber)) {
        // מפקיד כבר קיים - השתמש בו
        depositorId = depositorsByIdNumber.get(cleanIdNumber)!
        console.log(`♻️ מיזוג הפקדה למפקיד קיים: ${deposit.depositorName}`)
      } else {
        // צור מפקיד חדש
        const newDepositor: DatabaseDepositor = {
          id: this.getNextId(this.dataFile.depositors),
          name: deposit.depositorName,
          idNumber: cleanIdNumber,
          phone: deposit.phone || '',
          notes: deposit.notes || ''
        }
        
        this.dataFile.depositors.push(newDepositor)
        depositorId = newDepositor.id
        depositorsCreated++

        // שמור במפה
        if (cleanIdNumber) {
          depositorsByIdNumber.set(cleanIdNumber, depositorId)
        }

        console.log(`✅ נוצר מפקיד חדש: ${newDepositor.name} (ID: ${depositorId})`)
      }

      // עדכן את ההפקדה עם depositorId
      deposit.depositorId = depositorId
      depositsUpdated++
    }

    // שמור את השינויים
    this.saveData()

    // סמן שההמרה הושלמה
    localStorage.setItem('gemach_deposits_migrated', 'true')

    console.log(`✨ המרה הושלמה בהצלחה!`)
    console.log(`📊 נוצרו ${depositorsCreated} מפקידים חדשים`)
    console.log(`📊 עודכנו ${depositsUpdated} הפקדות`)

    // הצג הודעה למשתמש (תישמר ב-localStorage להצגה בממשק)
    const migrationMessage = `המערכת עודכנה! ${depositorsCreated} מפקידים ו-${depositsUpdated} הפקדות הומרו בהצלחה למבנה החדש.`
    localStorage.setItem('gemach_migration_message', migrationMessage)
  }

  // עיבוד הפקדות מחזוריות אוטומטיות
  private processRecurringDeposits(): void {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let depositsCreated = 0
    
    // מצא את כל ההפקדות המחזוריות הפעילות
    const recurringDeposits = this.dataFile.deposits.filter(d => 
      d.isRecurring && 
      d.depositorId && 
      (!d.recurringEndDate || new Date(d.recurringEndDate) >= today)
    )

    for (const recurringDeposit of recurringDeposits) {
      // קבע את תאריך ההפקדה האחרונה שנוצרה
      const lastDate = recurringDeposit.lastRecurringDate 
        ? new Date(recurringDeposit.lastRecurringDate)
        : new Date(recurringDeposit.depositDate)
      lastDate.setHours(0, 0, 0, 0)

      // חשב את תאריך ההפקדה הבאה
      let nextDate = new Date(lastDate)
      
      // אם זו הפקדה חדשה (אין lastRecurringDate) ויש יום ספציפי
      if (!recurringDeposit.lastRecurringDate && recurringDeposit.recurringDay) {
        // קבע את היום הספציפי בחודש הנוכחי
        nextDate.setDate(recurringDeposit.recurringDay)
        
        // אם היום הספציפי כבר עבר החודש, עבור לחודש הבא
        if (nextDate <= lastDate) {
          nextDate.setMonth(nextDate.getMonth() + 1)
          nextDate.setDate(recurringDeposit.recurringDay)
        }
      } else {
        // הפקדה קיימת - פשוט הוסף חודש
        nextDate.setMonth(nextDate.getMonth() + 1)
        
        // אם יש יום ספציפי בחודש, השתמש בו
        if (recurringDeposit.recurringDay) {
          nextDate.setDate(recurringDeposit.recurringDay)
        }
      }

      // בדוק אם הגיע הזמן ליצור הפקדה חדשה
      if (nextDate <= today) {
        // בדוק אם לא עברנו את תאריך הסיום
        if (recurringDeposit.recurringEndDate && nextDate > new Date(recurringDeposit.recurringEndDate)) {
          continue
        }

        // צור הפקדה חדשה
        const newDeposit: DatabaseDeposit = {
          id: this.getNextId(this.dataFile.deposits),
          depositorId: recurringDeposit.depositorId,
          depositorName: recurringDeposit.depositorName,
          idNumber: recurringDeposit.idNumber,
          phone: recurringDeposit.phone,
          amount: recurringDeposit.amount,
          depositDate: nextDate.toISOString().split('T')[0],
          depositPeriod: recurringDeposit.depositPeriod,
          reminderDays: recurringDeposit.reminderDays,
          notes: `${recurringDeposit.notes || ''} (הפקדה מחזורית אוטומטית)`.trim(),
          status: 'active',
          depositPaymentMethod: recurringDeposit.depositPaymentMethod,
          depositPaymentDetails: recurringDeposit.depositPaymentDetails,
          // לא מעתיק את השדות המחזוריים - זו הפקדה רגילה
          isRecurring: false
        }

        this.dataFile.deposits.push(newDeposit)
        
        // עדכן את תאריך ההפקדה האחרונה בהפקדה המקורית
        recurringDeposit.lastRecurringDate = nextDate.toISOString().split('T')[0]
        
        depositsCreated++
        console.log(`✅ נוצרה הפקדה מחזורית אוטומטית: ₪${newDeposit.amount} למפקיד ${newDeposit.depositorName}`)
      }
    }

    if (depositsCreated > 0) {
      this.saveData()
      console.log(`🔄 נוצרו ${depositsCreated} הפקדות מחזוריות אוטומטיות`)
      
      // שמור הודעה למשתמש
      const message = `🔄 נוצרו ${depositsCreated} הפקדות מחזוריות אוטומטיות`
      localStorage.setItem('gemach_recurring_message', message)
    }
  }

  updateBorrower(id: number, updates: Partial<DatabaseBorrower>): { success: boolean; error?: string } {
    const index = this.dataFile.borrowers.findIndex(borrower => borrower.id === id)
    if (index === -1) {
      return { success: false, error: 'לווה לא נמצא' }
    }

    // אם מעדכנים מספר זהות, בדוק תקינות וכפילות
    if (updates.idNumber !== undefined) {
      // בדוק אם מספר זהות חובה רק אם ההגדרה מפעילה את זה
      if (this.dataFile.settings.requireIdNumber && (!updates.idNumber || updates.idNumber.trim() === '')) {
        return { success: false, error: 'מספר זהות הוא שדה חובה (ניתן לשנות בהגדרות)' }
      }

      // בדוק תקינות רק אם יש מספר זהות
      if (updates.idNumber && updates.idNumber.trim() !== '' && !this.validateIsraeliId(updates.idNumber)) {
        return { success: false, error: 'מספר זהות לא תקין' }
      }

      // בדוק כפילות רק אם יש מספר זהות
      if (updates.idNumber && updates.idNumber.trim() !== '') {
        const cleanNewId = updates.idNumber.replace(/[\s-]/g, '')
        const existingBorrower = this.dataFile.borrowers.find(b =>
          b.id !== id && b.idNumber && b.idNumber.replace(/[\s-]/g, '') === cleanNewId
        )

        if (existingBorrower) {
          return {
            success: false,
            error: `מספר זהות זה כבר קיים אצל: ${existingBorrower.firstName} ${existingBorrower.lastName}`
          }
        }

        // נקה את מספר הזהות
        updates.idNumber = cleanNewId
      }
    }

    this.dataFile.borrowers[index] = { ...this.dataFile.borrowers[index], ...updates }
    this.saveData()
    return { success: true }
  }

  deleteBorrower(id: number): boolean {
    // בדוק אם יש הלוואות פעילות ללווה
    const activeLoans = this.dataFile.loans.filter(loan =>
      loan.borrowerId === id && loan.status === 'active'
    )

    if (activeLoans.length > 0) {
      return false // לא ניתן למחוק לווה עם הלוואות פעילות
    }

    // קבל את כל ההלוואות של הלווה לפני המחיקה
    const borrowerLoanIds = this.dataFile.loans
      .filter(loan => loan.borrowerId === id)
      .map(loan => loan.id)

    // מחק את הלווה
    this.dataFile.borrowers = this.dataFile.borrowers.filter(borrower => borrower.id !== id)
    // מחק את כל ההלוואות של הלווה
    this.dataFile.loans = this.dataFile.loans.filter(loan => loan.borrowerId !== id)
    // מחק את כל התשלומים הקשורים להלוואות של הלווה
    this.dataFile.payments = this.dataFile.payments.filter(payment => !borrowerLoanIds.includes(payment.loanId))

    this.saveData()
    return true
  }

  // מפקידים
  addDepositor(depositor: Omit<DatabaseDepositor, 'id'>): DatabaseDepositor | { error: string } {
    const settings = this.getSettings()

    // בדוק אם מספר זהות חובה
    if (settings.requireIdNumber) {
      // בדוק שמספר הזהות לא ריק
      if (!depositor.idNumber || depositor.idNumber.trim() === '') {
        return { error: 'מספר זהות הוא שדה חובה (ניתן לשנות בהגדרות)' }
      }

      // בדוק תקינות מספר הזהות
      if (!this.validateIsraeliId(depositor.idNumber)) {
        return { error: 'מספר זהות לא תקין' }
      }

      // בדוק אם מספר הזהות כבר קיים במפקידים
      const existingDepositor = this.dataFile.depositors.find(d =>
        d.idNumber.replace(/[\s-]/g, '') === depositor.idNumber.replace(/[\s-]/g, '')
      )
      if (existingDepositor) {
        return {
          error: `מפקיד עם מספר זהות זה כבר קיים במערכת: ${existingDepositor.name}`
        }
      }
    } else {
      // אם מספר זהות לא חובה, אבל אם הוזן - בדוק תקינות
      if (depositor.idNumber && depositor.idNumber.trim() !== '') {
        if (!this.validateIsraeliId(depositor.idNumber)) {
          return { error: 'מספר זהות לא תקין (או השאר ריק)' }
        }

        const existingDepositor = this.dataFile.depositors.find(d =>
          d.idNumber && d.idNumber.replace(/[\s-]/g, '') === depositor.idNumber.replace(/[\s-]/g, '')
        )
        if (existingDepositor) {
          return {
            error: `מפקיד עם מספר זהות זה כבר קיים במערכת: ${existingDepositor.name}`
          }
        }
      } else {
        // בדוק כפילות שם אם אין מספר זהות
        const existingDepositor = this.dataFile.depositors.find(d =>
          d.name.toLowerCase() === depositor.name.toLowerCase()
        )
        if (existingDepositor) {
          return { error: `מפקיד בשם "${depositor.name}" כבר קיים במערכת. הוסף מספר זהות כדי להבדיל בינם.` }
        }
      }
    }

    // נקה את מספר הזהות (הסר רווחים ומקפים) אם קיים
    const cleanIdNumber = depositor.idNumber ? depositor.idNumber.replace(/[\s-]/g, '') : ''

    const newDepositor: DatabaseDepositor = {
      ...depositor,
      idNumber: cleanIdNumber,
      id: this.getNextId(this.dataFile.depositors)
    }
    this.dataFile.depositors.push(newDepositor)
    this.saveData()
    return newDepositor
  }

  getDepositors(): DatabaseDepositor[] {
    return this.dataFile.depositors
  }

  getDepositorById(id: number): DatabaseDepositor | null {
    return this.dataFile.depositors.find(d => d.id === id) || null
  }

  updateDepositor(id: number, updates: Partial<DatabaseDepositor>): { success: boolean; error?: string } {
    const index = this.dataFile.depositors.findIndex(depositor => depositor.id === id)
    if (index === -1) {
      return { success: false, error: 'מפקיד לא נמצא' }
    }

    // אם מעדכנים מספר זהות, בדוק תקינות וכפילות
    if (updates.idNumber !== undefined) {
      // בדוק אם מספר זהות חובה רק אם ההגדרה מפעילה את זה
      if (this.dataFile.settings.requireIdNumber && (!updates.idNumber || updates.idNumber.trim() === '')) {
        return { success: false, error: 'מספר זהות הוא שדה חובה (ניתן לשנות בהגדרות)' }
      }

      // בדוק תקינות רק אם יש מספר זהות
      if (updates.idNumber && updates.idNumber.trim() !== '' && !this.validateIsraeliId(updates.idNumber)) {
        return { success: false, error: 'מספר זהות לא תקין' }
      }

      // בדוק כפילות רק אם יש מספר זהות
      if (updates.idNumber && updates.idNumber.trim() !== '') {
        const cleanNewId = updates.idNumber.replace(/[\s-]/g, '')
        const existingDepositor = this.dataFile.depositors.find(d =>
          d.id !== id && d.idNumber && d.idNumber.replace(/[\s-]/g, '') === cleanNewId
        )

        if (existingDepositor) {
          return {
            success: false,
            error: `מספר זהות זה כבר קיים אצל: ${existingDepositor.name}`
          }
        }

        // נקה את מספר הזהות
        updates.idNumber = cleanNewId
      }
    }

    this.dataFile.depositors[index] = { ...this.dataFile.depositors[index], ...updates }
    this.saveData()
    return { success: true }
  }

  deleteDepositor(id: number): { success: boolean; error?: string } {
    // בדוק אם יש הפקדות פעילות למפקיד
    const activeDeposits = this.dataFile.deposits.filter(deposit =>
      deposit.depositorId === id && deposit.status === 'active'
    )

    if (activeDeposits.length > 0) {
      return { 
        success: false, 
        error: 'לא ניתן למחוק מפקיד עם הפקדות פעילות' 
      }
    }

    // קבל את כל ההפקדות של המפקיד לפני המחיקה
    const depositorDepositIds = this.dataFile.deposits
      .filter(deposit => deposit.depositorId === id)
      .map(deposit => deposit.id)

    // מחק את המפקיד
    this.dataFile.depositors = this.dataFile.depositors.filter(depositor => depositor.id !== id)
    // מחק את כל ההפקדות של המפקיד
    this.dataFile.deposits = this.dataFile.deposits.filter(deposit => deposit.depositorId !== id)
    // מחק את כל המשיכות הקשורות להפקדות של המפקיד
    this.dataFile.withdrawals = this.dataFile.withdrawals.filter(
      withdrawal => !depositorDepositIds.includes(withdrawal.depositId)
    )

    this.saveData()
    return { success: true }
  }

  // פונקציות עזר למפקידים
  getDepositorBalance(depositorId: number): number {
    // קבל את כל ההפקדות הפעילות של המפקיד (לא כולל תבניות מחזוריות)
    const deposits = this.dataFile.deposits.filter(d => 
      d.depositorId === depositorId && !d.isRecurring
    )
    
    let totalBalance = 0
    for (const deposit of deposits) {
      // חשב יתרה להפקדה: סכום ההפקדה פחות כל המשיכות
      const withdrawnAmount = this.getTotalWithdrawnAmount(deposit.id)
      const depositBalance = deposit.amount - withdrawnAmount
      
      // הוסף רק אם היתרה חיובית (הפקדה פעילה)
      if (depositBalance > 0) {
        totalBalance += depositBalance
      }
    }
    
    return totalBalance
  }

  getDepositorDeposits(depositorId: number): DatabaseDeposit[] {
    // החזר רק הפקדות רגילות (לא תבניות מחזוריות)
    return this.dataFile.deposits
      .filter(d => d.depositorId === depositorId && !d.isRecurring)
      .sort((a, b) => new Date(b.depositDate).getTime() - new Date(a.depositDate).getTime())
  }

  getDepositorRecurringDeposits(depositorId: number): DatabaseDeposit[] {
    // החזר רק תבניות מחזוריות
    return this.dataFile.deposits
      .filter(d => d.depositorId === depositorId && d.isRecurring)
      .sort((a, b) => new Date(b.depositDate).getTime() - new Date(a.depositDate).getTime())
  }

  getDepositorActiveDepositsCount(depositorId: number): number {
    // ספור רק הפקדות רגילות פעילות (לא תבניות מחזוריות)
    return this.dataFile.deposits.filter(d => 
      d.depositorId === depositorId && d.status === 'active' && !d.isRecurring
    ).length
  }

  // הלוואות
  addLoan(loan: Omit<DatabaseLoan, 'id' | 'createdDate' | 'status'>): DatabaseLoan {
    const newLoan: DatabaseLoan = {
      ...loan,
      id: this.getNextId(this.dataFile.loans),
      createdDate: new Date().toISOString().split('T')[0],
      // אם לא סופק תאריך הלוואה, השתמש בתאריך היום
      loanDate: loan.loanDate || new Date().toISOString().split('T')[0],
      status: 'active'
    }
    this.dataFile.loans.push(newLoan)
    this.saveData()
    return newLoan
  }

  getLoans(): DatabaseLoan[] {
    return this.dataFile.loans
  }

  updateLoan(id: number, updates: Partial<DatabaseLoan>): void {
    const index = this.dataFile.loans.findIndex(loan => loan.id === id)
    if (index !== -1) {
      this.dataFile.loans[index] = { ...this.dataFile.loans[index], ...updates }
      this.saveData()
    }
  }

  deleteLoan(id: number): boolean {
    // בדוק אם יש תשלומים להלוואה
    const payments = this.getPaymentsByLoanId(id)
    const hasPayments = payments.filter(p => p.type === 'payment').length > 0

    if (hasPayments) {
      return false // לא ניתן למחוק הלוואה עם תשלומים
    }

    this.dataFile.loans = this.dataFile.loans.filter(loan => loan.id !== id)
    // מחק גם את כל התשלומים הקשורים
    this.dataFile.payments = this.dataFile.payments.filter(payment => payment.loanId !== id)
    this.saveData()
    return true
  }

  // תשלומים
  addPayment(payment: Omit<DatabasePayment, 'id'>): DatabasePayment {
    const newPayment: DatabasePayment = {
      ...payment,
      id: this.getNextId(this.dataFile.payments)
    }
    this.dataFile.payments.push(newPayment)
    this.saveData()
    return newPayment
  }

  getPaymentsByLoanId(loanId: number): DatabasePayment[] {
    return this.dataFile.payments.filter(payment => payment.loanId === loanId)
  }

  deletePayment(id: number): void {
    const payment = this.dataFile.payments.find(p => p.id === id)
    
    this.dataFile.payments = this.dataFile.payments.filter(payment => payment.id !== id)
    
    // אם התשלום היה לחוב ערב, עדכן את הסטטוס
    if (payment && payment.guarantorDebtId) {
      const debt = this.dataFile.guarantorDebts.find(d => d.id === payment.guarantorDebtId)
      if (debt) {
        const balance = this.getGuarantorDebtBalance(debt.id)
        if (balance > 0) {
          // יש עדיין יתרה - החזר לסטטוס פעיל או באיחור
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          let isOverdue = false
          if (debt.paymentType === 'single' && debt.installmentDates && debt.installmentDates[0]) {
            const dueDate = new Date(debt.installmentDates[0])
            dueDate.setHours(0, 0, 0, 0)
            isOverdue = dueDate < today
          } else if (debt.paymentType === 'installments' && debt.installmentDates) {
            for (const dateStr of debt.installmentDates) {
              const dueDate = new Date(dateStr)
              dueDate.setHours(0, 0, 0, 0)
              if (dueDate < today) {
                isOverdue = true
                break
              }
            }
          }
          
          debt.status = isOverdue ? 'overdue' : 'active'
        }
      }
    }
    
    this.saveData()
  }

  getLoanBalance(loanId: number): number {
    const loan = this.dataFile.loans.find(l => l.id === loanId)
    if (!loan) return 0

    const payments = this.getPaymentsByLoanId(loanId)
    const totalPaid = payments
      .filter(p => p.type === 'payment')
      .reduce((sum, p) => sum + p.amount, 0)

    return loan.amount - totalPaid
  }

  getTotalPaidAmount(loanId: number): number {
    const payments = this.getPaymentsByLoanId(loanId)
    return payments
      .filter(p => p.type === 'payment')
      .reduce((sum, p) => sum + p.amount, 0)
  }

  // חישוב יתרת חוב אחרי פרעון ספציפי (לשוברי פרעון)
  getLoanBalanceAfterPayment(loanId: number, specificPayment: DatabasePayment): number {
    const loan = this.dataFile.loans.find(l => l.id === loanId)
    if (!loan) return 0

    const payments = this.getPaymentsByLoanId(loanId)

    // חשב את סך הפרעונות עד התאריך של הפרעון הספציפי (כולל)
    const totalPaidUntilPayment = payments
      .filter(p => p.type === 'payment')
      .filter(p => {
        // כלול פרעונות שהיו לפני או באותו תאריך
        const paymentDate = new Date(p.date)
        const specificDate = new Date(specificPayment.date)

        // אם זה אותו תאריך, כלול רק פרעונות עד ה-ID של הפרעון הספציפי
        if (paymentDate.getTime() === specificDate.getTime()) {
          return p.id <= specificPayment.id
        }

        return paymentDate <= specificDate
      })
      .reduce((sum, p) => sum + p.amount, 0)

    return loan.amount - totalPaidUntilPayment
  }

  // קבלת פרעונות קודמים לפרעון ספציפי (לשוברי פרעון)
  getPreviousPayments(loanId: number, specificPayment: DatabasePayment): DatabasePayment[] {
    const payments = this.getPaymentsByLoanId(loanId)

    return payments
      .filter(p => p.type === 'payment')
      .filter(p => {
        // כלול רק פרעונות שהיו לפני הפרעון הספציפי
        const paymentDate = new Date(p.date)
        const specificDate = new Date(specificPayment.date)

        // אם זה אותו תאריך, כלול רק פרעונות עם ID קטן יותר
        if (paymentDate.getTime() === specificDate.getTime()) {
          return p.id < specificPayment.id
        }

        return paymentDate < specificDate
      })
      .sort((a, b) => {
        // מיין לפי תאריך ואז לפי ID
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime()
        }
        return a.id - b.id
      })
  }

  canAddPayment(loanId: number, amount: number): boolean {
    const balance = this.getLoanBalance(loanId)
    return amount > 0 && amount <= balance
  }

  // חישוב יתרת חוב כוללת של לווה (רק הלוואות פעילות, לא עתידיות)
  getBorrowerTotalBalance(borrowerId: number): number {
    const borrowerLoans = this.dataFile.loans.filter(loan =>
      loan.borrowerId === borrowerId && this.isLoanActive(loan)
    )

    return borrowerLoans.reduce((total, loan) => {
      return total + this.getLoanBalance(loan.id)
    }, 0)
  }

  // פרעון כולל ללווה - מחלק את הסכום בין ההלוואות
  addBorrowerPayment(borrowerId: number, totalAmount: number): boolean {
    const activeLoans = this.dataFile.loans.filter(loan =>
      loan.borrowerId === borrowerId && this.isLoanActive(loan)
    )

    if (activeLoans.length === 0) return false

    // חשב יתרה כוללת
    const totalBalance = this.getBorrowerTotalBalance(borrowerId)

    if (totalAmount > totalBalance || totalAmount <= 0) {
      return false
    }

    let remainingAmount = totalAmount
    const paymentDate = new Date().toISOString().split('T')[0]

    // מיין הלוואות לפי תאריך (הישנות קודם)
    const sortedLoans = activeLoans.sort((a, b) =>
      new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
    )

    // חלק את התשלום בין ההלוואות
    for (const loan of sortedLoans) {
      if (remainingAmount <= 0) break

      const loanBalance = this.getLoanBalance(loan.id)
      if (loanBalance <= 0) continue

      const paymentForThisLoan = Math.min(remainingAmount, loanBalance)

      // הוסף תשלום להלוואה הזו
      this.addPayment({
        loanId: loan.id,
        amount: paymentForThisLoan,
        date: paymentDate,
        type: 'payment',
        notes: `חלק מתשלום כולל של ₪${totalAmount.toLocaleString()}`
      })

      remainingAmount -= paymentForThisLoan

      // בדוק אם ההלוואה נפרעה במלואה
      const newBalance = this.getLoanBalance(loan.id)
      if (newBalance === 0) {
        this.updateLoan(loan.id, { status: 'completed' })
      }
    }

    return true
  }

  // קבל פירוט הלוואות של לווה
  getBorrowerLoansDetails(borrowerId: number) {
    const activeLoans = this.dataFile.loans.filter(loan =>
      loan.borrowerId === borrowerId && loan.status === 'active'
    )

    return activeLoans.map(loan => ({
      id: loan.id,
      amount: loan.amount,
      balance: this.getLoanBalance(loan.id),
      returnDate: loan.returnDate,
      createdDate: loan.createdDate
    }))
  }

  // פקדונות
  addDeposit(deposit: Omit<DatabaseDeposit, 'id' | 'status'>): DatabaseDeposit | { error: string } {
    const settings = this.getSettings()

    // בדוק אם מספר זהות חובה
    if (settings.requireIdNumber) {
      // בדוק שמספר הזהות לא ריק
      if (!deposit.idNumber || deposit.idNumber.trim() === '') {
        return { error: 'מספר זהות הוא שדה חובה (ניתן לשנות בהגדרות)' }
      }

      // בדוק תקינות מספר הזהות
      if (!this.validateIsraeliId(deposit.idNumber)) {
        return { error: 'מספר זהות לא תקין' }
      }

      // בדוק אם מספר הזהות כבר קיים בהפקדות
      const existingDeposit = this.dataFile.deposits.find(d =>
        d.idNumber.replace(/[\s-]/g, '') === deposit.idNumber.replace(/[\s-]/g, '')
      )
      if (existingDeposit) {
        return {
          error: `מפקיד עם מספר זהות זה כבר קיים במערכת: ${existingDeposit.depositorName}`
        }
      }
    } else {
      // אם מספר זהות לא חובה, אבל אם הוזן - בדוק תקינות
      if (deposit.idNumber && deposit.idNumber.trim() !== '') {
        if (!this.validateIsraeliId(deposit.idNumber)) {
          return { error: 'מספר זהות לא תקין (או השאר ריק)' }
        }

        const existingDeposit = this.dataFile.deposits.find(d =>
          d.idNumber.replace(/[\s-]/g, '') === deposit.idNumber.replace(/[\s-]/g, '')
        )
        if (existingDeposit) {
          return {
            error: `מפקיד עם מספר זהות זה כבר קיים במערכת: ${existingDeposit.depositorName}`
          }
        }
      } else {
        // בדוק כפילות שם אם אין מספר זהות
        const existingDeposit = this.dataFile.deposits.find(d =>
          d.depositorName.toLowerCase() === deposit.depositorName.toLowerCase()
        )
        if (existingDeposit) {
          return { error: `מפקיד בשם "${deposit.depositorName}" כבר קיים במערכת. הוסף מספר זהות כדי להבדיל בינם.` }
        }
      }
    }

    // נקה את מספר הזהות (הסר רווחים ומקפים) אם קיים
    const cleanIdNumber = deposit.idNumber ? deposit.idNumber.replace(/[\s-]/g, '') : ''

    const newDeposit: DatabaseDeposit = {
      ...deposit,
      idNumber: cleanIdNumber,
      id: this.getNextId(this.dataFile.deposits),
      status: 'active'
    }
    this.dataFile.deposits.push(newDeposit)
    this.saveData()
    return newDeposit
  }

  addDepositToDepositor(
    depositorId: number, 
    deposit: Omit<DatabaseDeposit, 'id' | 'depositorId' | 'status' | 'depositorName' | 'idNumber' | 'phone'>
  ): DatabaseDeposit | { error: string } {
    // בדוק שהמפקיד קיים
    const depositor = this.getDepositorById(depositorId)
    if (!depositor) {
      return { error: 'מפקיד לא נמצא' }
    }

    // צור הפקדה חדשה עם קישור למפקיד
    const newDeposit: DatabaseDeposit = {
      ...deposit,
      id: this.getNextId(this.dataFile.deposits),
      depositorId: depositorId,
      // מלא שדות ישנים לתאימות לאחור
      depositorName: depositor.name,
      idNumber: depositor.idNumber,
      phone: depositor.phone,
      status: 'active'
    }
    
    this.dataFile.deposits.push(newDeposit)
    this.saveData()
    return newDeposit
  }

  getDeposits(): DatabaseDeposit[] {
    return this.dataFile.deposits
  }

  updateDeposit(id: number, updates: Partial<DatabaseDeposit>): void {
    const index = this.dataFile.deposits.findIndex(deposit => deposit.id === id)
    if (index !== -1) {
      this.dataFile.deposits[index] = { ...this.dataFile.deposits[index], ...updates }
      this.saveData()
    }
  }

  deleteDeposit(id: number): void {
    this.dataFile.deposits = this.dataFile.deposits.filter(deposit => deposit.id !== id)
    this.saveData()
  }

  withdrawDeposit(id: number, amount: number, withdrawalMethod?: string, withdrawalDetails?: string): boolean {
    const deposit = this.dataFile.deposits.find(d => d.id === id)
    if (deposit && deposit.status === 'active') {
      const currentWithdrawn = this.getTotalWithdrawnAmount(id)
      const newTotalWithdrawn = currentWithdrawn + amount

      if (newTotalWithdrawn <= deposit.amount) {
        // יצירת רשומת משיכה חדשה
        const newWithdrawal: DatabaseWithdrawal = {
          id: this.getNextId(this.dataFile.withdrawals),
          depositId: id,
          amount: amount,
          date: new Date().toISOString().split('T')[0],
          paymentMethod: withdrawalMethod as 'cash' | 'transfer' | 'check' | 'credit' | 'other' | undefined,
          paymentDetails: withdrawalDetails,
          paymentDetailsComplete: true,
          notes: ''
        }

        this.dataFile.withdrawals.push(newWithdrawal)

        // עדכון ההפקדה (לתאימות לאחור)
        deposit.withdrawnAmount = newTotalWithdrawn
        deposit.withdrawnDate = new Date().toISOString().split('T')[0]
        deposit.withdrawalPaymentMethod = withdrawalMethod as 'cash' | 'transfer' | 'check' | 'credit' | 'other' | undefined
        deposit.withdrawalPaymentDetails = withdrawalDetails

        if (newTotalWithdrawn === deposit.amount) {
          deposit.status = 'withdrawn'
        }

        this.saveData()
        return true
      }
    }
    return false
  }

  // פונקציות עזר למשיכות
  getTotalWithdrawnAmount(depositId: number): number {
    return this.dataFile.withdrawals
      .filter(w => w.depositId === depositId)
      .reduce((sum, w) => sum + w.amount, 0)
  }

  getWithdrawalsByDepositId(depositId: number): DatabaseWithdrawal[] {
    return this.dataFile.withdrawals
      .filter(w => w.depositId === depositId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  addWithdrawal(withdrawal: Omit<DatabaseWithdrawal, 'id'>): DatabaseWithdrawal {
    const newWithdrawal: DatabaseWithdrawal = {
      ...withdrawal,
      id: this.getNextId(this.dataFile.withdrawals)
    }
    this.dataFile.withdrawals.push(newWithdrawal)
    this.saveData()
    return newWithdrawal
  }

  deleteWithdrawal(id: number): void {
    this.dataFile.withdrawals = this.dataFile.withdrawals.filter(w => w.id !== id)
    this.saveData()
  }

  // תרומות
  addDonation(donation: Omit<DatabaseDonation, 'id'>): DatabaseDonation {
    const newDonation: DatabaseDonation = {
      ...donation,
      id: this.getNextId(this.dataFile.donations)
    }
    this.dataFile.donations.push(newDonation)
    this.saveData()
    return newDonation
  }

  getDonations(): DatabaseDonation[] {
    return this.dataFile.donations
  }

  updateDonation(id: number, updates: Partial<DatabaseDonation>): void {
    const index = this.dataFile.donations.findIndex(donation => donation.id === id)
    if (index !== -1) {
      this.dataFile.donations[index] = { ...this.dataFile.donations[index], ...updates }
      this.saveData()
    }
  }

  deleteDonation(id: number): void {
    this.dataFile.donations = this.dataFile.donations.filter(donation => donation.id !== id)
    this.saveData()
  }

  // פונקציה נוספת לבדיקת מצב
  debugInfo() {
    return {
      borrowers: this.dataFile.borrowers,
      loans: this.dataFile.loans,
      deposits: this.dataFile.deposits,
      donations: this.dataFile.donations,
      payments: this.dataFile.payments,
      localStorage: {
        borrowers: localStorage.getItem('gemach_borrowers'),
        loans: localStorage.getItem('gemach_loans'),
        deposits: localStorage.getItem('gemach_deposits'),
        donations: localStorage.getItem('gemach_donations'),
        payments: localStorage.getItem('gemach_payments')
      }
    }
  }



  // רשימת הלוואות עם פרטי לווים
  getLoansWithBorrowers() {
    return this.dataFile.loans.map(loan => {
      const borrower = this.dataFile.borrowers.find(b => b.id === loan.borrowerId)
      const balance = this.getLoanBalance(loan.id)
      const isActive = this.isLoanActive(loan)
      const isFuture = this.isLoanFuture(loan)

      return {
        ...loan,
        borrowerName: borrower ? `${borrower.firstName} ${borrower.lastName}` : 'לא ידוע',
        borrower,
        balance,
        isActive,
        isFuture,
        loanStatus: isFuture ? 'future' : isActive ? 'active' : loan.status
      }
    })
  }

  // רשימת הלוואות פעילות עם פרטי לווים
  getActiveLoansWithBorrowers() {
    return this.getActiveLoans().map(loan => {
      const borrower = this.dataFile.borrowers.find(b => b.id === loan.borrowerId)
      const balance = this.getLoanBalance(loan.id)

      return {
        ...loan,
        borrowerName: borrower ? `${borrower.firstName} ${borrower.lastName}` : 'לא ידוע',
        borrower,
        balance,
        isActive: true,
        isFuture: false,
        loanStatus: 'active'
      }
    })
  }

  // רשימת הלוואות עתידיות עם פרטי לווים
  getFutureLoansWithBorrowers() {
    return this.getFutureLoans().map(loan => {
      const borrower = this.dataFile.borrowers.find(b => b.id === loan.borrowerId)
      const today = new Date()
      const loanDate = new Date(loan.loanDate)
      const daysUntilActive = Math.ceil((loanDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      return {
        ...loan,
        borrowerName: borrower ? `${borrower.firstName} ${borrower.lastName}` : 'לא ידוע',
        borrower,
        balance: loan.amount, // הלוואה עתידית - הסכום המלא
        isActive: false,
        isFuture: true,
        loanStatus: 'future',
        daysUntilActive
      }
    })
  }

  // המרת נתונים ישנים למבנה החדש
  private migrateOldData(): void {
    try {
      // בדוק אם יש נתונים ישנים במבנה הישן
      const oldLoans = this.dataFile.loans

      if (oldLoans.length > 0 && this.dataFile.borrowers.length === 0) {
        console.log('מזהה נתונים ישנים, מתחיל המרה...')

        // צור לווים מההלוואות הישנות
        const borrowersMap = new Map<string, DatabaseBorrower>()
        let borrowerId = 1

        oldLoans.forEach((loan: any) => {
          if (loan.borrowerName && loan.borrowerLastName) {
            const key = `${loan.borrowerName}_${loan.borrowerLastName}`

            if (!borrowersMap.has(key)) {
              const newBorrower: DatabaseBorrower = {
                id: borrowerId++,
                firstName: loan.borrowerName,
                lastName: loan.borrowerLastName,
                city: loan.city || '',
                phone: loan.phone || '',
                address: loan.address || '',
                email: loan.email || '',
                idNumber: ''
              }
              borrowersMap.set(key, newBorrower)
            }
          }
        })

        // שמור את הלווים החדשים
        this.dataFile.borrowers = Array.from(borrowersMap.values())

        // עדכן את ההלוואות עם מזהי הלווים החדשים
        this.dataFile.loans = oldLoans.map((loan: any) => {
          const key = `${loan.borrowerName}_${loan.borrowerLastName}`
          const borrower = borrowersMap.get(key)

          return {
            id: loan.id,
            borrowerId: borrower ? borrower.id : 1,
            amount: loan.amount,
            loanDate: loan.loanDate || loan.createdDate, // הוסף תאריך הלוואה
            returnDate: loan.returnDate,
            createdDate: loan.createdDate,
            notes: loan.notes || '',
            guarantor1: loan.guarantor1 || '',
            guarantor2: loan.guarantor2 || '',
            status: loan.status || 'active',
            loanType: loan.loanType || 'fixed', // הוסף סוג הלוואה
            isRecurring: loan.isRecurring || false,
            recurringDay: loan.recurringDay || 1,
            autoPayment: loan.autoPayment || false,
            autoPaymentAmount: loan.autoPaymentAmount || 0,
            autoPaymentDay: loan.autoPaymentDay || 1
          }
        })

        // שמור את הנתונים המומרים
        this.saveData()
        console.log('המרת נתונים הושלמה בהצלחה!')
      }
    } catch (error) {
      console.error('שגיאה בהמרת נתונים:', error)
    }
  }

  // ניקוי כל הנתונים
  clearAllData(): void {
    // הפונקציה מבוצעת ללא הודעות - ההודעות מטופלות ברמת הממשק
    this.dataFile = {
      borrowers: [],
      loans: [],
      deposits: [],
      depositors: [],
      donations: [],
      payments: [],
      withdrawals: [],
      guarantors: [],
      blacklist: [],
      warningLetters: [],
      guarantorDebts: [],
      masavFiles: [],
      lastUpdated: new Date().toISOString(),
      gemachName: 'נר שרה',
      settings: {
        currency: 'ILS',
        currencySymbol: '₪',
        autoExport: false,
        exportFrequency: 'weekly',
        showOverdueWarnings: true,
        defaultLoanPeriod: 12,
        theme: 'light',
        customBackgroundColor: '#87CEEB',
        headerTitle: 'מערכת לניהול גמ"ח כספים',
        footerText: 'אמר רבי אבא אמר רבי שמעון בן לקיש גדול המלוה יותר מן העושה צדקה (שבת סג.)',
        contactText: 'ניתן להפצה לזיכוי הרבים\n⭐ עולם חסד יבנה',
        enableRecurringLoans: false,
        enableRecurringPayments: false,
        requireIdNumber: false,
        showHebrewDates: false,
        showDateWarnings: true,
        trackPaymentMethods: true,
        quickActions: ['loans', 'deposits', 'donations', 'statistics', 'borrower-report', 'admin-tools'],
        enableMasav: false,
        appPassword: ''
      }
    }
    this.saveData()

    // נקה גם את localStorage
    localStorage.removeItem('gemach_borrowers')
    localStorage.removeItem('gemach_loans')
    localStorage.removeItem('gemach_deposits')
    localStorage.removeItem('gemach_donations')
    localStorage.removeItem('gemach_payments')
    localStorage.removeItem('gemach_full_data')

    // רענן את הדף אחרי ניקוי
    setTimeout(() => {
      window.location.reload()
    }, 1000) // המתן שנייה כדי שההודעה תוצג
  }

  // ניהול שם הגמ"ח
  getGemachName(): string {
    return this.dataFile.gemachName || 'נר שרה'
  }

  setGemachName(name: string): void {
    this.dataFile.gemachName = name
    this.saveData()
  }

  getHeaderTitle(): string {
    return this.dataFile.settings.headerTitle || 'מערכת לניהול גמ"ח כספים'
  }

  setHeaderTitle(title: string): void {
    this.dataFile.settings.headerTitle = title
    this.saveData()
  }

  getFooterText(): string {
    return this.dataFile.settings.footerText || 'אמר רבי אבא אמר רבי שמעון בן לקיש גדול המלוה יותר מן העושה צדקה (שבת סג.)'
  }

  setFooterText(text: string): void {
    this.dataFile.settings.footerText = text
    this.saveData()
  }

  getContactText(): string {
    return this.dataFile.settings.contactText || 'ניתן להפצה לזיכוי הרבים\n⭐ עולם חסד יבנה'
  }

  setContactText(text: string): void {
    this.dataFile.settings.contactText = text
    this.saveData()
  }

  // ניהול הגדרות
  getSettings(): DatabaseSettings {
    return this.dataFile.settings
  }

  updateSettings(newSettings: Partial<DatabaseSettings>): void {
    this.dataFile.settings = { ...this.dataFile.settings, ...newSettings }
    this.saveData()
  }

  getCurrencySymbol(): string {
    return this.dataFile.settings.currencySymbol
  }

  formatCurrency(amount: number): string {
    const symbol = this.getCurrencySymbol()
    // בדיקת בטיחות - אם amount הוא undefined או null, החזר 0
    const safeAmount = amount ?? 0
    return `${symbol}${safeAmount.toLocaleString()}`
  }

  // עדכון טקסטים לברירות מחדל חדשות
  updateTextsToNewDefaults(): void {
    this.dataFile.settings.headerTitle = 'מערכת לניהול גמ"ח כספים'
    this.dataFile.settings.footerText = 'אמר רבי אבא אמר רבי שמעון בן לקיש גדול המלוה יותר מן העושה צדקה (שבת סג.)'
    this.dataFile.settings.contactText = 'ניתן להפצה לזיכוי הרבים\n⭐ עולם חסד יבנה'
    this.saveData()
  }

  // בדיקה אם הלוואה פעילה (לא עתידית)
  isLoanActive(loan: DatabaseLoan): boolean {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const loanDate = new Date(loan.loanDate)
    loanDate.setHours(0, 0, 0, 0)

    return loanDate <= today && loan.status === 'active'
  }

  // בדיקה אם הלוואה עתידית
  isLoanFuture(loan: DatabaseLoan): boolean {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const loanDate = new Date(loan.loanDate)
    loanDate.setHours(0, 0, 0, 0)

    return loanDate > today && loan.status === 'active'
  }

  // קבלת הלוואות פעילות בלבד (לא עתידיות)
  getActiveLoans(): DatabaseLoan[] {
    return this.dataFile.loans.filter(loan => this.isLoanActive(loan))
  }

  // קבלת הלוואות עתידיות
  getFutureLoans(): DatabaseLoan[] {
    return this.dataFile.loans.filter(loan => this.isLoanFuture(loan))
  }

  // זיהוי הלוואות באיחור (רק מהלוואות הפעילות)
  getOverdueLoans() {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // התחלת היום

    return this.getActiveLoans()
      .filter(loan => {
        // הלוואות שהועברו לערבים לא צריכות להופיע כהלוואות באיחור
        if (loan.transferredToGuarantors) return false
        
        const returnDate = new Date(loan.returnDate)
        returnDate.setHours(0, 0, 0, 0)

        const balance = this.getLoanBalance(loan.id)
        return balance > 0 && returnDate < today
      })
      .map(loan => {
        const borrower = this.dataFile.borrowers.find(b => b.id === loan.borrowerId)
        const balance = this.getLoanBalance(loan.id)
        const returnDate = new Date(loan.returnDate)
        const daysOverdue = Math.floor((today.getTime() - returnDate.getTime()) / (1000 * 60 * 60 * 24))

        return {
          ...loan,
          borrowerName: borrower ? `${borrower.firstName} ${borrower.lastName}` : 'לא ידוע',
          borrowerPhone: borrower?.phone || '',
          balance,
          daysOverdue,
          severity: daysOverdue > 30 ? 'high' : daysOverdue > 7 ? 'medium' : 'low'
        }
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue) // הכי באיחור קודם
  }

  // בדיקה אם יש הלוואות באיחור
  hasOverdueLoans(): boolean {
    return this.getOverdueLoans().length > 0
  }

  // ספירת הלוואות לפי רמת חומרה
  getOverdueStats() {
    const overdueLoans = this.getOverdueLoans()
    return {
      total: overdueLoans.length,
      high: overdueLoans.filter(l => l.severity === 'high').length,
      medium: overdueLoans.filter(l => l.severity === 'medium').length,
      low: overdueLoans.filter(l => l.severity === 'low').length,
      totalAmount: overdueLoans.reduce((sum, loan) => sum + loan.balance, 0)
    }
  }

  // סיכום לווים עם סך ההלוואות שלהם (רק הלוואות פעילות)
  getBorrowersSummary() {
    const borrowersMap = new Map()

    this.dataFile.borrowers.forEach(borrower => {
      const activeLoans = this.dataFile.loans.filter(loan =>
        loan.borrowerId === borrower.id && this.isLoanActive(loan)
      )

      const futureLoans = this.dataFile.loans.filter(loan =>
        loan.borrowerId === borrower.id && this.isLoanFuture(loan)
      )

      if (activeLoans.length > 0) {
        const totalAmount = activeLoans.reduce((sum, loan) => sum + loan.amount, 0)
        const totalBalance = activeLoans.reduce((sum, loan) => sum + this.getLoanBalance(loan.id), 0)

        borrowersMap.set(borrower.id, {
          id: borrower.id,
          name: `${borrower.firstName} ${borrower.lastName}`,
          idNumber: borrower.idNumber,
          phone: borrower.phone,
          city: borrower.city,
          loansCount: activeLoans.length,
          futureLoansCount: futureLoans.length,
          totalAmount,
          totalBalance,
          loans: activeLoans.map(loan => ({
            id: loan.id,
            amount: loan.amount,
            balance: this.getLoanBalance(loan.id),
            returnDate: loan.returnDate
          })),
          futureLoans: futureLoans.map(loan => ({
            id: loan.id,
            amount: loan.amount,
            loanDate: loan.loanDate,
            returnDate: loan.returnDate
          }))
        })
      }
    })

    return Array.from(borrowersMap.values()).sort((a, b) => b.totalBalance - a.totalBalance)
  }

  // זיהוי הלוואות מחזוריות שצריכות להיווצר היום
  getPendingRecurringLoans() {
    const today = new Date()
    const currentDay = today.getDate()

    console.log(`🔍 בדיקת הלוואות מחזוריות - היום: ${currentDay}`)

    // חפש בכל ההלוואות שמסומנות כמחזוריות (לא משנה הסטטוס)
    const allRecurringLoans = this.dataFile.loans.filter(loan => loan.isRecurring && loan.recurringDay && loan.recurringMonths)

    console.log('🔍 כל ההלוואות המחזוריות:', allRecurringLoans.map(l => ({
      id: l.id,
      recurringDay: l.recurringDay,
      currentDay,
      matches: l.recurringDay === currentDay
    })))

    const recurringLoans = allRecurringLoans.filter(loan => {
      // בדוק אם היום הוא יום ההלוואה המחזורית
      const matches = loan.recurringDay === currentDay
      console.log(`🔍 בדיקת הלוואה ${loan.id}: יום ${loan.recurringDay} === ${currentDay}? ${matches}`)
      return matches
    })

    // קבץ לפי לווה + סכום + יום חזרה (כדי לזהות סדרות הלוואות מחזוריות)
    const recurringGroups = new Map<string, any[]>()

    recurringLoans.forEach(loan => {
      const key = `${loan.borrowerId}-${loan.amount}-${loan.recurringDay}`
      if (!recurringGroups.has(key)) {
        recurringGroups.set(key, [])
      }
      recurringGroups.get(key)!.push(loan)
    })

    const pendingLoans: any[] = []

    recurringGroups.forEach((loans) => {
      // קח את ההלוואה הראשונה כבסיס (ההלוואה המקורית)
      const baseLoan = loans.sort((a, b) => a.id - b.id)[0]
      const borrower = this.dataFile.borrowers.find(b => b.id === baseLoan.borrowerId)

      // חשב כמה הלוואות כבר נוצרו בסדרה הזו
      const existingCount = loans.length
      const totalPlanned = baseLoan.recurringMonths || 12
      const remainingLoans = totalPlanned - existingCount

      // בדוק אם כבר נוצרה הלוואה היום
      const todayString = today.toISOString().split('T')[0]
      const hasLoanToday = loans.some(loan => loan.loanDate === todayString)

      if (remainingLoans > 0 && !hasLoanToday) {
        pendingLoans.push({
          ...baseLoan,
          borrowerName: borrower ? `${borrower.firstName} ${borrower.lastName}` : 'לא ידוע',
          borrower,
          existingRecurringLoans: existingCount,
          remainingLoans,
          canCreate: true,
          hasLoanToday
        })
      }
    })

    return pendingLoans
  }

  // פונקציות עזר לאמצעי תשלום
  getPaymentMethodIcon(method?: string): string {
    switch (method) {
      case 'cash': return '💵'
      case 'transfer': return '🏦'
      case 'check': return '📝'
      case 'credit': return '💳'
      case 'other': return '❓'
      default: return '💰'
    }
  }

  getPaymentMethodName(method?: string): string {
    switch (method) {
      case 'cash': return 'מזומן'
      case 'transfer': return 'העברה בנקאית'
      case 'check': return 'צ\'ק'
      case 'credit': return 'אשראי'
      case 'other': return 'אחר'
      default: return 'לא צוין'
    }
  }

  getPaymentMethodDisplay(method?: string): string {
    return `${this.getPaymentMethodIcon(method)} ${this.getPaymentMethodName(method)}`
  }

  // פונקציות לטיפול בפרטי אמצעי תשלום
  parsePaymentDetails(method?: string, detailsJson?: string): any {
    if (!detailsJson || !method) return null

    try {
      return JSON.parse(detailsJson)
    } catch {
      return null
    }
  }

  formatPaymentDetails(method?: string, details?: any): string {
    if (!method || !details) return ''

    switch (method) {
      case 'check':
        const checkDetails = details as CheckDetails
        const checkParts = []
        if (checkDetails.checkNumber) checkParts.push(`מספר צ'ק: ${checkDetails.checkNumber}`)
        if (checkDetails.bankName) checkParts.push(`בנק: ${checkDetails.bankName}`)
        if (checkDetails.bankCode) checkParts.push(`מספר בנק: ${checkDetails.bankCode}`)
        if (checkDetails.bank && !checkDetails.bankName) checkParts.push(`בנק: ${checkDetails.bank}`) // תאימות לאחור
        if (checkDetails.branch) checkParts.push(`סניף: ${checkDetails.branch}`)
        if (checkDetails.dueDate) checkParts.push(`תאריך פדיון: ${new Date(checkDetails.dueDate).toLocaleDateString('he-IL')}`)
        return checkParts.join('\n')

      case 'transfer':
        const transferDetails = details as TransferDetails
        const transferParts = []
        if (transferDetails.referenceNumber) transferParts.push(`אסמכתא: ${transferDetails.referenceNumber}`)
        if (transferDetails.bankName) transferParts.push(`בנק: ${transferDetails.bankName}`)
        if (transferDetails.bankCode) transferParts.push(`מספר בנק: ${transferDetails.bankCode}`)
        if (transferDetails.branchNumber) transferParts.push(`מספר סניף: ${transferDetails.branchNumber}`)
        if (transferDetails.accountNumber) transferParts.push(`מספר חשבון: ${transferDetails.accountNumber}`)
        if (transferDetails.transferDate) transferParts.push(`תאריך ביצוע: ${new Date(transferDetails.transferDate).toLocaleDateString('he-IL')}`)
        return transferParts.join('\n')

      case 'credit':
        const creditDetails = details as CreditDetails
        const creditParts = []
        if (creditDetails.lastFourDigits) creditParts.push(`4 ספרות אחרונות: ${creditDetails.lastFourDigits}`)
        if (creditDetails.transactionNumber) creditParts.push(`מספר עסקה: ${creditDetails.transactionNumber}`)
        return creditParts.join('\n')

      case 'other':
        const otherDetails = details as OtherDetails
        return otherDetails.description || ''

      default:
        return ''
    }
  }

  getPaymentDetailsDisplay(method?: string, detailsJson?: string): string {
    const details = this.parsePaymentDetails(method, detailsJson)
    return this.formatPaymentDetails(method, details)
  }

  // סטטיסטיקות אמצעי תשלום
  getPaymentMethodStats() {
    const payments = this.dataFile.payments.filter(p => p.type === 'payment')
    const loans = this.dataFile.loans

    const stats = {
      payments: {
        cash: 0,
        transfer: 0,
        check: 0,
        credit: 0,
        other: 0,
        unspecified: 0
      },
      loans: {
        cash: 0,
        transfer: 0,
        check: 0,
        credit: 0,
        other: 0,
        unspecified: 0
      },
      paymentAmounts: {
        cash: 0,
        transfer: 0,
        check: 0,
        credit: 0,
        other: 0,
        unspecified: 0
      },
      loanAmounts: {
        cash: 0,
        transfer: 0,
        check: 0,
        credit: 0,
        other: 0,
        unspecified: 0
      }
    }

    // ספירת פרעונות
    payments.forEach(payment => {
      const method = payment.paymentMethod || 'unspecified'
      stats.payments[method as keyof typeof stats.payments]++
      stats.paymentAmounts[method as keyof typeof stats.paymentAmounts] += payment.amount
    })

    // ספירת הלוואות
    loans.forEach(loan => {
      const method = loan.loanPaymentMethod || 'unspecified'
      stats.loans[method as keyof typeof stats.loans]++
      stats.loanAmounts[method as keyof typeof stats.loanAmounts] += loan.amount
    })

    return stats
  }

  // פונקציה לבדיקה מהירה של הגדרות
  checkAdvancedFeatures() {
    const settings = this.getSettings()
    console.log('🔧 בדיקת פונקציות מתקדמות:', {
      enableRecurringLoans: settings.enableRecurringLoans,
      enableRecurringPayments: settings.enableRecurringPayments,
      totalLoans: this.dataFile.loans.length,
      recurringLoans: this.dataFile.loans.filter(l => l.isRecurring).length,
      autoPaymentLoans: this.dataFile.loans.filter(l => l.autoPayment).length
    })

    return {
      recurringEnabled: settings.enableRecurringLoans,
      paymentsEnabled: settings.enableRecurringPayments,
      hasRecurringLoans: this.dataFile.loans.some(l => l.isRecurring),
      hasAutoPayments: this.dataFile.loans.some(l => l.autoPayment)
    }
  }

  // פונקציה לדיבוג - מציגה מידע על הלוואות מחזוריות
  debugRecurringLoans() {
    const today = new Date()
    const currentDay = today.getDate()
    const todayString = today.toISOString().split('T')[0]

    const allRecurringLoans = this.dataFile.loans.filter(loan => loan.isRecurring)
    const pendingLoans = this.getPendingRecurringLoans()

    console.log('🔍 Debug Recurring Loans:', {
      today: today.toDateString(),
      currentDay,
      todayString,
      allRecurringLoans: allRecurringLoans.map(loan => {
        const borrower = this.dataFile.borrowers.find(b => b.id === loan.borrowerId)
        return {
          id: loan.id,
          borrower: borrower ? `${borrower.firstName} ${borrower.lastName}` : 'לא ידוע',
          amount: loan.amount,
          loanDate: loan.loanDate,
          recurringDay: loan.recurringDay,
          recurringMonths: loan.recurringMonths,
          isToday: loan.recurringDay === currentDay,
          status: loan.status,
          isLoanToday: loan.loanDate === todayString
        }
      }),
      pendingLoans: pendingLoans.map(loan => ({
        id: loan.id,
        borrower: loan.borrowerName,
        amount: loan.amount,
        recurringDay: loan.recurringDay,
        existingCount: loan.existingRecurringLoans,
        remaining: loan.remainingLoans
      }))
    })

    return {
      currentDay,
      todayString,
      allRecurringLoans: allRecurringLoans.length,
      todayRecurring: allRecurringLoans.filter(l => l.recurringDay === currentDay).length,
      pendingToday: pendingLoans.length,
      details: {
        allRecurring: allRecurringLoans,
        pending: pendingLoans
      }
    }
  }

  // זיהוי פרעונות אוטומטיים שמגיעים היום
  getPendingAutoPayments() {
    const today = new Date()
    const currentDay = today.getDate()
    const todayString = today.toISOString().split('T')[0]

    return this.getActiveLoans()
      .filter(loan => loan.autoPayment && loan.autoPaymentAmount && loan.autoPaymentDay)
      .filter(loan => {
        // בדוק אם היום הוא יום הפרעון
        if (loan.autoPaymentDay !== currentDay) return false

        // בדוק שההלוואה כבר התחילה (תאריך ההלוואה עבר)
        const loanDate = new Date(loan.loanDate)
        const todayDate = new Date(todayString)

        // אם ההלוואה עדיין לא התחילה, לא לבצע פרעון
        if (loanDate > todayDate) return false

        return true
      })
      .filter(loan => {
        // בדוק אם כבר בוצע פרעון אוטומטי היום
        const hasPaymentToday = this.dataFile.payments.some(payment =>
          payment.loanId === loan.id &&
          payment.date === todayString &&
          payment.type === 'payment' &&
          payment.notes.includes('פרעון אוטומטי')
        )
        return !hasPaymentToday
      })
      .map(loan => {
        const borrower = this.dataFile.borrowers.find(b => b.id === loan.borrowerId)
        const balance = this.getLoanBalance(loan.id)
        const paymentAmount = Math.min(loan.autoPaymentAmount!, balance)

        return {
          ...loan,
          borrowerName: borrower ? `${borrower.firstName} ${borrower.lastName}` : 'לא ידוע',
          borrower,
          balance,
          paymentAmount,
          canPay: balance > 0,
          willComplete: paymentAmount >= balance
        }
      })
  }

  // יצירת הלוואה מחזורית חדשה
  createRecurringLoan(originalLoanId: number): DatabaseLoan | null {
    const originalLoan = this.dataFile.loans.find(l => l.id === originalLoanId)
    if (!originalLoan || !originalLoan.isRecurring) return null

    // בדוק אם עדיין יש הלוואות שצריכות להיווצר
    const existingRecurringLoans = this.dataFile.loans.filter(l =>
      l.borrowerId === originalLoan.borrowerId &&
      l.amount === originalLoan.amount &&
      l.isRecurring &&
      l.recurringDay === originalLoan.recurringDay
    ).length

    const remainingLoans = (originalLoan.recurringMonths || 12) - existingRecurringLoans
    if (remainingLoans <= 0) return null

    // בדוק אם כבר נוצרה הלוואה היום
    const today = new Date()
    const todayString = today.toISOString().split('T')[0]
    const hasLoanToday = this.dataFile.loans.some(l =>
      l.borrowerId === originalLoan.borrowerId &&
      l.amount === originalLoan.amount &&
      l.isRecurring &&
      l.recurringDay === originalLoan.recurringDay &&
      l.loanDate === todayString
    )

    if (hasLoanToday) {
      console.log('כבר נוצרה הלוואה היום עבור הלווה הזה')
      return null
    }

    // צור הלוואה חדשה עם תאריך היום
    const loanDate = todayString

    // חשב תאריך החזרה חדש (חודש מהיום)
    const returnDate = new Date(today)
    returnDate.setMonth(returnDate.getMonth() + 1)

    const newLoan = this.addLoan({
      borrowerId: originalLoan.borrowerId,
      amount: originalLoan.amount,
      loanDate: loanDate,
      returnDate: returnDate.toISOString().split('T')[0],
      loanType: originalLoan.loanType || 'fixed',
      isRecurring: true,
      recurringDay: originalLoan.recurringDay,
      recurringMonths: originalLoan.recurringMonths,
      autoPayment: originalLoan.autoPayment || false,
      autoPaymentAmount: originalLoan.autoPaymentAmount || 0,
      autoPaymentDay: originalLoan.autoPaymentDay || 1,
      notes: `הלוואה מחזורית #${existingRecurringLoans + 1} מתוך ${originalLoan.recurringMonths || 12}`,
      guarantor1: originalLoan.guarantor1 || '',
      guarantor2: originalLoan.guarantor2 || ''
    })

    console.log('נוצרה הלוואה מחזורית חדשה:', newLoan)
    return newLoan
  }

  // ביצוע פרעון אוטומטי
  executeAutoPayment(loanId: number, amount?: number): boolean {
    const loan = this.dataFile.loans.find(l => l.id === loanId)
    if (!loan || !loan.autoPayment) return false

    const balance = this.getLoanBalance(loanId)
    if (balance <= 0) return false

    // בדוק שההלוואה כבר התחילה
    const todayString = new Date().toISOString().split('T')[0]
    const loanDate = new Date(loan.loanDate)
    const todayDate = new Date(todayString)

    if (loanDate > todayDate) {
      console.log('ההלוואה עדיין לא התחילה, לא מבצע פרעון אוטומטי')
      return false
    }

    // בדוק אם כבר בוצע פרעון אוטומטי היום
    const hasPaymentToday = this.dataFile.payments.some(payment =>
      payment.loanId === loanId &&
      payment.date === todayString &&
      payment.type === 'payment' &&
      payment.notes.includes('פרעון אוטומטי')
    )

    if (hasPaymentToday) {
      console.log('כבר בוצע פרעון אוטומטי היום עבור הלוואה', loanId)
      return false
    }

    const paymentAmount = amount || Math.min(loan.autoPaymentAmount || 0, balance)
    if (paymentAmount <= 0) return false

    // הוסף את הפרעון
    this.addPayment({
      loanId: loanId,
      amount: paymentAmount,
      date: todayString,
      type: 'payment',
      notes: `פרעון אוטומטי - ${paymentAmount.toLocaleString()} ש"ח`
    })

    // בדוק אם ההלוואה נפרעה במלואה
    const newBalance = this.getLoanBalance(loanId)
    if (newBalance <= 0) {
      this.updateLoan(loanId, { status: 'completed' })
    }

    return true
  }

  // חישוב תאריך הפרעון האוטומטי הבא
  getNextAutoPaymentDate(loanId: number): string | null {
    const loan = this.dataFile.loans.find(l => l.id === loanId)
    if (!loan || !loan.autoPayment || !loan.autoPaymentDay) return null

    const today = new Date()
    const frequency = loan.autoPaymentFrequency || 1 // ברירת מחדל - כל חודש

    // תאריך התחלת פרעון - אם לא הוגדר, השתמש בתאריך ההלוואה
    const startPaymentDate = loan.autoPaymentStartDate
      ? new Date(loan.autoPaymentStartDate)
      : new Date(loan.loanDate)

    // אם תאריך התחלת הפרעון עדיין לא הגיע
    if (startPaymentDate > today) {
      // חשב את הפרעון הראשון - יום הפרעון בחודש של תאריך התחלה או בחודש הבא
      let firstPaymentDate = new Date(startPaymentDate)
      firstPaymentDate.setDate(loan.autoPaymentDay)

      // אם יום הפרעון כבר עבר בחודש של תאריך התחלה, עבור לחודש הבא
      if (firstPaymentDate < startPaymentDate) {
        firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1)
        firstPaymentDate.setDate(loan.autoPaymentDay)
      }

      // טיפול במקרים שבהם החודש לא מכיל את היום
      if (firstPaymentDate.getDate() !== loan.autoPaymentDay) {
        firstPaymentDate.setDate(0) // יום אחרון של החודש הקודם
      }

      return firstPaymentDate.toISOString().split('T')[0]
    }

    // מצא את הפרעון הבא לפי התדירות
    let nextPaymentDate = new Date(startPaymentDate)
    nextPaymentDate.setDate(loan.autoPaymentDay)

    // הוסף חודשים לפי התדירות עד שנגיע לתאריך עתידי
    while (nextPaymentDate <= today) {
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + frequency)
      nextPaymentDate.setDate(loan.autoPaymentDay)
    }

    // טיפול במקרים שבהם החודש לא מכיל את היום (למשל 31 בפברואר)
    if (nextPaymentDate.getDate() !== loan.autoPaymentDay) {
      nextPaymentDate.setDate(0) // יום אחרון של החודש הקודם
    }

    return nextPaymentDate.toISOString().split('T')[0]
  }

  // המרת הלוואות ישנות להוסיף שדה תאריך הלוואה
  private migrateLoanDates(): void {
    let needsSave = false

    this.dataFile.loans.forEach(loan => {
      if (!loan.loanDate) {
        // אם אין תאריך הלוואה, השתמש בתאריך הרישום
        (loan as any).loanDate = loan.createdDate
        needsSave = true
      }
    })

    if (needsSave) {
      console.log('מעדכן הלוואות עם תאריכי הלוואה...')
      this.saveData()
    }
  }

  // סטטיסטיקות אמצעי תשלום
  getPaymentMethodStatistics() {
    // וודא שהנתונים נטענו
    if (!this.dataFile) {
      this.loadData()
    }

    const stats = {
      loans: { // הלוואות שניתנו
        cash: { count: 0, amount: 0 },
        transfer: { count: 0, amount: 0 },
        check: { count: 0, amount: 0 },
        credit: { count: 0, amount: 0 },
        other: { count: 0, amount: 0 },
        unknown: { count: 0, amount: 0 }
      },
      payments: { // פרעונות שהתקבלו
        cash: { count: 0, amount: 0 },
        transfer: { count: 0, amount: 0 },
        check: { count: 0, amount: 0 },
        credit: { count: 0, amount: 0 },
        other: { count: 0, amount: 0 },
        unknown: { count: 0, amount: 0 }
      },
      deposits: { // הפקדות שהתקבלו
        cash: { count: 0, amount: 0 },
        transfer: { count: 0, amount: 0 },
        check: { count: 0, amount: 0 },
        credit: { count: 0, amount: 0 },
        other: { count: 0, amount: 0 },
        unknown: { count: 0, amount: 0 }
      },
      withdrawals: { // משיכות הפקדות ששולמו
        cash: { count: 0, amount: 0 },
        transfer: { count: 0, amount: 0 },
        check: { count: 0, amount: 0 },
        credit: { count: 0, amount: 0 },
        other: { count: 0, amount: 0 },
        unknown: { count: 0, amount: 0 }
      },
      donations: { // תרומות שהתקבלו
        cash: { count: 0, amount: 0 },
        transfer: { count: 0, amount: 0 },
        check: { count: 0, amount: 0 },
        credit: { count: 0, amount: 0 },
        other: { count: 0, amount: 0 },
        unknown: { count: 0, amount: 0 }
      }
    }

    // סטטיסטיקות הלוואות (רק הלוואות פעילות, לא עתידיות)
    if (this.dataFile.loans) {
      this.getActiveLoans().forEach((loan: DatabaseLoan) => {
        const method = loan.loanPaymentMethod || 'unknown'
        if (stats.loans[method as keyof typeof stats.loans]) {
          stats.loans[method as keyof typeof stats.loans].count++
          stats.loans[method as keyof typeof stats.loans].amount += loan.amount
        }
      })
    }

    // סטטיסטיקות פרעונות
    if (this.dataFile.payments) {
      this.dataFile.payments.filter((p: DatabasePayment) => p.type === 'payment').forEach((payment: DatabasePayment) => {
        const method = payment.paymentMethod || 'unknown'
        if (stats.payments[method as keyof typeof stats.payments]) {
          stats.payments[method as keyof typeof stats.payments].count++
          stats.payments[method as keyof typeof stats.payments].amount += payment.amount
        }
      })
    }

    // סטטיסטיקות הפקדות
    if (this.dataFile.deposits) {
      this.dataFile.deposits.forEach((deposit: DatabaseDeposit) => {
        const method = deposit.depositPaymentMethod || 'unknown'
        if (stats.deposits[method as keyof typeof stats.deposits]) {
          stats.deposits[method as keyof typeof stats.deposits].count++
          stats.deposits[method as keyof typeof stats.deposits].amount += deposit.amount
        }
      })

      // סטטיסטיקות משיכות הפקדות
      this.dataFile.deposits.filter((d: DatabaseDeposit) => d.status === 'withdrawn').forEach((deposit: DatabaseDeposit) => {
        const method = deposit.withdrawalPaymentMethod || 'unknown'
        const amount = deposit.withdrawnAmount || deposit.amount
        if (stats.withdrawals[method as keyof typeof stats.withdrawals]) {
          stats.withdrawals[method as keyof typeof stats.withdrawals].count++
          stats.withdrawals[method as keyof typeof stats.withdrawals].amount += amount
        }
      })
    }

    // סטטיסטיקות תרומות
    if (this.dataFile.donations) {
      this.dataFile.donations.forEach((donation: DatabaseDonation) => {
        const method = donation.method || 'unknown'
        if (stats.donations[method as keyof typeof stats.donations]) {
          stats.donations[method as keyof typeof stats.donations].count++
          stats.donations[method as keyof typeof stats.donations].amount += donation.amount
        }
      })
    }

    return stats
  }

  // סיכום כספי לפי אמצעי תשלום
  getPaymentMethodSummary() {
    const stats = this.getPaymentMethodStatistics()
    const summary = {
      cash: { in: 0, out: 0, net: 0 }, // מזומן
      transfer: { in: 0, out: 0, net: 0 }, // העברות
      check: { in: 0, out: 0, net: 0 }, // צ'קים
      credit: { in: 0, out: 0, net: 0 }, // אשראי
      other: { in: 0, out: 0, net: 0 }, // אחר
      unknown: { in: 0, out: 0, net: 0 } // לא ידוע
    }

    // כספים שנכנסו (פרעונות + הפקדות + תרומות)
    Object.keys(summary).forEach(method => {
      const key = method as keyof typeof summary
      summary[key].in =
        stats.payments[key].amount +
        stats.deposits[key].amount +
        stats.donations[key].amount

      // כספים שיצאו (הלוואות + משיכות הפקדות)
      summary[key].out =
        stats.loans[key].amount +
        stats.withdrawals[key].amount

      // נטו
      summary[key].net = summary[key].in - summary[key].out
    })

    return summary
  }

  // פרטי אמצעי תשלום מפורטים
  getDetailedPaymentMethodReport() {
    const stats = this.getPaymentMethodStatistics()

    return {
      summary: this.getPaymentMethodSummary(),
      detailed: stats,
      totals: {
        totalIn: Object.values(this.getPaymentMethodSummary()).reduce((sum, method) => sum + method.in, 0),
        totalOut: Object.values(this.getPaymentMethodSummary()).reduce((sum, method) => sum + method.out, 0),
        totalNet: Object.values(this.getPaymentMethodSummary()).reduce((sum, method) => sum + method.net, 0)
      }
    }
  }

  // סטטיסטיקות כלליות לדף הבית
  getStats() {
    const activeLoans = this.getActiveLoans()
    const futureLoans = this.getFutureLoans()
    const allLoans = this.dataFile.loans
    const deposits = this.dataFile.deposits
    const donations = this.dataFile.donations

    // חישוב סכומים
    const totalLoansAmount = allLoans.reduce((sum, loan) => sum + loan.amount, 0)
    const activeLoansAmount = activeLoans.reduce((sum, loan) => sum + loan.amount, 0)
    const futureLoansAmount = futureLoans.reduce((sum, loan) => sum + loan.amount, 0)
    const totalLoansBalance = activeLoans.reduce((sum, loan) => sum + this.getLoanBalance(loan.id), 0)

    const totalDepositsAmount = deposits.filter(d => d.status === 'active').reduce((sum, deposit) => sum + deposit.amount, 0)
    const totalDonationsAmount = donations.reduce((sum, donation) => sum + donation.amount, 0)

    // חישוב יתרת הגמ"ח: כסף שיש - התחייבויות
    const totalPayments = this.dataFile.payments
      .filter(p => p.type === 'payment')
      .reduce((sum, payment) => sum + payment.amount, 0)

    // יתרת הגמ"ח = כסף שיש (תרומות + פקדונות) - התחייבויות (הלוואות פעילות)
    const balance = totalDonationsAmount + totalDepositsAmount - totalLoansBalance

    return {
      totalLoans: allLoans.length,
      activeLoans: activeLoans.length,
      futureLoans: futureLoans.length,
      totalDeposits: deposits.filter(d => d.status === 'active').length,
      totalDonations: donations.length,
      totalLoansAmount,
      activeLoansAmount,
      futureLoansAmount,
      totalLoansBalance,
      totalDepositsAmount,
      totalDonationsAmount,
      totalPayments,
      balance,
      lastUpdated: new Date().toISOString()
    }
  }

  // פונקציות למעקב השלמת פרטי תשלום

  // קבלת הלוואות שדורשות השלמת פרטי תשלום
  getLoansRequiringPaymentDetails(): DatabaseLoan[] {
    const settings = this.getSettings()
    if (!settings.trackPaymentMethods) {
      return []
    }

    return this.dataFile.loans.filter(loan =>
      loan.status === 'active' &&
      loan.paymentDetailsComplete !== true &&
      (loan.loanPaymentMethod === 'transfer' || loan.loanPaymentMethod === 'check' || !loan.loanPaymentMethod)
    )
  }

  // קבלת פרעונות שדורשים השלמת פרטי תשלום
  getPaymentsRequiringPaymentDetails(): DatabasePayment[] {
    const settings = this.getSettings()
    if (!settings.trackPaymentMethods) {
      return []
    }

    return this.dataFile.payments.filter(payment =>
      payment.type === 'payment' &&
      payment.paymentDetailsComplete !== true &&
      (payment.paymentMethod === 'transfer' || payment.paymentMethod === 'check' || !payment.paymentMethod)
    )
  }

  // סימון השלמת פרטי תשלום להלוואה
  markLoanPaymentDetailsComplete(loanId: number): void {
    const loan = this.dataFile.loans.find(l => l.id === loanId)
    if (loan) {
      loan.paymentDetailsComplete = true
      this.saveData()
    }
  }

  // סימון השלמת פרטי תשלום לפרעון
  markPaymentDetailsComplete(paymentId: number): void {
    const payment = this.dataFile.payments.find(p => p.id === paymentId)
    if (payment) {
      payment.paymentDetailsComplete = true
      this.saveData()
    }
  }

  // עדכון פרטי תשלום להלוואה
  updateLoanPaymentDetails(loanId: number, paymentMethod: string, paymentDetails?: string): boolean {
    const loan = this.dataFile.loans.find(l => l.id === loanId)
    if (!loan) return false

    loan.loanPaymentMethod = paymentMethod as 'cash' | 'transfer' | 'check' | 'credit' | 'other'
    loan.loanPaymentDetails = paymentDetails
    loan.paymentDetailsComplete = true
    this.saveData()
    return true
  }

  // עדכון פרטי תשלום לפרעון
  updatePaymentDetails(paymentId: number, paymentMethod: string, paymentDetails?: string): boolean {
    const payment = this.dataFile.payments.find(p => p.id === paymentId)
    if (!payment) return false

    payment.paymentMethod = paymentMethod as 'cash' | 'transfer' | 'check' | 'credit' | 'other'
    payment.paymentDetails = paymentDetails
    payment.paymentDetailsComplete = true
    this.saveData()
    return true
  }

  // יצירת הלוואה מחזורית עם סטטוס השלמת פרטים
  createRecurringLoanWithPaymentTracking(originalLoanId: number): DatabaseLoan | null {
    const originalLoan = this.dataFile.loans.find(l => l.id === originalLoanId)
    if (!originalLoan || !originalLoan.isRecurring) return null

    // בדוק אם עדיין יש הלוואות שצריכות להיווצר
    const existingRecurringLoans = this.dataFile.loans.filter(l =>
      l.borrowerId === originalLoan.borrowerId &&
      l.amount === originalLoan.amount &&
      l.isRecurring &&
      l.recurringDay === originalLoan.recurringDay
    ).length

    const remainingLoans = (originalLoan.recurringMonths || 12) - existingRecurringLoans
    if (remainingLoans <= 0) return null

    // בדוק אם כבר נוצרה הלוואה היום
    const today = new Date()
    const todayString = today.toISOString().split('T')[0]
    const hasLoanToday = this.dataFile.loans.some(l =>
      l.borrowerId === originalLoan.borrowerId &&
      l.amount === originalLoan.amount &&
      l.isRecurring &&
      l.recurringDay === originalLoan.recurringDay &&
      l.loanDate === todayString
    )

    if (hasLoanToday) {
      return null
    }

    // צור הלוואה חדשה
    const loanDate = todayString
    const returnDate = new Date(today)
    returnDate.setMonth(returnDate.getMonth() + 1)

    const settings = this.getSettings()

    const newLoan = this.addLoan({
      borrowerId: originalLoan.borrowerId,
      amount: originalLoan.amount,
      loanDate: loanDate,
      returnDate: returnDate.toISOString().split('T')[0],
      loanType: originalLoan.loanType || 'fixed',
      isRecurring: true,
      recurringDay: originalLoan.recurringDay,
      recurringMonths: originalLoan.recurringMonths,
      autoPayment: originalLoan.autoPayment || false,
      autoPaymentAmount: originalLoan.autoPaymentAmount || 0,
      autoPaymentDay: originalLoan.autoPaymentDay || 1,
      // אם מעקב אמצעי תשלום מופעל, השאר ללא פרטים
      loanPaymentMethod: settings.trackPaymentMethods ? undefined : originalLoan.loanPaymentMethod,
      loanPaymentDetails: settings.trackPaymentMethods ? undefined : originalLoan.loanPaymentDetails,
      paymentDetailsComplete: settings.trackPaymentMethods ? false : true,
      notes: `הלוואה מחזורית #${existingRecurringLoans + 1} מתוך ${originalLoan.recurringMonths || 12}`,
      guarantor1: originalLoan.guarantor1 || '',
      guarantor2: originalLoan.guarantor2 || ''
    })

    return newLoan
  }

  // ביצוע פרעון אוטומטי עם מעקב פרטי תשלום
  executeAutoPaymentWithTracking(loanId: number, amount?: number): boolean {
    const loan = this.dataFile.loans.find(l => l.id === loanId)
    if (!loan || !loan.autoPayment) return false

    const balance = this.getLoanBalance(loanId)
    if (balance <= 0) return false

    const todayString = new Date().toISOString().split('T')[0]
    const loanDate = new Date(loan.loanDate)
    const todayDate = new Date(todayString)

    if (loanDate > todayDate) {
      return false
    }

    // בדוק אם כבר בוצע פרעון אוטומטי היום
    const hasPaymentToday = this.dataFile.payments.some(payment =>
      payment.loanId === loanId &&
      payment.date === todayString &&
      payment.type === 'payment' &&
      payment.notes.includes('פרעון אוטומטי')
    )

    if (hasPaymentToday) {
      return false
    }

    const paymentAmount = amount || Math.min(loan.autoPaymentAmount || 0, balance)
    if (paymentAmount <= 0) return false

    const settings = this.getSettings()

    // הוסף את הפרעון
    this.addPayment({
      loanId: loanId,
      amount: paymentAmount,
      date: todayString,
      type: 'payment',
      // אם מעקב אמצעי תשלום מופעל, השאר ללא פרטים
      paymentMethod: settings.trackPaymentMethods ? undefined : 'cash',
      paymentDetails: settings.trackPaymentMethods ? undefined : undefined,
      paymentDetailsComplete: settings.trackPaymentMethods ? false : true,
      notes: `פרעון אוטומטי - ${paymentAmount.toLocaleString()} ש"ח`
    })

    // בדוק אם ההלוואה נפרעה במלואה
    const newBalance = this.getLoanBalance(loanId)
    if (newBalance <= 0) {
      this.updateLoan(loanId, { status: 'completed' })
    }

    return true
  }

  // ===== פונקציות ניהול ערבים =====

  // קבלת כל הערבים
  getGuarantors(): DatabaseGuarantor[] {
    return this.dataFile.guarantors.sort((a, b) => a.firstName.localeCompare(b.firstName))
  }

  // קבלת ערב לפי ID
  getGuarantor(id: number): DatabaseGuarantor | undefined {
    return this.dataFile.guarantors.find(g => g.id === id)
  }

  // הוספת ערב חדש
  addGuarantor(guarantor: Omit<DatabaseGuarantor, 'id' | 'createdDate' | 'lastUpdated' | 'activeGuarantees' | 'totalRisk'>): DatabaseGuarantor | { error: string } {
    // בדיקת שדות חובה
    if (!guarantor.firstName || !guarantor.lastName || !guarantor.phone) {
      return { error: 'שם מלא וטלפון הם שדות חובה' }
    }

    // בדיקת ייחודיות מספר טלפון
    if (this.dataFile.guarantors.some(g => g.phone === guarantor.phone)) {
      return { error: 'מספר טלפון כבר קיים במערכת' }
    }

    // בדיקת מספר זהות אם נדרש
    if (this.dataFile.settings.requireIdNumber && (!guarantor.idNumber || !this.validateIsraeliId(guarantor.idNumber))) {
      return { error: 'מספר זהות תקין הוא שדה חובה' }
    }

    // בדיקת ייחודיות מספר זהות
    if (guarantor.idNumber && this.dataFile.guarantors.some(g => g.idNumber === guarantor.idNumber)) {
      return { error: 'מספר זהות כבר קיים במערכת' }
    }

    const newGuarantor: DatabaseGuarantor = {
      ...guarantor,
      id: this.getNextId(this.dataFile.guarantors),
      createdDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      activeGuarantees: 0,
      totalRisk: 0,
      status: guarantor.status || 'active'
    }

    this.dataFile.guarantors.push(newGuarantor)
    this.saveData()
    this.updateGuarantorStats(newGuarantor.id) // עדכון סטטיסטיקות
    return newGuarantor
  }

  // עדכון ערב
  updateGuarantor(id: number, updates: Partial<DatabaseGuarantor>): boolean {
    const guarantorIndex = this.dataFile.guarantors.findIndex(g => g.id === id)
    if (guarantorIndex === -1) return false

    // בדיקת ייחודיות מספר זהות אם משנים אותו
    if (updates.idNumber && updates.idNumber !== this.dataFile.guarantors[guarantorIndex].idNumber) {
      if (this.dataFile.guarantors.some(g => g.id !== id && g.idNumber === updates.idNumber)) {
        return false // מספר זהות כבר קיים
      }
    }

    this.dataFile.guarantors[guarantorIndex] = {
      ...this.dataFile.guarantors[guarantorIndex],
      ...updates,
      lastUpdated: new Date().toISOString()
    }

    this.saveData()
    this.updateGuarantorStats(id) // עדכון סטטיסטיקות
    return true
  }

  // מחיקת ערב
  deleteGuarantor(id: number): boolean {
    // בדוק אם יש ערבויות פעילות
    const activeLoans = this.dataFile.loans.filter(loan =>
      loan.status === 'active' && (loan.guarantor1Id === id || loan.guarantor2Id === id)
    )

    if (activeLoans.length > 0) {
      return false // לא ניתן למחוק ערב עם ערבויות פעילות
    }

    const guarantorIndex = this.dataFile.guarantors.findIndex(g => g.id === id)
    if (guarantorIndex === -1) return false

    this.dataFile.guarantors.splice(guarantorIndex, 1)
    this.saveData()
    return true
  }

  // עדכון סטטיסטיקות ערב
  updateGuarantorStats(guarantorId: number): void {
    const guarantor = this.dataFile.guarantors.find(g => g.id === guarantorId)
    if (!guarantor) return

    const activeLoans = this.dataFile.loans.filter(loan =>
      loan.status === 'active' && (loan.guarantor1Id === guarantorId || loan.guarantor2Id === guarantorId)
    )

    guarantor.activeGuarantees = activeLoans.length
    guarantor.totalRisk = activeLoans.reduce((sum, loan) => sum + this.getLoanBalance(loan.id), 0)

    // עדכון סטטוס לפי רמת סיכון
    if (guarantor.status !== 'blacklisted') {
      if (guarantor.totalRisk > 50000 || guarantor.activeGuarantees > 5) {
        guarantor.status = 'at_risk'
      } else {
        guarantor.status = 'active'
      }
    }

    this.saveData()
  }

  // עדכון כל הסטטיסטיקות של ערבים
  updateAllGuarantorStats(): void {
    this.dataFile.guarantors.forEach(guarantor => {
      this.updateGuarantorStats(guarantor.id)
    })
  }

  // קבלת ערבים פעילים בלבד
  getActiveGuarantors(): DatabaseGuarantor[] {
    return this.dataFile.guarantors.filter(g => g.status === 'active')
  }

  // חיפוש ערבים
  searchGuarantors(query: string): DatabaseGuarantor[] {
    const lowerQuery = query.toLowerCase()
    return this.dataFile.guarantors.filter(g =>
      g.firstName.toLowerCase().includes(lowerQuery) ||
      g.lastName.toLowerCase().includes(lowerQuery) ||
      g.phone.includes(query) ||
      (g.idNumber && g.idNumber.includes(query))
    )
  }

  // ===== פונקציות רשימה שחורה =====

  // הוספה לרשימה שחורה
  addToBlacklist(type: 'borrower' | 'guarantor', personId: number, reason: string, blockedBy: string = 'מנהל'): boolean {
    // בדוק אם כבר חסום
    const existingEntry = this.dataFile.blacklist.find(entry =>
      entry.type === type && entry.personId === personId && entry.isActive
    )
    if (existingEntry) return false

    const newEntry: DatabaseBlacklistEntry = {
      id: this.getNextId(this.dataFile.blacklist),
      type,
      personId,
      reason,
      blockedDate: new Date().toISOString(),
      blockedBy,
      isActive: true
    }

    this.dataFile.blacklist.push(newEntry)

    // עדכון סטטוס האדם
    if (type === 'guarantor') {
      const guarantor = this.dataFile.guarantors.find(g => g.id === personId)
      if (guarantor) {
        guarantor.status = 'blacklisted'
        guarantor.blacklistReason = reason
        guarantor.blacklistDate = newEntry.blockedDate
        guarantor.blacklistBy = blockedBy
      }
    }

    this.saveData()
    return true
  }

  // הסרה מרשימה שחורה
  removeFromBlacklist(type: 'borrower' | 'guarantor', personId: number, removalReason: string, removedBy: string = 'מנהל'): boolean {
    const entry = this.dataFile.blacklist.find(entry =>
      entry.type === type && entry.personId === personId && entry.isActive
    )
    if (!entry) return false

    entry.isActive = false
    entry.removedDate = new Date().toISOString()
    entry.removedBy = removedBy
    entry.removalReason = removalReason

    // עדכון סטטוס האדם
    if (type === 'guarantor') {
      const guarantor = this.dataFile.guarantors.find(g => g.id === personId)
      if (guarantor) {
        guarantor.status = 'active'
        guarantor.blacklistReason = undefined
        guarantor.blacklistDate = undefined
        guarantor.blacklistBy = undefined
      }
    }

    this.saveData()
    return true
  }

  // בדיקה אם אדם חסום
  isBlacklisted(type: 'borrower' | 'guarantor', personId: number): boolean {
    return this.dataFile.blacklist.some(entry =>
      entry.type === type && entry.personId === personId && entry.isActive
    )
  }

  // קבלת רשימה שחורה פעילה
  getActiveBlacklist(): DatabaseBlacklistEntry[] {
    return this.dataFile.blacklist.filter(entry => entry.isActive)
  }

  // קבלת היסטוריה מלאה של רשימה שחורה (כולל מוסרים)
  getBlacklistHistory(): DatabaseBlacklistEntry[] {
    return this.dataFile.blacklist.sort((a, b) => 
      new Date(b.blockedDate).getTime() - new Date(a.blockedDate).getTime()
    )
  }

  // ===== פונקציות מכתבי התראה =====

  // הוספת מכתב התראה
  addWarningLetter(letter: Omit<DatabaseWarningLetter, 'id'>): DatabaseWarningLetter {
    const newLetter: DatabaseWarningLetter = {
      ...letter,
      id: this.getNextId(this.dataFile.warningLetters)
    }

    this.dataFile.warningLetters.push(newLetter)
    this.saveData()
    return newLetter
  }

  // קבלת מכתבי התראה לפי הלוואה
  getWarningLettersByLoan(loanId: number): DatabaseWarningLetter[] {
    return this.dataFile.warningLetters.filter(letter => letter.loanId === loanId)
  }

  // קבלת כל מכתבי ההתראה
  getWarningLetters(): DatabaseWarningLetter[] {
    return this.dataFile.warningLetters.sort((a, b) =>
      new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime()
    )
  }

  // יצירת מכתב התראה (alias ל-addWarningLetter)
  createWarningLetter(
    loanId: number, 
    type: 'borrower' | 'guarantor' | 'both',
    recipientType: 'borrower' | 'guarantor',
    recipientId: number,
    method: 'print' | 'email' | 'sms' | 'phone' = 'print',
    customContent?: string
  ): DatabaseWarningLetter | null {
    const loan = this.dataFile.loans.find(l => l.id === loanId)
    if (!loan) return null

    const borrower = this.dataFile.borrowers.find(b => b.id === loan.borrowerId)
    if (!borrower) return null

    // יצירת תוכן המכתב
    let content = customContent
    if (!content) {
      const overdueDays = Math.floor((new Date().getTime() - new Date(loan.returnDate).getTime()) / (1000 * 60 * 60 * 24))
      const paidAmount = this.getTotalPaidAmount(loanId)
      const remainingAmount = loan.amount - paidAmount

      if (recipientType === 'borrower') {
        content = `
שלום ${borrower.firstName} ${borrower.lastName},

אנו פונים אליך בנוגע להלוואה מספר ${loanId} בסכום ${loan.amount.toLocaleString()} ש"ח.

תאריך החזרה שנקבע: ${new Date(loan.returnDate).toLocaleDateString('he-IL')}
ימי איחור: ${overdueDays > 0 ? overdueDays : 'טרם פג תוקף'}
סכום שנותר להחזרה: ${remainingAmount.toLocaleString()} ש"ח

אנא פנה אלינו להסדרת ההחזרה בהקדם האפשרי.

בברכה,
גמ"ח ${this.getGemachName()}
        `.trim()
      } else {
        const guarantor = this.dataFile.guarantors.find(g => g.id === recipientId)
        if (!guarantor) return null

        content = `
שלום ${guarantor.firstName} ${guarantor.lastName},

אנו פונים אליך כערב להלוואה מספר ${loanId} של ${borrower.firstName} ${borrower.lastName}.

פרטי ההלוואה:
סכום: ${loan.amount.toLocaleString()} ש"ח
תאריך החזרה: ${new Date(loan.returnDate).toLocaleDateString('he-IL')}
ימי איחור: ${overdueDays > 0 ? overdueDays : 'טרם פג תוקף'}
סכום שנותר: ${remainingAmount.toLocaleString()} ש"ח

כערב להלוואה זו, אנו מבקשים את עזרתך ביצירת קשר עם הלווה להסדרת ההחזרה.

בברכה,
גמ"ח ${this.getGemachName()}
        `.trim()
      }
    }

    const warningLetter: DatabaseWarningLetter = {
      id: this.getNextId(this.dataFile.warningLetters),
      loanId,
      type,
      recipientType,
      recipientId,
      content,
      sentDate: new Date().toISOString().split('T')[0],
      sentBy: 'מנהל המערכת',
      method
    }

    this.dataFile.warningLetters.push(warningLetter)
    this.saveData()

    return warningLetter
  }

  // מיגרציה של ערבים מהלוואות קיימות
  migrateLoansToGuarantors(): void {
    let migratedCount = 0

    this.dataFile.loans.forEach(loan => {
      // מיגרציה של ערב ראשון
      if (loan.guarantor1 && !loan.guarantor1Id) {
        const guarantorName = loan.guarantor1.trim()
        if (guarantorName) {
          let guarantor = this.dataFile.guarantors.find(g =>
            `${g.firstName} ${g.lastName}`.trim() === guarantorName
          )

          if (!guarantor) {
            // יצירת ערב חדש
            const nameParts = guarantorName.split(' ')
            const firstName = nameParts[0] || ''
            const lastName = nameParts.slice(1).join(' ') || ''

            guarantor = {
              id: this.getNextId(this.dataFile.guarantors),
              firstName,
              lastName,
              idNumber: '',
              phone: '',
              status: 'active',
              createdDate: new Date().toISOString().split('T')[0],
              lastUpdated: new Date().toISOString().split('T')[0],
              activeGuarantees: 0,
              totalRisk: 0
            }

            this.dataFile.guarantors.push(guarantor)
            migratedCount++
          }

          loan.guarantor1Id = guarantor.id
        }
      }

      // מיגרציה של ערב שני
      if (loan.guarantor2 && !loan.guarantor2Id) {
        const guarantorName = loan.guarantor2.trim()
        if (guarantorName) {
          let guarantor = this.dataFile.guarantors.find(g =>
            `${g.firstName} ${g.lastName}`.trim() === guarantorName
          )

          if (!guarantor) {
            // יצירת ערב חדש
            const nameParts = guarantorName.split(' ')
            const firstName = nameParts[0] || ''
            const lastName = nameParts.slice(1).join(' ') || ''

            guarantor = {
              id: this.getNextId(this.dataFile.guarantors),
              firstName,
              lastName,
              idNumber: '',
              phone: '',
              status: 'active',
              createdDate: new Date().toISOString().split('T')[0],
              lastUpdated: new Date().toISOString().split('T')[0],
              activeGuarantees: 0,
              totalRisk: 0
            }

            this.dataFile.guarantors.push(guarantor)
            migratedCount++
          }

          loan.guarantor2Id = guarantor.id
        }
      }
    })

    if (migratedCount > 0) {
      this.saveData()
      console.log(`🔄 מיגרציה הושלמה: ${migratedCount} ערבים חדשים נוצרו`)
    }
  }

  // ===== מתודות לניהול חובות ערבים =====

  /**
   * הוספת חוב ערב חדש
   */
  addGuarantorDebt(debt: Omit<DatabaseGuarantorDebt, 'id'>): DatabaseGuarantorDebt {
    const newDebt: DatabaseGuarantorDebt = {
      ...debt,
      id: this.getNextId(this.dataFile.guarantorDebts)
    }
    this.dataFile.guarantorDebts.push(newDebt)
    this.saveData()
    return newDebt
  }

  /**
   * קבלת כל חובות הערבים
   */
  getGuarantorDebts(): DatabaseGuarantorDebt[] {
    return this.dataFile.guarantorDebts
  }

  /**
   * קבלת חובות של ערב ספציפי
   */
  getGuarantorDebtsByGuarantorId(guarantorId: number): DatabaseGuarantorDebt[] {
    return this.dataFile.guarantorDebts.filter(debt => debt.guarantorId === guarantorId)
  }

  /**
   * קבלת חובות שנוצרו מהלוואה ספציפית
   */
  getGuarantorDebtsByLoanId(loanId: number): DatabaseGuarantorDebt[] {
    return this.dataFile.guarantorDebts.filter(debt => debt.originalLoanId === loanId)
  }

  /**
   * עדכון סטטוס חוב ערב
   */
  updateGuarantorDebtStatus(debtId: number, status: 'active' | 'paid' | 'overdue'): boolean {
    const debt = this.dataFile.guarantorDebts.find(d => d.id === debtId)
    if (debt) {
      debt.status = status
      this.saveData()
      return true
    }
    return false
  }

  /**
   * חישוב יתרת חוב ערב (סכום החוב פחות תשלומים)
   */
  getGuarantorDebtBalance(debtId: number): number {
    const debt = this.dataFile.guarantorDebts.find(d => d.id === debtId)
    if (!debt) return 0

    // חשב את סך התשלומים לחוב זה
    const payments = this.dataFile.payments.filter(p => p.guarantorDebtId === debtId)
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

    return debt.amount - totalPaid
  }

  /**
   * העברת הלוואה לערבים
   * @param loanId - מזהה ההלוואה להעברה
   * @param guarantorSplits - Map של guarantorId לסכום שיחויב
   * @param paymentType - סוג תשלום (תשלום אחד או תשלומים)
   * @param installmentsData - נתוני תשלומים (אם רלוונטי)
   * @param transferredBy - שם המשתמש שמבצע את ההעברה
   * @param notes - הערות על ההעברה
   * @returns אובייקט עם success ו-message או error
   */
  transferLoanToGuarantors(
    loanId: number,
    guarantorSplits: Map<number, number>,
    paymentType: 'single' | 'installments',
    installmentsData?: {
      count: number
      amount: number
      dates: string[]
    },
    transferredBy: string = 'מנהל',
    notes?: string
  ): { success: boolean; message?: string; error?: string } {
    try {
      // בדיקות ולידציה
      const loan = this.dataFile.loans.find(l => l.id === loanId)
      if (!loan) {
        return { success: false, error: 'הלוואה לא נמצאה' }
      }

      if (loan.transferredToGuarantors) {
        return { success: false, error: 'הלוואה זו כבר הועברה לערבים' }
      }

      // בדוק שיש לפחות ערב אחד
      if (guarantorSplits.size === 0) {
        return { success: false, error: 'חייב לבחור לפחות ערב אחד' }
      }

      // בדוק שסכום החלוקה שווה ליתרת ההלוואה
      const loanBalance = this.getLoanBalance(loanId)
      const totalSplit = Array.from(guarantorSplits.values()).reduce((sum, amount) => sum + amount, 0)
      
      if (Math.abs(totalSplit - loanBalance) > 0.01) { // סובלנות של אגורה
        return { 
          success: false, 
          error: `סכום החלוקה (₪${totalSplit}) לא שווה ליתרת ההלוואה (₪${loanBalance})` 
        }
      }

      // בדוק שכל הערבים קיימים ולא ברשימה שחורה
      for (const [guarantorId] of guarantorSplits) {
        const guarantor = this.dataFile.guarantors.find(g => g.id === guarantorId)
        if (!guarantor) {
          return { success: false, error: `ערב עם ID ${guarantorId} לא נמצא` }
        }
        if (this.isBlacklisted('guarantor', guarantorId)) {
          return { 
            success: false, 
            error: `ערב ${guarantor.firstName} ${guarantor.lastName} נמצא ברשימה השחורה` 
          }
        }
      }

      // בדיקת תאריכים אם יש תשלומים
      if (paymentType === 'installments' && installmentsData) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        for (const dateStr of installmentsData.dates) {
          const date = new Date(dateStr)
          if (date < today) {
            return { success: false, error: 'תאריכי פירעון לא יכולים להיות בעבר' }
          }
        }
      }

      // ביצוע ההעברה
      const transferDate = new Date().toISOString()

      // יצירת חובות ערבים
      const createdDebts: DatabaseGuarantorDebt[] = []
      for (const [guarantorId, amount] of guarantorSplits) {
        const debt: Omit<DatabaseGuarantorDebt, 'id'> = {
          originalLoanId: loanId,
          guarantorId,
          originalBorrowerId: loan.borrowerId,
          amount,
          transferDate,
          transferredBy,
          paymentType,
          status: 'active',
          notes
        }

        // הוסף נתוני תשלומים אם רלוונטי
        if (paymentType === 'installments' && installmentsData) {
          debt.installmentsCount = installmentsData.count
          debt.installmentAmount = installmentsData.amount
          debt.installmentDates = installmentsData.dates
        }

        const createdDebt = this.addGuarantorDebt(debt)
        createdDebts.push(createdDebt)
      }

      // עדכון ההלוואה
      loan.transferredToGuarantors = true
      loan.transferDate = transferDate
      loan.transferredBy = transferredBy
      loan.transferNotes = notes

      // הוספת הלווה לרשימה שחורה אוטומטית
      const borrower = this.dataFile.borrowers.find(b => b.id === loan.borrowerId)
      if (borrower) {
        const blacklistReason = `לא פרע הלוואה #${loanId} - הועבר לערבים`
        this.addToBlacklist('borrower', loan.borrowerId, blacklistReason)
      }

      this.saveData()

      return {
        success: true,
        message: `הלוואה הועברה בהצלחה ל-${createdDebts.length} ערבים`
      }

    } catch (error) {
      console.error('שגיאה בהעברת הלוואה לערבים:', error)
      return {
        success: false,
        error: `שגיאה בהעברת הלוואה: ${error}`
      }
    }
  }

  /**
   * העברת הלוואה לערבים עם תנאי תשלום שונים לכל ערב
   * @param loanId - מזהה ההלוואה
   * @param guarantorSplits - מפה של ערב לסכום
   * @param guarantorPaymentData - מפה של ערב לתנאי תשלום
   * @param transferredBy - שם המבצע
   * @param notes - הערות
   * @returns אובייקט עם success ו-message או error
   */
  transferLoanToGuarantorsWithIndividualTerms(
    loanId: number,
    guarantorSplits: Map<number, number>,
    guarantorPaymentData: Map<number, {
      paymentType: 'single' | 'installments'
      installmentsCount?: number
      installmentAmount?: number
      installmentDates: string[]
    }>,
    transferredBy: string = 'מנהל',
    notes?: string
  ): { success: boolean; message?: string; error?: string } {
    try {
      // בדיקות ולידציה
      const loan = this.dataFile.loans.find(l => l.id === loanId)
      if (!loan) {
        return { success: false, error: 'הלוואה לא נמצאה' }
      }

      if (loan.transferredToGuarantors) {
        return { success: false, error: 'הלוואה זו כבר הועברה לערבים' }
      }

      if (guarantorSplits.size === 0) {
        return { success: false, error: 'חייב לבחור לפחות ערב אחד' }
      }

      // בדוק שסכום החלוקה שווה ליתרת ההלוואה
      const loanBalance = this.getLoanBalance(loanId)
      const totalSplit = Array.from(guarantorSplits.values()).reduce((sum, amount) => sum + amount, 0)
      
      if (Math.abs(totalSplit - loanBalance) > 0.01) {
        return { 
          success: false, 
          error: `סכום החלוקה (₪${totalSplit}) לא שווה ליתרת ההלוואה (₪${loanBalance})` 
        }
      }

      // בדוק שכל הערבים קיימים ולא ברשימה שחורה
      for (const [guarantorId] of guarantorSplits) {
        const guarantor = this.dataFile.guarantors.find(g => g.id === guarantorId)
        if (!guarantor) {
          return { success: false, error: `ערב עם ID ${guarantorId} לא נמצא` }
        }
        if (this.isBlacklisted('guarantor', guarantorId)) {
          return { 
            success: false, 
            error: `ערב ${guarantor.firstName} ${guarantor.lastName} נמצא ברשימה השחורה` 
          }
        }
      }

      // בדיקת תאריכים
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      for (const [, paymentData] of guarantorPaymentData) {
        for (const dateStr of paymentData.installmentDates) {
          if (!dateStr) continue
          const date = new Date(dateStr)
          if (date < today) {
            return { success: false, error: 'תאריכי פירעון לא יכולים להיות בעבר' }
          }
        }
      }

      // ביצוע ההעברה
      const transferDate = new Date().toISOString()

      // יצירת חובות ערבים
      for (const [gId, amount] of guarantorSplits) {
        const paymentData = guarantorPaymentData.get(gId)
        if (!paymentData) continue

        const debt: Omit<DatabaseGuarantorDebt, 'id'> = {
          originalLoanId: loanId,
          guarantorId: gId,
          originalBorrowerId: loan.borrowerId,
          amount,
          transferDate,
          transferredBy,
          paymentType: paymentData.paymentType,
          status: 'active',
          notes
        }

        // הוסף נתוני תשלומים
        if (paymentData.paymentType === 'installments') {
          debt.installmentsCount = paymentData.installmentsCount
          debt.installmentAmount = paymentData.installmentAmount
          debt.installmentDates = paymentData.installmentDates
        } else {
          debt.installmentDates = paymentData.installmentDates
        }

        this.addGuarantorDebt(debt)
      }

      // עדכן את ההלוואה
      loan.transferredToGuarantors = true
      loan.transferDate = transferDate
      loan.transferredBy = transferredBy
      loan.transferNotes = notes

      // הוסף את הלווה לרשימה שחורה
      const borrower = this.dataFile.borrowers.find(b => b.id === loan.borrowerId)
      if (borrower) {
        this.addToBlacklist(
          'borrower',
          loan.borrowerId,
          `לא פרע הלוואה #${loanId} - הועבר לערבים`
        )
      }

      this.saveData()

      return {
        success: true,
        message: `הלוואה #${loanId} הועברה בהצלחה ל-${guarantorSplits.size} ערבים`
      }
    } catch (error) {
      console.error('שגיאה בהעברת הלוואה לערבים:', error)
      return { success: false, error: 'שגיאה בביצוע ההעברה' }
    }
  }

  /**
   * בדיקת חובות ערבים שפג תוקפם
   * @returns רשימת ערבים שצריכים להיכנס לרשימה שחורה
   */
  checkOverdueGuarantorDebts(): Array<{ debt: DatabaseGuarantorDebt; guarantor: DatabaseGuarantor }> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const overdueDebts: Array<{ debt: DatabaseGuarantorDebt; guarantor: DatabaseGuarantor }> = []

    for (const debt of this.dataFile.guarantorDebts) {
      // דלג על חובות ששולמו או כבר מסומנים כבאיחור
      if (debt.status === 'paid') continue

      // בדוק אם הערב כבר ברשימה שחורה
      if (this.isBlacklisted('guarantor', debt.guarantorId)) continue

      // בדוק את תאריכי הפירעון
      let isOverdue = false

      if (debt.paymentType === 'single' && debt.installmentDates && debt.installmentDates[0]) {
        // תשלום אחד
        const dueDate = new Date(debt.installmentDates[0])
        dueDate.setHours(0, 0, 0, 0)
        isOverdue = dueDate < today
      } else if (debt.paymentType === 'installments' && debt.installmentDates) {
        // תשלומים - בדוק אם עבר תאריך התשלום הראשון שלא שולם
        const balance = this.getGuarantorDebtBalance(debt.id)
        if (balance > 0) {
          // יש עדיין יתרה - בדוק אם עבר תאריך כלשהו
          for (const dateStr of debt.installmentDates) {
            const dueDate = new Date(dateStr)
            dueDate.setHours(0, 0, 0, 0)
            if (dueDate < today) {
              isOverdue = true
              break
            }
          }
        }
      }

      if (isOverdue) {
        // עדכן סטטוס החוב
        if (debt.status !== 'overdue') {
          debt.status = 'overdue'
        }

        const guarantor = this.dataFile.guarantors.find(g => g.id === debt.guarantorId)
        if (guarantor) {
          overdueDebts.push({ debt, guarantor })
        }
      }
    }

    if (overdueDebts.length > 0) {
      this.saveData()
    }

    return overdueDebts
  }

  /**
   * טיפול בפרעון לווה אחרי שההלוואה הועברה לערבים
   * @param loanId - מזהה ההלוואה
   * @param amount - סכום הפרעון
   * @returns תוצאה עם הצלחה והודעה
   */
  handleBorrowerPaymentAfterTransfer(loanId: number, amount: number): { success: boolean; message: string } {
    const loan = this.dataFile.loans.find(l => l.id === loanId)
    if (!loan || !loan.transferredToGuarantors) {
      return { success: false, message: 'הלוואה לא נמצאה או לא הועברה לערבים' }
    }

    // מצא את חובות הערבים להלוואה זו
    const guarantorDebts = this.dataFile.guarantorDebts.filter(d => d.originalLoanId === loanId)
    if (guarantorDebts.length === 0) {
      return { success: false, message: 'לא נמצאו חובות ערבים להלוואה זו' }
    }

    // חשב את סך כל חובות הערבים
    const totalGuarantorDebt = guarantorDebts.reduce((sum, debt) => sum + debt.amount, 0)
    const totalGuarantorBalance = guarantorDebts.reduce((sum, debt) => sum + this.getGuarantorDebtBalance(debt.id), 0)

    // אם הלווה משלם את כל החוב
    if (amount >= totalGuarantorBalance) {
      // מחק את כל חובות הערבים
      for (const debt of guarantorDebts) {
        const balance = this.getGuarantorDebtBalance(debt.id)
        if (balance > 0) {
          // הוסף תשלום לחוב הערב
          this.addPayment({
            loanId: loanId,
            amount: balance,
            date: new Date().toISOString().split('T')[0],
            type: 'payment',
            notes: `פרעון מלא על ידי הלווה המקורי - חוב ערב #${debt.id}`,
            guarantorDebtId: debt.id,
            paidBy: 'borrower'
          })
          
          // עדכן סטטוס החוב
          debt.status = 'paid'
        }
      }
      
      this.saveData()
      return { success: true, message: 'כל חובות הערבים נמחקו - הלווה פרע את כל החוב' }
    }

    // פרעון חלקי - בדוק אם החלוקה הייתה שווה
    const isEqualSplit = guarantorDebts.every(debt => debt.amount === guarantorDebts[0].amount)

    if (isEqualSplit) {
      // חלוקה שווה - הפחת באופן יחסי מכל הערבים
      const reductionPerGuarantor = amount / guarantorDebts.length
      
      for (const debt of guarantorDebts) {
        const balance = this.getGuarantorDebtBalance(debt.id)
        const paymentAmount = Math.min(reductionPerGuarantor, balance)
        
        if (paymentAmount > 0) {
          this.addPayment({
            loanId: loanId,
            amount: paymentAmount,
            date: new Date().toISOString().split('T')[0],
            type: 'payment',
            notes: `פרעון חלקי על ידי הלווה המקורי - חוב ערב #${debt.id}`,
            guarantorDebtId: debt.id,
            paidBy: 'borrower'
          })
          
          // עדכן סטטוס אם נפרע במלואה
          const newBalance = this.getGuarantorDebtBalance(debt.id)
          if (newBalance <= 0) {
            debt.status = 'paid'
          }
        }
      }
      
      this.saveData()
      return { success: true, message: `הסכום חולק שווה בין ${guarantorDebts.length} ערבים (₪${reductionPerGuarantor.toLocaleString()} לכל אחד)` }
    } else {
      // חלוקה לא שווה - צריך החלטה ידנית
      // כרגע נחלק באופן יחסי לפי החלק של כל ערב
      for (const debt of guarantorDebts) {
        const debtRatio = debt.amount / totalGuarantorDebt
        const paymentForThisDebt = amount * debtRatio
        const balance = this.getGuarantorDebtBalance(debt.id)
        const actualPayment = Math.min(paymentForThisDebt, balance)
        
        if (actualPayment > 0) {
          this.addPayment({
            loanId: loanId,
            amount: actualPayment,
            date: new Date().toISOString().split('T')[0],
            type: 'payment',
            notes: `פרעון חלקי על ידי הלווה המקורי (יחסי) - חוב ערב #${debt.id}`,
            guarantorDebtId: debt.id,
            paidBy: 'borrower'
          })
          
          // עדכן סטטוס אם נפרע במלואה
          const newBalance = this.getGuarantorDebtBalance(debt.id)
          if (newBalance <= 0) {
            debt.status = 'paid'
          }
        }
      }
      
      this.saveData()
      return { success: true, message: 'הסכום חולק באופן יחסי בין הערבים לפי חלקם בחוב' }
    }
  }

  /**
   * הוספת ערבים שפג תוקפם לרשימה שחורה
   * @param overdueDebts - רשימת חובות שפג תוקפם
   * @returns מספר הערבים שנוספו
   */
  addOverdueGuarantorsToBlacklist(
    overdueDebts: Array<{ debt: DatabaseGuarantorDebt; guarantor: DatabaseGuarantor }>
  ): number {
    let addedCount = 0

    for (const { debt, guarantor } of overdueDebts) {
      // בדוק שהערב לא כבר ברשימה שחורה
      if (this.isBlacklisted('guarantor', debt.guarantorId)) continue

      const reason = `לא פרע חוב כערב - חוב #${debt.id} (הלוואה מקורית #${debt.originalLoanId})`
      
      if (this.addToBlacklist('guarantor', debt.guarantorId, reason)) {
        addedCount++
        console.log(`🚫 ערב ${guarantor.firstName} ${guarantor.lastName} נוסף לרשימה שחורה`)
      }
    }

    return addedCount
  }

  // ===============================================
  // מתודות מס"ב
  // ===============================================

  /**
   * קבלת הגדרות מס"ב
   */
  getMasavSettings(): MasavSettings | null {
    return this.dataFile.masavSettings || null
  }

  /**
   * עדכון הגדרות מס"ב
   */
  updateMasavSettings(settings: MasavSettings): void {
    this.dataFile.masavSettings = settings
    this.saveData()
  }

  /**
   * קבלת כל קבצי מס"ב
   */
  getMasavFiles(): MasavFileRecord[] {
    return this.dataFile.masavFiles || []
  }

  /**
   * הוספת קובץ מס"ב חדש
   */
  addMasavFile(file: Omit<MasavFileRecord, 'id'>): number {
    const newId = this.dataFile.masavFiles.length > 0
      ? Math.max(...this.dataFile.masavFiles.map(f => f.id)) + 1
      : 1

    const newFile: MasavFileRecord = {
      id: newId,
      ...file
    }

    this.dataFile.masavFiles.push(newFile)
    this.saveData()
    return newId
  }

  /**
   * עדכון סטטוס קובץ מס"ב
   */
  updateMasavFileStatus(fileId: number, status: 'pending' | 'confirmed' | 'cancelled'): boolean {
    const file = this.dataFile.masavFiles.find(f => f.id === fileId)
    if (!file) return false

    file.status = status
    this.saveData()
    return true
  }

  /**
   * קבלת מספר אסמכתא הבא
   */
  getNextReferenceNumber(): number {
    if (!this.dataFile.masavSettings) {
      return 1
    }

    const nextNumber = (this.dataFile.masavSettings.lastReferenceNumber || 0) + 1
    this.dataFile.masavSettings.lastReferenceNumber = nextNumber
    this.saveData()
    return nextNumber
  }

  /**
   * רישום תשלומים מקובץ מס"ב שאושר
   */
  confirmMasavFilePayments(fileId: number): boolean {
    const file = this.dataFile.masavFiles.find(f => f.id === fileId)
    if (!file || file.status !== 'pending') return false

    // רשום תשלום לכל חיוב
    for (const charge of file.charges) {
      if (charge.loanId) {
        this.addPayment({
          loanId: charge.loanId,
          amount: charge.amount,
          date: file.chargeDate,
          type: 'payment',
          paymentMethod: 'transfer',
          notes: `גביה באמצעות מס"ב - קובץ ${file.fileName} - אסמכתא ${charge.referenceNumber}`
        })
      }
    }

    // עדכן סטטוס הקובץ
    file.status = 'confirmed'
    this.saveData()
    return true
  }


}

export const db = new GemachDatabase()