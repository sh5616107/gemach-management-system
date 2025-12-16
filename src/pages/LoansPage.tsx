import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { db, DatabaseLoan, DatabasePayment, DatabaseBorrower, DatabaseGuarantor, DatabaseGuarantorDebt } from '../database/database'

import NumberInput from '../components/NumberInput'
import GuarantorDebtCard from '../components/GuarantorDebtCard'

import { formatCombinedDate, formatHebrewDateOnly } from '../utils/hebrewDate'
import BankBranchSelector from '../components/BankBranchSelector'

function LoansPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // קבלת הגדרות המערכת
  const settings = db.getSettings()
  console.log('🔧 הגדרות תאריכים עבריים:', settings.showHebrewDates)

  // פונקציה להצגת הודעות ויזואליות שלא חוסמות
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const colors = {
      success: '#27ae60',
      error: '#e74c3c',
      info: '#3498db'
    }

    const notification = document.createElement('div')
    notification.innerHTML = message
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      background: ${colors[type]}; color: white; padding: 15px 20px;
      border-radius: 5px; font-size: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      max-width: 300px; word-wrap: break-word;
    `
    document.body.appendChild(notification)
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 3000)
  }

  // פונקציה להצגת מודל אישור
  const showConfirmModal = (config: {
    title: string
    message: string
    confirmText: string
    cancelText?: string
    onConfirm: (inputValue?: string) => void
    onCancel?: () => void
    type?: 'warning' | 'danger' | 'info'
    hasInput?: boolean
    inputPlaceholder?: string
  }) => {
    setModalInputValue('')
    setModalConfig({
      isOpen: true,
      cancelText: 'ביטול',
      type: 'warning',
      hasInput: false,
      ...config
    })
  }

  // פונקציה לסגירת המודל
  const closeModal = () => {
    setModalConfig(null)
  }

  const [currentBorrower, setCurrentBorrower] = useState<Partial<DatabaseBorrower>>({
    firstName: '',
    lastName: '',
    city: '',
    phone: '',
    phone2: '',
    address: '',
    email: '',
    idNumber: '',
    notes: ''
  })

  const [currentLoan, setCurrentLoan] = useState<Partial<DatabaseLoan>>(() => {
    // חשב תאריך פירעון ברירת מחדל
    const today = new Date()
    const defaultPeriod = db.getSettings().defaultLoanPeriod || 12
    const defaultReturnDate = new Date(today)
    defaultReturnDate.setMonth(defaultReturnDate.getMonth() + defaultPeriod)
    
    return {
      borrowerId: 0,
      amount: undefined,
      loanDate: today.toISOString().split('T')[0], // תאריך היום כברירת מחדל
      returnDate: defaultReturnDate.toISOString().split('T')[0],
      loanType: 'fixed',
      isRecurring: false,
      recurringDay: 1,
      autoPayment: false,
      autoPaymentAmount: 0,
      autoPaymentDay: 1,
      autoPaymentStartDate: '',
      autoPaymentFrequency: 1,
      notes: '',
      guarantor1: '',
      guarantor2: '',
      guarantor1Id: undefined,
      guarantor2Id: undefined
    }
  })

  const [borrowers, setBorrowers] = useState<DatabaseBorrower[]>([])
  const [loans, setLoans] = useState<DatabaseLoan[]>([])
  const [payments, setPayments] = useState<DatabasePayment[]>([])
  const [guarantors, setGuarantors] = useState<DatabaseGuarantor[]>([])
  const [guarantorDebts, setGuarantorDebts] = useState<DatabaseGuarantorDebt[]>([])
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null)
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<number | null>(null)
  const [editingGuarantorId, setEditingGuarantorId] = useState<number | null>(null)
  const [guarantorSearchTerm, setGuarantorSearchTerm] = useState('')
  const [selectedGuarantorDebt, setSelectedGuarantorDebt] = useState<DatabaseGuarantorDebt | null>(null)
  const [showGuarantorDebtPaymentModal, setShowGuarantorDebtPaymentModal] = useState(false)
  
  // State לחיפוש לווים
  const [borrowerSearchTerm, setBorrowerSearchTerm] = useState('')
  const [borrowerSearchResults, setBorrowerSearchResults] = useState<DatabaseBorrower[]>([])
  const [showBorrowerSearchResults, setShowBorrowerSearchResults] = useState(false)
  
  // State לעריכת שמות שדות
  const [isEditingFieldLabels, setIsEditingFieldLabels] = useState(false)
  const [editingField, setEditingField] = useState<'city' | 'address' | 'email' | null>(null)
  const [tempFieldLabel, setTempFieldLabel] = useState('')
  // הכפתורים הועברו לדף "כלים מתקדמים"


  const [mode, setMode] = useState<'borrower' | 'guarantor' | 'loan' | 'payment-details'>('borrower')
  const [isAdvancedEditMode, setIsAdvancedEditMode] = useState(false)

  // State לערב חדש
  const [newGuarantor, setNewGuarantor] = useState({
    firstName: '',
    lastName: '',
    idNumber: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    status: 'active' as 'active' | 'blacklisted' | 'at_risk',
    bankCode: '',
    branchNumber: '',
    accountNumber: ''
  })

  // State למודל אישור
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText: string
    cancelText: string
    onConfirm: (inputValue?: string) => void
    onCancel?: () => void
    type: 'warning' | 'danger' | 'info'
    hasInput?: boolean
    inputPlaceholder?: string
    inputValue?: string
  } | null>(null)

  // State לשדה הקלט במודל
  const [modalInputValue, setModalInputValue] = useState('')

  // State למודל עדכון פרטי תשלום
  const [paymentDetailsModal, setPaymentDetailsModal] = useState<{
    isOpen: boolean
    type: 'loan' | 'payment'
    itemId: number
    currentMethod?: string
    currentDetails?: string
  } | null>(null)

  // State לטופס פרטי תשלום
  const [paymentDetailsForm, setPaymentDetailsForm] = useState({
    paymentMethod: '',
    referenceNumber: '',
    bankCode: '',
    bankName: '',
    branchCode: '',
    branchName: '',
    branchAddress: '',
    city: '',
    branchNumber: '',
    accountNumber: '',
    transferDate: '',
    checkNumber: '',
    branch: '',
    dueDate: '',
    lastFourDigits: '',
    transactionNumber: '',
    description: ''
  })

  useEffect(() => {
    loadData()
    loadGuarantors()
  }, [])

  // טיפול בפרמטר loanId לאחר טעינת הנתונים
  useEffect(() => {
    const loanId = searchParams.get('loanId')
    if (loanId && loans.length > 0 && borrowers.length > 0) {
      const loan = loans.find(l => l.id === Number(loanId))
      if (loan) {
        // טען את ההלוואה עם טעינה מאולצת
        selectLoan(Number(loanId), true)
        setMode('loan')

        // הצג הודעה שנטענה הלוואה ספציפית
        const borrower = borrowers.find(b => b.id === loan.borrowerId)
        const borrowerName = borrower ? `${borrower.firstName} ${borrower.lastName}` : 'לא ידוע'

        setTimeout(() => {
          showNotification(`📋 נטענה הלוואה #${loanId} של ${borrowerName}`, 'info')
        }, 100)

        // נקה את הפרמטר מה-URL
        window.history.replaceState({}, '', '/loans')
      } else {
        showNotification(`❌ הלוואה #${loanId} לא נמצאה`, 'error')
      }
    }
  }, [loans, borrowers, searchParams])

  // טיפול בפרמטר borrowerId לאחר טעינת הנתונים
  useEffect(() => {
    const borrowerId = searchParams.get('borrowerId')
    if (borrowerId && borrowers.length > 0) {
      const borrower = borrowers.find(b => b.id === Number(borrowerId))
      if (borrower) {
        // בחר את הלווה ועבור למצב הלוואות
        selectBorrower(Number(borrowerId))
        setMode('loan')

        // הצג הודעה שנטען לווה ספציפי
        setTimeout(() => {
          showNotification(`👤 נטען כרטיס הלווה: ${borrower.firstName} ${borrower.lastName}`, 'info')
        }, 100)

        // נקה את הפרמטר מה-URL
        window.history.replaceState({}, '', '/loans')
      } else {
        showNotification(`❌ לווה #${borrowerId} לא נמצא`, 'error')
      }
    }
  }, [borrowers, searchParams])

  // עדכן את רשימת ההלוואות כשמשנים לווה
  useEffect(() => {
    if (selectedBorrowerId && selectedLoanId) {
      const loan = loans.find(l => l.id === selectedLoanId)
      if (loan && loan.borrowerId !== selectedBorrowerId) {
        // אם ההלוואה הנבחרת לא שייכת للווה הנבחר, נקה את הבחירה
        setSelectedLoanId(null)
        setPayments([])
      }
    }
  }, [selectedBorrowerId, loans, selectedLoanId])

  // נקה את טופס ההלוואה כשעוברים למצב loan ואין הלוואה נבחרת
  useEffect(() => {
    if (mode === 'loan' && !selectedLoanId && selectedBorrowerId) {
      // אם אין הלוואה נבחרת, אפס את הטופס עם תאריך פירעון ברירת מחדל
      const today = new Date()
      const defaultPeriod = db.getSettings().defaultLoanPeriod || 12
      const defaultReturnDate = new Date(today)
      defaultReturnDate.setMonth(defaultReturnDate.getMonth() + defaultPeriod)
      const returnDateString = defaultReturnDate.toISOString().split('T')[0]
      
      console.log('🔍 useEffect - מאפס טופס עם תאריך פירעון:', returnDateString)
      
      setCurrentLoan({
        borrowerId: selectedBorrowerId,
        amount: undefined,
        loanDate: today.toISOString().split('T')[0],
        returnDate: returnDateString,
        loanType: 'fixed',
        isRecurring: false,
        recurringDay: 1,
        autoPayment: false,
        autoPaymentAmount: 0,
        autoPaymentDay: 1,
        autoPaymentStartDate: '',
        autoPaymentFrequency: 1,
        notes: '',
        guarantor1: '',
        guarantor2: '',
        guarantor1Id: undefined,
        guarantor2Id: undefined
      })
      setPayments([])
    }
  }, [mode, selectedLoanId, selectedBorrowerId])

  const loadData = () => {
    const newBorrowers = db.getBorrowers()
    const newLoans = db.getLoans()
    const newGuarantorDebts = db.getGuarantorDebts()

    // בדיקה תקופתית של חובות ערבים שפג תוקפם
    const overdueDebts = db.checkOverdueGuarantorDebts()
    if (overdueDebts.length > 0) {
      const guarantorNames = overdueDebts.map(({ guarantor }) => 
        `${guarantor.firstName} ${guarantor.lastName}`
      ).join(', ')
      
      // הצגת התראה למשתמש
      showConfirmModal({
        title: 'ערבים שלא פרעו בזמן',
        message: `⚠️ נמצאו ${overdueDebts.length} ערבים שלא פרעו בזמן:\n${guarantorNames}\n\nהאם להוסיף אותם לרשימה השחורה?`,
        confirmText: 'הוסף לרשימה שחורה',
        cancelText: 'ביטול',
        type: 'warning',
        onConfirm: () => {
          const addedCount = db.addOverdueGuarantorsToBlacklist(overdueDebts)
          showNotification(`🚫 ${addedCount} ערבים נוספו לרשימה השחורה`)
        }
      })
    }

    setBorrowers(newBorrowers)
    setLoans(newLoans)
    setGuarantorDebts(newGuarantorDebts)

    // עדכן את הנתונים הנוכחיים אם יש הלוואה או לווה נבחרים
    if (selectedLoanId) {
      const updatedLoan = newLoans.find(l => l.id === selectedLoanId)
      if (updatedLoan) {
        setCurrentLoan(updatedLoan)
        // עדכן גם את התשלומים
        const loanPayments = db.getPaymentsByLoanId(selectedLoanId)
        setPayments(loanPayments)
      }
    }

    if (selectedBorrowerId) {
      const updatedBorrower = newBorrowers.find(b => b.id === selectedBorrowerId)
      if (updatedBorrower) {
        setCurrentBorrower(updatedBorrower)
      }
    }

    console.log('טעינת נתונים:', {
      borrowers: newBorrowers.length,
      loans: newLoans.length
    })
  }

  const loadGuarantors = () => {
    const newGuarantors = db.getGuarantors()
    // עדכן סטטיסטיקות לכל הערבים
    db.updateAllGuarantorStats()
    setGuarantors(newGuarantors)
    console.log('🔄 רענון טבלת ערבים:', newGuarantors.length)
  }

  // רישום פרעון לחוב ערב
  const recordGuarantorDebtPayment = (debtId: number, amount: number) => {
    try {
      const debt = guarantorDebts.find(d => d.id === debtId)
      if (!debt) {
        showNotification('❌ חוב ערב לא נמצא', 'error')
        return
      }

      const balance = db.getGuarantorDebtBalance(debtId)
      if (amount > balance) {
        showNotification(`❌ סכום הפרעון (₪${amount}) גבוה מהיתרה (₪${balance})`, 'error')
        return
      }

      // מצא את הערב
      const guarantor = db.getGuarantors().find(g => g.id === debt.guarantorId)
      
      // יצירת תשלום חדש
      const payment: Omit<DatabasePayment, 'id'> = {
        loanId: debt.originalLoanId, // קישור להלוואה המקורית
        amount,
        date: new Date().toISOString().split('T')[0],
        type: 'payment',
        notes: `פרעון חוב ערב #${debtId}`,
        guarantorDebtId: debtId,
        paidBy: 'guarantor',
        guarantorId: debt.guarantorId,
        guarantorName: guarantor ? `${guarantor.firstName} ${guarantor.lastName}` : 'לא ידוע'
      }

      db.addPayment(payment)

      // עדכן סטטוס החוב אם נפרע במלואה
      const newBalance = balance - amount
      if (newBalance <= 0) {
        db.updateGuarantorDebtStatus(debtId, 'paid')
      }

      showNotification(`✅ פרעון של ₪${amount.toLocaleString()} נרשם בהצלחה!`)
      loadData()
      setShowGuarantorDebtPaymentModal(false)
      setSelectedGuarantorDebt(null)
    } catch (error) {
      console.error('שגיאה ברישום פרעון חוב ערב:', error)
      showNotification('❌ שגיאה ברישום הפרעון', 'error')
    }
  }

  const handleGuarantorInputChange = (field: string, value: string) => {
    setNewGuarantor(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const saveGuarantor = () => {
    if (!newGuarantor.firstName || !newGuarantor.lastName || !newGuarantor.phone) {
      showNotification('⚠️ אנא מלא את השדות החובה: שם מלא וטלפון', 'error')
      return
    }

    // בדוק מספר זהות רק אם זה חובה
    if (db.getSettings().requireIdNumber && (!newGuarantor.idNumber || newGuarantor.idNumber.trim() === '')) {
      showNotification('⚠️ מספר זהות הוא שדה חובה (ניתן לשנות בהגדרות)', 'error')
      return
    }

    // בדוק כפילויות לפי מספר טלפון
    const existingGuarantor = guarantors.find(g => 
      g.phone === newGuarantor.phone && 
      (!editingGuarantorId || g.id !== editingGuarantorId)
    )
    
    if (existingGuarantor) {
      showNotification(`⚠️ ערב עם מספר טלפון זה כבר קיים: ${existingGuarantor.firstName} ${existingGuarantor.lastName}`, 'error')
      return
    }

    if (editingGuarantorId) {
      // עדכון ערב קיים
      if (db.updateGuarantor(editingGuarantorId, newGuarantor)) {
        setEditingGuarantorId(null)
        showNotification('✅ הערב עודכן בהצלחה!')
      } else {
        showNotification('❌ שגיאה בעדכון הערב', 'error')
        return
      }
    } else {
      // ערב חדש
      const result = db.addGuarantor(newGuarantor)
      if ('error' in result) {
        showNotification(`❌ ${result.error}`, 'error')
        return
      } else {
        showNotification('✅ ערב חדש נוסף בהצלחה!')
      }
    }

    loadGuarantors()
    setNewGuarantor({
      firstName: '',
      lastName: '',
      idNumber: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      status: 'active',
      bankCode: '',
      branchNumber: '',
      accountNumber: ''
    })
  }

  const editGuarantor = (guarantor: DatabaseGuarantor) => {
    setNewGuarantor({
      firstName: guarantor.firstName,
      lastName: guarantor.lastName,
      idNumber: guarantor.idNumber || '',
      phone: guarantor.phone,
      email: guarantor.email || '',
      address: guarantor.address || '',
      notes: guarantor.notes || '',
      status: guarantor.status,
      bankCode: guarantor.bankCode || '',
      branchNumber: guarantor.branchNumber || '',
      accountNumber: guarantor.accountNumber || ''
    })
    setEditingGuarantorId(guarantor.id)
  }

  const cancelGuarantorEdit = () => {
    setEditingGuarantorId(null)
    setNewGuarantor({
      firstName: '',
      lastName: '',
      idNumber: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      status: 'active',
      bankCode: '',
      branchNumber: '',
      accountNumber: ''
    })
  }



  const performBorrowerSearch = (term: string) => {
    if (!term.trim()) {
      setBorrowerSearchResults([])
      setShowBorrowerSearchResults(false)
      return
    }

    const searchTerm = term.trim().toLowerCase()
    const results = borrowers.filter(b => {
      // חיפוש לפי שם מלא
      const fullName = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase()
      if (fullName.includes(searchTerm)) return true

      // חיפוש לפי שם פרטי או משפחה בנפרד
      if (b.firstName && b.firstName.toLowerCase().includes(searchTerm)) return true
      if (b.lastName && b.lastName.toLowerCase().includes(searchTerm)) return true

      // חיפוש לפי מספר זהות (עם או בלי מקפים/רווחים)
      if (b.idNumber) {
        const cleanId = b.idNumber.replace(/[\s-]/g, '')
        const cleanSearchTerm = searchTerm.replace(/[\s-]/g, '')
        if (cleanId.includes(cleanSearchTerm)) return true
      }

      // חיפוש לפי טלפון
      if (b.phone && b.phone.toLowerCase().includes(searchTerm)) return true

      // חיפוש לפי עיר
      if (b.city && b.city.toLowerCase().includes(searchTerm)) return true

      return false
    })

    setBorrowerSearchResults(results)
    setShowBorrowerSearchResults(results.length > 0)
  }

  const selectBorrower = (borrowerId: number) => {
    console.log('🔍 selectBorrower - נקרא עם borrowerId:', borrowerId)
    const borrower = borrowers.find(b => b.id === borrowerId)
    if (borrower) {
      setCurrentBorrower(borrower)
      setSelectedBorrowerId(borrowerId)

      // בדוק אם יש הלוואות קיימות ללווה
      const borrowerLoans = loans.filter(loan => loan.borrowerId === borrowerId)
      console.log('🔍 selectBorrower - מספר הלוואות קיימות:', borrowerLoans.length)

      if (borrowerLoans.length > 0) {
        // יש הלוואות קיימות - בחר את האחרונה או זו עם היתרה הגבוהה ביותר
        const activeLoan = borrowerLoans
          .filter(loan => db.getLoanBalance(loan.id) > 0)
          .sort((a, b) => db.getLoanBalance(b.id) - db.getLoanBalance(a.id))[0] ||
          borrowerLoans.sort((a, b) => b.id - a.id)[0] // אם אין פעילות, קח את האחרונה

        console.log('🔍 selectBorrower - יש הלוואות קיימות, טוען הלוואה:', activeLoan.id, 'תאריך פירעון:', activeLoan.returnDate)
        setSelectedLoanId(activeLoan.id)
        setCurrentLoan(activeLoan)
        setPayments(db.getPaymentsByLoanId(activeLoan.id))
      } else {
        // אין הלוואות קיימות - צור הלוואה חדשה עם תאריך פירעון ברירת מחדל
        const today = new Date()
        const defaultPeriod = db.getSettings().defaultLoanPeriod || 12
        const defaultReturnDate = new Date(today)
        defaultReturnDate.setMonth(defaultReturnDate.getMonth() + defaultPeriod)
        const returnDateString = defaultReturnDate.toISOString().split('T')[0]
        
        console.log('🔍 selectBorrower - אין הלוואות קיימות, תאריך פירעון:', returnDateString, 'תקופה:', defaultPeriod, 'חודשים')
        
        const newLoanData = {
          borrowerId,
          amount: undefined,
          loanDate: today.toISOString().split('T')[0],
          returnDate: returnDateString,
          loanType: 'fixed' as 'fixed' | 'flexible',
          isRecurring: false,
          recurringDay: 1,
          autoPayment: false,
          autoPaymentAmount: 0,
          autoPaymentDay: 1,
          autoPaymentStartDate: '',
          autoPaymentFrequency: 1,
          notes: '',
          guarantor1: '',
          guarantor2: '',
          guarantor1Id: undefined,
          guarantor2Id: undefined
        }
        
        console.log('🔍 selectBorrower - נתוני הלוואה חדשה:', newLoanData)
        setCurrentLoan(newLoanData)
        setSelectedLoanId(null)
        setPayments([])
      }
    }
  }

  const selectLoan = (loanId: number, forceLoad: boolean = false) => {
    const loan = loans.find(l => l.id === loanId)
    if (loan) {
      // בדוק אם ההלוואה שייכת ללווה הנבחר (אלא אם זה טעינה מאולצת)
      if (!forceLoad && selectedBorrowerId && loan.borrowerId !== selectedBorrowerId) {
        showNotification('⚠️ ההלוואה הזו לא שייכת ללווה הנבחר', 'error')
        return
      }

      setCurrentLoan(loan)
      setSelectedLoanId(loanId)
      setIsAdvancedEditMode(false) // איפוס מצב עריכה מתקדמת
      const loanPayments = db.getPaymentsByLoanId(loanId)
      setPayments(loanPayments)

      // טען את פרטי הלווה של ההלוואה
      const borrower = borrowers.find(b => b.id === loan.borrowerId)
      if (borrower) {
        setCurrentBorrower(borrower)
        setSelectedBorrowerId(borrower.id)
      }
    }
  }

  const handleBorrowerChange = (field: keyof DatabaseBorrower, value: string | number) => {
    setCurrentBorrower(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // פונקציה ליצירת תאריך מקומי מתאריך בפורמט YYYY-MM-DD
  const createLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day) // חודש מתחיל מ-0
  }

  // פונקציה להמרת תאריך לפורמט YYYY-MM-DD ללא בעיות אזור זמן
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // פונקציה לקבלת תאריך היום בפורמט YYYY-MM-DD
  const getTodayString = (): string => {
    return formatDateForInput(new Date())
  }

  const handleLoanChange = (field: keyof DatabaseLoan, value: string | number | boolean) => {
    console.log('🔄 LoansPage: handleLoanChange נקרא עם:', field, value)




    // בדיקה כשמשנים סכום הלוואה - וודא שהפרעון החודשי לא גבוה יותר
    if (field === 'amount' && typeof value === 'number') {
      // אם הסכום 0 או שלילי, כבה פרעון אוטומטי
      if (value <= 0 && currentLoan.autoPayment) {
        setCurrentLoan(prev => ({
          ...prev,
          amount: value,
          autoPayment: false,
          autoPaymentAmount: 0
        }))
        showNotification('💡 פרעון אוטומטי בוטל בגלל סכום הלוואה לא תקין', 'info')
        return
      }

      const autoPaymentAmount = currentLoan.autoPaymentAmount || 0
      if (currentLoan.autoPayment && autoPaymentAmount > value) {
        // תקן אוטומטית את הפרעון החודשי
        setCurrentLoan(prev => ({
          ...prev,
          amount: value,
          autoPaymentAmount: value
        }))
        showNotification(`💡 סכום הפרעון החודשי הותאם ל-₪${value.toLocaleString()} (סכום ההלוואה)`, 'info')
        return
      }
    }

    // הבדיקה של תאריך החזרה הועברה ל-onBlur של השדה עצמו
    // כדי שלא תפריע בזמן הקלדה

    // בדיקה כשמשנים תאריך הלוואה
    if (field === 'loanDate' && typeof value === 'string' && value) {
      const loanDate = createLocalDate(value)
      
      // אם יש כבר תאריך החזרה, בדוק שהוא לא לפני תאריך ההלוואה
      if (currentLoan.returnDate) {
        const returnDate = createLocalDate(currentLoan.returnDate)
        if (loanDate > returnDate) {
          showNotification(
            `⚠️ תאריך ההלוואה (${loanDate.toLocaleDateString('he-IL')}) מאוחר מתאריך החזרה (${returnDate.toLocaleDateString('he-IL')})<br>אנא תקן את התאריכים`, 'error'
          )
          return
        }
      } else {
        // אם אין תאריך החזרה, חשב אותו אוטומטי לפי ברירת המחדל
        const defaultPeriod = db.getSettings().defaultLoanPeriod || 12
        const calculatedReturnDate = new Date(loanDate)
        calculatedReturnDate.setMonth(calculatedReturnDate.getMonth() + defaultPeriod)
        const returnDateString = calculatedReturnDate.toISOString().split('T')[0]
        
        setCurrentLoan(prev => ({
          ...prev,
          [field]: value,
          returnDate: returnDateString
        }))
        return
      }
    }

    // לוגיקה מיוחדת לפרעון אוטומטי
    if (field === 'autoPayment' && value === true) {
      // בדיקה שיש סכום הלוואה תקין
      if (!currentLoan.amount || currentLoan.amount <= 0) {
        showNotification('⚠️ יש להגדיר סכום הלוואה לפני הפעלת פרעון אוטומטי', 'error')
        return
      }

      // כשמפעילים פרעון אוטומטי, הפוך להלוואה קבועה
      setCurrentLoan(prev => ({
        ...prev,
        [field]: value,
        loanType: 'fixed',
        autoPaymentDay: prev.autoPaymentDay || 5, // ברירת מחדל - יום 5 בחודש
        autoPaymentStartDate: prev.autoPaymentStartDate || prev.loanDate || getTodayString(), // ברירת מחדל - תאריך ההלוואה
        autoPaymentFrequency: prev.autoPaymentFrequency || 1 // ברירת מחדל - כל חודש
      }))
    } else if (field === 'autoPaymentStartDate' && typeof value === 'string' && value) {
      // ולידציה לתאריך התחלת פרעון
      const startDate = createLocalDate(value)
      const loanDateStr = currentLoan.loanDate || getTodayString()
      const loanDate = createLocalDate(loanDateStr)

      if (startDate < loanDate) {
        showNotification(
          `⚠️ תאריך תחילת פרעון (${startDate.toLocaleDateString('he-IL')}) לא יכול להיות לפני תאריך ההלוואה (${loanDate.toLocaleDateString('he-IL')})`, 'error'
        )
        return
      }

      setCurrentLoan(prev => ({
        ...prev,
        [field]: value
      }))
    } else {
      setCurrentLoan(prev => ({
        ...prev,
        [field]: value
      }))
    }

    // אם משנים את הלווה, עדכן גם את הנתונים הקשורים
    if (field === 'borrowerId' && typeof value === 'number') {
      const borrower = borrowers.find(b => b.id === value)
      if (borrower) {
        setCurrentBorrower(borrower)
        setSelectedBorrowerId(value)

        // אם זה לא עריכה מתקדמת, בדוק אם יש הלוואות קיימות
        if (!isAdvancedEditMode) {
          // חפש הלוואות של הלווה הנבחר
          const borrowerLoans = loans.filter(loan => loan.borrowerId === value)

          if (borrowerLoans.length > 0) {
            // יש הלוואות קיימות - בחר את האחרונה או זו עם היתרה הגבוהה ביותר
            const activeLoan = borrowerLoans
              .filter(loan => db.getLoanBalance(loan.id) > 0)
              .sort((a, b) => db.getLoanBalance(b.id) - db.getLoanBalance(a.id))[0] ||
              borrowerLoans.sort((a, b) => b.id - a.id)[0] // אם אין פעילות, קח את האחרונה

            setSelectedLoanId(activeLoan.id)
            setCurrentLoan(activeLoan)
            setPayments(db.getPaymentsByLoanId(activeLoan.id))
          } else {
            // אין הלוואות קיימות - צור הלוואה חדשה
            setSelectedLoanId(null)
            setPayments([])
            setCurrentLoan({
              borrowerId: value,
              amount: undefined,
              loanDate: new Date().toISOString().split('T')[0],
              returnDate: '',
              notes: '',
              guarantor1: '',
              guarantor2: '',
              guarantor1Id: undefined,
              guarantor2Id: undefined
            })
          }
        }
        // אם זה עריכה מתקדמת, רק עדכן את הלווה בהלוואה הקיימת
      }
    }
  }

  const saveBorrower = async () => {
    if (!currentBorrower.firstName || !currentBorrower.lastName) {
      showNotification('⚠️ אנא מלא שם פרטי ושם משפחה', 'error')
      return
    }

    // בדוק מספר זהות רק אם זה חובה
    if (db.getSettings().requireIdNumber && (!currentBorrower.idNumber || currentBorrower.idNumber.trim() === '')) {
      showNotification('⚠️ מספר זהות הוא שדה חובה (ניתן לשנות בהגדרות)', 'error')
      return
    }

    if (selectedBorrowerId) {
      // עדכון לווה קיים
      const updateResult = db.updateBorrower(selectedBorrowerId, currentBorrower as DatabaseBorrower)
      if ('error' in updateResult) {
        showNotification(`❌ ${updateResult.error}`, 'error')
        return
      }
      showNotification('✅ פרטי הלווה עודכנו בהצלחה!')
      loadData()
    } else {
      // הוספת לווה חדש
      const result = db.addBorrower(currentBorrower as Omit<DatabaseBorrower, 'id'>)
      if ('error' in result) {
        showNotification(`❌ ${result.error}`, 'error')
        return
      }
      setSelectedBorrowerId(result.id)
        // אפס את טופס ההלוואה עם הלווה החדש
        setCurrentLoan({
          borrowerId: result.id,
          amount: undefined,
          loanDate: new Date().toISOString().split('T')[0],
          returnDate: '',
          loanType: 'fixed',
          isRecurring: false,
          recurringDay: 1,
          autoPayment: false,
          autoPaymentAmount: 0,
          autoPaymentDay: 1,
          autoPaymentStartDate: '',
          autoPaymentFrequency: 1,
          notes: '',
          guarantor1: '',
          guarantor2: '',
          guarantor1Id: undefined,
          guarantor2Id: undefined
        })

        showNotification('✅ לווה חדש נוסף בהצלחה!')

        // עבור אוטומטית לניהול הלוואות
        setTimeout(() => {
          setMode('loan')
          showNotification('🔄 עברת לניהול הלוואות - כעת תוכל להוסיף הלוואה', 'info')
        }, 1500)

        // נקה את הטופס כדי לאפשר הוספת לווה נוסף אם יחזרו למצב לווים
        setTimeout(() => {
          setCurrentBorrower({
            firstName: '',
            lastName: '',
            city: '',
            phone: '',
            address: '',
            email: '',
            idNumber: ''
          })
        }, 50)

        loadData()
    }
  }

  const saveLoan = () => {
    console.log('💾 saveLoan called:', {
      borrowerId: currentLoan.borrowerId,
      selectedBorrowerId,
      amount: currentLoan.amount,
      currentLoan
    })

    if (!currentLoan.borrowerId || !currentLoan.amount) {
      console.log('❌ Validation failed:', {
        borrowerId: currentLoan.borrowerId,
        amount: currentLoan.amount
      })
      showNotification('⚠️ אנא בחר לווה והכנס סכום', 'error')
      return
    }

    // בדיקה שהלווה לא ברשימה שחורה
    if (db.isBlacklisted('borrower', currentLoan.borrowerId)) {
      showNotification('🚫 לא ניתן להלוות ללווה הנמצא ברשימה השחורה!', 'error')
      return
    }

    // בדיקה שהערבים לא ברשימה שחורה
    if (currentLoan.guarantor1Id && db.isBlacklisted('guarantor', currentLoan.guarantor1Id)) {
      const guarantor = db.getGuarantor(currentLoan.guarantor1Id)
      showNotification(`🚫 לא ניתן להשתמש בערב "${guarantor?.firstName} ${guarantor?.lastName}" - נמצא ברשימה השחורה!`, 'error')
      return
    }

    if (currentLoan.guarantor2Id && db.isBlacklisted('guarantor', currentLoan.guarantor2Id)) {
      const guarantor = db.getGuarantor(currentLoan.guarantor2Id)
      showNotification(`🚫 לא ניתן להשתמש בערב "${guarantor?.firstName} ${guarantor?.lastName}" - נמצא ברשימה השחורה!`, 'error')
      return
    }

    // בדיקה שסכום הפרעון החודשי לא עולה על סכום ההלוואה
    if (currentLoan.autoPayment) {
      const autoPaymentAmount = currentLoan.autoPaymentAmount || 0
      if (autoPaymentAmount <= 0) {
        showNotification('⚠️ יש להגדיר סכום פרעון חודשי כשהפרעון האוטומטי מופעל', 'error')
        return
      }
      if (autoPaymentAmount > currentLoan.amount) {
        showNotification(`❌ לא ניתן לשמור הלוואה!\n\nסכום הפרעון החודשי (₪${autoPaymentAmount.toLocaleString()}) גבוה יותר מסכום ההלוואה (₪${currentLoan.amount.toLocaleString()}).\n\nאנא תקן את הסכומים לפני השמירה.`, 'error')
        return
      }
    }

    // בדיקת תאריכים לפני שמירה (נעשה אחרי חישוב התאריך)
    const validateDates = (loanDate: string) => {
      // בדיקה שתאריך ההלוואה לא בעתיד (אלא אם זו הלוואה מחזורית)
      if (loanDate && !currentLoan.isRecurring) {
        const loanDateObj = new Date(loanDate)
        const today = new Date()
        today.setHours(23, 59, 59, 999) // סוף היום

        if (loanDateObj > today) {
          showNotification('⚠️ תאריך מתן ההלוואה לא יכול להיות בעתיד', 'error')
          return false
        }
      }

      if (currentLoan.returnDate && loanDate) {
        const returnDate = new Date(currentLoan.returnDate)
        const calculatedLoanDate = new Date(loanDate)

        if (returnDate < calculatedLoanDate) {
          showNotification('⚠️ תאריך החזרה לא יכול להיות קודם לתאריך ההלוואה', 'error')
          return false
        }
      }

      return true
    }

    // חישוב תאריך הלוואה להלוואות מחזוריות
    let finalLoanDate = currentLoan.loanDate

    if (currentLoan.isRecurring && currentLoan.recurringDay) {
      const today = new Date()
      const currentDay = today.getDate()
      const selectedDay = currentLoan.recurringDay

      console.log('💾 שמירת הלוואה מחזורית:', {
        today: today.toDateString(),
        currentDay,
        selectedDay,
        willBeNextMonth: selectedDay < currentDay
      })

      if (selectedDay >= currentDay) {
        // החודש הנוכחי - רק אם היום שנבחר עדיין לא עבר
        const calculatedDate = new Date(today.getFullYear(), today.getMonth(), selectedDay)
        finalLoanDate = formatDateForInput(calculatedDate)
        console.log('📅 תאריך החודש הנוכחי:', finalLoanDate)
      } else {
        // החודש הבא - אם היום שנבחר כבר עבר החודש
        const calculatedDate = new Date(today.getFullYear(), today.getMonth() + 1, selectedDay)
        finalLoanDate = formatDateForInput(calculatedDate)
        console.log('📅 תאריך החודש הבא:', finalLoanDate)
      }

      // עדכן את ה-state עם התאריך המחושב
      setCurrentLoan(prev => ({
        ...prev,
        loanDate: finalLoanDate
      }))
    } else if (!currentLoan.loanDate) {
      // הלוואה רגילה ללא תאריך - השתמש בהיום
      finalLoanDate = getTodayString()
      setCurrentLoan(prev => ({
        ...prev,
        loanDate: finalLoanDate
      }))
    }

    // בדיקת סכום חיובי
    if (currentLoan.amount <= 0) {
      showNotification('⚠️ סכום ההלוואה חייב להיות חיובי', 'error')
      return
    }

    // בדיקת תאריכים עם התאריך המחושב
    if (!finalLoanDate || !validateDates(finalLoanDate)) {
      return
    }

    try {
      let savedLoanId: number

      // הכן את נתוני ההלוואה עם התאריך המחושב
      const loanToSave = {
        ...currentLoan,
        loanDate: finalLoanDate
      } as DatabaseLoan

      if (selectedLoanId) {
        // עדכון הלוואה קיימת
        db.updateLoan(selectedLoanId, loanToSave)
        savedLoanId = selectedLoanId
      } else {
        // הוספת הלוואה חדשה
        const newLoan = db.addLoan(loanToSave as Omit<DatabaseLoan, 'id' | 'createdDate' | 'status'>)
        savedLoanId = newLoan.id

        // עבור להלוואה החדשה שנשמרה
        setSelectedLoanId(savedLoanId)
      }

      loadData()

      // אם זו הייתה הלוואה חדשה, טען את הנתונים של ההלוואה שנשמרה
      if (!selectedLoanId) {
        // טען את ההלוואה החדשה שנשמרה
        const allLoans = db.getLoans()
        const savedLoan = allLoans.find(l => l.id === savedLoanId)
        if (savedLoan) {
          setCurrentLoan(savedLoan)
          setPayments(db.getPaymentsByLoanId(savedLoanId))
        }
      }

      showNotification('✅ ההלוואה נשמרה בהצלחה!')
    } catch (error) {
      showNotification('❌ שגיאה בשמירת ההלוואה: ' + error, 'error')
    }
  }

  const addPayment = () => {
    if (!selectedLoanId) {
      showNotification('⚠️ לא ניתן לרשום פרעון להלוואה חדשה שלא נשמרה עדיין. אנא שמור את ההלוואה תחילה.', 'error')
      return
    }

    const balance = db.getLoanBalance(selectedLoanId)
    if (balance <= 0) {
      const loan = loans.find(l => l.id === selectedLoanId)
      const borrower = borrowers.find(b => b.id === loan?.borrowerId)
      const borrowerName = borrower ? `${borrower.firstName} ${borrower.lastName}` : 'לא ידוע'

      showNotification(`🎉 ההלוואה של ${borrowerName} כבר נפרעה במלואה!<br>לא ניתן להוסיף פרעון נוסף`, 'info')
      return
    }

    // State לאמצעי תשלום בפרעון
    let paymentMethod = ''
    let paymentDetails = ''

    // יצירת מודל מתקדם לפרעון עם אמצעי תשלום
    const createPaymentModal = () => {
      const modalContent = document.createElement('div')
      modalContent.innerHTML = `
        <div style="
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5); display: flex; align-items: center;
          justify-content: center; z-index: 10000; direction: rtl;
        ">
          <div style="
            background: white; border-radius: 10px; padding: 30px;
            max-width: 500px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          ">
            <h3 style="margin-bottom: 20px; color: #3498db; text-align: center;">הוספת פרעון</h3>
            <p style="margin-bottom: 15px; text-align: center;">יתרה לפרעון: ₪${balance.toLocaleString()}</p>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">סכום לפרעון:</label>
              <input type="number" id="paymentAmount" placeholder="הכנס סכום" style="
                width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px;
                font-size: 16px; text-align: center;
              " />
            </div>

            ${db.getSettings().trackPaymentMethods ? `
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">אמצעי פרעון:</label>
                <select id="paymentMethodSelect" style="
                  width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px; font-size: 14px;
                ">
                  <option value="">בחר אמצעי תשלום</option>
                  <option value="cash">💵 מזומן</option>
                  <option value="transfer">🏦 העברה בנקאית</option>
                  <option value="check">📝 צ'ק</option>
                  <option value="credit">💳 אשראי</option>
                  <option value="other">❓ אחר</option>
                </select>
              </div>

              <div id="paymentDetailsContainer" style="margin-bottom: 15px; display: none;">
                <!-- פרטים נוספים יתווספו כאן -->
              </div>
            ` : ''}

            <div style="display: flex; gap: 15px; justify-content: center; margin-top: 20px;">
              <button id="confirmPayment" style="
                background: #3498db; color: white; border: none; padding: 12px 24px;
                border-radius: 5px; font-size: 16px; cursor: pointer; font-weight: bold;
              ">הוסף פרעון</button>
              <button id="cancelPayment" style="
                background: #95a5a6; color: white; border: none; padding: 12px 24px;
                border-radius: 5px; font-size: 16px; cursor: pointer;
              ">ביטול</button>
            </div>
          </div>
        </div>
      `

      document.body.appendChild(modalContent)

      // הוספת event listeners
      const amountInput = modalContent.querySelector('#paymentAmount') as HTMLInputElement
      const methodSelect = modalContent.querySelector('#paymentMethodSelect') as HTMLSelectElement
      const detailsContainer = modalContent.querySelector('#paymentDetailsContainer') as HTMLDivElement
      const confirmBtn = modalContent.querySelector('#confirmPayment') as HTMLButtonElement
      const cancelBtn = modalContent.querySelector('#cancelPayment') as HTMLButtonElement

      amountInput.focus()

      // טיפול בשינוי אמצעי תשלום
      if (methodSelect) {
        methodSelect.addEventListener('change', (e) => {
          const method = (e.target as HTMLSelectElement).value
          paymentMethod = method

          if (method && detailsContainer) {
            detailsContainer.style.display = 'block'
            detailsContainer.innerHTML = createPaymentDetailsHTML(method)
            addPaymentDetailsListeners(detailsContainer, method)
          } else if (detailsContainer) {
            detailsContainer.style.display = 'none'
          }
        })
      }

      // אישור פרעון
      confirmBtn.addEventListener('click', () => {
        const amount = Number(amountInput.value)
        if (!amountInput.value || isNaN(amount) || amount <= 0) {
          showNotification('⚠️ אנא הכנס סכום תקין', 'error')
          return
        }

        if (amount > balance) {
          showNotification('⚠️ הסכום גדול מהיתרה', 'error')
          return
        }

        // בדיקת תאריך העברה בנקאית - לא יכול להיות בעתיד
        if (paymentMethod === 'transfer' && paymentDetails) {
          try {
            const details = JSON.parse(paymentDetails)
            if (details.transferDate) {
              const transferDateObj = new Date(details.transferDate)
              const today = new Date()
              today.setHours(23, 59, 59, 999) // סוף היום

              if (transferDateObj > today) {
                showNotification('⚠️ תאריך ההעברה לא יכול להיות בעתיד', 'error')
                return
              }
            }
          } catch (error) {
            // אם יש שגיאה בפענוח, המשך בלי בדיקה
          }
        }

        if (db.canAddPayment(selectedLoanId!, amount)) {
          // בדוק אם ההלוואה הועברה לערבים
          const loan = loans.find(l => l.id === selectedLoanId)
          if (loan && loan.transferredToGuarantors) {
            // הלוואה שהועברה לערבים - צריך לטפל בחובות הערבים
            const result = db.handleBorrowerPaymentAfterTransfer(selectedLoanId!, amount)
            
            if (result.success) {
              showNotification(`✅ פרעון נרשם! ${result.message}`, 'success')
            } else {
              showNotification(`❌ ${result.message}`, 'error')
              document.body.removeChild(modalContent)
              return
            }
          } else {
            // הלוואה רגילה
            db.addPayment({
              loanId: selectedLoanId!,
              amount,
              date: getTodayString(),
              type: 'payment',
              paymentMethod: paymentMethod as 'cash' | 'transfer' | 'check' | 'credit' | 'other' | undefined,
              paymentDetails: paymentDetails || undefined,
              notes: '',
              paidBy: 'borrower'
            })
          }

          // עדכן את התשלומים
          const loanPayments = db.getPaymentsByLoanId(selectedLoanId!)
          setPayments(loanPayments)

          // בדוק אם ההלוואה נפרעה במלואה
          const newBalance = db.getLoanBalance(selectedLoanId!)
          if (newBalance === 0) {
            db.updateLoan(selectedLoanId!, { status: 'completed' })
          }

          // עדכן את כל הנתונים
          loadData()

          // עדכן את ההלוואה הנוכחית
          const updatedLoan = db.getLoans().find(l => l.id === selectedLoanId)
          if (updatedLoan) {
            setCurrentLoan(updatedLoan)
          }

          showNotification('✅ פרעון נוסף בהצלחה!')
          document.body.removeChild(modalContent)
        } else {
          showNotification('⚠️ סכום לא תקין או גדול מהיתרה', 'error')
        }
      })

      // ביטול
      cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modalContent)
      })

      // סגירה בלחיצה על הרקע
      modalContent.addEventListener('click', (e) => {
        if (e.target === modalContent) {
          document.body.removeChild(modalContent)
        }
      })
    }

    // פונקציה ליצירת HTML לפרטי תשלום
    const createPaymentDetailsHTML = (method: string): string => {
      switch (method) {
        case 'check':
          return `
            <h5 style="margin: 0 0 10px 0; color: #666; font-size: 14px;">📝 פרטי הצ'ק</h5>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div>
                <label style="display: block; margin-bottom: 3px; font-size: 12px;">מספר צ'ק:</label>
                <input type="text" id="checkNumber" placeholder="מספר הצ'ק" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
              </div>
              <div>
                <label style="display: block; margin-bottom: 3px; font-size: 12px;">בנק:</label>
                <select id="checkBankSelect" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                  <option value="">בחר בנק</option>
                  <option value="10">10 - בנק לאומי</option>
                  <option value="11">11 - בנק דיסקונט</option>
                  <option value="12">12 - בנק הפועלים</option>
                  <option value="13">13 - בנק איגוד</option>
                  <option value="14">14 - בנק אוצר החייל</option>
                  <option value="15">15 - בנק ירושלים</option>
                  <option value="16">16 - בנק מרכנתיל</option>
                  <option value="17">17 - בנק מזרחי טפחות</option>
                  <option value="18">18 - בנק הבינלאומי</option>
                  <option value="19">19 - בנק יהב</option>
                  <option value="20">20 - בנק מסד</option>
                  <option value="31">31 - בנק הדואר</option>
                  <option value="99">99 - בנק אחר</option>
                </select>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <label style="display: block; margin-bottom: 3px; font-size: 12px;">סניף:</label>
                <input type="text" id="branch" placeholder="מספר סניף" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
              </div>
              <div>
                <label style="display: block; margin-bottom: 3px; font-size: 12px;">תאריך פדיון:</label>
                <input type="date" id="dueDate" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
              </div>
            </div>
          `
        case 'transfer':
          return `
            <h5 style="margin: 0 0 10px 0; color: #666; font-size: 14px;">🏦 פרטי ההעברה</h5>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div>
                <label style="display: block; margin-bottom: 3px; font-size: 12px;">מספר אסמכתא:</label>
                <input type="text" id="referenceNumber" placeholder="מספר אסמכתא" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
              </div>
              <div>
                <label style="display: block; margin-bottom: 3px; font-size: 12px;">בנק:</label>
                <select id="bankSelect" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                  <option value="">בחר בנק</option>
                  <option value="10">10 - בנק לאומי</option>
                  <option value="11">11 - בנק דיסקונט</option>
                  <option value="12">12 - בנק הפועלים</option>
                  <option value="13">13 - בנק איגוד</option>
                  <option value="14">14 - בנק אוצר החייל</option>
                  <option value="15">15 - בנק ירושלים</option>
                  <option value="16">16 - בנק מרכנתיל</option>
                  <option value="17">17 - בנק מזרחי טפחות</option>
                  <option value="18">18 - בנק הבינלאומי</option>
                  <option value="19">19 - בנק יהב</option>
                  <option value="20">20 - בנק מסד</option>
                  <option value="31">31 - בנק הדואר</option>
                  <option value="99">99 - בנק אחר</option>
                </select>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div>
                <label style="display: block; margin-bottom: 3px; font-size: 12px;">מספר סניף:</label>
                <input type="text" id="branchNumber" placeholder="מספר סניף" maxlength="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
              </div>
              <div>
                <label style="display: block; margin-bottom: 3px; font-size: 12px;">מספר חשבון:</label>
                <input type="text" id="accountNumber" placeholder="מספר חשבון" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
              </div>
            </div>
            <div>
              <label style="display: block; margin-bottom: 3px; font-size: 12px;">תאריך העברה:</label>
              <input type="date" id="transferDate" max="${new Date().toISOString().split('T')[0]}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
            </div>
          `
        case 'credit':
          return `
            <h5 style="margin: 0 0 10px 0; color: #666; font-size: 14px;">💳 פרטי האשראי</h5>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <label style="display: block; margin-bottom: 3px; font-size: 12px;">4 ספרות אחרונות:</label>
                <input type="text" id="lastFourDigits" placeholder="1234" maxlength="4" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
              </div>
              <div>
                <label style="display: block; margin-bottom: 3px; font-size: 12px;">מספר עסקה:</label>
                <input type="text" id="transactionNumber" placeholder="מספר עסקה" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
              </div>
            </div>
          `
        case 'other':
          return `
            <h5 style="margin: 0 0 10px 0; color: #666; font-size: 14px;">❓ פרטים נוספים</h5>
            <div>
              <label style="display: block; margin-bottom: 3px; font-size: 12px;">הסבר:</label>
              <textarea id="description" placeholder="הסבר על אמצעי התשלום" rows="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"></textarea>
            </div>
          `
        default:
          return ''
      }
    }

    // פונקציה להוספת event listeners לפרטי תשלום
    const addPaymentDetailsListeners = (container: HTMLDivElement, method: string) => {
      const inputs = container.querySelectorAll('input, textarea')
      inputs.forEach(input => {
        input.addEventListener('input', () => {
          const details: any = {}

          switch (method) {
            case 'check':
              const checkBankSelect = container.querySelector('#checkBankSelect') as HTMLSelectElement
              const selectedCheckBankCode = checkBankSelect?.value || ''
              const selectedCheckBankName = checkBankSelect?.selectedOptions[0]?.text?.split(' - ')[1] || ''

              details.checkNumber = (container.querySelector('#checkNumber') as HTMLInputElement)?.value || ''
              details.bankCode = selectedCheckBankCode
              details.bankName = selectedCheckBankName
              details.branch = (container.querySelector('#branch') as HTMLInputElement)?.value || ''
              details.dueDate = (container.querySelector('#dueDate') as HTMLInputElement)?.value || ''
              break
            case 'transfer':
              const bankSelect = container.querySelector('#bankSelect') as HTMLSelectElement
              const selectedBankCode = bankSelect?.value || ''
              const selectedBankName = bankSelect?.selectedOptions[0]?.text?.split(' - ')[1] || ''

              details.referenceNumber = (container.querySelector('#referenceNumber') as HTMLInputElement)?.value || ''
              details.bankCode = selectedBankCode
              details.bankName = selectedBankName
              details.branchNumber = (container.querySelector('#branchNumber') as HTMLInputElement)?.value || ''
              details.accountNumber = (container.querySelector('#accountNumber') as HTMLInputElement)?.value || ''
              details.transferDate = (container.querySelector('#transferDate') as HTMLInputElement)?.value || ''
              break
            case 'credit':
              details.lastFourDigits = (container.querySelector('#lastFourDigits') as HTMLInputElement)?.value || ''
              details.transactionNumber = (container.querySelector('#transactionNumber') as HTMLInputElement)?.value || ''
              break
            case 'other':
              details.description = (container.querySelector('#description') as HTMLTextAreaElement)?.value || ''
              break
          }

          paymentDetails = JSON.stringify(details)
        })
      })
    }

    createPaymentModal()
  }

  const newBorrower = () => {
    setCurrentBorrower({
      firstName: '',
      lastName: '',
      city: '',
      phone: '',
      address: '',
      email: '',
      idNumber: '',
      notes: ''
    })
    setSelectedBorrowerId(null)
    setMode('borrower')
  }

  const newLoan = () => {
    if (!selectedBorrowerId) {
      showNotification('⚠️ אנא בחר לווה תחילה', 'error')
      return
    }

    // חשב תאריך פירעון ברירת מחדל
    const today = new Date()
    const defaultPeriod = db.getSettings().defaultLoanPeriod || 12
    const defaultReturnDate = new Date(today)
    defaultReturnDate.setMonth(defaultReturnDate.getMonth() + defaultPeriod)
    const returnDateString = defaultReturnDate.toISOString().split('T')[0]

    console.log('🔍 newLoan - תאריך פירעון:', returnDateString, 'תקופה:', defaultPeriod, 'חודשים')

    // איפוס טופס הלוואה חדשה
    const newLoanData = {
      borrowerId: selectedBorrowerId,
      amount: undefined,
      loanDate: new Date().toISOString().split('T')[0],
      returnDate: returnDateString,
      loanType: 'fixed' as 'fixed' | 'flexible',
      isRecurring: false,
      recurringDay: 1,
      autoPayment: false,
      autoPaymentAmount: 0,
      autoPaymentDay: 1,
      autoPaymentStartDate: '',
      autoPaymentFrequency: 1,
      notes: '',
      guarantor1: '',
      guarantor2: '',
      guarantor1Id: undefined,
      guarantor2Id: undefined
    }
    
    console.log('🔍 newLoan - נתוני הלוואה חדשה:', newLoanData)
    setCurrentLoan(newLoanData)
    setSelectedLoanId(null)
    setPayments([])
    setMode('loan')
  }

  const deletePayment = (paymentId: number) => {
    showConfirmModal({
      title: 'מחיקת תשלום',
      message: 'האם אתה בטוח שברצונך למחוק את התשלום?\nפעולה זו לא ניתנת לביטול.',
      confirmText: 'מחק תשלום',
      cancelText: 'ביטול',
      type: 'danger',
      onConfirm: () => {
        db.deletePayment(paymentId)
        if (selectedLoanId) {
          // עדכן את התשלומים
          const loanPayments = db.getPaymentsByLoanId(selectedLoanId)
          setPayments(loanPayments)

          // עדכן סטטוס ההלוואה
          const newBalance = db.getLoanBalance(selectedLoanId)
          if (newBalance > 0) {
            db.updateLoan(selectedLoanId, { status: 'active' })
          }

          // עדכן את כל הנתונים
          loadData()

          // עדכן את ההלוואה הנוכחית
          const updatedLoan = db.getLoans().find(l => l.id === selectedLoanId)
          if (updatedLoan) {
            setCurrentLoan(updatedLoan)
          }
        }
        showNotification('✅ התשלום נמחק בהצלחה')
      }
    })
  }

  const toggleAdvancedEdit = () => {
    if (!isAdvancedEditMode) {
      const hasPayments = payments.filter(p => p.type === 'payment').length > 0

      if (hasPayments) {
        showConfirmModal({
          title: 'עריכה מתקדמת',
          message: 'אזהרה: עריכה מתקדמת של הלוואה עם תשלומים קיימים!\n\nשינוי סכום ההלוואה עלול לגרום לחישובים שגויים של יתרות.\nהאם אתה בטוח שברצונך להמשיך?\n\n💡 עצה: במקום לשנות את הסכום, שקול להוסיף תשלום תיקון.',
          confirmText: 'המשך בעריכה מתקדמת',
          cancelText: 'ביטול',
          type: 'warning',
          onConfirm: () => {
            setIsAdvancedEditMode(true)
            showNotification('🔓 מצב עריכה מתקדמת הופעל<br>כעת ניתן לערוך את כל השדות', 'info')
          }
        })
      } else {
        setIsAdvancedEditMode(true)
        showNotification('🔓 מצב עריכה מתקדמת הופעל<br>כעת ניתן לערוך את כל השדות', 'info')
      }
    } else {
      setIsAdvancedEditMode(false)
      showNotification('🔒 מצב עריכה מתקדמת כובה', 'info')
    }
  }

  const generateLoanDocument = (withBlankGuarantors = false) => {
    if (!selectedLoanId) {
      showNotification('⚠️ לא ניתן להפיק שטר להלוואה חדשה שלא נשמרה עדיין. אנא שמור את ההלוואה תחילה.', 'error')
      return
    }

    if (!currentBorrower.firstName) {
      showNotification('⚠️ אנא בחר לווה תחילה', 'error')
      return
    }

    // השתמש ב-currentLoan כדי לקבל את הנתונים העדכניים ביותר כולל הערות
    const loan = currentLoan.id === selectedLoanId ? currentLoan : loans.find(l => l.id === selectedLoanId)
    if (!loan) return

    // בדוק אם ההלוואה נפרעה
    const balance = db.getLoanBalance(selectedLoanId)
    const borrowerName = `${currentBorrower.firstName} ${currentBorrower.lastName}`

    if (balance <= 0) {
      showConfirmModal({
        title: 'הדפסת שטר הלוואה',
        message: `🎉 ההלוואה של ${borrowerName} כבר נפרעה במלואה!\n\nהאם ברצונך להדפיס שטר הלוואה למטרות תיעוד בלבד?`,
        confirmText: 'הדפס שטר',
        cancelText: 'ביטול',
        type: 'info',
        onConfirm: () => {
          printLoanDocument(loan, borrowerName, balance, withBlankGuarantors)
        }
      })
      return
    }

    // אם ההלוואה פעילה, הדפס ישירות
    printLoanDocument(loan, borrowerName, balance, withBlankGuarantors)
  }

  const handlePrintToPDF = async (loanId: number, withBlankGuarantors = false) => {
    if (!loanId || !currentBorrower.firstName) {
      showNotification('⚠️ אנא בחר הלוואה תחילה', 'error')
      return
    }

    const loan = loans.find(l => l.id === loanId)
    if (!loan) return

    const borrowerName = `${currentBorrower.firstName} ${currentBorrower.lastName}`
    const balance = db.getLoanBalance(loanId)

    // יצירת תוכן השטר
    createPrintContent(loan, borrowerName, balance, withBlankGuarantors)

    // שימוש ב-Electron API לשמירה כ-PDF
    try {
      const result = await (window as any).electronAPI.printToPDF()
      if (result.success && !result.canceled) {
        showNotification(`📁 הקובץ נשמר בהצלחה!`, 'success')
      }
    } catch (error) {
      showNotification('❌ שגיאה בשמירת הקובץ', 'error')
    }
  }

  const createPrintContent = (loan: any, borrowerName: string, balance: number, withBlankGuarantors = false) => {
    const gemachName = db.getGemachName()
    const gemachLogo = db.getGemachLogo()
    const loanText = db.getLoanDocumentTemplate()
    const loanFooter = db.getLoanDocumentFooter()
    const loanAmount = loan.amount.toLocaleString()
    const returnDate = db.getSettings().showHebrewDates ?
      formatCombinedDate(loan.returnDate) :
      new Date(loan.returnDate).toLocaleDateString('he-IL')
    const loanDate = db.getSettings().showHebrewDates ?
      formatCombinedDate(loan.loanDate) :
      new Date(loan.loanDate).toLocaleDateString('he-IL')
    const borrowerIdNumber = currentBorrower.idNumber ? db.formatIdNumber(currentBorrower.idNumber) : ''
    
    // אם מבוקש שטר עם שדות ריקים לערבים
    const guarantor1Display = withBlankGuarantors ? '' : loan.guarantor1
    const guarantor2Display = withBlankGuarantors ? '' : loan.guarantor2

    const printContent = `
      <div id="print-content" style="display: none;">
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: center; padding: 20px; line-height: 1.4; font-size: 14px; margin: 0;">
          <div style="max-width: 500px; margin: 0 auto; text-align: right;">
            ${gemachLogo ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${gemachLogo}" alt="לוגו" style="max-width: 250px; max-height: 100px; object-fit: contain;" /></div>` : ''}
            <h1 style="font-size: 20px; margin-bottom: 20px; text-decoration: underline;">שטר הלוואה</h1>
            <p style="margin: 8px 0;">אני הח"מ <strong>${borrowerName}</strong></p>
            ${borrowerIdNumber ? `<p style="margin: 8px 0;">ת.ז. <strong>${borrowerIdNumber}</strong></p>` : ''}
            <p style="margin: 8px 0;">${loanText} "<strong>${gemachName}</strong>"</p>
            <p style="margin: 8px 0;">סכום של: <strong>${loanAmount} ש"ח</strong></p>
            <p style="margin: 8px 0;">בתאריך: <strong>${loanDate}</strong></p>
            <p style="margin: 8px 0;">אני מתחייב להחזיר את הסכום עד לתאריך: <strong>${returnDate}</strong></p>
            ${guarantor1Display ? `<p style="margin: 8px 0;">ערב ראשון: <strong>${guarantor1Display}</strong></p>` : withBlankGuarantors ? `<p style="margin: 8px 0;">ערב ראשון: ___________________________</p>` : ''}
            ${guarantor2Display ? `<p style="margin: 8px 0;">ערב שני: <strong>${guarantor2Display}</strong></p>` : withBlankGuarantors ? `<p style="margin: 8px 0;">ערב שני: ___________________________</p>` : ''}
            ${loan.notes ? `<p style="margin: 8px 0;">הערות: <strong>${loan.notes}</strong></p>` : ''}
            ${balance <= 0 ? `
              <div style="background: #27ae60; color: white; padding: 10px; border-radius: 5px; margin: 15px 0; text-align: center;">
                <strong>✅ ההלוואה נפרעה במלואה ✅</strong><br>
                <small>תאריך פרעון מלא: ${db.getSettings().showHebrewDates ? formatCombinedDate(new Date()) : new Date().toLocaleDateString('he-IL')}</small>
              </div>
            ` : ''}
            <p style="margin: 8px 0;">תאריך הפקת השטר: <strong>${db.getSettings().showHebrewDates ? formatCombinedDate(new Date()) : new Date().toLocaleDateString('he-IL')}</strong></p>
            ${loanFooter ? `<div style="margin: 20px 0; padding: 15px; background: #f0f8ff; border-right: 4px solid #3498db; border-radius: 5px;"><p style="margin: 0; white-space: pre-wrap;">${loanFooter}</p></div>` : ''}
            <div style="display: flex; justify-content: space-between; margin-top: 40px;">
              <div>
                <p>חתימת הלווה:</p>
                <div style="border-bottom: 1px solid #000; width: 150px; margin-top: 30px;"></div>
              </div>
              <div>
                <p>חתימת הערב:</p>
                <div style="border-bottom: 1px solid #000; width: 150px; margin-top: 30px;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    // הוספת התוכן לעמוד
    const existingPrintContent = document.getElementById('print-content')
    if (existingPrintContent) {
      existingPrintContent.remove()
    }

    document.body.insertAdjacentHTML('beforeend', printContent)

    // הוספת CSS להדפסה
    const printStyle = document.createElement('style')
    printStyle.id = 'print-style'
    printStyle.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        #print-content, #print-content * {
          visibility: visible;
        }
        #print-content {
          position: absolute;
          left: 0;
          top: 0;
          display: block !important;
          width: 100%;
        }
      }
    `

    const existingPrintStyle = document.getElementById('print-style')
    if (existingPrintStyle) {
      existingPrintStyle.remove()
    }

    document.head.appendChild(printStyle)
  }

  const printLoanDocument = (loan: any, borrowerName: string, balance: number, withBlankGuarantors = false) => {
    const gemachName = db.getGemachName()
    const gemachLogo = db.getGemachLogo()
    const loanText = db.getLoanDocumentTemplate()
    const loanFooter = db.getLoanDocumentFooter()
    const loanAmount = loan.amount.toLocaleString()
    const returnDate = db.getSettings().showHebrewDates ?
      formatCombinedDate(loan.returnDate) :
      new Date(loan.returnDate).toLocaleDateString('he-IL')
    const loanDate = db.getSettings().showHebrewDates ?
      formatCombinedDate(loan.loanDate) :
      new Date(loan.loanDate).toLocaleDateString('he-IL')
    const borrowerIdNumber = currentBorrower.idNumber ? db.formatIdNumber(currentBorrower.idNumber) : ''
    
    // אם מבוקש שטר עם שדות ריקים לערבים, נדרוס את שמות הערבים
    const guarantor1Display = withBlankGuarantors ? '' : loan.guarantor1
    const guarantor2Display = withBlankGuarantors ? '' : loan.guarantor2

    // בדיקה אם זה Electron עם API חדש
    const isElectron = (window as any).electronAPI?.isElectron?.()

    if (isElectron) {
      // פתרון מיוחד ל-Electron - יצירת תוכן HTML ישירות בחלון הנוכחי
      const printContent = `
        <div id="print-content" style="display: none;">
          <div style="font-family: Arial, sans-serif; direction: rtl; text-align: center; padding: 20px; line-height: 1.4; font-size: 14px; margin: 0;">
            <div style="max-width: 500px; margin: 0 auto; text-align: right;">
              <h1 style="font-size: 20px; margin-bottom: 20px; text-decoration: underline;">שטר הלוואה</h1>
              <p style="margin: 8px 0;">אני הח"מ <strong>${borrowerName}</strong></p>
              ${borrowerIdNumber ? `<p style="margin: 8px 0;">ת.ז. <strong>${borrowerIdNumber}</strong></p>` : ''}
              ${currentBorrower.phone ? `<p style="margin: 8px 0;">טלפון: <strong>${currentBorrower.phone}</strong></p>` : ''}
              ${currentBorrower.address ? `<p style="margin: 8px 0;">כתובת: <strong>${currentBorrower.address}</strong></p>` : ''}
              ${currentBorrower.email ? `<p style="margin: 8px 0;">מייל: <strong>${currentBorrower.email}</strong></p>` : ''}
              <p style="margin: 8px 0;">${loanText} "<strong>${gemachName}</strong>"</p>
              <p style="margin: 8px 0;">סכום של: <strong>${loanAmount} ש"ח</strong></p>
              <p style="margin: 8px 0;">בתאריך: <strong>${loanDate}</strong></p>
              ${loan.loanType === 'flexible' ?
          `<p style="margin: 8px 0;">אני מתחייב להחזיר את הסכום <strong>לפי התראה</strong></p>` :
          `<p style="margin: 8px 0;">אני מתחייב להחזיר את הסכום עד לתאריך: <strong>${returnDate}</strong></p>`
        }
              ${loan.isRecurring ? `
                <div style="background: rgba(52, 152, 219, 0.1); border: 2px solid rgba(52, 152, 219, 0.3); border-radius: 5px; padding: 10px; margin: 10px 0;">
                  <p style="margin: 4px 0; color: #2c3e50;"><strong>🔄 הלוואה מחזורית:</strong></p>
                  <p style="margin: 4px 0; color: #2c3e50;">הלוואה חוזרת כל חודש ביום <strong>${loan.recurringDay}</strong></p>
                  <p style="margin: 4px 0; color: #2c3e50;">סכום כל הלוואה: <strong>${loanAmount} ש"ח</strong></p>
                  <p style="margin: 4px 0; color: #2c3e50;">משך זמן: <strong>${loan.recurringMonths || 12} חודשים</strong></p>
                  <p style="margin: 4px 0; color: #2c3e50;">סה"כ צפוי: <strong>${(loan.amount * (loan.recurringMonths || 12)).toLocaleString()} ש"ח</strong></p>
                </div>
              ` : ''}
              ${loan.autoPayment ? `
                <div style="background: rgba(39, 174, 96, 0.1); border: 2px solid rgba(39, 174, 96, 0.3); border-radius: 5px; padding: 10px; margin: 10px 0;">
                  <p style="margin: 4px 0; color: #2c3e50;"><strong>💰 פרעון אוטומטי:</strong></p>
                  <p style="margin: 4px 0; color: #2c3e50;">סכום: <strong>${loan.autoPaymentAmount?.toLocaleString()} ש"ח</strong></p>
                  <p style="margin: 4px 0; color: #2c3e50;">יום בחודש: <strong>${loan.autoPaymentDay}</strong></p>
                  <p style="margin: 4px 0; color: #2c3e50;">תדירות: <strong>${loan.autoPaymentFrequency === 1 ? 'כל חודש' :
            loan.autoPaymentFrequency === 2 ? 'כל חודשיים' :
              loan.autoPaymentFrequency === 3 ? 'כל 3 חודשים' :
                loan.autoPaymentFrequency === 6 ? 'כל 6 חודשים' :
                  `כל ${loan.autoPaymentFrequency} חודשים`
          }</strong></p>
                  ${loan.autoPaymentStartDate ? `<p style="margin: 4px 0; color: #2c3e50;">תחילת פרעון: <strong>${db.getSettings().showHebrewDates ? formatCombinedDate(loan.autoPaymentStartDate) : new Date(loan.autoPaymentStartDate).toLocaleDateString('he-IL')}</strong></p>` : ''}
                  ${(() => {
            const nextPaymentDate = db.getNextAutoPaymentDate(loan.id)
            return nextPaymentDate ? `<p style="margin: 4px 0; color: #27ae60; font-weight: bold;">📅 פרעון הבא: <strong>${db.getSettings().showHebrewDates ? formatCombinedDate(nextPaymentDate) : new Date(nextPaymentDate).toLocaleDateString('he-IL')}</strong></p>` : ''
          })()}
                </div>
              ` : ''}
              ${guarantor1Display ? `<p style="margin: 8px 0;">ערב ראשון: <strong>${guarantor1Display}</strong></p>` : withBlankGuarantors ? `<p style="margin: 8px 0;">ערב ראשון: ___________________________</p>` : ''}
              ${guarantor2Display ? `<p style="margin: 8px 0;">ערב שני: <strong>${guarantor2Display}</strong></p>` : withBlankGuarantors ? `<p style="margin: 8px 0;">ערב שני: ___________________________</p>` : ''}
              ${loan.notes ? `<p style="margin: 8px 0;">הערות: <strong>${loan.notes}</strong></p>` : ''}
              ${balance <= 0 ? `
                <div style="background: #27ae60; color: white; padding: 10px; border-radius: 5px; margin: 15px 0; text-align: center;">
                  <strong>✅ ההלוואה נפרעה במלואה ✅</strong><br>
                  <small>תאריך פרעון מלא: ${db.getSettings().showHebrewDates ? formatCombinedDate(new Date()) : new Date().toLocaleDateString('he-IL')}</small>
                </div>
              ` : balance < loan.amount ? `
                <div style="background: #f39c12; color: white; padding: 10px; border-radius: 5px; margin: 15px 0; text-align: center;">
                  <strong>🔄 ההלוואה נפרעה חלקית 🔄</strong><br>
                  <small>נפרע עד כה: <strong>${db.formatCurrency(loan.amount - balance)}</strong> מתוך <strong>${db.formatCurrency(loan.amount)}</strong></small><br>
                  <small>יתרת חוב: <strong>${db.formatCurrency(balance)}</strong></small>
                </div>
              ` : ''}
              <p style="margin: 8px 0;">תאריך הפקת השטר: <strong>${db.getSettings().showHebrewDates ? formatCombinedDate(new Date()) : new Date().toLocaleDateString('he-IL')}</strong></p>
              ${loanFooter ? `<div style="margin: 20px 0; padding: 15px; background: #f0f8ff; border-right: 4px solid #3498db; border-radius: 5px;"><p style="margin: 0; white-space: pre-wrap;">${loanFooter}</p></div>` : ''}
              <div style="display: flex; justify-content: space-between; margin-top: 40px; flex-wrap: wrap; gap: 20px;">
                <div>
                  <p>חתימת הלווה:</p>
                  <div style="border-bottom: 1px solid #000; width: 150px; margin-top: 30px;"></div>
                </div>
                ${(guarantor1Display || withBlankGuarantors) ? `
                  <div>
                    <p>חתימת ערב ראשון:</p>
                    <div style="border-bottom: 1px solid #000; width: 150px; margin-top: 30px;"></div>
                  </div>
                ` : ''}
                ${(guarantor2Display || withBlankGuarantors) ? `
                  <div>
                    <p>חתימת ערב שני:</p>
                    <div style="border-bottom: 1px solid #000; width: 150px; margin-top: 30px;"></div>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `

      // הוספת התוכן לעמוד
      const existingPrintContent = document.getElementById('print-content')
      if (existingPrintContent) {
        existingPrintContent.remove()
      }

      document.body.insertAdjacentHTML('beforeend', printContent)

      // הוספת CSS להדפסה
      const printStyle = document.createElement('style')
      printStyle.id = 'print-style'
      printStyle.textContent = `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-content, #print-content * {
            visibility: visible;
          }
          #print-content {
            position: absolute;
            left: 0;
            top: 0;
            display: block !important;
            width: 100%;
          }
        }
      `

      const existingPrintStyle = document.getElementById('print-style')
      if (existingPrintStyle) {
        existingPrintStyle.remove()
      }

      document.head.appendChild(printStyle)

      // הדפסה
      setTimeout(() => {
        window.print()

        // ניקוי לאחר ההדפסה
        setTimeout(() => {
          const printContentEl = document.getElementById('print-content')
          const printStyleEl = document.getElementById('print-style')
          if (printContentEl) printContentEl.remove()
          if (printStyleEl) printStyleEl.remove()
        }, 1000)
      }, 100)

    } else {
      // פתרון רגיל לדפדפנים - יצירת חלון הדפסה
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      if (printWindow) {
        printWindow.document.write(`
          <html dir="rtl">
            <head>
              <title>שטר הלוואה - ${borrowerName}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  direction: rtl;
                  text-align: center;
                  padding: 20px;
                  line-height: 1.4;
                  font-size: 14px;
                  margin: 0;
                }
                h1 {
                  font-size: 20px;
                  margin-bottom: 20px;
                  text-decoration: underline;
                }
                .content {
                  max-width: 500px;
                  margin: 0 auto;
                  text-align: right;
                }
                p {
                  margin: 8px 0;
                }
                .signature-section {
                  display: flex;
                  justify-content: space-between;
                  margin-top: 40px;
                  flex-wrap: wrap;
                  gap: 20px;
                }
                .signature-line {
                  border-bottom: 1px solid #000;
                  width: 150px;
                  margin-top: 30px;
                }
                .print-buttons {
                  text-align: center;
                  margin: 20px 0;
                  padding: 20px;
                  background: #f5f5f5;
                  border-radius: 5px;
                }
                .print-btn {
                  background: #007bff;
                  color: white;
                  border: none;
                  padding: 10px 20px;
                  margin: 0 10px;
                  border-radius: 5px;
                  cursor: pointer;
                  font-size: 14px;
                }
                .print-btn:hover {
                  background: #0056b3;
                }
                .close-btn {
                  background: #6c757d;
                }
                .close-btn:hover {
                  background: #545b62;
                }
                @media print {
                  .print-buttons { display: none; }
                  body { 
                    padding: 15px;
                    font-size: 12px;
                  }
                  h1 { font-size: 18px; margin-bottom: 15px; }
                  p { margin: 5px 0; }
                  .signature-section { margin-top: 30px; }
                }
              </style>
            </head>
            <body>
              <div class="print-buttons">
                <button class="print-btn" onclick="window.print()">🖨️ הדפס</button>
                <button class="print-btn close-btn" onclick="window.close()">❌ סגור</button>
              </div>
              <div class="content">
                ${gemachLogo ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${gemachLogo}" alt="לוגו" style="max-width: 250px; max-height: 100px; object-fit: contain;" /></div>` : ''}
                <h1>שטר הלוואה</h1>
                <p>אני הח"מ <strong>${borrowerName}</strong></p>
                ${borrowerIdNumber ? `<p>ת.ז. <strong>${borrowerIdNumber}</strong></p>` : ''}
                ${currentBorrower.phone ? `<p>טלפון: <strong>${currentBorrower.phone}</strong></p>` : ''}
                ${currentBorrower.address ? `<p>כתובת: <strong>${currentBorrower.address}</strong></p>` : ''}
                ${currentBorrower.email ? `<p>מייל: <strong>${currentBorrower.email}</strong></p>` : ''}
                <p>${loanText} "<strong>${gemachName}</strong>"</p>
                <p>סכום של: <strong>${loanAmount} ש"ח</strong></p>
                <p>בתאריך: <strong>${loanDate}</strong></p>
                ${loan.loanType === 'flexible' ?
            `<p>אני מתחייב להחזיר את הסכום <strong>לפי התראה</strong></p>` :
            `<p>אני מתחייב להחזיר את הסכום עד לתאריך: <strong>${returnDate}</strong></p>`
          }
                ${loan.isRecurring ? `
                  <div style="background: rgba(52, 152, 219, 0.1); border: 2px solid rgba(52, 152, 219, 0.3); border-radius: 5px; padding: 10px; margin: 10px 0;">
                    <p style="margin: 4px 0; color: #2c3e50;"><strong>🔄 הלוואה מחזורית:</strong></p>
                    <p style="margin: 4px 0; color: #2c3e50;">הלוואה חוזרת כל חודש ביום <strong>${loan.recurringDay}</strong></p>
                    <p style="margin: 4px 0; color: #2c3e50;">סכום כל הלוואה: <strong>${loanAmount} ש"ח</strong></p>
                    <p style="margin: 4px 0; color: #2c3e50;">משך זמן: <strong>${loan.recurringMonths || 12} חודשים</strong></p>
                    <p style="margin: 4px 0; color: #2c3e50;">סה"כ צפוי: <strong>${(loan.amount * (loan.recurringMonths || 12)).toLocaleString()} ש"ח</strong></p>
                  </div>
                ` : ''}
                ${loan.autoPayment ? `
                  <div style="background: rgba(39, 174, 96, 0.1); border: 2px solid rgba(39, 174, 96, 0.3); border-radius: 5px; padding: 10px; margin: 10px 0;">
                    <p style="margin: 4px 0; color: #2c3e50;"><strong>💰 פרעון אוטומטי:</strong></p>
                    <p style="margin: 4px 0; color: #2c3e50;">סכום: <strong>${loan.autoPaymentAmount?.toLocaleString()} ש"ח</strong></p>
                    <p style="margin: 4px 0; color: #2c3e50;">יום בחודש: <strong>${loan.autoPaymentDay}</strong></p>
                    <p style="margin: 4px 0; color: #2c3e50;">תדירות: <strong>${(loan.autoPaymentFrequency || 1) === 1 ? 'כל חודש' :
              loan.autoPaymentFrequency === 2 ? 'כל חודשיים' :
                loan.autoPaymentFrequency === 3 ? 'כל 3 חודשים' :
                  loan.autoPaymentFrequency === 6 ? 'כל 6 חודשים' :
                    `כל ${loan.autoPaymentFrequency} חודשים`
            }</strong></p>
                    ${loan.autoPaymentStartDate ? `<p style="margin: 4px 0; color: #2c3e50;">תחילת פרעון: <strong>${db.getSettings().showHebrewDates ? formatCombinedDate(loan.autoPaymentStartDate) : new Date(loan.autoPaymentStartDate).toLocaleDateString('he-IL')}</strong></p>` : ''}
                    ${(() => {
              const nextPaymentDate = db.getNextAutoPaymentDate(loan.id)
              return nextPaymentDate ? `<p style="margin: 4px 0; color: #27ae60; font-weight: bold;">📅 פרעון הבא: <strong>${db.getSettings().showHebrewDates ? formatCombinedDate(nextPaymentDate) : new Date(nextPaymentDate).toLocaleDateString('he-IL')}</strong></p>` : ''
            })()}
                  </div>
                ` : ''}
                ${guarantor1Display ? `<p>ערב ראשון: <strong>${guarantor1Display}</strong></p>` : withBlankGuarantors ? `<p>ערב ראשון: ___________________________</p>` : ''}
                ${guarantor2Display ? `<p>ערב שני: <strong>${guarantor2Display}</strong></p>` : withBlankGuarantors ? `<p>ערב שני: ___________________________</p>` : ''}
                ${loan.notes ? `<p>הערות: <strong>${loan.notes}</strong></p>` : ''}
                ${balance <= 0 ? `
                  <div style="background: #27ae60; color: white; padding: 10px; border-radius: 5px; margin: 15px 0; text-align: center;">
                    <strong>✅ ההלוואה נפרעה במלואה ✅</strong><br>
                    <small>תאריך פרעון מלא: ${db.getSettings().showHebrewDates ? formatCombinedDate(new Date()) : new Date().toLocaleDateString('he-IL')}</small>
                  </div>
                ` : balance < loan.amount ? `
                  <div style="background: #f39c12; color: white; padding: 10px; border-radius: 5px; margin: 15px 0; text-align: center;">
                    <strong>🔄 ההלוואה נפרעה חלקית 🔄</strong><br>
                    <small>נפרע עד כה: <strong>${db.formatCurrency(loan.amount - balance)}</strong> מתוך <strong>${db.formatCurrency(loan.amount)}</strong></small><br>
                    <small>יתרת חוב: <strong>${db.formatCurrency(balance)}</strong></small>
                  </div>
                ` : ''}
                <p>תאריך הפקת השטר: <strong>${db.getSettings().showHebrewDates ? formatCombinedDate(new Date()) : new Date().toLocaleDateString('he-IL')}</strong></p>
                ${loanFooter ? `<div style="margin: 20px 0; padding: 15px; background: #f0f8ff; border-right: 4px solid #3498db; border-radius: 5px;"><p style="margin: 0; white-space: pre-wrap;">${loanFooter}</p></div>` : ''}
                <div class="signature-section">
                  <div>
                    <p>חתימת הלווה:</p>
                    <div class="signature-line"></div>
                  </div>
                  ${(guarantor1Display || withBlankGuarantors) ? `
                    <div>
                      <p>חתימת ערב ראשון:</p>
                      <div class="signature-line"></div>
                    </div>
                  ` : ''}
                  ${(guarantor2Display || withBlankGuarantors) ? `
                    <div>
                      <p>חתימת ערב שני:</p>
                      <div class="signature-line"></div>
                    </div>
                  ` : ''}
                </div>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.focus()
      }
    }
  }

  // פונקציה ליצירת שובר פרעון
  const generatePaymentReceipt = (payment: DatabasePayment) => {
    if (!selectedLoanId) {
      showNotification('⚠️ לא ניתן להפיק שובר ללא הלוואה נבחרת', 'error')
      return
    }

    const loan = loans.find(l => l.id === selectedLoanId)
    if (!loan) {
      showNotification('⚠️ הלוואה לא נמצאה', 'error')
      return
    }

    if (!currentBorrower.firstName) {
      showNotification('⚠️ פרטי לווה לא נמצאו', 'error')
      return
    }

    const borrowerName = `${currentBorrower.firstName} ${currentBorrower.lastName}`
    printPaymentReceipt(payment, loan, borrowerName)
  }

  const printPaymentReceipt = (payment: DatabasePayment, loan: any, borrowerName: string) => {
    const gemachName = db.getGemachName()
    const gemachLogo = db.getGemachLogo()
    const paymentText = db.getPaymentReceiptTemplate()
    const paymentFooter = db.getPaymentReceiptFooter()
    const settings = db.getSettings()

    // חישוב יתרת חוב לאחר הפרעון הספציפי הזה
    const balanceAfterThisPayment = db.getLoanBalanceAfterPayment(loan.id, payment)

    // פרעונות קודמים
    const previousPayments = db.getPreviousPayments(loan.id, payment)
    const totalPreviousPayments = previousPayments.reduce((sum, p) => sum + p.amount, 0)

    // פרטי התשלום
    const paymentAmount = payment.amount.toLocaleString()
    const paymentDate = settings.showHebrewDates ?
      formatCombinedDate(payment.date) :
      new Date(payment.date).toLocaleDateString('he-IL')

    // פרטי ההלוואה
    const loanAmount = loan.amount.toLocaleString()
    const loanDate = settings.showHebrewDates ?
      formatCombinedDate(loan.loanDate) :
      new Date(loan.loanDate).toLocaleDateString('he-IL')

    // פרטי הלווה
    const borrowerIdNumber = currentBorrower.idNumber ? db.formatIdNumber(currentBorrower.idNumber) : ''

    // פרטי אמצעי תשלום
    const paymentMethodName = db.getPaymentMethodName(payment.paymentMethod)
    const paymentMethodIcon = db.getPaymentMethodIcon(payment.paymentMethod)
    const paymentDetails = db.getPaymentDetailsDisplay(payment.paymentMethod, payment.paymentDetails)

    // תאריך הפקת השובר
    const receiptDate = settings.showHebrewDates ?
      formatCombinedDate(new Date()) :
      new Date().toLocaleDateString('he-IL')

    if ((window as any).electronAPI) {
      // במצב Electron - הדפסה ישירה
      const printContent = `
        <div id="print-content" style="display: none;">
          <div style="font-family: Arial, sans-serif; direction: rtl; text-align: center; padding: 20px; line-height: 1.4; font-size: 14px; margin: 0;">
            <div style="max-width: 500px; margin: 0 auto; text-align: right;">
              ${gemachLogo ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${gemachLogo}" alt="לוגו" style="max-width: 250px; max-height: 100px; object-fit: contain;" /></div>` : ''}
              <h1 style="font-size: 20px; margin-bottom: 20px; text-decoration: underline;">שובר פרעון</h1>
              
              <div style="border: 2px solid #2c3e50; padding: 15px; margin: 15px 0; background: #f8f9fa;">
                <h3 style="margin: 0 0 10px 0; color: #27ae60;">מספר פרעון: #${payment.id}</h3>
                <p style="margin: 5px 0; font-weight: bold;">תאריך פרעון: ${paymentDate}</p>
              </div>

              <div style="text-align: right; margin: 15px 0;">
                <h3 style="margin-bottom: 10px; color: #2c3e50;">${payment.paidBy === 'guarantor' ? 'פרטי הערב המשלם:' : 'פרטי הלווה:'}</h3>
                <p style="margin: 5px 0;">שם: <strong>${payment.paidBy === 'guarantor' ? payment.guarantorName || 'ערב' : borrowerName}</strong></p>
                ${borrowerIdNumber && payment.paidBy !== 'guarantor' ? `<p style="margin: 5px 0;">ת.ז: <strong>${borrowerIdNumber}</strong></p>` : ''}
                ${payment.paidBy === 'guarantor' ? `<p style="margin: 5px 0; color: #fb923c; font-weight: bold;">🤝 תשלום על ידי ערב</p>` : ''}
              </div>
              
              ${payment.paidBy === 'guarantor' ? `
              <div style="text-align: right; margin: 15px 0;">
                <h3 style="margin-bottom: 10px; color: #2c3e50;">פרטי הלווה המקורי:</h3>
                <p style="margin: 5px 0;">שם: <strong>${borrowerName}</strong></p>
                ${borrowerIdNumber ? `<p style="margin: 5px 0;">ת.ז: <strong>${borrowerIdNumber}</strong></p>` : ''}
              </div>
              ` : ''}

              <div style="text-align: right; margin: 15px 0;">
                <h3 style="margin-bottom: 10px; color: #2c3e50;">פרטי ההלוואה:</h3>
                <p style="margin: 5px 0;">סכום הלוואה מקורי: <strong>₪${loanAmount}</strong></p>
                <p style="margin: 5px 0;">תאריך מתן הלוואה: <strong>${loanDate}</strong></p>
              </div>

              ${previousPayments.length > 0 ? `
                <div style="border: 2px solid #3498db; padding: 15px; margin: 15px 0; background: #e8f4fd;">
                  <h3 style="margin: 0 0 10px 0; color: #3498db;">פרעונות קודמים:</h3>
                  ${previousPayments.map((prevPayment, index) => {
        const prevPaymentDate = settings.showHebrewDates ?
          formatCombinedDate(prevPayment.date) :
          new Date(prevPayment.date).toLocaleDateString('he-IL')
        return `
                      <p style="margin: 5px 0; font-size: 14px;">
                        פרעון ${index + 1}: <strong>₪${prevPayment.amount.toLocaleString()}</strong> 
                        ${db.getPaymentMethodIcon(prevPayment.paymentMethod)} ${db.getPaymentMethodName(prevPayment.paymentMethod)}
                        (${prevPaymentDate})
                      </p>
                    `
      }).join('')}
                  <p style="margin: 10px 0 5px 0; font-weight: bold; border-top: 1px solid #3498db; padding-top: 10px;">
                    סה"כ פרעונות קודמים: <strong>₪${totalPreviousPayments.toLocaleString()}</strong>
                  </p>
                </div>
              ` : ''}

              <div style="border: 2px solid #27ae60; padding: 15px; margin: 15px 0; background: #d5f4e6;">
                <h3 style="margin: 0 0 10px 0; color: #27ae60;">פרטי הפרעון:</h3>
                <p style="margin: 5px 0; font-size: 16px; font-weight: bold;">סכום פרעון: <strong>₪${paymentAmount}</strong></p>
                <p style="margin: 5px 0;">אמצעי תשלום: <strong>${paymentMethodIcon} ${paymentMethodName}</strong></p>
                ${paymentDetails ? `
                  <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 5px;">
                    <strong>פרטי התשלום:</strong><br>
                    ${paymentDetails.split('\n').map(line => `<div style="margin: 2px 0;">${line}</div>`).join('')}
                  </div>
                ` : ''}
                ${payment.notes ? `<p style="margin: 5px 0;">הערות: <strong>${payment.notes}</strong></p>` : ''}
              </div>

              <div style="text-align: right; margin: 15px 0;">
                <p style="margin: 5px 0; font-size: 16px; font-weight: bold; color: ${balanceAfterThisPayment > 0 ? '#e74c3c' : '#27ae60'};">
                  יתרת חוב לאחר פרעון: <strong>₪${balanceAfterThisPayment.toLocaleString()}</strong>
                </p>
                ${balanceAfterThisPayment === 0 ? `
                  <div style="background: #27ae60; color: white; padding: 10px; border-radius: 5px; margin: 10px 0; text-align: center;">
                    <strong>🎉 ההלוואה נפרעה במלואה! 🎉</strong>
                  </div>
                ` : ''}
              </div>

              <div style="text-align: center; margin: 20px 0; padding: 15px; border-top: 1px solid #bdc3c7;">
                <p style="margin: 10px 0; font-size: 16px; color: #27ae60; font-weight: bold;">${paymentText}</p>
                ${paymentFooter ? `<div style="margin: 15px 0; padding: 10px; background: #f0f8ff; border-radius: 5px;"><p style="margin: 0; white-space: pre-wrap; font-size: 14px;">${paymentFooter}</p></div>` : ''}
                <p style="margin: 5px 0; font-weight: bold;">גמ"ח "${gemachName}"</p>
                <p style="margin: 5px 0; font-size: 12px;">תאריך הפקת השובר: ${receiptDate}</p>
              </div>

              <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #7f8c8d;">
                <p>שובר זה מהווה אישור על קבלת התשלום</p>
              </div>
            </div>
          </div>
        </div>
      `

      // הוסף את התוכן לדף
      const existingContent = document.getElementById('print-content')
      if (existingContent) {
        existingContent.remove()
      }
      document.body.insertAdjacentHTML('beforeend', printContent)

      // המתן רגע ואז הדפס
      setTimeout(() => {
        window.print()
      }, 100)

    } else {
      // פתרון רגיל לדפדפנים - יצירת חלון הדפסה עם כפתורים
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      if (printWindow) {
        printWindow.document.write(`
          <html dir="rtl">
            <head>
              <title>שובר פרעון - ${borrowerName}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  direction: rtl;
                  text-align: center;
                  padding: 20px;
                  line-height: 1.4;
                  font-size: 14px;
                  margin: 0;
                }
                h1 {
                  font-size: 20px;
                  margin-bottom: 20px;
                  text-decoration: underline;
                }
                .content {
                  max-width: 500px;
                  margin: 0 auto;
                  text-align: right;
                }
                p {
                  margin: 8px 0;
                }
                .receipt-header {
                  border: 2px solid #2c3e50;
                  padding: 15px;
                  margin: 15px 0;
                  background: #f8f9fa;
                }
                .payment-details {
                  border: 2px solid #27ae60;
                  padding: 15px;
                  margin: 15px 0;
                  background: #d5f4e6;
                }
                .payment-method-details {
                  margin: 10px 0;
                  padding: 10px;
                  background: white;
                  border-radius: 5px;
                }
                .completed-loan {
                  background: #27ae60;
                  color: white;
                  padding: 10px;
                  border-radius: 5px;
                  margin: 10px 0;
                  text-align: center;
                }
                .footer {
                  text-align: center;
                  margin: 20px 0;
                  padding: 15px;
                  border-top: 1px solid #bdc3c7;
                }
                .disclaimer {
                  margin-top: 30px;
                  text-align: center;
                  font-size: 12px;
                  color: #7f8c8d;
                }
                .print-buttons {
                  text-align: center;
                  margin: 20px 0;
                  padding: 20px;
                  background: #f5f5f5;
                  border-radius: 5px;
                }
                .print-btn {
                  background: #007bff;
                  color: white;
                  border: none;
                  padding: 10px 20px;
                  margin: 0 10px;
                  border-radius: 5px;
                  cursor: pointer;
                  font-size: 14px;
                }
                .print-btn:hover {
                  background: #0056b3;
                }
                .close-btn {
                  background: #6c757d;
                }
                .close-btn:hover {
                  background: #545b62;
                }
                @media print {
                  .print-buttons { display: none; }
                  body { 
                    padding: 15px;
                    font-size: 12px;
                  }
                  h1 { font-size: 18px; margin-bottom: 15px; }
                  p { margin: 5px 0; }
                  .receipt-header, .payment-details { margin: 10px 0; }
                }
              </style>
            </head>
            <body>
              <div class="print-buttons">
                <button class="print-btn" onclick="window.print()">🖨️ הדפס</button>
                <button class="print-btn close-btn" onclick="window.close()">❌ סגור</button>
              </div>
              <div class="content">
                ${gemachLogo ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${gemachLogo}" alt="לוגו" style="max-width: 250px; max-height: 100px; object-fit: contain;" /></div>` : ''}
                <h1>שובר פרעון</h1>
                
                <div class="receipt-header">
                  <h3 style="margin: 0 0 10px 0; color: #27ae60;">מספר פרעון: #${payment.id}</h3>
                  <p style="margin: 5px 0; font-weight: bold;">תאריך פרעון: ${paymentDate}</p>
                </div>

                <div style="text-align: right; margin: 15px 0;">
                  <h3 style="margin-bottom: 10px; color: #2c3e50;">${payment.paidBy === 'guarantor' ? 'פרטי הערב המשלם:' : 'פרטי הלווה:'}</h3>
                  <p style="margin: 5px 0;">שם: <strong>${payment.paidBy === 'guarantor' ? payment.guarantorName || 'ערב' : borrowerName}</strong></p>
                  ${borrowerIdNumber && payment.paidBy !== 'guarantor' ? `<p style="margin: 5px 0;">ת.ז: <strong>${borrowerIdNumber}</strong></p>` : ''}
                  ${payment.paidBy === 'guarantor' ? `<p style="margin: 5px 0; color: #fb923c; font-weight: bold;">🤝 תשלום על ידי ערב</p>` : ''}
                </div>
                
                ${payment.paidBy === 'guarantor' ? `
                <div style="text-align: right; margin: 15px 0;">
                  <h3 style="margin-bottom: 10px; color: #2c3e50;">פרטי הלווה המקורי:</h3>
                  <p style="margin: 5px 0;">שם: <strong>${borrowerName}</strong></p>
                  ${borrowerIdNumber ? `<p style="margin: 5px 0;">ת.ז: <strong>${borrowerIdNumber}</strong></p>` : ''}
                </div>
                ` : ''}

                <div style="text-align: right; margin: 15px 0;">
                  <h3 style="margin-bottom: 10px; color: #2c3e50;">פרטי ההלוואה:</h3>
                  <p style="margin: 5px 0;">סכום הלוואה מקורי: <strong>₪${loanAmount}</strong></p>
                  <p style="margin: 5px 0;">תאריך מתן הלוואה: <strong>${loanDate}</strong></p>
                </div>

                ${previousPayments.length > 0 ? `
                  <div style="border: 2px solid #3498db; padding: 15px; margin: 15px 0; background: #e8f4fd;">
                    <h3 style="margin: 0 0 10px 0; color: #3498db;">פרעונות קודמים:</h3>
                    ${previousPayments.map((prevPayment, index) => {
          const prevPaymentDate = settings.showHebrewDates ?
            formatCombinedDate(prevPayment.date) :
            new Date(prevPayment.date).toLocaleDateString('he-IL')
          return `
                        <p style="margin: 5px 0; font-size: 14px;">
                          פרעון ${index + 1}: <strong>₪${prevPayment.amount.toLocaleString()}</strong> 
                          ${db.getPaymentMethodIcon(prevPayment.paymentMethod)} ${db.getPaymentMethodName(prevPayment.paymentMethod)}
                          (${prevPaymentDate})
                        </p>
                      `
        }).join('')}
                    <p style="margin: 10px 0 5px 0; font-weight: bold; border-top: 1px solid #3498db; padding-top: 10px;">
                      סה"כ פרעונות קודמים: <strong>₪${totalPreviousPayments.toLocaleString()}</strong>
                    </p>
                  </div>
                ` : ''}

                <div class="payment-details">
                  <h3 style="margin: 0 0 10px 0; color: #27ae60;">פרטי הפרעון:</h3>
                  <p style="margin: 5px 0; font-size: 16px; font-weight: bold;">סכום פרעון: <strong>₪${paymentAmount}</strong></p>
                  <p style="margin: 5px 0;">אמצעי תשלום: <strong>${paymentMethodIcon} ${paymentMethodName}</strong></p>
                  ${paymentDetails ? `
                    <div class="payment-method-details">
                      <strong>פרטי התשלום:</strong><br>
                      ${paymentDetails.split('\n').map(line => `<div style="margin: 2px 0;">${line}</div>`).join('')}
                    </div>
                  ` : ''}
                  ${payment.notes ? `<p style="margin: 5px 0;">הערות: <strong>${payment.notes}</strong></p>` : ''}
                </div>

                <div style="text-align: right; margin: 15px 0;">
                  <p style="margin: 5px 0; font-size: 16px; font-weight: bold; color: ${balanceAfterThisPayment > 0 ? '#e74c3c' : '#27ae60'};">
                    יתרת חוב לאחר פרעון: <strong>₪${balanceAfterThisPayment.toLocaleString()}</strong>
                  </p>
                  ${balanceAfterThisPayment === 0 ? `
                    <div class="completed-loan">
                      <strong>🎉 ההלוואה נפרעה במלואה! 🎉</strong>
                    </div>
                  ` : ''}
                </div>

                <div class="footer">
                  <p style="margin: 10px 0; font-size: 16px; color: #27ae60; font-weight: bold;">${paymentText}</p>
                  ${paymentFooter ? `<div style="margin: 15px 0; padding: 10px; background: #f0f8ff; border-radius: 5px;"><p style="margin: 0; white-space: pre-wrap; font-size: 14px;">${paymentFooter}</p></div>` : ''}
                  <p style="margin: 5px 0; font-weight: bold;">גמ"ח "${gemachName}"</p>
                  <p style="margin: 5px 0; font-size: 12px;">תאריך הפקת השובר: ${receiptDate}</p>
                </div>

                <div class="disclaimer">
                  <p>שובר זה מהווה אישור על קבלת התשלום</p>
                </div>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.focus()
      }
    }
  }

  // פונקציה לשמירת שובר פרעון כ-PDF
  const handlePrintReceiptToPDF = async (payment: DatabasePayment) => {
    if (!selectedLoanId || !currentBorrower.firstName) {
      showNotification('⚠️ אנא בחר הלוואה ולווה תחילה', 'error')
      return
    }

    const loan = loans.find(l => l.id === selectedLoanId)
    if (!loan) return

    const borrowerName = `${currentBorrower.firstName} ${currentBorrower.lastName}`

    // יצירת תוכן השובר
    printPaymentReceipt(payment, loan, borrowerName)

    // שימוש ב-Electron API לשמירה כ-PDF
    try {
      const result = await (window as any).electronAPI.printToPDF()
      if (result.success && !result.canceled) {
        showNotification(`📁 שובר הפרעון נשמר בהצלחה!`, 'success')
      }
    } catch (error) {
      showNotification('❌ שגיאה בשמירת השובר', 'error')
    }
  }

  // פונקציה לביצוע פרעון מרובה
  const performMultiplePayment = (borrowerLoans: any[], amount: number, paymentMethod?: string, paymentDetails?: string) => {
    let remainingAmount = amount

    // פרע לפי סדר הלוואות (הישנות קודם)
    borrowerLoans.sort((a, b) => a.id - b.id)

    for (const loan of borrowerLoans) {
      if (remainingAmount <= 0) break

      const paymentForThisLoan = Math.min(remainingAmount, loan.balance)

      db.addPayment({
        loanId: loan.id,
        amount: paymentForThisLoan,
        date: getTodayString(),
        type: 'payment',
        paymentMethod: paymentMethod as 'cash' | 'transfer' | 'check' | 'credit' | 'other' | undefined,
        paymentDetails: paymentDetails || undefined,
        notes: `פרעון מרובה - חלק מ-₪${amount.toLocaleString()}`
      })

      remainingAmount -= paymentForThisLoan

      // עדכן סטטוס אם ההלוואה נפרעה במלואה
      if (db.getLoanBalance(loan.id) === 0) {
        db.updateLoan(loan.id, { status: 'completed' })
      }
    }

    // עדכן את הנתונים המקומיים
    loadData()

    // עדכן את רשימת התשלומים אם יש הלוואה נבחרת
    if (selectedLoanId && selectedLoanId > 0) {
      const loanPayments = db.getPaymentsByLoanId(selectedLoanId)
      setPayments(loanPayments)
    }

    // עדכן את פרטי ההלוואה הנוכחית אם היא השתנתה
    if (selectedLoanId && selectedLoanId > 0) {
      const updatedLoan = loans.find(l => l.id === selectedLoanId)
      if (updatedLoan) {
        setCurrentLoan(updatedLoan)
      }
    }

    showNotification(`✅ פרעון מרובה בוצע בהצלחה!<br>סכום: ₪${amount.toLocaleString()}`)
  }

  // פונקציות למודל עדכון פרטי תשלום
  const openPaymentDetailsModal = (type: 'loan' | 'payment', itemId: number) => {
    // קודם טען נתונים קיימים
    let currentMethod = ''
    let currentDetails = ''

    if (type === 'loan') {
      const loan = loans.find(l => l.id === itemId)
      if (loan) {
        currentMethod = loan.loanPaymentMethod || ''
        currentDetails = loan.loanPaymentDetails || ''
      }
    } else {
      const payment = db.getPaymentsByLoanId(selectedLoanId || 0).find(p => p.id === itemId)
      if (payment) {
        currentMethod = payment.paymentMethod || ''
        currentDetails = payment.paymentDetails || ''
      }
    }

    // טען נתונים קיימים לטופס
    if (currentMethod) {
      // תמיד טען את אמצעי התשלום
      setPaymentDetailsForm(prev => ({
        ...prev,
        paymentMethod: currentMethod
      }))

      // אם יש פרטים נוספים, טען גם אותם
      if (currentDetails) {
        try {
          const details = JSON.parse(currentDetails)
          setPaymentDetailsForm(prev => ({
            ...prev,
            paymentMethod: currentMethod,
            ...details
          }))


        } catch (error) {
          console.log('שגיאה בפענוח פרטי תשלום:', error)
          // אם יש שגיאה בפענוח, לפחות נשמור את אמצעי התשלום
          setPaymentDetailsForm(prev => ({
            ...prev,
            paymentMethod: currentMethod
          }))
        }
      }
    } else {
      // אם אין אמצעי תשלום, איפוס הטופס
      setPaymentDetailsForm({
        paymentMethod: '',
        referenceNumber: '',
        bankCode: '',
        bankName: '',
        branchCode: '',
        branchName: '',
        branchAddress: '',
        city: '',
        branchNumber: '',
        accountNumber: '',
        transferDate: getTodayString(),
        checkNumber: '',
        branch: '',
        dueDate: getTodayString(),
        lastFourDigits: '',
        transactionNumber: '',
        description: ''
      })
    }

    setPaymentDetailsModal({
      isOpen: true,
      type,
      itemId,
      currentMethod,
      currentDetails
    })
  }

  const closePaymentDetailsModal = () => {
    setPaymentDetailsModal(null)
  }

  const handlePaymentDetailsFormChange = (field: string, value: string) => {
    setPaymentDetailsForm(prev => ({
      ...prev,
      [field]: value
    }))
  }



  const savePaymentDetails = () => {
    if (!paymentDetailsModal) return

    const { type, itemId } = paymentDetailsModal
    const { paymentMethod } = paymentDetailsForm

    if (!paymentMethod) {
      showNotification('⚠️ אנא בחר אמצעי תשלום', 'error')
      return
    }

    // בנה את פרטי התשלום לפי האמצעי
    let paymentDetails = ''

    if (paymentMethod === 'transfer') {
      const { referenceNumber, bankCode, bankName, branchNumber, accountNumber, transferDate } = paymentDetailsForm

      // בדיקת תאריך העברה - לא יכול להיות מאוחר להיום
      if (transferDate) {
        const today = new Date()
        const selectedDate = new Date(transferDate)
        today.setHours(0, 0, 0, 0)
        selectedDate.setHours(0, 0, 0, 0)

        if (selectedDate > today) {
          showNotification('⚠️ תאריך העברה לא יכול להיות מאוחר להיום', 'error')
          return
        }
      }

      paymentDetails = JSON.stringify({
        referenceNumber: referenceNumber || '',
        bankCode: bankCode || '',
        bankName: bankName || '',
        branchNumber: branchNumber || '',
        accountNumber: accountNumber || '',
        transferDate: transferDate || getTodayString()
      })
    } else if (paymentMethod === 'check') {
      const { checkNumber, bankCode, bankName, branch, dueDate } = paymentDetailsForm

      if (!checkNumber) {
        showNotification('⚠️ אנא הזן מספר צ\'ק', 'error')
        return
      }

      paymentDetails = JSON.stringify({
        checkNumber,
        bankCode: bankCode || '',
        bankName: bankName || '',
        branch: branch || '',
        dueDate: dueDate || getTodayString()
      })
    } else if (paymentMethod === 'credit') {
      const { lastFourDigits, transactionNumber } = paymentDetailsForm

      if (!lastFourDigits) {
        showNotification('⚠️ אנא הזן 4 ספרות אחרונות', 'error')
        return
      }

      paymentDetails = JSON.stringify({
        lastFourDigits,
        transactionNumber: transactionNumber || ''
      })
    } else if (paymentMethod === 'other') {
      const { description } = paymentDetailsForm

      if (!description) {
        showNotification('⚠️ אנא הזן תיאור', 'error')
        return
      }

      paymentDetails = JSON.stringify({
        description
      })
    }

    // שמור את הפרטים
    let success = false
    if (type === 'loan') {
      success = db.updateLoanPaymentDetails(itemId, paymentMethod, paymentDetails)
    } else {
      success = db.updatePaymentDetails(itemId, paymentMethod, paymentDetails)
    }

    if (success) {
      showNotification('✅ פרטי התשלום עודכנו בהצלחה!', 'success')
      closePaymentDetailsModal()
      loadData() // רענן את הנתונים
    } else {
      showNotification('❌ שגיאה בעדכון פרטי התשלום', 'error')
    }
  }

  // סינון ערבים לפי חיפוש
  const filteredGuarantors = guarantors.filter(guarantor => {
    if (!guarantorSearchTerm) return true
    const search = guarantorSearchTerm.toLowerCase()
    return (
      guarantor.firstName.toLowerCase().includes(search) ||
      guarantor.lastName.toLowerCase().includes(search) ||
      guarantor.phone.includes(search) ||
      (guarantor.idNumber && guarantor.idNumber.includes(search)) ||
      (guarantor.email && guarantor.email.toLowerCase().includes(search))
    )
  })

  return (
    <div>
      <header className="header">
        <h1>הלוואות</h1>
        <button className="close-btn" onClick={() => navigate('/')}>×</button>
      </header>

      <div className="container">
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <button
            className={`btn ${mode === 'borrower' ? 'btn-success' : 'btn-primary'}`}
            onClick={() => setMode('borrower')}
            style={{ marginLeft: '10px' }}
          >
            ניהול לווים
          </button>
          <button
            className={`btn ${mode === 'guarantor' ? 'btn-success' : 'btn-primary'}`}
            onClick={() => setMode('guarantor')}
            style={{ marginLeft: '10px' }}
          >
            ניהול ערבים
          </button>
          <button
            className={`btn ${mode === 'loan' ? 'btn-success' : 'btn-primary'}`}
            onClick={() => setMode('loan')}
            style={{ marginLeft: '10px' }}
          >
            ניהול הלוואות
          </button>
          {db.getSettings().trackPaymentMethods && (() => {
            const incompleteLoans = db.getLoansRequiringPaymentDetails().length
            const incompletePayments = db.getPaymentsRequiringPaymentDetails().length
            const totalIncomplete = incompleteLoans + incompletePayments

            return totalIncomplete > 0 && (
              <button
                className={`btn ${mode === 'payment-details' ? 'btn-success' : 'btn-warning'}`}
                onClick={() => setMode('payment-details')}
                style={{ marginLeft: '10px' }}
                title={`${totalIncomplete} פריטים דורשים השלמת פרטי תשלום`}
              >
                ⚠️ השלמת פרטים ({totalIncomplete})
              </button>
            )
          })()}

        </div>

        {mode === 'borrower' && (
          <div className="form-container">
            <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>ניהול לווים</h3>

            {/* כותרת מקטע פרטי לווה */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontWeight: 'bold',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>👤</span>
                פרטי הלווה
              </div>
              <button
                onClick={() => {
                  setIsEditingFieldLabels(!isEditingFieldLabels)
                  if (isEditingFieldLabels) {
                    // שמירה אוטומטית בעת יציאה ממצב עריכה
                    setEditingField(null)
                  }
                }}
                style={{
                  backgroundColor: isEditingFieldLabels ? '#27ae60' : 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '2px solid white',
                  padding: '6px 12px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {isEditingFieldLabels ? '💾 שמור שדות' : '⚙️ ערוך שדות'}
              </button>
            </div>

            {/* חיפוש ובחירת לווה */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '20px', 
              marginBottom: '20px',
              maxWidth: '900px',
              margin: '0 auto 20px auto'
            }}>
              {/* חיפוש מהיר */}
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  🔍 חיפוש מהיר:
                </label>
                <input
                  type="text"
                  placeholder="חיפוש לווה (שם, ת.ז, טלפון, עיר)..."
                  value={borrowerSearchTerm}
                  onChange={(e) => {
                    setBorrowerSearchTerm(e.target.value)
                    performBorrowerSearch(e.target.value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (borrowerSearchResults.length === 1) {
                        selectBorrower(borrowerSearchResults[0].id)
                        setBorrowerSearchTerm('')
                        setShowBorrowerSearchResults(false)
                      } else if (borrowerSearchResults.length > 1) {
                        setShowBorrowerSearchResults(true)
                      } else if (borrowerSearchTerm.trim()) {
                        showNotification('❌ לא נמצא לווה התואם לחיפוש', 'error')
                      }
                    }
                  }}
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    border: '2px solid #667eea',
                    borderRadius: '5px'
                  }}
                />
                
                {/* תוצאות חיפוש */}
                {showBorrowerSearchResults && borrowerSearchResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '2px solid #667eea',
                    borderRadius: '5px',
                    marginTop: '5px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}>
                    {borrowerSearchResults.map(borrower => (
                      <div
                        key={borrower.id}
                        onClick={() => {
                          selectBorrower(borrower.id)
                          setBorrowerSearchTerm('')
                          setShowBorrowerSearchResults(false)
                        }}
                        style={{
                          padding: '12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #ecf0f1',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          {borrower.firstName} {borrower.lastName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                          ת.ז: {borrower.idNumber} | טלפון: {borrower.phone}
                          {borrower.city && ` | ${borrower.city}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* בחירה מרשימה */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  📋 או בחר מהרשימה:
                </label>
                <select
                  value={selectedBorrowerId || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      selectBorrower(Number(e.target.value))
                      setBorrowerSearchTerm('')
                      setShowBorrowerSearchResults(false)
                    } else {
                      newBorrower()
                    }
                  }}
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">➕ לווה חדש</option>
                  {borrowers.map(borrower => (
                    <option key={borrower.id} value={borrower.id}>
                      {borrower.firstName} {borrower.lastName} - {borrower.phone}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* לווה נבחר */}
            {selectedBorrowerId && currentBorrower && currentBorrower.id && (
              <div style={{
                maxWidth: '900px',
                margin: '0 auto 20px auto',
                padding: '15px',
                backgroundColor: '#e8f5e9',
                border: '2px solid #4caf50',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>
                    ✅ {currentBorrower.firstName} {currentBorrower.lastName}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    ת.ז: {currentBorrower.idNumber} | טלפון: {currentBorrower.phone}
                    {currentBorrower.city && ` | ${currentBorrower.city}`}
                  </div>
                </div>
                <button
                  className="btn"
                  onClick={() => {
                    setSelectedBorrowerId(null)
                    setCurrentBorrower({} as DatabaseBorrower)
                    setSelectedLoanId(null)
                    setBorrowerSearchTerm('')
                    setMode('borrower')
                  }}
                  style={{
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    padding: '8px 15px',
                    fontSize: '14px'
                  }}
                >
                  ✕ נקה בחירה
                </button>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>שם פרטי:</label>
                <input
                  key={`firstName-${selectedBorrowerId || 'new'}`}
                  type="text"
                  value={currentBorrower.firstName || ''}
                  onChange={(e) => handleBorrowerChange('firstName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>שם משפחה:</label>
                <input
                  key={`lastName-${selectedBorrowerId || 'new'}`}
                  type="text"
                  value={currentBorrower.lastName || ''}
                  onChange={(e) => handleBorrowerChange('lastName', e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  מספר זהות: {db.getSettings().requireIdNumber && <span style={{ color: '#e74c3c' }}>*</span>}
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      marginRight: '5px',
                      cursor: 'help'
                    }}
                    title={db.getSettings().requireIdNumber ?
                      "מספר זהות ישראלי תקין עם ספרת ביקורת נכונה (חובה)" :
                      "מספר זהות ישראלי תקין עם ספרת ביקורת נכונה (אופציונלי)"
                    }
                  >
                    ℹ️
                  </span>
                </label>
                <input
                  key={`idNumber-${selectedBorrowerId || 'new'}`}
                  type="text"
                  value={currentBorrower.idNumber || ''}
                  onChange={(e) => {
                    // הסר תווים שאינם ספרות, מקפים או רווחים
                    const cleanValue = e.target.value.replace(/[^\d\s-]/g, '')
                    handleBorrowerChange('idNumber', cleanValue)
                  }}
                  placeholder={db.getSettings().requireIdNumber ? "דוגמה: 123456782" : "דוגמה: 123456782 (אופציונלי)"}
                  maxLength={11}
                  style={{
                    borderColor: currentBorrower.idNumber && !db.validateIsraeliId(currentBorrower.idNumber) ? '#e74c3c' : undefined
                  }}
                />
                {currentBorrower.idNumber && (
                  <small style={{
                    color: db.validateIsraeliId(currentBorrower.idNumber) ? '#27ae60' : '#e74c3c',
                    fontSize: '12px',
                    display: 'block',
                    marginTop: '2px'
                  }}>
                    {(() => {
                      const cleanId = currentBorrower.idNumber.replace(/[\s-]/g, '')
                      if (cleanId.length !== 9) {
                        return `נדרשות 9 ספרות (יש ${cleanId.length})`
                      } else if (db.validateIsraeliId(currentBorrower.idNumber)) {
                        return '✓ מספר זהות תקין'
                      } else {
                        return '❌ מספר זהות לא תקין (ספרת ביקורת שגויה)'
                      }
                    })()}
                  </small>
                )}
              </div>
              <div className="form-group">
                {/* שדה ריק לאיזון */}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editingField === 'city' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input
                        type="text"
                        value={tempFieldLabel}
                        onChange={(e) => setTempFieldLabel(e.target.value)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '13px',
                          border: '2px solid #667eea',
                          borderRadius: '3px',
                          width: '150px'
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          if (tempFieldLabel.trim()) {
                            db.updateCustomFieldLabel('city', tempFieldLabel.trim())
                            showNotification('✅ שם השדה עודכן בהצלחה')
                          }
                          setEditingField(null)
                        }}
                        style={{
                          backgroundColor: '#27ae60',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingField(null)}
                        style={{
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      {db.getCustomFieldLabel('city')}:
                      {isEditingFieldLabels && (
                        <button
                          onClick={() => {
                            setEditingField('city')
                            setTempFieldLabel(db.getCustomFieldLabel('city'))
                          }}
                          style={{
                            backgroundColor: '#f39c12',
                            color: 'white',
                            border: 'none',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          ✏️
                        </button>
                      )}
                    </>
                  )}
                </label>
                <input
                  key={`city-${selectedBorrowerId || 'new'}`}
                  type="text"
                  value={currentBorrower.city || ''}
                  onChange={(e) => handleBorrowerChange('city', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>טלפון:</label>
                <input
                  key={`phone-${selectedBorrowerId || 'new'}`}
                  type="text"
                  value={currentBorrower.phone || ''}
                  onChange={(e) => handleBorrowerChange('phone', e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>טלפון נוסף:</label>
                <input
                  key={`phone2-${selectedBorrowerId || 'new'}`}
                  type="text"
                  value={currentBorrower.phone2 || ''}
                  onChange={(e) => handleBorrowerChange('phone2', e.target.value)}
                  placeholder="אופציונלי"
                />
              </div>
              <div className="form-group">
                {/* שדה ריק לאיזון */}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editingField === 'address' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input
                        type="text"
                        value={tempFieldLabel}
                        onChange={(e) => setTempFieldLabel(e.target.value)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '13px',
                          border: '2px solid #667eea',
                          borderRadius: '3px',
                          width: '150px'
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          if (tempFieldLabel.trim()) {
                            db.updateCustomFieldLabel('address', tempFieldLabel.trim())
                            showNotification('✅ שם השדה עודכן בהצלחה')
                          }
                          setEditingField(null)
                        }}
                        style={{
                          backgroundColor: '#27ae60',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingField(null)}
                        style={{
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      {db.getCustomFieldLabel('address')}:
                      {isEditingFieldLabels && (
                        <button
                          onClick={() => {
                            setEditingField('address')
                            setTempFieldLabel(db.getCustomFieldLabel('address'))
                          }}
                          style={{
                            backgroundColor: '#f39c12',
                            color: 'white',
                            border: 'none',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          ✏️
                        </button>
                      )}
                    </>
                  )}
                </label>
                <input
                  key={`address-${selectedBorrowerId || 'new'}`}
                  type="text"
                  value={currentBorrower.address || ''}
                  onChange={(e) => handleBorrowerChange('address', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editingField === 'email' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input
                        type="text"
                        value={tempFieldLabel}
                        onChange={(e) => setTempFieldLabel(e.target.value)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '13px',
                          border: '2px solid #667eea',
                          borderRadius: '3px',
                          width: '150px'
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          if (tempFieldLabel.trim()) {
                            db.updateCustomFieldLabel('email', tempFieldLabel.trim())
                            showNotification('✅ שם השדה עודכן בהצלחה')
                          }
                          setEditingField(null)
                        }}
                        style={{
                          backgroundColor: '#27ae60',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingField(null)}
                        style={{
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      {db.getCustomFieldLabel('email')}:
                      {isEditingFieldLabels && (
                        <button
                          onClick={() => {
                            setEditingField('email')
                            setTempFieldLabel(db.getCustomFieldLabel('email'))
                          }}
                          style={{
                            backgroundColor: '#f39c12',
                            color: 'white',
                            border: 'none',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          ✏️
                        </button>
                      )}
                    </>
                  )}
                </label>
                <input
                  key={`email-${selectedBorrowerId || 'new'}`}
                  type="email"
                  value={currentBorrower.email || ''}
                  onChange={(e) => handleBorrowerChange('email', e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ width: '100%' }}>
                <label>הערות:</label>
                <input
                  key={`notes-${selectedBorrowerId || 'new'}`}
                  type="text"
                  value={currentBorrower.notes || ''}
                  onChange={(e) => handleBorrowerChange('notes', e.target.value)}
                  placeholder=""
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* פרטי בנק למס"ב - מוצג רק אם מופעל */}
            {db.getSettings().enableMasav && (
              <div style={{
                marginTop: '20px',
                padding: '15px',
                background: 'rgba(59, 130, 246, 0.05)',
                border: '2px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '8px'
              }}>
              <h3 style={{ 
                marginBottom: '15px', 
                color: '#2c3e50',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🏦 פרטי בנק למס"ב (אופציונלי)
                <span style={{
                  fontSize: '12px',
                  color: '#666',
                  fontWeight: 'normal'
                }}>
                  - נדרש לגביית תשלומים אוטומטית
                </span>
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label>קוד בנק (2 ספרות):</label>
                  <input
                    key={`bankCode-${selectedBorrowerId || 'new'}`}
                    type="text"
                    value={currentBorrower.bankCode || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 2)
                      handleBorrowerChange('bankCode', value)
                    }}
                    placeholder="12"
                    maxLength={2}
                    style={{
                      borderColor: currentBorrower.bankCode && currentBorrower.bankCode.length !== 2 ? '#f39c12' : undefined
                    }}
                  />
                  {currentBorrower.bankCode && currentBorrower.bankCode.length !== 2 && (
                    <small style={{ color: '#f39c12', fontSize: '12px' }}>
                      חייב להיות 2 ספרות
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label>מספר סניף (3 ספרות):</label>
                  <input
                    key={`branchNumber-${selectedBorrowerId || 'new'}`}
                    type="text"
                    value={currentBorrower.branchNumber || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 3)
                      handleBorrowerChange('branchNumber', value)
                    }}
                    placeholder="345"
                    maxLength={3}
                    style={{
                      borderColor: currentBorrower.branchNumber && currentBorrower.branchNumber.length !== 3 ? '#f39c12' : undefined
                    }}
                  />
                  {currentBorrower.branchNumber && currentBorrower.branchNumber.length !== 3 && (
                    <small style={{ color: '#f39c12', fontSize: '12px' }}>
                      חייב להיות 3 ספרות
                    </small>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>מספר חשבון (9 ספרות):</label>
                  <input
                    key={`accountNumber-${selectedBorrowerId || 'new'}`}
                    type="text"
                    value={currentBorrower.accountNumber || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 9)
                      handleBorrowerChange('accountNumber', value)
                    }}
                    placeholder="123456789"
                    maxLength={9}
                    style={{
                      borderColor: currentBorrower.accountNumber && currentBorrower.accountNumber.length !== 9 ? '#f39c12' : undefined
                    }}
                  />
                  {currentBorrower.accountNumber && currentBorrower.accountNumber.length !== 9 && (
                    <small style={{ color: '#f39c12', fontSize: '12px' }}>
                      חייב להיות 9 ספרות
                    </small>
                  )}
                </div>
                <div className="form-group">
                  {/* שדה ריק לאיזון */}
                </div>
              </div>

              {/* סטטוס פרטי בנק */}
              {currentBorrower.bankCode && currentBorrower.branchNumber && currentBorrower.accountNumber && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  background: currentBorrower.bankCode.length === 2 && 
                             currentBorrower.branchNumber.length === 3 && 
                             currentBorrower.accountNumber.length === 9
                    ? 'rgba(39, 174, 96, 0.1)'
                    : 'rgba(243, 156, 18, 0.1)',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: currentBorrower.bankCode.length === 2 && 
                         currentBorrower.branchNumber.length === 3 && 
                         currentBorrower.accountNumber.length === 9
                    ? '#27ae60'
                    : '#f39c12'
                }}>
                  {currentBorrower.bankCode.length === 2 && 
                   currentBorrower.branchNumber.length === 3 && 
                   currentBorrower.accountNumber.length === 9
                    ? '✅ פרטי בנק מלאים - ניתן לגבות באמצעות מס"ב'
                    : '⚠️ פרטי בנק חלקיים - יש להשלים את כל השדות'}
                </div>
              )}

              <div style={{
                marginTop: '10px',
                padding: '8px',
                background: 'rgba(52, 152, 219, 0.1)',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#666'
              }}>
                💡 <strong>טיפ:</strong> פרטי הבנק נדרשים רק אם ברצונך לגבות תשלומים באמצעות מערכת מס"ב.
                ניתן להשאיר ריק אם לא רלוונטי.
              </div>
              </div>
            )}

            <div className="form-row" style={{ justifyContent: 'center' }}>
              <button className="btn btn-success" onClick={saveBorrower}>
                שמור לווה
              </button>
              <button className="btn btn-primary" onClick={newBorrower} style={{ marginRight: '10px' }}>
                לווה חדש
              </button>
              {selectedBorrowerId && (
                <button
                  className="btn"
                  onClick={() => {
                    const borrowerLoans = loans.filter(loan =>
                      loan.borrowerId === selectedBorrowerId && loan.status === 'active'
                    )

                    if (borrowerLoans.length > 0) {
                      showConfirmModal({
                        title: 'לא ניתן למחוק לווה',
                        message: `ללווה יש ${borrowerLoans.length} הלוואות פעילות.\n\nכדי למחוק את הלווה, עליך קודם למחוק או לסגור את כל ההלוואות הפעילות שלו.`,
                        confirmText: 'הבנתי',
                        type: 'warning',
                        onConfirm: () => { }
                      })
                    } else {
                      showConfirmModal({
                        title: 'מחיקת לווה',
                        message: `האם אתה בטוח שברצונך למחוק את הלווה "${currentBorrower.firstName} ${currentBorrower.lastName}"?\n\nפעולה זו תמחק את הלווה וכל ההלוואות הסגורות שלו.\nפעולה זו לא ניתנת לביטול.`,
                        confirmText: 'מחק לווה',
                        cancelText: 'ביטול',
                        type: 'danger',
                        onConfirm: () => {
                          const success = db.deleteBorrower(selectedBorrowerId)
                          if (success) {
                            showNotification('✅ הלווה נמחק בהצלחה!')
                            // נקה את הטופס
                            setCurrentBorrower({
                              firstName: '',
                              lastName: '',
                              city: '',
                              phone: '',
                              address: '',
                              email: '',
                              idNumber: ''
                            })
                            setSelectedBorrowerId(null)
                            loadData()
                          } else {
                            showNotification('❌ שגיאה במחיקת הלווה', 'error')
                          }
                        }
                      })
                    }
                  }}
                  style={{
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    marginRight: '10px'
                  }}
                >
                  🗑️ מחק לווה
                </button>
              )}
            </div>

            {/* הצגת חובות ערבים */}
            {selectedBorrowerId && guarantorDebts.filter(debt => 
              loans.find(l => l.id === debt.originalLoanId && l.borrowerId === selectedBorrowerId)
            ).length > 0 && (
              <div style={{ marginTop: '30px', padding: '20px', background: '#fff7ed', borderRadius: '15px' }}>
                <h3 style={{ color: '#ea580c', marginBottom: '20px', textAlign: 'center' }}>
                  🤝 חובות ערבים (הלוואות שהועברו לערבים)
                </h3>
                {guarantorDebts
                  .filter(debt => loans.find(l => l.id === debt.originalLoanId && l.borrowerId === selectedBorrowerId))
                  .map(debt => (
                    <GuarantorDebtCard
                      key={debt.id}
                      debt={debt}
                      onPaymentClick={(debt) => {
                        setSelectedGuarantorDebt(debt)
                        setShowGuarantorDebtPaymentModal(true)
                      }}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {mode === 'guarantor' && (
          <div style={{ padding: '20px' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px', textAlign: 'center' }}>
              🤝 מערכת ניהול ערבים מתקדמת
            </h2>
            <p style={{ color: '#34495e', fontSize: '16px', textAlign: 'center', marginBottom: '15px' }}>
              נהל את כל הערבים של הגמ"ח במקום אחד - עם מעקב אחר ערבויות פעילות וסיכונים
            </p>

            {/* הסבר על סטטוסים */}
            <div style={{
              background: '#f8f9fa',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              <strong>הסבר סטטוסים:</strong>
              <span style={{ color: '#27ae60', marginLeft: '10px' }}>✅ פעיל</span> - ערב רגיל |
              <span style={{ color: '#f39c12', marginLeft: '10px' }}>⚠️ בסיכון גבוה</span> - מעל 50,000 ש"ח ערבויות |
              <span style={{ color: '#e74c3c', marginLeft: '10px' }}>🚫 חסום</span> - ברשימה שחורה
            </div>

            {/* סטטיסטיקות מהירות */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #3498db, #2980b9)',
                color: 'white',
                padding: '20px',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{guarantors.length}</h3>
                <p style={{ margin: 0, fontSize: '14px' }}>סה"כ ערבים</p>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #27ae60, #229954)',
                color: 'white',
                padding: '20px',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
                  {guarantors.filter(g => g.status === 'active').length}
                </h3>
                <p style={{ margin: 0, fontSize: '14px' }}>ערבים פעילים</p>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #f39c12, #e67e22)',
                color: 'white',
                padding: '20px',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
                  {guarantors.filter(g => g.status === 'at_risk').length}
                </h3>
                <p style={{ margin: 0, fontSize: '14px' }}>ערבים בסיכון גבוה</p>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                color: 'white',
                padding: '20px',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
                  {guarantors.reduce((sum, g) => sum + g.activeGuarantees, 0)}
                </h3>
                <p style={{ margin: 0, fontSize: '14px' }}>ערבויות פעילות</p>
              </div>
            </div>



            <div className="form-container" style={{ marginBottom: '30px' }}>
              <h3 style={{ marginBottom: '20px', color: '#2c3e50', textAlign: 'center' }}>
                {editingGuarantorId ? 'עריכת ערב' : 'הוספת ערב חדש'}
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label>שם פרטי: <span style={{ color: '#e74c3c' }}>*</span></label>
                  <input
                    type="text"
                    value={newGuarantor.firstName}
                    onChange={(e) => handleGuarantorInputChange('firstName', e.target.value)}
                    placeholder="הכנס שם פרטי"
                  />
                </div>
                <div className="form-group">
                  <label>שם משפחה: <span style={{ color: '#e74c3c' }}>*</span></label>
                  <input
                    type="text"
                    value={newGuarantor.lastName}
                    onChange={(e) => handleGuarantorInputChange('lastName', e.target.value)}
                    placeholder="הכנס שם משפחה"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>טלפון: <span style={{ color: '#e74c3c' }}>*</span></label>
                  <input
                    type="text"
                    value={newGuarantor.phone}
                    onChange={(e) => handleGuarantorInputChange('phone', e.target.value)}
                    placeholder="הכנס מספר טלפון"
                  />
                </div>
                <div className="form-group">
                  <label>
                    מספר זהות: {db.getSettings().requireIdNumber && <span style={{ color: '#e74c3c' }}>*</span>}
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#666',
                        marginRight: '5px',
                        cursor: 'help'
                      }}
                      title={db.getSettings().requireIdNumber ?
                        "מספר זהות ישראלי תקין עם ספרת ביקורת נכונה (חובה)" :
                        "מספר זהות ישראלי תקין עם ספרת ביקורת נכונה (אופציונלי)"
                      }
                    >
                      ℹ️
                    </span>
                  </label>
                  <input
                    type="text"
                    value={newGuarantor.idNumber}
                    onChange={(e) => {
                      const cleanValue = e.target.value.replace(/[^\d\s-]/g, '')
                      handleGuarantorInputChange('idNumber', cleanValue)
                    }}
                    placeholder={db.getSettings().requireIdNumber ? "דוגמה: 123456782" : "דוגמה: 123456782 (אופציונלי)"}
                    maxLength={11}
                    style={{
                      borderColor: newGuarantor.idNumber && !db.validateIsraeliId(newGuarantor.idNumber) ? '#e74c3c' : undefined
                    }}
                  />
                  {newGuarantor.idNumber && (
                    <small style={{
                      color: db.validateIsraeliId(newGuarantor.idNumber) ? '#27ae60' : '#e74c3c',
                      fontSize: '12px',
                      display: 'block',
                      marginTop: '2px'
                    }}>
                      {(() => {
                        const cleanId = newGuarantor.idNumber.replace(/[\s-]/g, '')
                        if (cleanId.length !== 9) {
                          return `נדרשות 9 ספרות (יש ${cleanId.length})`
                        } else if (db.validateIsraeliId(newGuarantor.idNumber)) {
                          return '✓ מספר זהות תקין'
                        } else {
                          return '❌ מספר זהות לא תקין (ספרת ביקורת שגויה)'
                        }
                      })()}
                    </small>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>כתובת:</label>
                  <input
                    type="text"
                    value={newGuarantor.address || ''}
                    onChange={(e) => handleGuarantorInputChange('address', e.target.value)}
                    placeholder="הכנס כתובת (אופציונלי)"
                  />
                </div>
                <div className="form-group">
                  <label>אימייל:</label>
                  <input
                    type="email"
                    value={newGuarantor.email || ''}
                    onChange={(e) => handleGuarantorInputChange('email', e.target.value)}
                    placeholder="הכנס אימייל (אופציונלי)"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>הערות:</label>
                  <textarea
                    value={newGuarantor.notes || ''}
                    onChange={(e) => handleGuarantorInputChange('notes', e.target.value)}
                    placeholder="הערות נוספות (אופציונלי)"
                    rows={3}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              </div>

              {/* פרטי בנק למס"ב */}
              <div style={{
                marginTop: '20px',
                padding: '15px',
                background: 'rgba(59, 130, 246, 0.05)',
                border: '2px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '8px'
              }}>
                <h4 style={{ 
                  marginBottom: '15px', 
                  color: '#2c3e50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🏦 פרטי בנק למס"ב (אופציונלי)
                  <span style={{
                    fontSize: '12px',
                    color: '#666',
                    fontWeight: 'normal'
                  }}>
                    - נדרש לגביית תשלומים מהערב
                  </span>
                </h4>

                <div className="form-row">
                  <div className="form-group">
                    <label>קוד בנק (2 ספרות):</label>
                    <input
                      type="text"
                      value={newGuarantor.bankCode || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 2)
                        handleGuarantorInputChange('bankCode', value)
                      }}
                      placeholder="12"
                      maxLength={2}
                      style={{
                        borderColor: newGuarantor.bankCode && newGuarantor.bankCode.length !== 2 ? '#f39c12' : undefined
                      }}
                    />
                    {newGuarantor.bankCode && newGuarantor.bankCode.length !== 2 && (
                      <small style={{ color: '#f39c12', fontSize: '12px' }}>
                        חייב להיות 2 ספרות
                      </small>
                    )}
                  </div>
                  <div className="form-group">
                    <label>מספר סניף (3 ספרות):</label>
                    <input
                      type="text"
                      value={newGuarantor.branchNumber || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 3)
                        handleGuarantorInputChange('branchNumber', value)
                      }}
                      placeholder="345"
                      maxLength={3}
                      style={{
                        borderColor: newGuarantor.branchNumber && newGuarantor.branchNumber.length !== 3 ? '#f39c12' : undefined
                      }}
                    />
                    {newGuarantor.branchNumber && newGuarantor.branchNumber.length !== 3 && (
                      <small style={{ color: '#f39c12', fontSize: '12px' }}>
                        חייב להיות 3 ספרות
                      </small>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>מספר חשבון (9 ספרות):</label>
                    <input
                      type="text"
                      value={newGuarantor.accountNumber || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 9)
                        handleGuarantorInputChange('accountNumber', value)
                      }}
                      placeholder="123456789"
                      maxLength={9}
                      style={{
                        borderColor: newGuarantor.accountNumber && newGuarantor.accountNumber.length !== 9 ? '#f39c12' : undefined
                      }}
                    />
                    {newGuarantor.accountNumber && newGuarantor.accountNumber.length !== 9 && (
                      <small style={{ color: '#f39c12', fontSize: '12px' }}>
                        חייב להיות 9 ספרות
                      </small>
                    )}
                  </div>
                  <div className="form-group">
                    {/* שדה ריק לאיזון */}
                  </div>
                </div>

                {/* סטטוס פרטי בנק */}
                {newGuarantor.bankCode && newGuarantor.branchNumber && newGuarantor.accountNumber && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    background: newGuarantor.bankCode.length === 2 && 
                               newGuarantor.branchNumber.length === 3 && 
                               newGuarantor.accountNumber.length === 9
                      ? 'rgba(39, 174, 96, 0.1)'
                      : 'rgba(243, 156, 18, 0.1)',
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: newGuarantor.bankCode.length === 2 && 
                           newGuarantor.branchNumber.length === 3 && 
                           newGuarantor.accountNumber.length === 9
                      ? '#27ae60'
                      : '#f39c12'
                  }}>
                    {newGuarantor.bankCode.length === 2 && 
                     newGuarantor.branchNumber.length === 3 && 
                     newGuarantor.accountNumber.length === 9
                      ? '✅ פרטי בנק מלאים - ניתן לגבות באמצעות מס"ב'
                      : '⚠️ פרטי בנק חלקיים - יש להשלים את כל השדות'}
                  </div>
                )}
              </div>

              <div className="form-row" style={{ justifyContent: 'center' }}>
                <button className="btn btn-success" onClick={saveGuarantor}>
                  {editingGuarantorId ? '💾 עדכן ערב' : '➕ הוסף ערב'}
                </button>
                {editingGuarantorId && (
                  <button
                    className="btn"
                    onClick={cancelGuarantorEdit}
                    style={{ backgroundColor: '#e74c3c', color: 'white', marginRight: '10px' }}
                  >
                    ❌ ביטול עריכה
                  </button>
                )}
              </div>
            </div>

            {/* תיבת חיפוש לסינון הטבלה */}
            <div style={{
              marginBottom: '20px',
              background: '#f8f9fa',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="🔍 חפש ערב (שם מלא, ת.ז, טלפון, אימייל, כתובת)..."
                  value={guarantorSearchTerm}
                  onChange={(e) => setGuarantorSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setGuarantorSearchTerm('')
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '16px',
                    border: guarantorSearchTerm ? '2px solid #3498db' : '2px solid #ddd',
                    borderRadius: '8px',
                    transition: 'border-color 0.2s ease'
                  }}
                />
                {guarantorSearchTerm && (
                  <button
                    onClick={() => setGuarantorSearchTerm('')}
                    style={{
                      background: '#95a5a6',
                      color: 'white',
                      border: 'none',
                      padding: '12px 15px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                    title="נקה חיפוש"
                  >
                    ✕
                  </button>
                )}
              </div>
              {guarantorSearchTerm && (
                <div style={{
                  fontSize: '14px',
                  color: '#666',
                  marginTop: '5px',
                  textAlign: 'center'
                }}>
                  נמצאו {filteredGuarantors.length} ערבים מתוך {guarantors.length}
                </div>
              )}
            </div>

            {filteredGuarantors.length > 0 && (
              <div>
                <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>
                  רשימת ערבים ({filteredGuarantors.length})
                </h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>מספר</th>
                      <th>שם מלא</th>
                      <th>טלפון</th>
                      <th>מספר זהות</th>
                      <th>ערבויות פעילות</th>
                      <th>סיכון כולל</th>
                      <th>סטטוס</th>
                      <th>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGuarantors.map((guarantor) => (
                      <tr key={guarantor.id}>
                        <td>{guarantor.id}</td>
                        <td>
                          <div style={{ fontWeight: 'bold' }}>
                            {guarantor.firstName} {guarantor.lastName}
                          </div>
                          {guarantor.email && (
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              📧 {guarantor.email}
                            </div>
                          )}
                        </td>
                        <td>
                          <div>{guarantor.phone}</div>
                          {guarantor.address && (
                            <div style={{ fontSize: '11px', color: '#666' }}>
                              📍 {guarantor.address}
                            </div>
                          )}
                        </td>
                        <td>{db.formatIdNumber(guarantor.idNumber || '')}</td>
                        <td style={{
                          color: guarantor.activeGuarantees > 0 ? '#e74c3c' : '#27ae60',
                          fontWeight: 'bold',
                          textAlign: 'center'
                        }}>
                          {guarantor.activeGuarantees}
                        </td>
                        <td style={{
                          color: guarantor.totalRisk > 50000 ? '#e74c3c' :
                            guarantor.totalRisk > 20000 ? '#f39c12' : '#27ae60',
                          fontWeight: 'bold',
                          textAlign: 'center'
                        }}>
                          ₪{guarantor.totalRisk.toLocaleString()}
                        </td>
                        <td>
                          <span style={{
                            background: guarantor.status === 'active' ? '#27ae60' :
                              guarantor.status === 'at_risk' ? '#f39c12' : '#e74c3c',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}>
                            {guarantor.status === 'active' ? '✅ פעיל' :
                              guarantor.status === 'at_risk' ? '⚠️ בסיכון גבוה' : '🚫 חסום'}
                          </span>
                          {guarantor.notes && (
                            <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                              📝 {guarantor.notes.length > 20 ? guarantor.notes.substring(0, 20) + '...' : guarantor.notes}
                            </div>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => editGuarantor(guarantor)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              backgroundColor: '#f39c12',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              marginLeft: '5px'
                            }}
                            title="ערוך פרטי ערב"
                          >
                            ✏️ ערוך
                          </button>
                          <button
                            onClick={() => {
                              if (guarantor.activeGuarantees > 0) {
                                showNotification('❌ לא ניתן למחוק ערב עם ערבויות פעילות', 'error')
                                return
                              }

                              showConfirmModal({
                                title: 'מחיקת ערב',
                                message: `האם אתה בטוח שברצונך למחוק את הערב ${guarantor.firstName} ${guarantor.lastName}?\n\nפעולה זו לא ניתנת לביטול.`,
                                confirmText: 'מחק ערב',
                                cancelText: 'ביטול',
                                type: 'danger',
                                onConfirm: () => {
                                  if (db.deleteGuarantor(guarantor.id)) {
                                    loadGuarantors()
                                    showNotification('✅ הערב נמחק בהצלחה!')
                                  } else {
                                    showNotification('❌ שגיאה במחיקת הערב', 'error')
                                  }
                                }
                              })
                            }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              backgroundColor: '#e74c3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            title="מחק ערב (רק אם אין ערבויות פעילות)"
                          >
                            🗑️ מחק
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filteredGuarantors.length === 0 && guarantorSearchTerm && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#666',
                background: '#f8f9fa',
                borderRadius: '8px',
                margin: '20px 0'
              }}>
                <h3>🔍 לא נמצאו ערבים</h3>
                <p>לא נמצאו ערבים התואמים לחיפוש "{guarantorSearchTerm}"</p>
                <button
                  onClick={() => setGuarantorSearchTerm('')}
                  className="btn btn-primary"
                  style={{ marginTop: '10px' }}
                >
                  נקה חיפוש
                </button>
              </div>
            )}

            {guarantors.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#666',
                background: '#f8f9fa',
                borderRadius: '8px',
                margin: '20px 0'
              }}>
                <h3>🤝 אין ערבים במערכת</h3>
                <p>התחל בהוספת הערב הראשון באמצעות הטופס למעלה</p>
              </div>
            )}
          </div>
        )}

        {mode === 'loan' && (
          <div className="form-container">
            <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>ניהול הלוואות</h3>

            <div className="form-row">
              <div className="form-group">
                <label>בחר הלוואה:</label>
                <select
                  key={`loans-${selectedBorrowerId || 'all'}`}
                  value={selectedLoanId || ''}
                  onChange={(e) => e.target.value ? selectLoan(Number(e.target.value)) : newLoan()}
                  disabled={!(selectedBorrowerId || currentLoan.borrowerId)}
                >
                  <option value="">
                    {(selectedBorrowerId || currentLoan.borrowerId) ? 'הלוואה חדשה' : 'בחר לווה תחילה'}
                  </option>
                  {(selectedBorrowerId || currentLoan.borrowerId) && loans
                    .filter(loan => loan.borrowerId === (selectedBorrowerId || currentLoan.borrowerId))
                    .sort((a, b) => {
                      // הלוואות פעילות קודם
                      if (a.status === 'active' && b.status !== 'active') return -1
                      if (b.status === 'active' && a.status !== 'active') return 1
                      return b.id - a.id // לפי מספר הלוואה (החדשות קודם)
                    })
                    .map(loan => {
                      const borrower = borrowers.find(b => b.id === loan.borrowerId)
                      const balance = db.getLoanBalance(loan.id)

                      // בדוק אם ההלוואה עתידית
                      const today = new Date()
                      const loanDate = new Date(loan.loanDate)
                      const isFuture = loanDate > today

                      let statusIcon = '✅'
                      let statusText = 'נפרע'

                      if (loan.transferredToGuarantors) {
                        // הלוואה שהועברה לערבים
                        statusIcon = '🔄'
                        statusText = 'הועברה לערבים'
                      } else if (isFuture) {
                        // הלוואה עתידית
                        const daysUntil = Math.ceil((loanDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                        statusIcon = '🕐'
                        statusText = `מתוכנן - ${daysUntil === 1 ? 'מחר' : `בעוד ${daysUntil} ימים`}`
                      } else if (balance > 0) {
                        // הלוואה פעילה
                        const returnDate = new Date(loan.returnDate)
                        const isOverdue = returnDate < today
                        const daysOverdue = isOverdue ? Math.floor((today.getTime() - returnDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

                        if (isOverdue) {
                          statusIcon = '⚠️'
                          statusText = `איחור ${daysOverdue} ימים`
                        } else {
                          statusIcon = '🔴'
                          statusText = 'פעיל'
                        }
                      }

                      return (
                        <option key={loan.id} value={loan.id}>
                          {statusIcon} {loan.id} - {borrower ? `${borrower.firstName} ${borrower.lastName}` : 'לא ידוע'} - {db.formatCurrency(loan.amount)} ({statusText})
                        </option>
                      )
                    })}
                </select>
              </div>
              <div className="form-group">
                <label>בחר לווה:</label>
                <select
                  value={selectedBorrowerId || currentLoan.borrowerId || ''}
                  onChange={(e) => handleLoanChange('borrowerId', Number(e.target.value))}
                  style={{
                    border: isAdvancedEditMode && selectedLoanId ? '2px solid #e74c3c' : undefined
                  }}
                >
                  <option value="">בחר לווה</option>
                  {borrowers.map(borrower => (
                    <option key={borrower.id} value={borrower.id}>
                      {borrower.firstName} {borrower.lastName}
                    </option>
                  ))}
                </select>
                {isAdvancedEditMode && selectedLoanId && (
                  <small style={{ color: '#e74c3c', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                    ⚠️ עריכה מתקדמת - שינוי לווה ישפיע על ההלוואה הקיימת!
                  </small>
                )}
              </div>
            </div>

            {/* סימון הלוואה שהועברה לערבים */}
            {selectedLoanId && currentLoan.transferredToGuarantors && (
              <div style={{
                background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                border: '2px solid #a855f7',
                borderRadius: '12px',
                padding: '15px 20px',
                marginBottom: '20px',
                boxShadow: '0 4px 10px rgba(168, 85, 247, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '28px' }}>🔄</span>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#7c3aed', fontSize: '16px' }}>
                      הלוואה הועברה לאחריות הערבים
                    </h4>
                    <div style={{ fontSize: '13px', color: '#6b21a8' }}>
                      <div>תאריך העברה: {currentLoan.transferDate ? new Date(currentLoan.transferDate).toLocaleDateString('he-IL') : '-'}</div>
                      {currentLoan.transferredBy && <div>הועבר על ידי: {currentLoan.transferredBy}</div>}
                      {currentLoan.transferNotes && <div>הערות: {currentLoan.transferNotes}</div>}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const debts = guarantorDebts.filter(d => d.originalLoanId === selectedLoanId)
                      if (debts.length > 0) {
                        // הצגת מודל עם פרטי העברה
                        const modalContent = debts.map(d => {
                          const g = guarantors.find(gr => gr.id === d.guarantorId)
                          const balance = db.getGuarantorDebtBalance(d.id)
                          return `
                            <div style="padding: 12px; background: #f9fafb; border-radius: 8px; margin-bottom: 10px;">
                              <div style="font-weight: bold; color: #1f2937; margin-bottom: 5px;">
                                ${g ? `${g.firstName} ${g.lastName}` : 'לא ידוע'}
                              </div>
                              <div style="font-size: 13px; color: #6b7280;">
                                סכום חוב: ₪${d.amount.toLocaleString()} | יתרה: ₪${balance.toLocaleString()}
                              </div>
                              <div style="font-size: 12px; color: #9ca3af; margin-top: 3px;">
                                ${d.paymentType === 'single' ? 'תשלום אחד' : `${d.installmentsCount} תשלומים`}
                              </div>
                            </div>
                          `
                        }).join('')
                        
                        showNotification(`
                          <div style="max-width: 400px;">
                            <h4 style="margin: 0 0 15px 0; color: #7c3aed;">ערבים שחויבו:</h4>
                            ${modalContent}
                          </div>
                        `, 'info')
                      }
                    }}
                    style={{
                      background: '#7c3aed',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    📋 פרטי העברה
                  </button>
                </div>
              </div>
            )}

            {/* כותרת מקטע פרטי הלוואה */}
            <div style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '8px',
              marginBottom: '20px',
              marginTop: '30px',
              fontWeight: 'bold',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 2px 8px rgba(240, 147, 251, 0.3)'
            }}>
              <span style={{ fontSize: '20px' }}>💰</span>
              פרטי ההלוואה
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>סכום ההלוואה:</label>
                <NumberInput
                  key={`amount-${selectedLoanId || 'new'}-${isAdvancedEditMode}`}
                  value={currentLoan.amount || 0}
                  onChange={(value) => {
                    // בדיקה שסכום ההלוואה לא נמוך מהפרעון החודשי
                    if (currentLoan.autoPayment && currentLoan.autoPaymentAmount && value < currentLoan.autoPaymentAmount) {
                      showNotification(`⚠️ סכום ההלוואה לא יכול להיות נמוך מסכום הפרעון החודשי (₪${currentLoan.autoPaymentAmount.toLocaleString()})`, 'error')
                      return
                    }
                    handleLoanChange('amount', value)
                  }}
                  placeholder="הזן סכום"
                  style={{
                    backgroundColor: selectedLoanId && !isAdvancedEditMode ? '#f5f5f5' :
                      (currentLoan.autoPayment && currentLoan.autoPaymentAmount && currentLoan.amount && currentLoan.amount < currentLoan.autoPaymentAmount) ?
                        '#ffebee' : 'white',
                    cursor: selectedLoanId && !isAdvancedEditMode ? 'not-allowed' : 'text',
                    border: isAdvancedEditMode && selectedLoanId ? '2px solid #e74c3c' :
                      (currentLoan.autoPayment && currentLoan.autoPaymentAmount && currentLoan.amount && currentLoan.amount < currentLoan.autoPaymentAmount) ?
                        '2px solid #f44336' : undefined
                  }}
                  readOnly={!!(selectedLoanId && !isAdvancedEditMode)}
                />
                {selectedLoanId && !isAdvancedEditMode && (
                  <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                    סכום קבוע - השתמש בעריכה מתקדמת לשינוי
                  </small>
                )}
                {selectedLoanId && isAdvancedEditMode && (
                  <small style={{ color: '#e74c3c', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                    ⚠️ עריכה מתקדמת - שים לב לתשלומים קיימים!
                  </small>
                )}

              </div>
              <div className="form-group">
                <label>תאריך מתן ההלוואה:</label>
                <input
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={currentLoan.loanDate || ''}
                  onChange={(e) => handleLoanChange('loanDate', e.target.value)}
                  disabled={currentLoan.isRecurring}
                  style={{
                    backgroundColor: currentLoan.isRecurring ? '#f5f5f5' : 'white',
                    cursor: currentLoan.isRecurring ? 'not-allowed' : 'text',
                    color: currentLoan.isRecurring ? '#999' : 'inherit'
                  }}
                />
                {currentLoan.isRecurring && (
                  <small style={{
                    color: '#f39c12',
                    fontSize: '12px',
                    display: 'block',
                    marginTop: '5px'
                  }}>
                    🔄 התאריך יחושב אוטומטי לפי היום בחודש שנבחר
                  </small>
                )}
                {currentLoan.loanDate && db.getSettings().showHebrewDates && (
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    marginTop: '3px',
                    fontStyle: 'italic'
                  }}>
                    📅 {formatHebrewDateOnly(currentLoan.loanDate)}
                  </div>
                )}
                {(() => {
                  // אל תציג הודעה אם זו הלוואה מחזורית
                  if (currentLoan.isRecurring) return null

                  const today = getTodayString()
                  const loanDate = currentLoan.loanDate

                  if (loanDate && loanDate > today) {
                    const daysUntil = Math.ceil((new Date(loanDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
                    return (
                      <small style={{
                        color: '#3498db',
                        fontSize: '12px',
                        display: 'block',
                        marginTop: '5px'
                      }}>
                        🕐 הלוואה מתוכננת - תופעל בעוד {daysUntil === 1 ? 'יום אחד' : `${daysUntil} ימים`}
                      </small>
                    )
                  }
                  return null
                })()}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>סוג הלוואה:</label>
                <select
                  value={currentLoan.loanType || 'fixed'}
                  onChange={(e) => handleLoanChange('loanType', e.target.value)}
                  disabled={currentLoan.autoPayment}
                  style={{
                    backgroundColor: currentLoan.autoPayment ? '#f5f5f5' : 'white',
                    cursor: currentLoan.autoPayment ? 'not-allowed' : 'text',
                    color: currentLoan.autoPayment ? '#999' : 'inherit'
                  }}
                >
                  <option value="fixed">קבועה - עם תאריך פרעון</option>
                  <option value="flexible">גמישה - פרעון לפי התראה</option>
                </select>
                {currentLoan.autoPayment && (
                  <small style={{
                    color: '#f39c12',
                    fontSize: '12px',
                    display: 'block',
                    marginTop: '5px'
                  }}>
                    🔄 פרעון אוטומטי דורש הלוואה קבועה
                  </small>
                )}
              </div>
              <div className="form-group">
                <label>תאריך החזרה מתוכנן:</label>
                <input
                  type="date"
                  value={(() => {
                    const val = currentLoan.returnDate || ''
                    console.log('🔍 שדה תאריך החזרה - ערך נוכחי:', val, 'loanType:', currentLoan.loanType)
                    return val
                  })()}
                  onChange={(e) => {
                    // עדכון הערך ללא בדיקה
                    console.log('🔍 שדה תאריך החזרה - שינוי ל:', e.target.value)
                    setCurrentLoan(prev => ({ ...prev, returnDate: e.target.value }))
                  }}
                  onBlur={(e) => {
                    // בדיקה רק כשיוצאים מהשדה
                    const value = e.target.value
                    if (value) {
                      const returnDate = new Date(value)
                      const loanDateStr = currentLoan.loanDate || new Date().toISOString().split('T')[0]
                      const loanDate = new Date(loanDateStr)
                      
                      if (returnDate < loanDate) {
                        showNotification(
                          `⚠️ תאריך החזרה (${returnDate.toLocaleDateString('he-IL')}) קודם לתאריך ההלוואה (${loanDate.toLocaleDateString('he-IL')})<br>אנא ערוך את התאריכים`,
                          'error'
                        )
                      }
                    }
                  }}
                  disabled={currentLoan.loanType === 'flexible' || currentLoan.autoPayment}
                  style={{
                    backgroundColor: (currentLoan.loanType === 'flexible' || currentLoan.autoPayment) ? '#f5f5f5' : 'white',
                    cursor: (currentLoan.loanType === 'flexible' || currentLoan.autoPayment) ? 'not-allowed' : 'text',
                    color: (currentLoan.loanType === 'flexible' || currentLoan.autoPayment) ? '#999' : 'inherit'
                  }}
                  placeholder={
                    currentLoan.loanType === 'flexible' ? 'לא רלוונטי להלוואה גמישה' :
                      currentLoan.autoPayment ? 'לא רלוונטי לפרעון אוטומטי' : ''
                  }
                />
                {currentLoan.returnDate && db.getSettings().showHebrewDates && currentLoan.loanType !== 'flexible' && !currentLoan.autoPayment && (
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    marginTop: '3px',
                    fontStyle: 'italic'
                  }}>
                    📅 {formatHebrewDateOnly(currentLoan.returnDate)}
                  </div>
                )}
                {currentLoan.autoPayment && (
                  <small style={{
                    color: '#f39c12',
                    fontSize: '12px',
                    display: 'block',
                    marginTop: '5px'
                  }}>
                    🔄 פרעון אוטומטי - התאריך לא רלוונטי
                  </small>
                )}
              </div>
            </div>

            {settings.enableRecurringLoans && (
              <div style={{
                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                border: '2px solid #2196f3',
                borderRadius: '12px',
                padding: '20px',
                marginTop: '30px',
                marginBottom: '20px',
                boxShadow: '0 3px 10px rgba(33, 150, 243, 0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '20px',
                  paddingBottom: '15px',
                  borderBottom: '2px solid rgba(33, 150, 243, 0.3)'
                }}>
                  <span style={{ fontSize: '28px' }}>🔄</span>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, color: '#1976d2', fontSize: '18px' }}>הלוואה מחזורית</h4>
                    <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#555' }}>
                      הלוואה שחוזרת על עצמה אוטומטית כל חודש
                    </p>
                  </div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    background: currentLoan.isRecurring ? '#2196f3' : 'white',
                    color: currentLoan.isRecurring ? 'white' : '#666',
                    padding: '10px 20px',
                    borderRadius: '25px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    border: '2px solid #2196f3'
                  }}>
                    <input
                      type="checkbox"
                      checked={currentLoan.isRecurring || false}
                      onChange={(e) => handleLoanChange('isRecurring', e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span>{currentLoan.isRecurring ? 'מופעל' : 'כבוי'}</span>
                  </label>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>מספר חודשים:</label>
                    <input
                      type="number"
                      value={currentLoan.recurringMonths || 12}
                      onChange={(e) => handleLoanChange('recurringMonths', Number(e.target.value))}
                      min="1"
                      max="120"
                      disabled={!currentLoan.isRecurring}
                      style={{
                        backgroundColor: !currentLoan.isRecurring ? '#f5f5f5' : 'white',
                        cursor: !currentLoan.isRecurring ? 'not-allowed' : 'text'
                      }}
                      placeholder="12"
                    />
                    {currentLoan.isRecurring && (
                      <small style={{
                        color: '#1976d2',
                        fontSize: '12px',
                        display: 'block',
                        marginTop: '5px',
                        fontWeight: '500'
                      }}>
                        ✓ ההלוואה תחזור {currentLoan.recurringMonths || 12} פעמים
                      </small>
                    )}
                  </div>
                  <div className="form-group">
                    <label>יום בחודש להלוואה:</label>
                    <input
                      type="number"
                      value={currentLoan.recurringDay || 1}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        if (value >= 1 && value <= 31) {
                          handleLoanChange('recurringDay', value)
                        } else if (e.target.value === '') {
                          handleLoanChange('recurringDay', 1)
                        } else if (value > 31) {
                          showNotification('⚠️ יום בחודש חייב להיות בין 1 ל-31', 'error')
                        }
                      }}
                      min="1"
                      max="31"
                      placeholder="1-31"
                      disabled={!currentLoan.isRecurring}
                      style={{
                        backgroundColor: !currentLoan.isRecurring ? '#f5f5f5' : 'white',
                        cursor: !currentLoan.isRecurring ? 'not-allowed' : 'text'
                      }}
                    />
                    {currentLoan.isRecurring && (
                      <small style={{
                        color: '#1976d2',
                        fontSize: '12px',
                        display: 'block',
                        marginTop: '5px',
                        fontWeight: '500'
                      }}>
                        📅 ההלוואה הראשונה תהיה ביום {currentLoan.recurringDay || 1} בחודש
                      </small>
                    )}
                  </div>
                </div>
              </div>
            )}

            {settings.enableRecurringPayments && (
              <div style={{
                background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                border: '2px solid #4caf50',
                borderRadius: '12px',
                padding: '20px',
                marginTop: '30px',
                marginBottom: '20px',
                boxShadow: '0 3px 10px rgba(76, 175, 80, 0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '20px',
                  paddingBottom: '15px',
                  borderBottom: '2px solid rgba(76, 175, 80, 0.3)'
                }}>
                  <span style={{ fontSize: '28px' }}>💰</span>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, color: '#388e3c', fontSize: '18px' }}>פרעון אוטומטי</h4>
                    <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#555' }}>
                      רישום פרעונות אוטומטי בתאריכים קבועים
                    </p>
                  </div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    background: currentLoan.autoPayment ? '#4caf50' : 'white',
                    color: currentLoan.autoPayment ? 'white' : '#666',
                    padding: '10px 20px',
                    borderRadius: '25px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    border: '2px solid #4caf50'
                  }}>
                    <input
                      type="checkbox"
                      checked={currentLoan.autoPayment || false}
                      onChange={(e) => {
                        if (e.target.checked && (!currentLoan.amount || currentLoan.amount <= 0)) {
                          showNotification('⚠️ יש להגדיר סכום הלוואה לפני הפעלת פרעון אוטומטי', 'error')
                          return
                        }
                        handleLoanChange('autoPayment', e.target.checked)
                        if (e.target.checked && currentLoan.autoPaymentAmount && currentLoan.autoPaymentAmount > (currentLoan.amount || 0)) {
                          handleLoanChange('autoPaymentAmount', currentLoan.amount || 0)
                          showNotification(`💡 סכום הפרעון החודשי הותאם ל-₪${(currentLoan.amount || 0).toLocaleString()}`, 'info')
                        }
                      }}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span>{currentLoan.autoPayment ? 'מופעל' : 'כבוי'}</span>
                  </label>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>סכום פרעון חודשי:</label>
                    <NumberInput
                      value={currentLoan.autoPaymentAmount || 0}
                      onChange={(value) => handleLoanChange('autoPaymentAmount', value)}
                      placeholder="סכום"
                      style={{
                        backgroundColor: !currentLoan.autoPayment ? '#f5f5f5' :
                          (currentLoan.autoPaymentAmount && currentLoan.amount && currentLoan.autoPaymentAmount > currentLoan.amount) ?
                            '#ffebee' : 'white',
                        cursor: !currentLoan.autoPayment ? 'not-allowed' : 'text',
                        border: (currentLoan.autoPaymentAmount && currentLoan.amount && currentLoan.autoPaymentAmount > currentLoan.amount) ?
                          '2px solid #f44336' : undefined
                      }}
                      readOnly={!currentLoan.autoPayment}
                    />
                    {currentLoan.autoPayment && currentLoan.amount && (
                      <small style={{
                        color: '#666',
                        fontSize: '12px',
                        display: 'block',
                        marginTop: '5px'
                      }}>
                        💡 מקסימום: ₪{currentLoan.amount.toLocaleString()} (סכום ההלוואה)
                      </small>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>יום בחודש לפרעון:</label>
                    <input
                      type="number"
                      value={currentLoan.autoPaymentDay || 1}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        // הגבל את הערך בין 1 ל-31
                        if (value >= 1 && value <= 31) {
                          handleLoanChange('autoPaymentDay', value)
                        } else if (e.target.value === '') {
                          handleLoanChange('autoPaymentDay', 1)
                        } else if (value > 31) {
                          showNotification('⚠️ יום בחודש חייב להיות בין 1 ל-31', 'error')
                        }
                      }}
                      min="1"
                      max="31"
                      disabled={!currentLoan.autoPayment}
                      style={{
                        backgroundColor: !currentLoan.autoPayment ? '#f5f5f5' : 'white',
                        cursor: !currentLoan.autoPayment ? 'not-allowed' : 'text'
                      }}
                      placeholder="1-31"
                    />
                    {currentLoan.autoPayment && (
                      <small style={{
                        color: '#666',
                        fontSize: '12px',
                        display: 'block',
                        marginTop: '5px'
                      }}>
                        💰 הפרעון יתבצע ביום {currentLoan.autoPaymentDay || 1} {
                          (currentLoan.autoPaymentFrequency || 1) === 1 ? 'בכל חודש' :
                            currentLoan.autoPaymentFrequency === 2 ? 'כל חודשיים' :
                              currentLoan.autoPaymentFrequency === 3 ? 'כל 3 חודשים' :
                                currentLoan.autoPaymentFrequency === 6 ? 'כל 6 חודשים' :
                                  `כל ${currentLoan.autoPaymentFrequency} חודשים`
                        }
                        {selectedLoanId && (() => {
                          const nextPaymentDate = db.getNextAutoPaymentDate(selectedLoanId)
                          if (nextPaymentDate) {
                            return (
                              <span style={{ display: 'block', color: '#27ae60', fontWeight: 'bold' }}>
                                📅 פרעון הבא: {db.getSettings().showHebrewDates ? formatCombinedDate(nextPaymentDate) : new Date(nextPaymentDate).toLocaleDateString('he-IL')}
                              </span>
                            )
                          }
                          return null
                        })()}
                      </small>
                    )}

                  </div>
                  <div className="form-group" style={{ display: 'block', width: '100%' }}>
                    <label style={{ display: 'block', marginBottom: '8px' }}>תאריך תחילת פרעון:</label>
                    <input
                      type="date"
                      value={currentLoan.autoPaymentStartDate || currentLoan.loanDate || getTodayString()}
                      onChange={(e) => handleLoanChange('autoPaymentStartDate', e.target.value)}
                      disabled={!currentLoan.autoPayment}
                      style={{
                        backgroundColor: !currentLoan.autoPayment ? '#f5f5f5' : 'white',
                        cursor: !currentLoan.autoPayment ? 'not-allowed' : 'text',
                        padding: '12px',
                        fontSize: '16px',
                        minHeight: '48px',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        width: '100%',
                        boxSizing: 'border-box',
                        display: 'block'
                      }}
                    />
                    {currentLoan.autoPayment && (
                      <small style={{
                        color: '#666',
                        fontSize: '12px',
                        display: 'block',
                        marginTop: '5px'
                      }}>
                        📅 הפרעון הראשון יתבצע החל מתאריך זה
                      </small>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>תדירות פרעון:</label>
                    <select
                      value={currentLoan.autoPaymentFrequency || 1}
                      onChange={(e) => handleLoanChange('autoPaymentFrequency', Number(e.target.value))}
                      disabled={!currentLoan.autoPayment}
                      style={{
                        backgroundColor: !currentLoan.autoPayment ? '#f5f5f5' : 'white',
                        cursor: !currentLoan.autoPayment ? 'not-allowed' : 'text'
                      }}
                    >
                      <option value={1}>כל חודש</option>
                      <option value={2}>כל חודשיים</option>
                      <option value={3}>כל 3 חודשים</option>
                      <option value={6}>כל 6 חודשים</option>
                    </select>
                    {currentLoan.autoPayment && (
                      <small style={{
                        color: '#666',
                        fontSize: '12px',
                        display: 'block',
                        marginTop: '5px'
                      }}>
                        🔄 {(currentLoan.autoPaymentFrequency || 1) === 1 ? 'פרעון חודשי' :
                          currentLoan.autoPaymentFrequency === 2 ? 'פרעון דו-חודשי' :
                            currentLoan.autoPaymentFrequency === 3 ? 'פרעון רבעוני' :
                              currentLoan.autoPaymentFrequency === 6 ? 'פרעון חצי-שנתי' :
                                `פרעון כל ${currentLoan.autoPaymentFrequency} חודשים`}
                      </small>
                    )}
                  </div>
                  <div className="form-group">
                    <label>תאריך רישום במערכת:</label>
                    <input
                      type="text"
                      value={currentLoan.createdDate || new Date().toLocaleDateString('he-IL')}
                      readOnly
                      style={{ 
                        backgroundColor: '#f5f5f5', 
                        cursor: 'not-allowed',
                        border: '2px solid #ddd',
                        color: '#2c3e50',
                        fontWeight: '500'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* כותרת מקטע הערות */}
            <div style={{
              background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
              color: '#2d3436',
              padding: '12px 20px',
              borderRadius: '8px',
              marginBottom: '20px',
              marginTop: '30px',
              fontWeight: 'bold',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 2px 8px rgba(253, 203, 110, 0.3)'
            }}>
              <span style={{ fontSize: '20px' }}>📝</span>
              הערות נוספות (אופציונלי)
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>הערות:</label>
                <input
                  type="text"
                  value={currentLoan.notes || ''}
                  onChange={(e) => handleLoanChange('notes', e.target.value)}
                  placeholder="הוסף הערות או מידע נוסף על ההלוואה..."
                />
              </div>
            </div>

            {/* אמצעי תשלום - רק אם מופעל בהגדרות */}
            {db.getSettings().trackPaymentMethods && (
              <div style={{
                background: '#f0f8ff',
                padding: '20px',
                borderRadius: '10px',
                border: '2px solid #e3f2fd',
                margin: '20px 0'
              }}>
                <h4 style={{
                  margin: '0 0 15px 0',
                  color: '#1976d2',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  💰 אמצעי מתן ההלוואה
                </h4>

                <div className="form-group">
                  <label>בחר אמצעי תשלום:</label>
                  <select
                    value={currentLoan.loanPaymentMethod || ''}
                    onChange={(e) => {
                      handleLoanChange('loanPaymentMethod', e.target.value)
                      // נקה פרטי תשלום קודמים כשמשנים אמצעי
                      handleLoanChange('loanPaymentDetails', '')
                    }}
                    style={{
                      padding: '10px',
                      border: '2px solid #e3f2fd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      width: '100%',
                      background: 'white'
                    }}
                  >
                    <option value="">בחר אמצעי תשלום</option>
                    <option value="cash">💵 מזומן</option>
                    <option value="transfer">🏦 העברה בנקאית</option>
                    <option value="check">📝 צ'ק</option>
                    <option value="credit">💳 אשראי</option>
                    <option value="other">❓ אחר</option>
                  </select>
                </div>

                {/* פרטים נוספים לפי אמצעי התשלום */}
                {currentLoan.loanPaymentMethod === 'check' && (
                  <div style={{ marginTop: '15px' }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>📝 פרטי הצ'ק</h5>
                    <div className="form-row">
                      <div className="form-group">
                        <label>מספר צ'ק:</label>
                        <input
                          type="text"
                          placeholder="מספר הצ'ק"
                          onChange={(e) => {
                            const details = db.parsePaymentDetails('check', currentLoan.loanPaymentDetails) || {}
                            details.checkNumber = e.target.value
                            handleLoanChange('loanPaymentDetails', JSON.stringify(details))
                          }}
                          value={db.parsePaymentDetails('check', currentLoan.loanPaymentDetails)?.checkNumber || ''}
                        />
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <BankBranchSelector
                          key="check-bank-selector"
                          selectedBankCode={(() => {
                            const code = db.parsePaymentDetails('check', currentLoan.loanPaymentDetails)?.bankCode || ''
                            console.log('🏦 LoansPage: selectedBankCode לצ\'ק:', code)
                            return code
                          })()}
                          selectedBranchCode={(() => {
                            const code = db.parsePaymentDetails('check', currentLoan.loanPaymentDetails)?.branchCode || ''
                            console.log('🏢 LoansPage: selectedBranchCode לצ\'ק:', code)
                            return code
                          })()}
                          onBankChange={(bankCode, bankName) => {
                            console.log('🏦 LoansPage: onBankChange נקרא עם:', bankCode, bankName)
                            const details = db.parsePaymentDetails('check', currentLoan.loanPaymentDetails) || {}
                            console.log('🏦 LoansPage: פרטים נוכחיים:', details)
                            details.bankCode = bankCode
                            details.bankName = bankName
                            details.branchCode = ''
                            details.branchName = ''
                            const newDetails = JSON.stringify(details)
                            console.log('🏦 LoansPage: פרטים חדשים:', newDetails)
                            handleLoanChange('loanPaymentDetails', newDetails)
                          }}
                          onBranchChange={(branchCode, branchName, branchAddress, city) => {
                            const details = db.parsePaymentDetails('check', currentLoan.loanPaymentDetails) || {}
                            details.branchCode = branchCode
                            details.branchName = branchName
                            details.branchAddress = branchAddress
                            details.city = city
                            details.branch = `${branchName} (${city})` // תאימות לאחור
                            handleLoanChange('loanPaymentDetails', JSON.stringify(details))
                          }}
                          showLabels={false}
                        />
                      </div>
                    </div>
                    <div className="form-row">

                      <div className="form-group">
                        <label>תאריך פדיון:</label>
                        <input
                          type="date"
                          onChange={(e) => {
                            const details = db.parsePaymentDetails('check', currentLoan.loanPaymentDetails) || {}
                            details.dueDate = e.target.value
                            handleLoanChange('loanPaymentDetails', JSON.stringify(details))
                          }}
                          value={db.parsePaymentDetails('check', currentLoan.loanPaymentDetails)?.dueDate || ''}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentLoan.loanPaymentMethod === 'transfer' && (
                  <div style={{ marginTop: '15px' }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>🏦 פרטי ההעברה</h5>
                    <div className="form-row">
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <BankBranchSelector
                          selectedBankCode={db.parsePaymentDetails('transfer', currentLoan.loanPaymentDetails)?.bankCode || ''}
                          selectedBranchCode={db.parsePaymentDetails('transfer', currentLoan.loanPaymentDetails)?.branchCode || ''}
                          onBankChange={(bankCode, bankName) => {
                            const details = db.parsePaymentDetails('transfer', currentLoan.loanPaymentDetails) || {}
                            details.bankCode = bankCode
                            details.bankName = bankName
                            details.branchCode = ''
                            details.branchName = ''
                            handleLoanChange('loanPaymentDetails', JSON.stringify(details))
                          }}
                          onBranchChange={(branchCode, branchName, branchAddress, city) => {
                            const details = db.parsePaymentDetails('transfer', currentLoan.loanPaymentDetails) || {}
                            details.branchCode = branchCode
                            details.branchName = branchName
                            details.branchAddress = branchAddress
                            details.city = city
                            details.branchNumber = branchCode // תאימות לאחור
                            handleLoanChange('loanPaymentDetails', JSON.stringify(details))
                          }}
                          showLabels={true}
                          bankLabel="בנק:"
                          branchLabel="סניף:"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>חשבון:</label>
                        <input
                          type="text"
                          placeholder="חשבון"
                          onChange={(e) => {
                            const details = db.parsePaymentDetails('transfer', currentLoan.loanPaymentDetails) || {}
                            details.accountNumber = e.target.value
                            handleLoanChange('loanPaymentDetails', JSON.stringify(details))
                          }}
                          value={db.parsePaymentDetails('transfer', currentLoan.loanPaymentDetails)?.accountNumber || ''}
                        />
                      </div>
                      <div className="form-group">
                        <label>אסמכתא:</label>
                        <input
                          type="text"
                          placeholder="אסמכתא"
                          onChange={(e) => {
                            const details = db.parsePaymentDetails('transfer', currentLoan.loanPaymentDetails) || {}
                            details.referenceNumber = e.target.value
                            handleLoanChange('loanPaymentDetails', JSON.stringify(details))
                          }}
                          value={db.parsePaymentDetails('transfer', currentLoan.loanPaymentDetails)?.referenceNumber || ''}
                        />
                      </div>
                      <div className="form-group">
                        <label>תאריך:</label>
                        <input
                          type="date"
                          max={new Date().toISOString().split('T')[0]}
                          onChange={(e) => {
                            const details = db.parsePaymentDetails('transfer', currentLoan.loanPaymentDetails) || {}
                            details.transferDate = e.target.value
                            handleLoanChange('loanPaymentDetails', JSON.stringify(details))
                          }}
                          value={db.parsePaymentDetails('transfer', currentLoan.loanPaymentDetails)?.transferDate || ''}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentLoan.loanPaymentMethod === 'credit' && (
                  <div style={{ marginTop: '15px' }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>💳 פרטי האשראי</h5>
                    <div className="form-row">
                      <div className="form-group">
                        <label>4 ספרות אחרונות:</label>
                        <input
                          type="text"
                          placeholder="1234"
                          maxLength={4}
                          onChange={(e) => {
                            const details = db.parsePaymentDetails('credit', currentLoan.loanPaymentDetails) || {}
                            details.lastFourDigits = e.target.value
                            handleLoanChange('loanPaymentDetails', JSON.stringify(details))
                          }}
                          value={db.parsePaymentDetails('credit', currentLoan.loanPaymentDetails)?.lastFourDigits || ''}
                        />
                      </div>
                      <div className="form-group">
                        <label>מספר עסקה:</label>
                        <input
                          type="text"
                          placeholder="מספר עסקה"
                          onChange={(e) => {
                            const details = db.parsePaymentDetails('credit', currentLoan.loanPaymentDetails) || {}
                            details.transactionNumber = e.target.value
                            handleLoanChange('loanPaymentDetails', JSON.stringify(details))
                          }}
                          value={db.parsePaymentDetails('credit', currentLoan.loanPaymentDetails)?.transactionNumber || ''}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentLoan.loanPaymentMethod === 'other' && (
                  <div style={{ marginTop: '15px' }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>❓ פרטים נוספים</h5>
                    <div className="form-group">
                      <label>הסבר:</label>
                      <textarea
                        placeholder="הסבר על אמצעי התשלום"
                        rows={3}
                        onChange={(e) => {
                          const details = { description: e.target.value }
                          handleLoanChange('loanPaymentDetails', JSON.stringify(details))
                        }}
                        value={db.parsePaymentDetails('other', currentLoan.loanPaymentDetails)?.description || ''}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* כותרת מקטע ערבים */}
            <div style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '8px',
              marginBottom: '20px',
              marginTop: '30px',
              fontWeight: 'bold',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 2px 8px rgba(79, 172, 254, 0.3)'
            }}>
              <span style={{ fontSize: '20px' }}>🤝</span>
              פרטי ערבים (אופציונלי)
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>ערב ראשון:</label>
                <select
                  value={currentLoan.guarantor1Id || ''}
                  onChange={(e) => {
                    const guarantorId = e.target.value ? Number(e.target.value) : undefined
                    const guarantor = guarantorId ? guarantors.find(g => g.id === guarantorId) : undefined
                    handleLoanChange('guarantor1Id', guarantorId || 0)
                    handleLoanChange('guarantor1', guarantor ? `${guarantor.firstName} ${guarantor.lastName}` : '')
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">בחר ערב ראשון (אופציונלי)</option>
                  {guarantors
                    .filter(g => g.status === 'active') // רק ערבים פעילים
                    .map(guarantor => (
                      <option key={guarantor.id} value={guarantor.id}>
                        {guarantor.firstName} {guarantor.lastName}
                        {guarantor.phone && ` - ${guarantor.phone}`}
                        {guarantor.activeGuarantees > 0 && ` (${guarantor.activeGuarantees} ערבויות)`}
                      </option>
                    ))
                  }
                </select>
                {currentLoan.guarantor1Id && (() => {
                  const guarantor = guarantors.find(g => g.id === currentLoan.guarantor1Id)
                  return guarantor && (
                    <small style={{
                      display: 'block',
                      marginTop: '5px',
                      color: guarantor.status === 'at_risk' ? '#f39c12' : '#666',
                      fontSize: '12px'
                    }}>
                      {guarantor.status === 'at_risk' && '⚠️ '}
                      ערבויות פעילות: {guarantor.activeGuarantees} |
                      סיכון: ₪{guarantor.totalRisk.toLocaleString()}
                      {guarantor.status === 'at_risk' && ' (בסיכון גבוה)'}
                    </small>
                  )
                })()}
              </div>
              <div className="form-group">
                <label>ערב שני:</label>
                <select
                  value={currentLoan.guarantor2Id || ''}
                  onChange={(e) => {
                    const guarantorId = e.target.value ? Number(e.target.value) : undefined
                    const guarantor = guarantorId ? guarantors.find(g => g.id === guarantorId) : undefined
                    handleLoanChange('guarantor2Id', guarantorId || 0)
                    handleLoanChange('guarantor2', guarantor ? `${guarantor.firstName} ${guarantor.lastName}` : '')
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">בחר ערב שני (אופציונלי)</option>
                  {guarantors
                    .filter(g => g.status === 'active' && g.id !== currentLoan.guarantor1Id) // רק ערבים פעילים ושונים מהערב הראשון
                    .map(guarantor => (
                      <option key={guarantor.id} value={guarantor.id}>
                        {guarantor.firstName} {guarantor.lastName}
                        {guarantor.phone && ` - ${guarantor.phone}`}
                        {guarantor.activeGuarantees > 0 && ` (${guarantor.activeGuarantees} ערבויות)`}
                      </option>
                    ))
                  }
                </select>
                {currentLoan.guarantor2Id && (() => {
                  const guarantor = guarantors.find(g => g.id === currentLoan.guarantor2Id)
                  return guarantor && (
                    <small style={{
                      display: 'block',
                      marginTop: '5px',
                      color: guarantor.status === 'at_risk' ? '#f39c12' : '#666',
                      fontSize: '12px'
                    }}>
                      {guarantor.status === 'at_risk' && '⚠️ '}
                      ערבויות פעילות: {guarantor.activeGuarantees} |
                      סיכון: ₪{guarantor.totalRisk.toLocaleString()}
                      {guarantor.status === 'at_risk' && ' (בסיכון גבוה)'}
                    </small>
                  )
                })()}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>יתרה לפרעון:</label>
                <input
                  type="text"
                  value={selectedLoanId ? db.formatCurrency(db.getLoanBalance(selectedLoanId)) : db.formatCurrency(0)}
                  readOnly
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
              </div>
            </div>


            <div className="form-row" style={{ justifyContent: 'center', gap: '20px' }}>
              <button className="btn btn-success" onClick={saveLoan}>
                שמור הלוואה
              </button>
              <button className="btn btn-primary" onClick={newLoan} style={{ marginRight: '10px' }}>
                הלוואה חדשה
              </button>
              {selectedLoanId && (
                <button
                  className="btn btn-primary"
                  onClick={addPayment}
                  disabled={db.getLoanBalance(selectedLoanId) <= 0}
                  style={{
                    marginRight: '10px',
                    backgroundColor: db.getLoanBalance(selectedLoanId) <= 0 ? '#95a5a6' : undefined
                  }}
                  title={db.getLoanBalance(selectedLoanId) <= 0 ? 'ההלוואה כבר נפרעה במלואה' : 'הוסף פרעון להלוואה'}
                >
                  {db.getLoanBalance(selectedLoanId) <= 0 ? '✅ נפרע במלואה' : 'הוסף פרעון'}
                </button>
              )}

              {selectedBorrowerId && (
                <button
                  className="btn"
                  onClick={() => {
                    // בדיקה אם יש הלוואה חדשה לא שמורה
                    if (!selectedLoanId && ((currentLoan.amount && currentLoan.amount > 0) || currentLoan.guarantor1 || currentLoan.guarantor2)) {
                      showNotification('⚠️ לא ניתן לבצע פרעון מרובה כשיש הלוואה חדשה לא שמורה. אנא שמור את ההלוואה תחילה או בטל אותה.', 'error')
                      return
                    }

                    const borrowerLoans = db.getLoansWithBorrowers().filter(loan =>
                      loan.borrowerId === selectedBorrowerId && loan.balance > 0 && loan.isActive
                    )

                    if (borrowerLoans.length === 0) {
                      showNotification('⚠️ אין הלוואות פעילות ללווה זה', 'error')
                      return
                    }

                    const totalBalance = borrowerLoans.reduce((sum, loan) => sum + loan.balance, 0)

                    // State לאמצעי תשלום בפרעון מרובה
                    let multiplePaymentMethod = ''
                    let multiplePaymentDetails = ''

                    // יצירת מודל מתקדם לפרעון מרובה עם אמצעי תשלום
                    const createMultiplePaymentModal = () => {
                      const modalContent = document.createElement('div')
                      modalContent.innerHTML = `
                        <div style="
                          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                          background: rgba(0,0,0,0.5); display: flex; align-items: center;
                          justify-content: center; z-index: 10000; direction: rtl;
                        ">
                          <div style="
                            background: white; border-radius: 10px; padding: 30px;
                            max-width: 500px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                          ">
                            <h3 style="margin-bottom: 20px; color: #e67e22; text-align: center;">פרעון מרובה הלוואות</h3>
                            <p style="margin-bottom: 15px; text-align: center;">הלוואות פעילות: ${borrowerLoans.length}<br>יתרה כוללת: ₪${totalBalance.toLocaleString()}</p>
                            
                            <div style="margin-bottom: 15px;">
                              <label style="display: block; margin-bottom: 5px; font-weight: bold;">סכום לפרעון:</label>
                              <input type="number" id="multiplePaymentAmount" placeholder="הכנס סכום" style="
                                width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px;
                                font-size: 16px; text-align: center;
                              " />
                            </div>

                            ${db.getSettings().trackPaymentMethods ? `
                              <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">אמצעי פרעון:</label>
                                <select id="multiplePaymentMethodSelect" style="
                                  width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px; font-size: 14px;
                                ">
                                  <option value="">בחר אמצעי תשלום</option>
                                  <option value="cash">💵 מזומן</option>
                                  <option value="transfer">🏦 העברה בנקאית</option>
                                  <option value="check">📝 צ'ק</option>
                                  <option value="credit">💳 אשראי</option>
                                  <option value="other">❓ אחר</option>
                                </select>
                              </div>

                              <div id="multiplePaymentDetailsContainer" style="margin-bottom: 15px; display: none;">
                                <!-- פרטים נוספים יתווספו כאן -->
                              </div>
                            ` : ''}

                            <div style="display: flex; gap: 15px; justify-content: center; margin-top: 20px;">
                              <button id="confirmMultiplePayment" style="
                                background: #e67e22; color: white; border: none; padding: 12px 24px;
                                border-radius: 5px; font-size: 16px; cursor: pointer; font-weight: bold;
                              ">בצע פרעון מרובה</button>
                              <button id="cancelMultiplePayment" style="
                                background: #95a5a6; color: white; border: none; padding: 12px 24px;
                                border-radius: 5px; font-size: 16px; cursor: pointer;
                              ">ביטול</button>
                            </div>
                          </div>
                        </div>
                      `

                      document.body.appendChild(modalContent)

                      // הוספת event listeners
                      const amountInput = modalContent.querySelector('#multiplePaymentAmount') as HTMLInputElement
                      const methodSelect = modalContent.querySelector('#multiplePaymentMethodSelect') as HTMLSelectElement
                      const detailsContainer = modalContent.querySelector('#multiplePaymentDetailsContainer') as HTMLDivElement
                      const confirmBtn = modalContent.querySelector('#confirmMultiplePayment') as HTMLButtonElement
                      const cancelBtn = modalContent.querySelector('#cancelMultiplePayment') as HTMLButtonElement

                      amountInput.focus()

                      // טיפול בשינוי אמצעי תשלום
                      if (methodSelect) {
                        methodSelect.addEventListener('change', (e) => {
                          const method = (e.target as HTMLSelectElement).value
                          multiplePaymentMethod = method

                          if (method && detailsContainer) {
                            detailsContainer.style.display = 'block'
                            detailsContainer.innerHTML = createPaymentDetailsHTML(method)
                            addPaymentDetailsListeners(detailsContainer, method)
                          } else if (detailsContainer) {
                            detailsContainer.style.display = 'none'
                          }
                        })
                      }

                      // אישור פרעון מרובה
                      confirmBtn.addEventListener('click', () => {
                        const amount = Number(amountInput.value)
                        if (!amountInput.value || isNaN(amount) || amount <= 0) {
                          showNotification('⚠️ אנא הכנס סכום תקין', 'error')
                          return
                        }

                        if (amount > totalBalance) {
                          showNotification('⚠️ הסכום גדול מהיתרה הכוללת', 'error')
                          return
                        }

                        performMultiplePayment(borrowerLoans, amount, multiplePaymentMethod || undefined, multiplePaymentDetails || undefined)
                        document.body.removeChild(modalContent)
                      })

                      // ביטול
                      cancelBtn.addEventListener('click', () => {
                        document.body.removeChild(modalContent)
                      })

                      // סגירה בלחיצה על הרקע
                      modalContent.addEventListener('click', (e) => {
                        if (e.target === modalContent) {
                          document.body.removeChild(modalContent)
                        }
                      })
                    }

                    // פונקציה להוספת event listeners לפרטי תשלום במרובה
                    const addPaymentDetailsListeners = (container: HTMLDivElement, method: string) => {
                      const inputs = container.querySelectorAll('input, textarea')
                      inputs.forEach(input => {
                        input.addEventListener('input', () => {
                          const details: any = {}

                          switch (method) {
                            case 'check':
                              details.checkNumber = (container.querySelector('#checkNumber') as HTMLInputElement)?.value || ''
                              details.bank = (container.querySelector('#bank') as HTMLInputElement)?.value || ''
                              details.branch = (container.querySelector('#branch') as HTMLInputElement)?.value || ''
                              details.dueDate = (container.querySelector('#dueDate') as HTMLInputElement)?.value || ''
                              break
                            case 'transfer':
                              const bankSelect = container.querySelector('#bankSelect') as HTMLSelectElement
                              const selectedBankCode = bankSelect?.value || ''
                              const selectedBankName = bankSelect?.selectedOptions[0]?.text?.split(' - ')[1] || ''

                              details.referenceNumber = (container.querySelector('#referenceNumber') as HTMLInputElement)?.value || ''
                              details.bankCode = selectedBankCode
                              details.bankName = selectedBankName
                              details.branchNumber = (container.querySelector('#branchNumber') as HTMLInputElement)?.value || ''
                              details.accountNumber = (container.querySelector('#accountNumber') as HTMLInputElement)?.value || ''
                              details.transferDate = (container.querySelector('#transferDate') as HTMLInputElement)?.value || ''
                              break
                            case 'credit':
                              details.lastFourDigits = (container.querySelector('#lastFourDigits') as HTMLInputElement)?.value || ''
                              details.transactionNumber = (container.querySelector('#transactionNumber') as HTMLInputElement)?.value || ''
                              break
                            case 'other':
                              details.description = (container.querySelector('#description') as HTMLTextAreaElement)?.value || ''
                              break
                          }

                          multiplePaymentDetails = JSON.stringify(details)
                        })
                      })
                    }

                    // פונקציה ליצירת HTML לפרטי תשלום במרובה (זהה לפונקציה הרגילה)
                    const createPaymentDetailsHTML = (method: string): string => {
                      switch (method) {
                        case 'check':
                          return `
                            <h5 style="margin: 0 0 10px 0; color: #666; font-size: 14px;">📝 פרטי הצ'ק</h5>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                              <div>
                                <label style="display: block; margin-bottom: 3px; font-size: 12px;">מספר צ'ק:</label>
                                <input type="text" id="checkNumber" placeholder="מספר הצ'ק" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                              </div>
                              <div>
                                <label style="display: block; margin-bottom: 3px; font-size: 12px;">בנק:</label>
                                <input type="text" id="bank" placeholder="שם הבנק" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                              </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                              <div>
                                <label style="display: block; margin-bottom: 3px; font-size: 12px;">סניף:</label>
                                <input type="text" id="branch" placeholder="מספר סניף" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                              </div>
                              <div>
                                <label style="display: block; margin-bottom: 3px; font-size: 12px;">תאריך פדיון:</label>
                                <input type="date" id="dueDate" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                              </div>
                            </div>
                          `
                        case 'transfer':
                          return `
                            <h5 style="margin: 0 0 10px 0; color: #666; font-size: 14px;">🏦 פרטי ההעברה</h5>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                              <div>
                                <label style="display: block; margin-bottom: 3px; font-size: 12px;">מספר אסמכתא:</label>
                                <input type="text" id="referenceNumber" placeholder="מספר אסמכתא" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                              </div>
                              <div>
                                <label style="display: block; margin-bottom: 3px; font-size: 12px;">בנק:</label>
                                <select id="bankSelect" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                  <option value="">בחר בנק</option>
                                  <option value="10">10 - בנק לאומי</option>
                                  <option value="11">11 - בנק דיסקונט</option>
                                  <option value="12">12 - בנק הפועלים</option>
                                  <option value="13">13 - בנק איגוד</option>
                                  <option value="14">14 - בנק אוצר החייל</option>
                                  <option value="15">15 - בנק ירושלים</option>
                                  <option value="16">16 - בנק מרכנתיל</option>
                                  <option value="17">17 - בנק מזרחי טפחות</option>
                                  <option value="18">18 - בנק הבינלאומי</option>
                                  <option value="19">19 - בנק יהב</option>
                                  <option value="20">20 - בנק מסד</option>
                                  <option value="31">31 - בנק הדואר</option>
                                  <option value="99">99 - בנק אחר</option>
                                </select>
                              </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                              <div>
                                <label style="display: block; margin-bottom: 3px; font-size: 12px;">מספר סניף:</label>
                                <input type="text" id="branchNumber" placeholder="מספר סניף" maxlength="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                              </div>
                              <div>
                                <label style="display: block; margin-bottom: 3px; font-size: 12px;">מספר חשבון:</label>
                                <input type="text" id="accountNumber" placeholder="מספר חשבון" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                              </div>
                            </div>
                            <div>
                              <label style="display: block; margin-bottom: 3px; font-size: 12px;">תאריך העברה:</label>
                              <input type="date" id="transferDate" max="${new Date().toISOString().split('T')[0]}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                            </div>
                          `
                        case 'credit':
                          return `
                            <h5 style="margin: 0 0 10px 0; color: #666; font-size: 14px;">💳 פרטי האשראי</h5>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                              <div>
                                <label style="display: block; margin-bottom: 3px; font-size: 12px;">4 ספרות אחרונות:</label>
                                <input type="text" id="lastFourDigits" placeholder="1234" maxlength="4" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                              </div>
                              <div>
                                <label style="display: block; margin-bottom: 3px; font-size: 12px;">מספר עסקה:</label>
                                <input type="text" id="transactionNumber" placeholder="מספר עסקה" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                              </div>
                            </div>
                          `
                        case 'other':
                          return `
                            <h5 style="margin: 0 0 10px 0; color: #666; font-size: 14px;">❓ פרטים נוספים</h5>
                            <div>
                              <label style="display: block; margin-bottom: 3px; font-size: 12px;">הסבר:</label>
                              <textarea id="description" placeholder="הסבר על אמצעי התשלום" rows="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"></textarea>
                            </div>
                          `
                        default:
                          return ''
                      }
                    }

                    createMultiplePaymentModal()

                    return // יציאה מהפונקציה כדי לא להמשיך עם הקוד הישן

                  }}
                  style={{
                    backgroundColor: '#e67e22',
                    color: 'white',
                    marginRight: '10px'
                  }}
                  title="פרע מספר הלוואות יחד - הפרעון יחולק לפי סדר ההלוואות"
                >
                  💰 פרעון מרובה
                </button>
              )}
              {selectedLoanId && (
                <>
                  <button
                    className="btn"
                    onClick={() => generateLoanDocument(false)}
                    style={{
                      backgroundColor: db.getLoanBalance(selectedLoanId) <= 0 ? '#27ae60' : '#9b59b6',
                      color: 'white',
                      marginRight: '10px'
                    }}
                    title={db.getLoanBalance(selectedLoanId) <= 0 ? 'הדפס שטר הלוואה (נפרע)' : 'הדפס שטר הלוואה'}
                  >
                    {db.getLoanBalance(selectedLoanId) <= 0 ? '📄 שטר (נפרע)' : '📄 הפק שטר'}
                  </button>
                  <button
                    className="btn"
                    onClick={() => generateLoanDocument(true)}
                    style={{
                      backgroundColor: '#3498db',
                      color: 'white',
                      marginRight: '10px'
                    }}
                    title="הדפס שטר עם שדות ריקים לערבים - מתאים כשעדיין לא ידוע מי יערוב"
                  >
                    📝 שטר עם ערבים ריקים
                  </button>
                </>
              )}
              {(window as any).electronAPI && selectedLoanId && (
                <button
                  className="btn"
                  onClick={() => handlePrintToPDF(selectedLoanId)}
                  style={{
                    backgroundColor: '#e67e22',
                    color: 'white',
                    marginRight: '10px'
                  }}
                  title="שמור שטר הלוואה כקובץ PDF"
                >
                  📁 שמור PDF
                </button>
              )}
              {selectedLoanId && (
                <>
                  <button
                    className="btn"
                    onClick={toggleAdvancedEdit}
                    style={{
                      backgroundColor: isAdvancedEditMode ? '#e74c3c' : '#f39c12',
                      color: 'white',
                      marginRight: '10px'
                    }}
                    title={isAdvancedEditMode ? 'כבה עריכה מתקדמת' : 'הפעל עריכה מתקדמת לשינוי סכום ההלוואה'}
                  >
                    {isAdvancedEditMode ? '🔒 כבה עריכה מתקדמת' : '🔓 עריכה מתקדמת'}
                  </button>

                  {isAdvancedEditMode && selectedLoanId && (
                    <button
                      className="btn"
                      onClick={() => {
                        showConfirmModal({
                          title: 'מחיקת הלוואה',
                          message: 'אזהרה: מחיקת הלוואה!\n\n⚠️ שים לב: לא ניתן למחוק הלוואה עם תשלומים קיימים.\nרק הלוואות ללא תשלומים יכולות להימחק.\n\nהאם אתה בטוח שברצונך להמשיך?',
                          confirmText: 'מחק הלוואה',
                          cancelText: 'ביטול',
                          type: 'danger',
                          onConfirm: () => {
                            const success = db.deleteLoan(selectedLoanId)
                            if (success) {
                              showNotification('✅ ההלוואה נמחקה בהצלחה!')

                              // אפס את כל הנתונים מיידית
                              setSelectedLoanId(null)
                              setPayments([])
                              setIsAdvancedEditMode(false)

                              // וודא שהעדכון מתבצע
                              setTimeout(() => {
                                setSelectedLoanId(null)
                                setIsAdvancedEditMode(false)
                              }, 10)

                              // אפס את טופס ההלוואה לחלוטין
                              if (selectedBorrowerId) {
                                setCurrentLoan({
                                  borrowerId: selectedBorrowerId,
                                  amount: undefined,
                                  loanDate: new Date().toISOString().split('T')[0],
                                  returnDate: '',
                                  loanType: 'fixed',
                                  isRecurring: false,
                                  recurringDay: 1,
                                  autoPayment: false,
                                  autoPaymentAmount: 0,
                                  autoPaymentDay: 1,
                                  notes: '',
                                  guarantor1: '',
                                  guarantor2: ''
                                })
                              } else {
                                // אם אין לווה נבחר, אפס הכל
                                setCurrentLoan({
                                  borrowerId: 0,
                                  amount: undefined,
                                  loanDate: new Date().toISOString().split('T')[0],
                                  returnDate: '',
                                  loanType: 'fixed',
                                  isRecurring: false,
                                  recurringDay: 1,
                                  autoPayment: false,
                                  autoPaymentAmount: 0,
                                  autoPaymentDay: 1,
                                  notes: '',
                                  guarantor1: '',
                                  guarantor2: ''
                                })
                              }

                              loadData()
                            } else {
                              showNotification('⚠️ לא ניתן למחוק הלוואה עם תשלומים קיימים', 'error')
                            }
                          }
                        })
                      }}
                      style={{
                        backgroundColor: '#c0392b',
                        color: 'white',
                        marginLeft: '10px'
                      }}
                      title="מחק הלוואה (זמין רק במצב עריכה מתקדמת)"
                    >
                      🗑️ מחק הלוואה
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {selectedLoanId && payments.length > 0 && (
          <div style={{ marginTop: '30px' }}>
            <h4 style={{ marginBottom: '15px', color: '#2c3e50' }}>
              תשלומים להלוואה #{selectedLoanId}
              {selectedLoanId && db.getLoanBalance(selectedLoanId) <= 0 && (
                <span style={{
                  marginRight: '10px',
                  background: '#27ae60',
                  color: 'white',
                  padding: '5px 10px',
                  borderRadius: '15px',
                  fontSize: '12px'
                }}>
                  ✅ נפרע במלואה
                </span>
              )}
            </h4>
            <table className="table">
              <thead>
                <tr>
                  <th>תאריך</th>
                  <th>סוג</th>
                  <th>סכום</th>
                  <th>שולם על ידי</th>
                  <th>אמצעי תשלום</th>
                  <th>הערות</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const paymentMethodIcon = payment.paymentMethod ?
                    (payment.paymentMethod === 'cash' ? '💵' :
                      payment.paymentMethod === 'transfer' ? '🏦' :
                        payment.paymentMethod === 'check' ? '📝' :
                          payment.paymentMethod === 'credit' ? '💳' : '❓') : ''

                  const paymentMethodName = payment.paymentMethod ?
                    (payment.paymentMethod === 'cash' ? 'מזומן' :
                      payment.paymentMethod === 'transfer' ? 'העברה' :
                        payment.paymentMethod === 'check' ? 'צ\'ק' :
                          payment.paymentMethod === 'credit' ? 'אשראי' : 'אחר') : ''

                  const paymentDetails = payment.paymentDetails ?
                    db.getPaymentDetailsDisplay(payment.paymentMethod || '', payment.paymentDetails) : ''

                  return (
                    <tr key={payment.id}>
                      <td>
                        {db.getSettings().showHebrewDates ?
                          formatCombinedDate(payment.date) :
                          new Date(payment.date).toLocaleDateString('he-IL')
                        }
                      </td>
                      <td>
                        <span style={{
                          background: payment.type === 'loan' ? '#e74c3c' : '#27ae60',
                          color: 'white',
                          padding: '3px 8px',
                          borderRadius: '10px',
                          fontSize: '12px'
                        }}>
                          {payment.type === 'loan' ? '💸 הלוואה' : '💰 פרעון'}
                        </span>
                      </td>
                      <td style={{
                        color: payment.type === 'loan' ? '#e74c3c' : '#27ae60',
                        fontWeight: 'bold'
                      }}>
                        ₪{payment.amount.toLocaleString()}
                      </td>
                      <td>
                        {payment.paidBy === 'guarantor' ? (
                          <span style={{
                            background: '#fb923c',
                            color: 'white',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '12px'
                          }}>
                            🤝 {payment.guarantorName || 'ערב'}
                          </span>
                        ) : (
                          <span style={{
                            background: '#3b82f6',
                            color: 'white',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '12px'
                          }}>
                            👤 לווה
                          </span>
                        )}
                      </td>
                      <td>
                        {paymentMethodIcon && paymentMethodName ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px' }}>
                              {paymentMethodIcon} {paymentMethodName}
                            </span>
                            {paymentDetails && (
                              <button
                                style={{
                                  background: '#3498db',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title={paymentDetails}
                                onClick={() => {
                                  // הצגת מודל גדול עם פרטי התשלום
                                  showConfirmModal({
                                    title: `פרטי תשלום - ${paymentMethodName}`,
                                    message: `תאריך: ${db.getSettings().showHebrewDates ? formatCombinedDate(payment.date) : new Date(payment.date).toLocaleDateString('he-IL')}\n\nסכום: ₪${payment.amount.toLocaleString()}\n\nאמצעי תשלום: ${paymentMethodIcon} ${paymentMethodName}\n\n${paymentDetails}\n\n${payment.notes ? `הערות: ${payment.notes}` : ''}`,
                                    confirmText: 'סגור',
                                    type: 'info',
                                    onConfirm: () => { }
                                  })
                                }}
                              >
                                ℹ️
                              </button>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#999', fontSize: '12px' }}>לא צוין</span>
                        )}
                      </td>
                      <td style={{ fontSize: '12px', maxWidth: '150px' }}>
                        {payment.notes || '-'}
                      </td>
                      <td>
                        {payment.type === 'payment' && (
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            <button
                              className="btn"
                              onClick={() => generatePaymentReceipt(payment)}
                              style={{
                                padding: '5px 10px',
                                fontSize: '12px',
                                backgroundColor: '#3498db',
                                color: 'white'
                              }}
                              title="הפק שובר פרעון"
                            >
                              📄 שובר
                            </button>
                            {(window as any).electronAPI && (
                              <button
                                className="btn"
                                onClick={() => handlePrintReceiptToPDF(payment)}
                                style={{
                                  padding: '5px 10px',
                                  fontSize: '12px',
                                  backgroundColor: '#9b59b6',
                                  color: 'white'
                                }}
                                title="שמור שובר פרעון כקובץ PDF"
                              >
                                📁 PDF
                              </button>
                            )}
                            <button
                              className="btn"
                              onClick={() => deletePayment(payment.id)}
                              style={{
                                padding: '5px 10px',
                                fontSize: '12px',
                                backgroundColor: '#e74c3c',
                                color: 'white'
                              }}
                            >
                              מחק
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* הלוואות פעילות של הלווה הנבחר */}
        {selectedBorrowerId && mode !== 'payment-details' && (() => {
          const activeLoans = loans.filter(loan =>
            loan.borrowerId === selectedBorrowerId &&
            loan.status === 'active' &&
            new Date(loan.loanDate) <= new Date()
          )

          return activeLoans.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{
                  color: '#27ae60',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  margin: 0
                }}>
                  💰 הלוואות פעילות של הלווה ({activeLoans.length})
                </h4>
              </div>

              <table className="table">
                <thead>
                  <tr>
                    <th>סכום</th>
                    <th>תאריך הלוואה</th>
                    <th>תאריך החזרה</th>
                    <th>יתרה</th>
                    <th>סטטוס</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLoans.map((loan) => {
                    const balance = db.getLoanBalance(loan.id)
                    const returnDate = new Date(loan.returnDate)
                    const today = new Date()
                    const isOverdue = returnDate < today
                    const daysOverdue = isOverdue ? Math.floor((today.getTime() - returnDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

                    return (
                      <tr key={loan.id}>
                        <td style={{ color: '#27ae60', fontWeight: 'bold' }}>
                          {db.formatCurrency(loan.amount)}
                        </td>
                        <td>
                          {db.getSettings().showHebrewDates ?
                            formatCombinedDate(loan.loanDate) :
                            new Date(loan.loanDate).toLocaleDateString('he-IL')
                          }
                        </td>
                        <td>
                          {loan.loanType === 'flexible' ?
                            <span style={{ color: '#f39c12', fontStyle: 'italic' }}>לפי התראה</span> :
                            (db.getSettings().showHebrewDates ?
                              formatCombinedDate(loan.returnDate) :
                              new Date(loan.returnDate).toLocaleDateString('he-IL')
                            )
                          }
                        </td>
                        <td style={{ color: balance > 0 ? '#e74c3c' : '#27ae60', fontWeight: 'bold' }}>
                          {db.formatCurrency(balance)}
                        </td>
                        <td>
                          {isOverdue ? (
                            <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                              ⚠️ איחור {daysOverdue} ימים
                            </span>
                          ) : (
                            <span style={{ color: '#27ae60' }}>🔴 פעיל</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        })()}

        {/* הלוואות עתידיות של הלווה הנבחר */}
        {selectedBorrowerId && mode !== 'payment-details' && (() => {
          const futureLoans = db.getFutureLoansWithBorrowers().filter(loan => loan.borrowerId === selectedBorrowerId)



          return futureLoans.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{
                  color: '#3498db',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  margin: 0
                }}>
                  🕐 הלוואות מתוכננות של הלווה ({futureLoans.length})
                  <span style={{
                    background: '#3498db',
                    color: 'white',
                    padding: '3px 8px',
                    borderRadius: '10px',
                    fontSize: '12px'
                  }}>
                    לא פעילות עדיין
                  </span>
                </h4>


              </div>

              <table className="table">
                <thead>
                  <tr>
                    <th>סכום</th>
                    <th>תאריך הלוואה</th>
                    <th>תאריך החזרה</th>
                    <th>ימים עד הפעלה</th>
                    <th>הערות</th>

                  </tr>
                </thead>
                <tbody>
                  {futureLoans.map((loan) => (
                    <tr
                      key={loan.id}
                      style={{
                        background: 'rgba(52, 152, 219, 0.05)',
                        cursor: 'pointer'
                      }}

                    >
                      <td style={{ color: '#3498db', fontWeight: 'bold' }}>
                        {db.formatCurrency(loan.amount)}
                      </td>
                      <td>
                        {(() => {
                          const showHebrew = db.getSettings().showHebrewDates
                          console.log('💰 LoansPage - תאריך הלוואה:', { showHebrew, loanDate: loan.loanDate })
                          return showHebrew ?
                            formatCombinedDate(loan.loanDate) :
                            new Date(loan.loanDate).toLocaleDateString('he-IL')
                        })()}
                      </td>
                      <td>
                        {loan.loanType === 'flexible' ?
                          <span style={{ color: '#f39c12', fontStyle: 'italic' }}>לפי התראה</span> :
                          (db.getSettings().showHebrewDates ?
                            formatCombinedDate(loan.returnDate) :
                            new Date(loan.returnDate).toLocaleDateString('he-IL')
                          )
                        }
                      </td>
                      <td>
                        <span style={{
                          background: loan.daysUntilActive <= 7 ? '#f39c12' : '#3498db',
                          color: 'white',
                          padding: '3px 8px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {loan.daysUntilActive === 1 ? 'מחר' :
                            loan.daysUntilActive === 0 ? 'היום' :
                              `${loan.daysUntilActive} ימים`}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', maxWidth: '150px' }}>
                        {loan.notes || '-'}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })()}

      </div>

      <button className="back-btn" onClick={() => navigate('/')}>
        🏠
      </button>

      {/* מצב השלמת פרטי תשלום */}
      {mode === 'payment-details' && db.getSettings().trackPaymentMethods && (
        <div className="form-container">
          <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#f39c12' }}>
            ⚠️ השלמת פרטי תשלום
          </h3>

          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '5px' }}>
            <p style={{ margin: 0, textAlign: 'center' }}>
              <strong>הפריטים הבאים נוצרו אוטומטית ודורשים השלמת פרטי תשלום:</strong>
            </p>
          </div>

          {(() => {
            const incompleteLoans = db.getLoansRequiringPaymentDetails()
            const incompletePayments = db.getPaymentsRequiringPaymentDetails()

            return (
              <>
                {/* הלוואות שדורשות השלמת פרטים */}
                {incompleteLoans.length > 0 && (
                  <div style={{ marginBottom: '30px' }}>
                    <h4 style={{ color: '#e74c3c', marginBottom: '15px' }}>
                      💸 הלוואות שדורשות השלמת פרטים ({incompleteLoans.length})
                    </h4>

                    <table className="table">
                      <thead>
                        <tr>
                          <th>לווה</th>
                          <th>סכום</th>
                          <th>תאריך הלוואה</th>
                          <th>אמצעי תשלום נוכחי</th>
                          <th>פעולות</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incompleteLoans.map(loan => {
                          const borrower = borrowers.find(b => b.id === loan.borrowerId)
                          const borrowerName = borrower ? `${borrower.firstName} ${borrower.lastName}` : 'לא ידוע'
                          const currentMethod = loan.loanPaymentMethod ?
                            db.getPaymentMethodDisplay(loan.loanPaymentMethod) :
                            '❓ לא הוגדר'

                          return (
                            <tr key={loan.id}>
                              <td>{borrowerName}</td>
                              <td style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                                {db.formatCurrency(loan.amount)}
                              </td>
                              <td>
                                {db.getSettings().showHebrewDates ?
                                  formatCombinedDate(loan.loanDate) :
                                  new Date(loan.loanDate).toLocaleDateString('he-IL')
                                }
                              </td>
                              <td>{currentMethod}</td>
                              <td>
                                <button
                                  className="btn"
                                  onClick={() => openPaymentDetailsModal('loan', loan.id)}
                                  style={{
                                    backgroundColor: '#3498db',
                                    color: 'white',
                                    padding: '5px 10px',
                                    fontSize: '12px'
                                  }}
                                >
                                  ✏️ עדכן פרטים
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* פרעונות שדורשים השלמת פרטים */}
                {incompletePayments.length > 0 && (
                  <div style={{ marginBottom: '30px' }}>
                    <h4 style={{ color: '#27ae60', marginBottom: '15px' }}>
                      💰 פרעונות שדורשים השלמת פרטים ({incompletePayments.length})
                    </h4>

                    <table className="table">
                      <thead>
                        <tr>
                          <th>לווה</th>
                          <th>סכום פרעון</th>
                          <th>תאריך פרעון</th>
                          <th>אמצעי תשלום נוכחי</th>
                          <th>פעולות</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incompletePayments.map(payment => {
                          const loan = loans.find(l => l.id === payment.loanId)
                          const borrower = loan ? borrowers.find(b => b.id === loan.borrowerId) : null
                          const borrowerName = borrower ? `${borrower.firstName} ${borrower.lastName}` : 'לא ידוע'
                          const currentMethod = payment.paymentMethod ?
                            db.getPaymentMethodDisplay(payment.paymentMethod) :
                            '❓ לא הוגדר'

                          return (
                            <tr key={payment.id}>
                              <td>{borrowerName}</td>
                              <td style={{ color: '#27ae60', fontWeight: 'bold' }}>
                                {db.formatCurrency(payment.amount)}
                              </td>
                              <td>
                                {db.getSettings().showHebrewDates ?
                                  formatCombinedDate(payment.date) :
                                  new Date(payment.date).toLocaleDateString('he-IL')
                                }
                              </td>
                              <td>{currentMethod}</td>
                              <td>
                                <button
                                  className="btn"
                                  onClick={() => openPaymentDetailsModal('payment', payment.id)}
                                  style={{
                                    backgroundColor: '#3498db',
                                    color: 'white',
                                    padding: '5px 10px',
                                    fontSize: '12px'
                                  }}
                                >
                                  ✏️ עדכן פרטים
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* אם אין פריטים שדורשים השלמה */}
                {incompleteLoans.length === 0 && incompletePayments.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    backgroundColor: '#d5f4e6',
                    border: '2px solid #27ae60',
                    borderRadius: '10px',
                    color: '#27ae60'
                  }}>
                    <h3>🎉 כל הפרטים הושלמו!</h3>
                    <p>כל ההלוואות והפרעונות כוללים פרטי תשלום מלאים.</p>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}

      {/* מודל עדכון פרטי תשלום */}
      {paymentDetailsModal && paymentDetailsModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={closePaymentDetailsModal}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '10px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              direction: 'rtl'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '20px', textAlign: 'center', color: '#2c3e50' }}>
              עדכון פרטי תשלום
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                אמצעי תשלום:
              </label>
              <select
                value={paymentDetailsForm.paymentMethod}
                onChange={(e) => handlePaymentDetailsFormChange('paymentMethod', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              >
                <option value="">בחר אמצעי תשלום</option>
                <option value="cash">💵 מזומן</option>
                <option value="transfer">🏦 העברה בנקאית</option>
                <option value="check">📝 צ'ק</option>
                <option value="credit">💳 אשראי</option>
                <option value="other">❓ אחר</option>
              </select>
            </div>

            {/* פרטים להעברה בנקאית */}
            {paymentDetailsForm.paymentMethod === 'transfer' && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                <h4 style={{ marginBottom: '15px', color: '#2c3e50' }}>פרטי העברה בנקאית:</h4>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    מספר אסמכתא:
                  </label>
                  <input
                    type="text"
                    value={paymentDetailsForm.referenceNumber}
                    onChange={(e) => handlePaymentDetailsFormChange('referenceNumber', e.target.value)}
                    placeholder="הזן מספר אסמכתא (אופציונלי)"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <BankBranchSelector
                    selectedBankCode={paymentDetailsForm.bankCode}
                    selectedBranchCode={paymentDetailsForm.branchCode}
                    onBankChange={(bankCode, bankName) => {
                      setPaymentDetailsForm(prev => ({
                        ...prev,
                        bankCode,
                        bankName,
                        branchCode: '',
                        branchName: '',
                        branchAddress: '',
                        city: ''
                      }))
                    }}
                    onBranchChange={(branchCode, branchName, branchAddress, city) => {
                      setPaymentDetailsForm(prev => ({
                        ...prev,
                        branchCode,
                        branchName,
                        branchAddress,
                        city,
                        branchNumber: branchCode // עדכן גם את branchNumber לתאימות לאחור
                      }))
                    }}
                    bankLabel="בנק:"
                    branchLabel="סניף:"
                  />
                </div>

                <div style={{ marginTop: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      מספר חשבון:
                    </label>
                    <input
                      type="text"
                      value={paymentDetailsForm.accountNumber}
                      onChange={(e) => handlePaymentDetailsFormChange('accountNumber', e.target.value)}
                      placeholder="למשל: 789123"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #ddd',
                        borderRadius: '5px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    תאריך העברה:
                  </label>
                  <input
                    type="date"
                    value={paymentDetailsForm.transferDate}
                    onChange={(e) => handlePaymentDetailsFormChange('transferDate', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            )}

            {/* פרטים לצ'ק */}
            {paymentDetailsForm.paymentMethod === 'check' && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                <h4 style={{ marginBottom: '15px', color: '#2c3e50' }}>פרטי צ'ק:</h4>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#e74c3c' }}>
                    מספר צ'ק: *
                  </label>
                  <input
                    type="text"
                    value={paymentDetailsForm.checkNumber}
                    onChange={(e) => handlePaymentDetailsFormChange('checkNumber', e.target.value)}
                    placeholder="הזן מספר צ'ק"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    בנק:
                  </label>
                  <BankBranchSelector
                    selectedBankCode={paymentDetailsForm.bankCode}
                    selectedBranchCode={paymentDetailsForm.branchCode}
                    onBankChange={(bankCode, bankName) => {
                      setPaymentDetailsForm(prev => ({
                        ...prev,
                        bankCode,
                        bankName,
                        branchCode: '',
                        branchName: '',
                        branchAddress: '',
                        city: ''
                      }))
                    }}
                    onBranchChange={(branchCode, branchName, branchAddress, city) => {
                      setPaymentDetailsForm(prev => ({
                        ...prev,
                        branchCode,
                        branchName,
                        branchAddress,
                        city,
                        branch: `${branchName} (${city})` // עדכן גם את branch לתאימות לאחור
                      }))
                    }}
                    bankLabel="בנק:"
                    branchLabel="סניף:"
                  />
                </div>

                <div style={{ marginTop: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      תאריך פדיון:
                    </label>
                    <input
                      type="date"
                      value={paymentDetailsForm.dueDate}
                      onChange={(e) => handlePaymentDetailsFormChange('dueDate', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #ddd',
                        borderRadius: '5px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* פרטים לאשראי */}
            {paymentDetailsForm.paymentMethod === 'credit' && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                <h4 style={{ marginBottom: '15px', color: '#2c3e50' }}>פרטי אשראי:</h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#e74c3c' }}>
                      4 ספרות אחרונות: *
                    </label>
                    <input
                      type="text"
                      value={paymentDetailsForm.lastFourDigits}
                      onChange={(e) => handlePaymentDetailsFormChange('lastFourDigits', e.target.value)}
                      placeholder="1234"
                      maxLength={4}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #ddd',
                        borderRadius: '5px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      מספר עסקה:
                    </label>
                    <input
                      type="text"
                      value={paymentDetailsForm.transactionNumber}
                      onChange={(e) => handlePaymentDetailsFormChange('transactionNumber', e.target.value)}
                      placeholder="מספר עסקה (אופציונלי)"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #ddd',
                        borderRadius: '5px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* פרטים לאחר */}
            {paymentDetailsForm.paymentMethod === 'other' && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                <h4 style={{ marginBottom: '15px', color: '#2c3e50' }}>פרטים נוספים:</h4>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#e74c3c' }}>
                    תיאור: *
                  </label>
                  <textarea
                    value={paymentDetailsForm.description}
                    onChange={(e) => handlePaymentDetailsFormChange('description', e.target.value)}
                    placeholder="תאר את אמצעי התשלום"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px' }}>
              <button
                onClick={savePaymentDetails}
                style={{
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                ✅ שמור פרטים
              </button>
              <button
                onClick={closePaymentDetailsModal}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ❌ ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* מודל אישור */}
      {
        modalConfig && modalConfig.isOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000
            }}
            onClick={closeModal}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '10px',
                padding: '30px',
                maxWidth: modalConfig.type === 'info' ? '600px' : '400px',
                width: '90%',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                textAlign: modalConfig.type === 'info' ? 'right' : 'center',
                direction: 'rtl'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{
                marginBottom: '20px',
                color: modalConfig.type === 'danger' ? '#e74c3c' :
                  modalConfig.type === 'warning' ? '#f39c12' : '#3498db',
                fontSize: '20px'
              }}>
                {modalConfig.title}
              </h3>

              <div style={{
                marginBottom: modalConfig.hasInput ? '20px' : '30px',
                lineHeight: '1.6',
                fontSize: modalConfig.type === 'info' ? '15px' : '16px',
                color: '#2c3e50',
                whiteSpace: 'pre-line',
                textAlign: modalConfig.type === 'info' ? 'right' : 'center'
              }}>
                {modalConfig.type === 'info' && modalConfig.message.includes('אמצעי תשלום:') ? (
                  // תצוגה מיוחדת לפרטי תשלום
                  <div style={{
                    background: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    {modalConfig.message.split('\n').map((line, index) => {
                      // דלג על שורות ריקות
                      if (!line.trim()) return null

                      return (
                        <div key={index} style={{ marginBottom: '8px' }}>
                          {line.includes(':') && !line.includes('תאריך:') && !line.includes('סכום:') ? (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ color: '#495057' }}>{line.split(':')[0]}:</strong>
                              <span style={{ color: '#6c757d', fontWeight: 'normal' }}>{line.split(':').slice(1).join(':').trim()}</span>
                            </div>
                          ) : (
                            <div style={{
                              color: line.includes('תאריך:') || line.includes('סכום:') ? '#2c3e50' : '#6c757d',
                              fontWeight: line.includes('תאריך:') || line.includes('סכום:') ? 'bold' : 'normal'
                            }}>
                              {line}
                            </div>
                          )}
                        </div>
                      )
                    }).filter(Boolean)}
                  </div>
                ) : (
                  modalConfig.message
                )}
              </div>

              {modalConfig.hasInput && (
                <div style={{ marginBottom: '20px' }}>
                  <input
                    type="number"
                    value={modalInputValue}
                    onChange={(e) => setModalInputValue(e.target.value)}
                    placeholder={modalConfig.inputPlaceholder || 'הכנס סכום'}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      border: '2px solid #ddd',
                      borderRadius: '5px',
                      textAlign: 'center',
                      direction: 'ltr'
                    }}
                    autoFocus
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    modalConfig.onConfirm(modalInputValue)
                    closeModal()
                  }}
                  style={{
                    backgroundColor: modalConfig.type === 'danger' ? '#e74c3c' :
                      modalConfig.type === 'warning' ? '#f39c12' : '#3498db',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '5px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {modalConfig.confirmText}
                </button>

                {modalConfig.type !== 'info' && (
                  <button
                    onClick={() => {
                      if (modalConfig.onCancel) modalConfig.onCancel()
                      closeModal()
                    }}
                    style={{
                      backgroundColor: '#95a5a6',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '5px',
                      fontSize: '16px',
                      cursor: 'pointer'
                    }}
                  >
                    {modalConfig.cancelText}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      }


      {/* מודל רישום פרעון לחוב ערב */}
      {showGuarantorDebtPaymentModal && selectedGuarantorDebt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          direction: 'rtl'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#ea580c' }}>💰 רישום פרעון לחוב ערב</h3>
            
            <div style={{ marginBottom: '20px', padding: '15px', background: '#fff7ed', borderRadius: '10px' }}>
              <div style={{ fontSize: '14px', color: '#9a3412' }}>
                <div><strong>חוב ערב #{selectedGuarantorDebt.id}</strong></div>
                <div style={{ marginTop: '5px' }}>סכום חוב: ₪{selectedGuarantorDebt.amount.toLocaleString()}</div>
                <div>יתרה: ₪{db.getGuarantorDebtBalance(selectedGuarantorDebt.id).toLocaleString()}</div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                סכום פרעון:
              </label>
              <input
                type="number"
                id="guarantorDebtPaymentAmount"
                step="0.01"
                min="0"
                max={db.getGuarantorDebtBalance(selectedGuarantorDebt.id)}
                placeholder="הכנס סכום"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowGuarantorDebtPaymentModal(false)
                  setSelectedGuarantorDebt(null)
                }}
                style={{
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                ביטול
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('guarantorDebtPaymentAmount') as HTMLInputElement
                  const amount = parseFloat(input.value)
                  if (!amount || amount <= 0) {
                    showNotification('⚠️ אנא הכנס סכום תקין', 'error')
                    return
                  }
                  recordGuarantorDebtPayment(selectedGuarantorDebt.id, amount)
                }}
                style={{
                  background: '#ea580c',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 'bold'
                }}
              >
                ✅ אשר פרעון
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  )
}

export default LoansPage
