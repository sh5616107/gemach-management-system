// מסד נתונים מקומי עם קובץ JSON

export interface DatabaseBorrower {
  id: number
  firstName: string
  lastName: string
  city: string
  phone: string
  address: string
  email: string
  idNumber?: string
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
  autoPayment?: boolean // פרעון אוטומטי
  autoPaymentAmount?: number // סכום פרעון אוטומטי
  autoPaymentDay?: number // יום בחודש לפרעון אוטומטי
  notes: string
  guarantor1: string
  guarantor2: string
  status: 'active' | 'completed' | 'overdue' | 'reminder_sent'
}

export interface DatabasePayment {
  id: number
  loanId: number
  amount: number
  date: string
  type: 'loan' | 'payment'
  notes: string
}

export interface DatabaseDeposit {
  id: number
  depositorName: string
  amount: number
  depositDate: string
  depositPeriod: number
  reminderDays?: number // כמה ימים לפני תום תקופת ההפקדה להתריע
  phone: string
  notes: string
  status: 'active' | 'withdrawn'
  withdrawnAmount?: number
  withdrawnDate?: string
}

export interface DatabaseDonation {
  id: number
  donorName: string
  donorLastName: string
  amount: number
  donationDate: string
  method: 'cash' | 'transfer' | 'check' | 'other'
  phone: string
  address: string
  notes: string
  needsReceipt: boolean
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
}

interface DatabaseFile {
  borrowers: DatabaseBorrower[]
  loans: DatabaseLoan[]
  deposits: DatabaseDeposit[]
  donations: DatabaseDonation[]
  payments: DatabasePayment[]
  lastUpdated: string
  gemachName: string
  settings: DatabaseSettings
}

class GemachDatabase {
  private dataFile: DatabaseFile = {
    borrowers: [],
    loans: [],
    deposits: [],
    donations: [],
    payments: [],
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
      // פונקציות מתקדמות - כבויות כברירת מחדל
      enableRecurringLoans: false,
      enableRecurringPayments: false
    }
  }

  constructor() {
    this.loadData()
    this.migrateOldData()
    this.migrateLoanDates()
  }

  private loadData(): void {
    try {
      // נסה לטעון מ-localStorage
      const borrowers = localStorage.getItem('gemach_borrowers')
      const loans = localStorage.getItem('gemach_loans')
      const deposits = localStorage.getItem('gemach_deposits')
      const donations = localStorage.getItem('gemach_donations')
      const payments = localStorage.getItem('gemach_payments')

      const gemachName = localStorage.getItem('gemach_name')
      const settings = localStorage.getItem('gemach_settings')

      this.dataFile = {
        borrowers: borrowers ? JSON.parse(borrowers) : [],
        loans: loans ? JSON.parse(loans) : [],
        deposits: deposits ? JSON.parse(deposits) : [],
        donations: donations ? JSON.parse(donations) : [],
        payments: payments ? JSON.parse(payments) : [],
        lastUpdated: new Date().toISOString(),
        gemachName: gemachName || 'נר שרה',
        settings: settings ? JSON.parse(settings) : {
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
          enableRecurringPayments: false
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
      localStorage.setItem('gemach_donations', JSON.stringify(this.dataFile.donations))
      localStorage.setItem('gemach_payments', JSON.stringify(this.dataFile.payments))
      localStorage.setItem('gemach_name', this.dataFile.gemachName)
      localStorage.setItem('gemach_settings', JSON.stringify(this.dataFile.settings))

      // גם שמור את הקובץ המלא ב-localStorage לייצוא
      localStorage.setItem('gemach_full_data', JSON.stringify(this.dataFile))

      console.log('נתונים נשמרו:', {
        borrowers: this.dataFile.borrowers.length,
        loans: this.dataFile.loans.length,
        deposits: this.dataFile.deposits.length,
        donations: this.dataFile.donations.length,
        payments: this.dataFile.payments.length
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
        donations: importedData.donations || [],
        payments: importedData.payments || [],
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
          enableRecurringPayments: false
        }
      }
      this.saveData()
      return true
    } catch (error) {
      console.error('שגיאה בייבוא נתונים:', error)
      return false
    }
  }

  // לווים
  addBorrower(borrower: Omit<DatabaseBorrower, 'id'>): DatabaseBorrower {
    const newBorrower: DatabaseBorrower = {
      ...borrower,
      id: this.getNextId(this.dataFile.borrowers)
    }
    this.dataFile.borrowers.push(newBorrower)
    this.saveData()
    return newBorrower
  }

  getBorrowers(): DatabaseBorrower[] {
    return this.dataFile.borrowers
  }

  updateBorrower(id: number, updates: Partial<DatabaseBorrower>): void {
    const index = this.dataFile.borrowers.findIndex(borrower => borrower.id === id)
    if (index !== -1) {
      this.dataFile.borrowers[index] = { ...this.dataFile.borrowers[index], ...updates }
      this.saveData()
    }
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
    this.dataFile.payments = this.dataFile.payments.filter(payment => payment.id !== id)
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
      loan.borrowerId === borrowerId && loan.status === 'active'
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
  addDeposit(deposit: Omit<DatabaseDeposit, 'id' | 'status'>): DatabaseDeposit {
    const newDeposit: DatabaseDeposit = {
      ...deposit,
      id: this.getNextId(this.dataFile.deposits),
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

  withdrawDeposit(id: number, amount: number): boolean {
    const deposit = this.dataFile.deposits.find(d => d.id === id)
    if (deposit && deposit.status === 'active') {
      const withdrawnAmount = (deposit.withdrawnAmount || 0) + amount
      if (withdrawnAmount <= deposit.amount) {
        deposit.withdrawnAmount = withdrawnAmount
        deposit.withdrawnDate = new Date().toISOString().split('T')[0]
        if (withdrawnAmount === deposit.amount) {
          deposit.status = 'withdrawn'
        }
        this.saveData()
        return true
      }
    }
    return false
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

  // סטטיסטיקות
  getStats() {
    const allLoans = this.dataFile.loans
    const activeLoans = this.getActiveLoans()
    const futureLoans = this.getFutureLoans()
    const deposits = this.dataFile.deposits
    const donations = this.dataFile.donations

    const totalLoansAmount = allLoans.reduce((sum, loan) => sum + loan.amount, 0)
    const activeLoansAmount = activeLoans.reduce((sum, loan) => sum + loan.amount, 0)
    const futureLoansAmount = futureLoans.reduce((sum, loan) => sum + loan.amount, 0)
    
    // חישוב רק הפקדות פעילות (לא נמשכו במלואן)
    const activeDeposits = deposits.filter(deposit => deposit.status === 'active')
    const totalDepositsAmount = activeDeposits.reduce((sum, deposit) => {
      const remainingAmount = deposit.amount - (deposit.withdrawnAmount || 0)
      return sum + remainingAmount
    }, 0)
    const totalDonationsAmount = donations.reduce((sum, donation) => sum + donation.amount, 0)

    // חישוב יתרת הלוואות אמיתית (רק הלוואות פעילות, אחרי פרעונות)
    const totalLoansBalance = activeLoans.reduce((sum, loan) => sum + this.getLoanBalance(loan.id), 0)

    return {
      totalLoans: allLoans.length,
      activeLoans: activeLoans.length,
      futureLoans: futureLoans.length,
      totalDeposits: activeDeposits.length,
      totalDonations: donations.length,
      totalLoansAmount,
      activeLoansAmount,
      futureLoansAmount,
      totalLoansBalance, // יתרה אמיתית של הלוואות פעילות בלבד
      totalDepositsAmount,
      totalDonationsAmount,
      balance: totalDonationsAmount + totalDepositsAmount - totalLoansBalance, // חישוב נכון: תרומות + פקדונות - הלוואות פעילות
      lastUpdated: this.dataFile.lastUpdated
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
      donations: [],
      payments: [],
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
        enableRecurringPayments: false
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
    return `${symbol}${amount.toLocaleString()}`
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
}

export const db = new GemachDatabase()