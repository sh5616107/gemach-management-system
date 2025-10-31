import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { db, DatabaseLoan, DatabasePayment, DatabaseBorrower } from '../database/database'
import NumberInput from '../components/NumberInput'
import { formatCombinedDate, formatHebrewDateOnly } from '../utils/hebrewDate'

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
    address: '',
    email: '',
    idNumber: ''
  })

  const [currentLoan, setCurrentLoan] = useState<Partial<DatabaseLoan>>({
    borrowerId: 0,
    amount: 0,
    loanDate: '',
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
    guarantor2: ''
  })

  const [borrowers, setBorrowers] = useState<DatabaseBorrower[]>([])
  const [loans, setLoans] = useState<DatabaseLoan[]>([])
  const [payments, setPayments] = useState<DatabasePayment[]>([])
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null)
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<number | null>(null)
  const [mode, setMode] = useState<'borrower' | 'loan'>('borrower')
  const [isAdvancedEditMode, setIsAdvancedEditMode] = useState(false)

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

  useEffect(() => {
    loadData()
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

  const loadData = () => {
    const newBorrowers = db.getBorrowers()
    const newLoans = db.getLoans()

    setBorrowers(newBorrowers)
    setLoans(newLoans)

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

  const selectBorrower = (borrowerId: number) => {
    const borrower = borrowers.find(b => b.id === borrowerId)
    if (borrower) {
      setCurrentBorrower(borrower)
      setSelectedBorrowerId(borrowerId)

      // בדוק אם יש הלוואות קיימות ללווה
      const borrowerLoans = loans.filter(loan => loan.borrowerId === borrowerId)

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
        const today = getTodayString()
        setCurrentLoan({
          borrowerId,
          amount: 0,
          loanDate: today,
          returnDate: calculateDefaultReturnDate(today),
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
          guarantor2: ''
        })
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

  // פונקציה לחישוב תאריך החזרה כברירת מחדל
  const calculateDefaultReturnDate = (loanDate?: string): string => {
    const settings = db.getSettings()
    const baseDate = loanDate ? createLocalDate(loanDate) : new Date()
    const returnDate = new Date(baseDate)
    returnDate.setMonth(returnDate.getMonth() + settings.defaultLoanPeriod)
    return formatDateForInput(returnDate)
  }

  const handleLoanChange = (field: keyof DatabaseLoan, value: string | number | boolean) => {




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

    // בדיקת תאריכים לוגיים
    if (field === 'returnDate' && typeof value === 'string' && value) {
      const returnDate = createLocalDate(value)
      const loanDateStr = currentLoan.loanDate || getTodayString()
      const loanDate = createLocalDate(loanDateStr)

      if (returnDate < loanDate) {
        showNotification(
          `⚠️ תאריך החזרה (${returnDate.toLocaleDateString('he-IL')}) קודם לתאריך ההלוואה (${loanDate.toLocaleDateString('he-IL')})<br>אנא ערוך את התאריכים`, 'error'
        )
        return
      }
    }

    // בדיקה כשמשנים תאריך הלוואה
    if (field === 'loanDate' && typeof value === 'string' && value && currentLoan.returnDate) {
      const loanDate = createLocalDate(value)
      const returnDate = createLocalDate(currentLoan.returnDate)

      if (loanDate > returnDate) {
        showNotification(
          `⚠️ תאריך ההלוואה (${loanDate.toLocaleDateString('he-IL')}) מאוחר מתאריך החזרה (${returnDate.toLocaleDateString('he-IL')})<br>אנא תקן את התאריכים`, 'error'
        )
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
            const today = getTodayString()
            setCurrentLoan({
              borrowerId: value,
              amount: 0,
              loanDate: today,
              returnDate: calculateDefaultReturnDate(today),
              notes: '',
              guarantor1: '',
              guarantor2: ''
            })
          }
        }
        // אם זה עריכה מתקדמת, רק עדכן את הלווה בהלוואה הקיימת
      }
    }
  }

  const saveBorrower = () => {
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
      const result = db.updateBorrower(selectedBorrowerId, currentBorrower as DatabaseBorrower)
      if (result.success) {
        showNotification('✅ פרטי הלווה עודכנו בהצלחה!')
        loadData()
      } else {
        showNotification(`❌ ${result.error}`, 'error')
      }
    } else {
      // הוספת לווה חדש
      const result = db.addBorrower(currentBorrower as Omit<DatabaseBorrower, 'id'>)
      if ('error' in result) {
        showNotification(`❌ ${result.error}`, 'error')
      } else {
        setSelectedBorrowerId(result.id)
        setCurrentLoan(prev => ({ ...prev, borrowerId: result.id }))

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
          db.addPayment({
            loanId: selectedLoanId!,
            amount,
            date: getTodayString(),
            type: 'payment',
            paymentMethod: paymentMethod as 'cash' | 'transfer' | 'check' | 'credit' | 'other' | undefined,
            paymentDetails: paymentDetails || undefined,
            notes: ''
          })

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

    // פונקציה להוספת event listeners לפרטי תשלום
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
      idNumber: ''
    })
    setSelectedBorrowerId(null)
    setMode('borrower')
  }

  const newLoan = () => {
    if (!selectedBorrowerId) {
      showNotification('⚠️ אנא בחר לווה תחילה', 'error')
      return
    }

    // חישוב תאריכים ברירת מחדל
    const today = getTodayString()
    setCurrentLoan({
      borrowerId: selectedBorrowerId,
      amount: 0,
      loanDate: today, // תאריך ההלוואה - היום כברירת מחדל
      returnDate: calculateDefaultReturnDate(today),
      autoPayment: false,
      autoPaymentAmount: 0,
      autoPaymentDay: 1,
      autoPaymentStartDate: today, // ברירת מחדל - התחלת פרעון מהיום
      autoPaymentFrequency: 1, // ברירת מחדל - כל חודש
      notes: '',
      guarantor1: '',
      guarantor2: ''
    })
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

  const generateLoanDocument = () => {
    if (!selectedLoanId) {
      showNotification('⚠️ לא ניתן להפיק שטר להלוואה חדשה שלא נשמרה עדיין. אנא שמור את ההלוואה תחילה.', 'error')
      return
    }

    if (!currentBorrower.firstName) {
      showNotification('⚠️ אנא בחר לווה תחילה', 'error')
      return
    }

    const loan = loans.find(l => l.id === selectedLoanId)
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
          printLoanDocument(loan, borrowerName, balance)
        }
      })
      return
    }

    // אם ההלוואה פעילה, הדפס ישירות
    printLoanDocument(loan, borrowerName, balance)
  }

  const handlePrintToPDF = async (loanId: number) => {
    if (!loanId || !currentBorrower.firstName) {
      showNotification('⚠️ אנא בחר הלוואה תחילה', 'error')
      return
    }

    const loan = loans.find(l => l.id === loanId)
    if (!loan) return

    const borrowerName = `${currentBorrower.firstName} ${currentBorrower.lastName}`
    const balance = db.getLoanBalance(loanId)

    // יצירת תוכן השטר
    createPrintContent(loan, borrowerName, balance)

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

  const createPrintContent = (loan: any, borrowerName: string, balance: number) => {
    const gemachName = db.getGemachName()
    const loanAmount = loan.amount.toLocaleString()
    const returnDate = db.getSettings().showHebrewDates ?
      formatCombinedDate(loan.returnDate) :
      new Date(loan.returnDate).toLocaleDateString('he-IL')
    const loanDate = db.getSettings().showHebrewDates ?
      formatCombinedDate(loan.loanDate) :
      new Date(loan.loanDate).toLocaleDateString('he-IL')
    const borrowerIdNumber = currentBorrower.idNumber ? db.formatIdNumber(currentBorrower.idNumber) : ''

    const printContent = `
      <div id="print-content" style="display: none;">
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: center; padding: 20px; line-height: 1.4; font-size: 14px; margin: 0;">
          <div style="max-width: 500px; margin: 0 auto; text-align: right;">
            <h1 style="font-size: 20px; margin-bottom: 20px; text-decoration: underline;">שטר הלוואה</h1>
            <p style="margin: 8px 0;">אני הח"מ <strong>${borrowerName}</strong></p>
            ${borrowerIdNumber ? `<p style="margin: 8px 0;">ת.ז. <strong>${borrowerIdNumber}</strong></p>` : ''}
            <p style="margin: 8px 0;">מאשר בזה כי לוויתי מגמ"ח "<strong>${gemachName}</strong>"</p>
            <p style="margin: 8px 0;">סכום של: <strong>${loanAmount} ש"ח</strong></p>
            <p style="margin: 8px 0;">בתאריך: <strong>${loanDate}</strong></p>
            <p style="margin: 8px 0;">אני מתחייב להחזיר את הסכום עד לתאריך: <strong>${returnDate}</strong></p>
            ${loan.guarantor1 ? `<p style="margin: 8px 0;">ערב ראשון: <strong>${loan.guarantor1}</strong></p>` : ''}
            ${loan.guarantor2 ? `<p style="margin: 8px 0;">ערב שני: <strong>${loan.guarantor2}</strong></p>` : ''}
            ${loan.notes ? `<p style="margin: 8px 0;">הערות: <strong>${loan.notes}</strong></p>` : ''}
            ${balance <= 0 ? `
              <div style="background: #27ae60; color: white; padding: 10px; border-radius: 5px; margin: 15px 0; text-align: center;">
                <strong>✅ ההלוואה נפרעה במלואה ✅</strong><br>
                <small>תאריך פרעון מלא: ${db.getSettings().showHebrewDates ? formatCombinedDate(new Date()) : new Date().toLocaleDateString('he-IL')}</small>
              </div>
            ` : ''}
            <p style="margin: 8px 0;">תאריך הפקת השטר: <strong>${db.getSettings().showHebrewDates ? formatCombinedDate(new Date()) : new Date().toLocaleDateString('he-IL')}</strong></p>
            <div style="display: flex; justify-content: space-between; margin-top: 40px;">
              <div>
                <p>חתימת הלווה:</p>
                <div style="border-bottom: 1px solid #000; width: 150px; margin-top: 10px;"></div>
              </div>
              <div>
                <p>חתימת הערב:</p>
                <div style="border-bottom: 1px solid #000; width: 150px; margin-top: 10px;"></div>
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

  const printLoanDocument = (loan: any, borrowerName: string, balance: number) => {
    const gemachName = db.getGemachName()
    const loanAmount = loan.amount.toLocaleString()
    const returnDate = db.getSettings().showHebrewDates ?
      formatCombinedDate(loan.returnDate) :
      new Date(loan.returnDate).toLocaleDateString('he-IL')
    const loanDate = db.getSettings().showHebrewDates ?
      formatCombinedDate(loan.loanDate) :
      new Date(loan.loanDate).toLocaleDateString('he-IL')
    const borrowerIdNumber = currentBorrower.idNumber ? db.formatIdNumber(currentBorrower.idNumber) : ''

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
              <p style="margin: 8px 0;">מאשר בזה כי לוויתי מגמ"ח "<strong>${gemachName}</strong>"</p>
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
              ${loan.guarantor1 ? `<p style="margin: 8px 0;">ערב ראשון: <strong>${loan.guarantor1}</strong></p>` : ''}
              ${loan.guarantor2 ? `<p style="margin: 8px 0;">ערב שני: <strong>${loan.guarantor2}</strong></p>` : ''}
              ${loan.notes ? `<p style="margin: 8px 0;">הערות: <strong>${loan.notes}</strong></p>` : ''}
              ${balance <= 0 ? `
                <div style="background: #27ae60; color: white; padding: 10px; border-radius: 5px; margin: 15px 0; text-align: center;">
                  <strong>✅ ההלוואה נפרעה במלואה ✅</strong><br>
                  <small>תאריך פרעון מלא: ${db.getSettings().showHebrewDates ? formatCombinedDate(new Date()) : new Date().toLocaleDateString('he-IL')}</small>
                </div>
              ` : ''}
              <p style="margin: 8px 0;">תאריך הפקת השטר: <strong>${db.getSettings().showHebrewDates ? formatCombinedDate(new Date()) : new Date().toLocaleDateString('he-IL')}</strong></p>
              <div style="display: flex; justify-content: space-between; margin-top: 40px; flex-wrap: wrap; gap: 20px;">
                <div>
                  <p>חתימת הלווה:</p>
                  <div style="border-bottom: 1px solid #000; width: 150px; margin-top: 10px;"></div>
                </div>
                ${loan.guarantor1 ? `
                  <div>
                    <p>חתימת ערב ראשון:</p>
                    <div style="border-bottom: 1px solid #000; width: 150px; margin-top: 10px;"></div>
                  </div>
                ` : ''}
                ${loan.guarantor2 ? `
                  <div>
                    <p>חתימת ערב שני:</p>
                    <div style="border-bottom: 1px solid #000; width: 150px; margin-top: 10px;"></div>
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
                  margin-top: 10px;
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
                <h1>שטר הלוואה</h1>
                <p>אני הח"מ <strong>${borrowerName}</strong></p>
                ${borrowerIdNumber ? `<p>ת.ז. <strong>${borrowerIdNumber}</strong></p>` : ''}
                <p>מאשר בזה כי לוויתי מגמ"ח "<strong>${gemachName}</strong>"</p>
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
                ${loan.guarantor1 ? `<p>ערב ראשון: <strong>${loan.guarantor1}</strong></p>` : ''}
                ${loan.guarantor2 ? `<p>ערב שני: <strong>${loan.guarantor2}</strong></p>` : ''}
                ${loan.notes ? `<p>הערות: <strong>${loan.notes}</strong></p>` : ''}
                ${balance <= 0 ? `
                  <div style="background: #27ae60; color: white; padding: 10px; border-radius: 5px; margin: 15px 0; text-align: center;">
                    <strong>✅ ההלוואה נפרעה במלואה ✅</strong><br>
                    <small>תאריך פרעון מלא: ${db.getSettings().showHebrewDates ? formatCombinedDate(new Date()) : new Date().toLocaleDateString('he-IL')}</small>
                  </div>
                ` : ''}
                <p>תאריך הפקת השטר: <strong>${db.getSettings().showHebrewDates ? formatCombinedDate(new Date()) : new Date().toLocaleDateString('he-IL')}</strong></p>
                <div class="signature-section">
                  <div>
                    <p>חתימת הלווה:</p>
                    <div class="signature-line"></div>
                  </div>
                  ${loan.guarantor1 ? `
                    <div>
                      <p>חתימת ערב ראשון:</p>
                      <div class="signature-line"></div>
                    </div>
                  ` : ''}
                  ${loan.guarantor2 ? `
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
            className={`btn ${mode === 'loan' ? 'btn-success' : 'btn-primary'}`}
            onClick={() => setMode('loan')}
          >
            ניהול הלוואות
          </button>
          <button
            className="btn"
            onClick={() => {
              loadData()
              showNotification(`🔄 נתונים נטענו מחדש<br>לווים: ${borrowers.length}, הלוואות: ${loans.length}`, 'info')
            }}
            style={{ backgroundColor: '#f39c12', color: 'white', marginRight: '10px' }}
          >
            🔄 רענן
          </button>
        </div>

        {mode === 'borrower' && (
          <div className="form-container">
            <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>ניהול לווים</h3>

            <div className="form-row">
              <div className="form-group">
                <label>בחר לווה:</label>
                <select
                  value={selectedBorrowerId || ''}
                  onChange={(e) => e.target.value ? selectBorrower(Number(e.target.value)) : newBorrower()}
                >
                  <option value="">לווה חדש</option>
                  {borrowers.map(borrower => (
                    <option key={borrower.id} value={borrower.id}>
                      {borrower.firstName} {borrower.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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
                <label>עיר:</label>
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
                <label>כתובת:</label>
                <input
                  key={`address-${selectedBorrowerId || 'new'}`}
                  type="text"
                  value={currentBorrower.address || ''}
                  onChange={(e) => handleBorrowerChange('address', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>מייל:</label>
                <input
                  key={`email-${selectedBorrowerId || 'new'}`}
                  type="email"
                  value={currentBorrower.email || ''}
                  onChange={(e) => handleBorrowerChange('email', e.target.value)}
                />
              </div>
            </div>

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

                      if (isFuture) {
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
                  value={currentLoan.returnDate || ''}
                  onChange={(e) => handleLoanChange('returnDate', e.target.value)}
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
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>הלוואה מחזורית:</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={currentLoan.isRecurring || false}
                        onChange={(e) => handleLoanChange('isRecurring', e.target.checked)}
                      />
                      <span>הלוואה חוזרת כל חודש</span>
                    </div>
                  </div>
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
                        color: '#3498db',
                        fontSize: '12px',
                        display: 'block',
                        marginTop: '5px'
                      }}>
                        ההלוואה תחזור {currentLoan.recurringMonths || 12} פעמים
                      </small>
                    )}
                  </div>
                </div>

                {currentLoan.isRecurring && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>יום בחודש להלוואה:</label>
                      <input
                        type="number"
                        value={currentLoan.recurringDay || 1}
                        onChange={(e) => {
                          const value = Number(e.target.value)
                          // הגבל את הערך בין 1 ל-31
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
                      />
                      <small style={{
                        color: '#27ae60',
                        fontSize: '12px',
                        display: 'block',
                        marginTop: '5px'
                      }}>
                        📅 ההלוואה הראשונה תהיה ביום {currentLoan.recurringDay || 1} בחודש
                      </small>
                    </div>
                    <div className="form-group">
                      {/* שדה ריק לאיזון */}
                    </div>
                  </div>
                )}
              </>
            )}

            {settings.enableRecurringPayments && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>פרעון אוטומטי:</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={currentLoan.autoPayment || false}
                        onChange={(e) => {
                          // בדיקה שיש סכום הלוואה לפני הפעלת פרעון אוטומטי
                          if (e.target.checked && (!currentLoan.amount || currentLoan.amount <= 0)) {
                            showNotification('⚠️ יש להגדיר סכום הלוואה לפני הפעלת פרעון אוטומטי', 'error')
                            return
                          }

                          handleLoanChange('autoPayment', e.target.checked)
                          // אם מפעילים פרעון אוטומטי ויש סכום גבוה יותר מההלוואה, תקן אותו
                          if (e.target.checked && currentLoan.autoPaymentAmount && currentLoan.autoPaymentAmount > (currentLoan.amount || 0)) {
                            // תקן את הסכום לסכום ההלוואה
                            handleLoanChange('autoPaymentAmount', currentLoan.amount || 0)
                            showNotification(`💡 סכום הפרעון החודשי הותאם ל-₪${(currentLoan.amount || 0).toLocaleString()}`, 'info')
                          }
                        }}
                      />
                      <span>פרעון חודשי אוטומטי</span>
                    </div>
                  </div>
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
                  <div className="form-group">
                    <label>תאריך תחילת פרעון:</label>
                    <input
                      type="date"
                      value={currentLoan.autoPaymentStartDate || currentLoan.loanDate || getTodayString()}
                      onChange={(e) => handleLoanChange('autoPaymentStartDate', e.target.value)}
                      disabled={!currentLoan.autoPayment}
                      style={{
                        backgroundColor: !currentLoan.autoPayment ? '#f5f5f5' : 'white',
                        cursor: !currentLoan.autoPayment ? 'not-allowed' : 'text'
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
                    {/* שדה ריק לאיזון */}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>תאריך רישום במערכת:</label>
                    <input
                      type="text"
                      value={currentLoan.createdDate || new Date().toLocaleDateString('he-IL')}
                      readOnly
                      style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    {/* שדה ריק לאיזון */}
                  </div>
                </div>
              </>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>הערות:</label>
                <input
                  type="text"
                  value={currentLoan.notes || ''}
                  onChange={(e) => handleLoanChange('notes', e.target.value)}
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
                      <div className="form-group">
                        <label>בנק:</label>
                        <input
                          type="text"
                          placeholder="שם הבנק"
                          onChange={(e) => {
                            const details = db.parsePaymentDetails('check', currentLoan.loanPaymentDetails) || {}
                            details.bank = e.target.value
                            handleLoanChange('loanPaymentDetails', JSON.stringify(details))
                          }}
                          value={db.parsePaymentDetails('check', currentLoan.loanPaymentDetails)?.bank || ''}
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>סניף:</label>
                        <input
                          type="text"
                          placeholder="מספר סניף"
                          onChange={(e) => {
                            const details = db.parsePaymentDetails('check', currentLoan.loanPaymentDetails) || {}
                            details.branch = e.target.value
                            handleLoanChange('loanPaymentDetails', JSON.stringify(details))
                          }}
                          value={db.parsePaymentDetails('check', currentLoan.loanPaymentDetails)?.branch || ''}
                        />
                      </div>
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
                      <div className="form-group">
                        <label>מספר אסמכתא:</label>
                        <input
                          type="text"
                          placeholder="מספר אסמכתא"
                          onChange={(e) => {
                            const details = db.parsePaymentDetails('transfer', currentLoan.loanPaymentDetails) || {}
                            details.referenceNumber = e.target.value
                            handleLoanChange('loanPaymentDetails', JSON.stringify(details))
                          }}
                          value={db.parsePaymentDetails('transfer', currentLoan.loanPaymentDetails)?.referenceNumber || ''}
                        />
                      </div>
                      <div className="form-group">
                        <label>בנק:</label>
                        <select
                          onChange={(e) => {
                            const details = db.parsePaymentDetails('transfer', currentLoan.loanPaymentDetails) || {}
                            details.bankCode = e.target.value
                            details.bankName = e.target.selectedOptions[0]?.text?.split(' - ')[1] || ''
                            handleLoanChange('loanPaymentDetails', JSON.stringify(details))
                          }}
                          value={db.parsePaymentDetails('transfer', currentLoan.loanPaymentDetails)?.bankCode || ''}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
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
                    <div className="form-row">
                      <div className="form-group">
                        <label>מספר סניף:</label>
                        <input
                          type="text"
                          placeholder="מספר סניף"
                          maxLength={3}
                          onChange={(e) => {
                            const details = db.parsePaymentDetails('transfer', currentLoan.loanPaymentDetails) || {}
                            details.branchNumber = e.target.value
                            handleLoanChange('loanPaymentDetails', JSON.stringify(details))
                          }}
                          value={db.parsePaymentDetails('transfer', currentLoan.loanPaymentDetails)?.branchNumber || ''}
                        />
                      </div>
                      <div className="form-group">
                        <label>מספר חשבון:</label>
                        <input
                          type="text"
                          placeholder="מספר חשבון"
                          onChange={(e) => {
                            const details = db.parsePaymentDetails('transfer', currentLoan.loanPaymentDetails) || {}
                            details.accountNumber = e.target.value
                            handleLoanChange('loanPaymentDetails', JSON.stringify(details))
                          }}
                          value={db.parsePaymentDetails('transfer', currentLoan.loanPaymentDetails)?.accountNumber || ''}
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>תאריך העברה:</label>
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
                      <div className="form-group">
                        {/* שדה ריק לאיזון */}
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

            <div className="form-row">
              <div className="form-group">
                <label>ערב 1:</label>
                <input
                  type="text"
                  value={currentLoan.guarantor1 || ''}
                  onChange={(e) => handleLoanChange('guarantor1', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>ערב 2:</label>
                <input
                  type="text"
                  value={currentLoan.guarantor2 || ''}
                  onChange={(e) => handleLoanChange('guarantor2', e.target.value)}
                />
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
              <button
                className="btn btn-primary"
                onClick={addPayment}
                disabled={selectedLoanId ? db.getLoanBalance(selectedLoanId) <= 0 : false}
                style={{
                  marginRight: '10px',
                  backgroundColor: selectedLoanId && db.getLoanBalance(selectedLoanId) <= 0 ? '#95a5a6' :
                    !selectedLoanId ? '#f39c12' : undefined
                }}
                title={!selectedLoanId ? 'שמור את ההלוואה תחילה כדי לרשום פרעון' :
                  selectedLoanId && db.getLoanBalance(selectedLoanId) <= 0 ? 'ההלוואה כבר נפרעה במלואה' : 'הוסף פרעון להלוואה'}
              >
                {!selectedLoanId ? '⚠️ שמור תחילה' :
                  selectedLoanId && db.getLoanBalance(selectedLoanId) <= 0 ? '✅ נפרע במלואה' : 'הוסף פרעון'}
              </button>

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
              <button
                className="btn"
                onClick={generateLoanDocument}
                style={{
                  backgroundColor: !selectedLoanId ? '#f39c12' :
                    selectedLoanId && db.getLoanBalance(selectedLoanId) <= 0 ? '#27ae60' : '#9b59b6',
                  color: 'white',
                  marginRight: '10px'
                }}
                title={!selectedLoanId ? 'שמור את ההלוואה תחילה כדי להפיק שטר' :
                  selectedLoanId && db.getLoanBalance(selectedLoanId) <= 0 ? 'הדפס שטר הלוואה (נפרע)' : 'הדפס שטר הלוואה'}
              >
                {!selectedLoanId ? '⚠️ שמור תחילה' :
                  selectedLoanId && db.getLoanBalance(selectedLoanId) <= 0 ? '📄 שטר (נפרע)' : '📄 הפק שטר הלוואה'}
              </button>
              {(window as any).electronAPI && (
                <button
                  className="btn"
                  onClick={() => selectedLoanId && handlePrintToPDF(selectedLoanId)}
                  disabled={!selectedLoanId}
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
                                const today = getTodayString()

                                setCurrentLoan({
                                  borrowerId: selectedBorrowerId,
                                  amount: 0,
                                  loanDate: today,
                                  returnDate: calculateDefaultReturnDate(today),
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
                                  amount: 0,
                                  loanDate: '',
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
                                    onConfirm: () => {}
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
        {selectedBorrowerId && (() => {
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
        {selectedBorrowerId && (() => {
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
    </div >
  )
}

export default LoansPage