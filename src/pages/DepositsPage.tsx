import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, DatabaseDeposit, DatabaseWithdrawal } from '../database/database'
import NumberInput from '../components/NumberInput'
import { formatCombinedDate } from '../utils/hebrewDate'
import BankBranchSelector from '../components/BankBranchSelector'

function DepositsPage() {
  const navigate = useNavigate()

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
  } | null>(null)
  
  // State לשדה הקלט במודל
  const [modalInputValue, setModalInputValue] = useState('')

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

  const [deposits, setDeposits] = useState<DatabaseDeposit[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newDeposit, setNewDeposit] = useState<{
    depositorName: string
    idNumber: string
    amount: number
    depositDate: string
    depositPeriod: number
    reminderDays: number
    phone: string
    notes: string
    withdrawnAmount: number
    withdrawnDate: string
    depositPaymentMethod?: string
    depositPaymentDetails?: string
    withdrawalPaymentMethod?: string
    withdrawalPaymentDetails?: string
  }>({
    depositorName: '',
    idNumber: '',
    amount: 0,
    depositDate: '',
    depositPeriod: 12,
    reminderDays: 30,
    phone: '',
    notes: '',
    withdrawnAmount: 0,
    withdrawnDate: '',
    depositPaymentMethod: '',
    depositPaymentDetails: '',
    withdrawalPaymentMethod: '',
    withdrawalPaymentDetails: ''
  })

  useEffect(() => {
    loadDeposits()
  }, [])

  const loadDeposits = () => {
    const newDeposits = db.getDeposits()
    setDeposits(newDeposits)
    console.log('🔄 רענון טבלת הפקדות:', newDeposits.length)
  }

  const handleInputChange = (field: string, value: string | number) => {
    setNewDeposit(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const generateDepositDocument = (deposit: DatabaseDeposit) => {
    const gemachName = db.getGemachName()
    const depositorName = deposit.depositorName
    const amount = deposit.amount.toLocaleString()
    const depositDate = db.getSettings().showHebrewDates ? 
      formatCombinedDate(deposit.depositDate) : 
      new Date(deposit.depositDate).toLocaleDateString('he-IL')
    const depositNumber = deposit.id
    
    // בדוק מצב הפקדון
    const withdrawnAmount = deposit.withdrawnAmount || 0
    const remainingAmount = deposit.amount - withdrawnAmount
    const isFullyWithdrawn = remainingAmount <= 0

    
    if (isFullyWithdrawn) {
      // הצג הודעת אישור לפקדון שנמשך במלואו
      showConfirmModal({
        title: 'הפקת שטר הפקדה',
        message: `🎉 הפקדון של ${depositorName} כבר נמשך במלואו!\n\nהאם ברצונך להדפיס שטר הפקדה למטרות תיעוד בלבד?`,
        confirmText: 'הדפס שטר',
        cancelText: 'ביטול',
        type: 'info',
        onConfirm: () => {
          printDepositDocument(deposit, gemachName, depositorName, amount, depositDate, depositNumber, withdrawnAmount, remainingAmount)
        }
      })
      return
    }
    
    // אם הפקדון פעיל (כולל משיכה חלקית), הדפס ישירות
    printDepositDocument(deposit, gemachName, depositorName, amount, depositDate, depositNumber, withdrawnAmount, remainingAmount)
  }

  const printDepositDocument = (deposit: DatabaseDeposit, gemachName: string, depositorName: string, amount: string, depositDate: string, depositNumber: number, withdrawnAmount: number, remainingAmount: number) => {
    const isFullyWithdrawn = remainingAmount <= 0

    // בדיקה אם זה Electron עם API חדש
    const isElectron = (window as any).electronAPI?.isElectron?.()

    if (isElectron) {
      // פתרון מיוחד ל-Electron
      const printContent = `
        <div id="print-content" style="display: none;">
          <div style="font-family: Arial, sans-serif; direction: rtl; text-align: center; padding: 20px; line-height: 1.4; font-size: 14px; margin: 0;">
            <div style="max-width: 500px; margin: 0 auto; text-align: right;">
              <h1 style="font-size: 20px; margin-bottom: 20px; text-decoration: underline;">שטר הפקדה</h1>
              <p style="margin: 8px 0;">מספר הפקדה: <strong>${depositNumber}</strong></p>
              <p style="margin: 8px 0;">אנו הח"מ מגמ"ח "<strong>${gemachName}</strong>"</p>
              <p style="margin: 8px 0;">מאשרים בזה כי קיבלנו מאת <strong>${depositorName}</strong></p>
              ${deposit.idNumber ? `<p style="margin: 8px 0;">ת.ז. <strong>${db.formatIdNumber(deposit.idNumber)}</strong></p>` : ''}
              <p style="margin: 8px 0;">סכום של: <strong>${amount} ש"ח</strong></p>
              <p style="margin: 8px 0;">בתאריך: <strong>${depositDate}</strong></p>
              <p style="margin: 8px 0;">תקופת ההפקדה: <strong>${deposit.depositPeriod} חודשים</strong></p>
              <p style="margin: 8px 0;">אנו מתחייבים להחזיר את הסכום בתום התקופה או לפי דרישה</p>
              ${deposit.phone ? `<p style="margin: 8px 0;">טלפון המפקיד: <strong>${deposit.phone}</strong></p>` : ''}
              ${deposit.notes ? `<p style="margin: 8px 0;">הערות: <strong>${deposit.notes}</strong></p>` : ''}
              ${isFullyWithdrawn ? `
                <div style="background: #27ae60; color: white; padding: 10px; border-radius: 5px; margin: 15px 0; text-align: center;">
                  <strong>✅ הפקדון נמשך במלואו ✅</strong><br>
                  <small>תאריך משיכה מלאה: ${db.getSettings().showHebrewDates ? formatCombinedDate(new Date()) : new Date().toLocaleDateString('he-IL')}</small>
                </div>
              ` : (withdrawnAmount > 0 && remainingAmount > 0) ? `
                <div style="background: #f39c12; color: white; padding: 10px; border-radius: 5px; margin: 15px 0; text-align: center;">
                  <strong>⚠️ משיכה חלקית ⚠️</strong><br>
                  <small>נמשך: ${withdrawnAmount.toLocaleString()} ש"ח | נותר: ${remainingAmount.toLocaleString()} ש"ח</small>
                </div>
              ` : ''}
              <p style="margin: 8px 0;">תאריך הפקה: <strong>${db.getSettings().showHebrewDates ? formatCombinedDate(new Date()) : new Date().toLocaleDateString('he-IL')}</strong></p>
              <div style="display: flex; justify-content: space-between; margin-top: 40px;">
                <div>
                  <p>חתימת המפקיד:</p>
                  <div style="border-bottom: 1px solid #000; width: 150px; margin-top: 10px;"></div>
                </div>
                <div>
                  <p>חתימת הגמ"ח:</p>
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
              <title>שטר הפקדה - ${depositorName}</title>
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
                <h1>שטר הפקדה</h1>
                <p>מספר הפקדה: <strong>${depositNumber}</strong></p>
                <p>אנו הח"מ מגמ"ח "<strong>${gemachName}</strong>"</p>
                <p>מאשרים בזה כי קיבלנו מאת <strong>${depositorName}</strong></p>
                ${deposit.idNumber ? `<p>ת.ז. <strong>${db.formatIdNumber(deposit.idNumber)}</strong></p>` : ''}
                <p>סכום של: <strong>${amount} ש"ח</strong></p>
                <p>בתאריך: <strong>${depositDate}</strong></p>
                <p>תקופת ההפקדה: <strong>${deposit.depositPeriod} חודשים</strong></p>
                <p>אנו מתחייבים להחזיר את הסכום בתום התקופה או לפי דרישה</p>
                ${deposit.phone ? `<p>טלפון המפקיד: <strong>${deposit.phone}</strong></p>` : ''}
                ${deposit.notes ? `<p>הערות: <strong>${deposit.notes}</strong></p>` : ''}
                ${isFullyWithdrawn ? `
                  <div style="background: #27ae60; color: white; padding: 10px; border-radius: 5px; margin: 15px 0; text-align: center;">
                    <strong>✅ הפקדון נמשך במלואו ✅</strong><br>
                    <small>תאריך משיכה מלאה: ${db.getSettings().showHebrewDates ? formatCombinedDate(new Date()) : new Date().toLocaleDateString('he-IL')}</small>
                  </div>
                ` : (withdrawnAmount > 0 && remainingAmount > 0) ? `
                  <div style="background: #f39c12; color: white; padding: 10px; border-radius: 5px; margin: 15px 0; text-align: center;">
                    <strong>⚠️ משיכה חלקית ⚠️</strong><br>
                    <small>נמשך: ${withdrawnAmount.toLocaleString()} ש"ח | נותר: ${remainingAmount.toLocaleString()} ש"ח</small>
                  </div>
                ` : ''}
                <p>תאריך הפקה: <strong>${new Date().toLocaleDateString('he-IL')}</strong></p>
                <div class="signature-section">
                  <div>
                    <p>חתימת המפקיד:</p>
                    <div class="signature-line"></div>
                  </div>
                  <div>
                    <p>חתימת הגמ"ח:</p>
                    <div class="signature-line"></div>
                  </div>
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

  const saveDeposit = () => {
    if (!newDeposit.depositorName || !newDeposit.amount) {
      showNotification('⚠️ אנא מלא את השדות החובה: שם המפקיד וסכום', 'error')
      return
    }

    // בדוק מספר זהות רק אם זה חובה
    if (db.getSettings().requireIdNumber && (!newDeposit.idNumber || newDeposit.idNumber.trim() === '')) {
      showNotification('⚠️ מספר זהות הוא שדה חובה (ניתן לשנות בהגדרות)', 'error')
      return
    }

    // בדיקת תאריך הפקדה - לא יכול להיות בעתיד
    if (newDeposit.depositDate) {
      const depositDateObj = new Date(newDeposit.depositDate)
      const today = new Date()
      today.setHours(23, 59, 59, 999) // סוף היום

      if (depositDateObj > today) {
        showNotification('⚠️ תאריך ההפקדה לא יכול להיות בעתיד', 'error')
        return
      }
    }

    // בדיקת תאריך משיכה - לא יכול להיות בעתיד
    if (newDeposit.withdrawnDate) {
      const withdrawnDateObj = new Date(newDeposit.withdrawnDate)
      const today = new Date()
      today.setHours(23, 59, 59, 999) // סוף היום

      if (withdrawnDateObj > today) {
        showNotification('⚠️ תאריך המשיכה לא יכול להיות בעתיד', 'error')
        return
      }
    }

    // בדיקת תאריך העברה בהפקדה - לא יכול להיות בעתיד
    if (newDeposit.depositPaymentMethod === 'transfer' && newDeposit.depositPaymentDetails) {
      try {
        const details = JSON.parse(newDeposit.depositPaymentDetails)
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

    // בדיקת תאריך העברה במשיכה - לא יכול להיות בעתיד
    if (newDeposit.withdrawalPaymentMethod === 'transfer' && newDeposit.withdrawalPaymentDetails) {
      try {
        const details = JSON.parse(newDeposit.withdrawalPaymentDetails)
        if (details.transferDate) {
          const transferDateObj = new Date(details.transferDate)
          const today = new Date()
          today.setHours(23, 59, 59, 999) // סוף היום

          if (transferDateObj > today) {
            showNotification('⚠️ תאריך ההעברה במשיכה לא יכול להיות בעתיד', 'error')
            return
          }
        }
      } catch (error) {
        // אם יש שגיאה בפענוח, המשך בלי בדיקה
      }
    }

    if (editingId) {
      // עדכון הפקדה קיימת
      const updatedDeposit = {
        ...newDeposit,
        status: (newDeposit.withdrawnAmount && newDeposit.withdrawnAmount >= newDeposit.amount) ? 'withdrawn' : 'active'
      }
      db.updateDeposit(editingId, updatedDeposit as DatabaseDeposit)
      setEditingId(null)
      showNotification('✅ ההפקדה עודכנה בהצלחה!')
    } else {
      // הפקדה חדשה
      const result = db.addDeposit({
        ...newDeposit,
        depositPaymentMethod: newDeposit.depositPaymentMethod as 'cash' | 'transfer' | 'check' | 'credit' | 'other' | undefined,
        withdrawalPaymentMethod: newDeposit.withdrawalPaymentMethod as 'cash' | 'transfer' | 'check' | 'credit' | 'other' | undefined
      })
      if ('error' in result) {
        showNotification(`❌ ${result.error}`, 'error')
        return
      } else {
        showNotification('✅ הפקדון נשמר בהצלחה!')
      }
    }
    
    loadDeposits()
    setNewDeposit({
      depositorName: '',
      idNumber: '',
      amount: 0,
      depositDate: '',
      depositPeriod: 12,
      reminderDays: 30,
      phone: '',
      notes: '',
      withdrawnAmount: 0,
      withdrawnDate: '',
      depositPaymentMethod: '',
      depositPaymentDetails: '',
      withdrawalPaymentMethod: '',
      withdrawalPaymentDetails: ''
    })
  }

  const withdrawDeposit = (depositId: number) => {
    const deposit = deposits.find(d => d.id === depositId)
    if (!deposit) return

    const availableAmount = deposit.amount - (deposit.withdrawnAmount || 0)
    
    // State לאמצעי תשלום במשיכה
    let withdrawalMethod = ''
    let withdrawalDetails = ''

    // יצירת מודל מתקדם למשיכה עם אמצעי תשלום
    const createWithdrawalModal = () => {
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
            <h3 style="margin-bottom: 20px; color: #3498db; text-align: center;">משיכת פקדון</h3>
            <p style="margin-bottom: 15px; text-align: center;">זמין למשיכה: ₪${availableAmount.toLocaleString()}</p>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">סכום למשיכה:</label>
              <input type="number" id="withdrawalAmount" placeholder="הכנס סכום" style="
                width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px;
                font-size: 16px; text-align: center;
              " />
            </div>

            ${db.getSettings().trackPaymentMethods ? `
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">אמצעי תשלום למשיכה:</label>
                <select id="withdrawalMethodSelect" style="
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

              <div id="withdrawalDetailsContainer" style="margin-bottom: 15px; display: none;">
                <!-- פרטים נוספים יתווספו כאן -->
              </div>
            ` : ''}

            <div style="display: flex; gap: 15px; justify-content: center; margin-top: 20px;">
              <button id="confirmWithdrawal" style="
                background: #3498db; color: white; border: none; padding: 12px 24px;
                border-radius: 5px; font-size: 16px; cursor: pointer; font-weight: bold;
              ">בצע משיכה</button>
              <button id="cancelWithdrawal" style="
                background: #95a5a6; color: white; border: none; padding: 12px 24px;
                border-radius: 5px; font-size: 16px; cursor: pointer;
              ">ביטול</button>
            </div>
          </div>
        </div>
      `

      document.body.appendChild(modalContent)

      // הוספת event listeners
      const amountInput = modalContent.querySelector('#withdrawalAmount') as HTMLInputElement
      const methodSelect = modalContent.querySelector('#withdrawalMethodSelect') as HTMLSelectElement
      const detailsContainer = modalContent.querySelector('#withdrawalDetailsContainer') as HTMLDivElement
      const confirmBtn = modalContent.querySelector('#confirmWithdrawal') as HTMLButtonElement
      const cancelBtn = modalContent.querySelector('#cancelWithdrawal') as HTMLButtonElement

      amountInput.focus()

      // טיפול בשינוי אמצעי תשלום
      if (methodSelect) {
        methodSelect.addEventListener('change', (e) => {
          const method = (e.target as HTMLSelectElement).value
          withdrawalMethod = method
          
          if (method && detailsContainer) {
            detailsContainer.style.display = 'block'
            detailsContainer.innerHTML = createWithdrawalDetailsHTML(method)
            addWithdrawalDetailsListeners(detailsContainer, method)
          } else if (detailsContainer) {
            detailsContainer.style.display = 'none'
          }
        })
      }

      // אישור משיכה
      confirmBtn.addEventListener('click', () => {
        const amount = Number(amountInput.value)
        if (!amountInput.value || isNaN(amount) || amount <= 0) {
          showNotification('⚠️ אנא הכנס סכום תקין', 'error')
          return
        }

        if (amount > availableAmount) {
          showNotification('⚠️ הסכום גדול מהסכום הזמין למשיכה', 'error')
          return
        }

        // בדיקת תאריך משיכה - לא יכול להיות בעתיד (אם יש תאריך העברה)
        if (withdrawalMethod === 'transfer' && withdrawalDetails) {
          try {
            const details = JSON.parse(withdrawalDetails)
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

        if (db.withdrawDeposit && db.withdrawDeposit(depositId, amount, withdrawalMethod || undefined, withdrawalDetails || undefined)) {
          loadDeposits()
          showNotification(`✅ נמשכו ₪${amount.toLocaleString()} בהצלחה!`)
          document.body.removeChild(modalContent)
        } else {
          showNotification('❌ שגיאה במשיכת הפקדון', 'error')
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

    // פונקציה ליצירת HTML לפרטי תשלום למשיכה
    const createWithdrawalDetailsHTML = (method: string): string => {
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

    // פונקציה להוספת event listeners לפרטי תשלום למשיכה
    const addWithdrawalDetailsListeners = (container: HTMLDivElement, method: string) => {
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
          
          withdrawalDetails = JSON.stringify(details)
        })
      })
    }

    createWithdrawalModal()
  }

  // פונקציה להצגת מודל בחירת משיכה לשובר
  const showWithdrawalSelectionModal = (depositId: number, withdrawals: DatabaseWithdrawal[]) => {
    const deposit = deposits.find(d => d.id === depositId)
    if (!deposit) return

    const modalContent = document.createElement('div')
    modalContent.innerHTML = `
      <div style="
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5); display: flex; align-items: center;
        justify-content: center; z-index: 10000; direction: rtl;
      ">
        <div style="
          background: white; border-radius: 10px; padding: 30px;
          max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        ">
          <h3 style="margin-bottom: 20px; color: #2c3e50; text-align: center;">
            בחר משיכה להדפסת שובר
          </h3>
          
          <!-- סיכום כללי -->
          <div style="
            background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;
            border: 1px solid #e9ecef;
          ">
            <div style="text-align: center; margin-bottom: 10px;">
              <strong style="color: #2c3e50; font-size: 16px;">מפקיד: ${deposit.depositorName}</strong>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; text-align: center;">
              <div>
                <div style="font-size: 12px; color: #666;">סכום הפקדה מקורי</div>
                <div style="font-weight: bold; color: #3498db;">₪${deposit.amount.toLocaleString()}</div>
              </div>
              <div>
                <div style="font-size: 12px; color: #666;">סה"כ נמשך</div>
                <div style="font-weight: bold; color: #e74c3c;">₪${withdrawals.reduce((sum, w) => sum + w.amount, 0).toLocaleString()}</div>
              </div>
              <div>
                <div style="font-size: 12px; color: #666;">יתרה נוכחית</div>
                <div style="font-weight: bold; color: #27ae60;">₪${(deposit.amount - withdrawals.reduce((sum, w) => sum + w.amount, 0)).toLocaleString()}</div>
              </div>
            </div>
            <div style="text-align: center; margin-top: 10px; font-size: 14px; color: #666;">
              סה"כ משיכות: <strong>${withdrawals.length}</strong>
            </div>
          </div>
          
          <div style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; border-radius: 5px;">
            ${withdrawals.map((withdrawal, index) => {
              const withdrawalDate = db.getSettings().showHebrewDates ? 
                formatCombinedDate(withdrawal.date) : 
                new Date(withdrawal.date).toLocaleDateString('he-IL')
              
              const paymentMethodDisplay = withdrawal.paymentMethod ? 
                db.getPaymentMethodDisplay(withdrawal.paymentMethod) : 'לא צוין'
              
              // חישוב יתרה לאחר משיכה זו
              const withdrawalsUpToThis = withdrawals.slice(0, index + 1)
              const totalWithdrawnUpToThis = withdrawalsUpToThis.reduce((sum, w) => sum + w.amount, 0)
              const remainingAfterThis = deposit.amount - totalWithdrawnUpToThis
              
              return `
                <div style="
                  padding: 15px; border-bottom: 1px solid #eee; cursor: pointer;
                  transition: background-color 0.2s;
                " 
                onmouseover="this.style.backgroundColor='#f8f9fa'" 
                onmouseout="this.style.backgroundColor='white'"
                onclick="selectWithdrawal(${withdrawal.id})">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="font-weight: bold; color: #2c3e50; font-size: 16px;">
                          משיכה #${withdrawal.id}
                        </div>
                        <div style="font-weight: bold; color: #e74c3c; font-size: 16px;">
                          ₪${withdrawal.amount.toLocaleString()}
                        </div>
                      </div>
                      
                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px;">
                        <div style="font-size: 13px; color: #666;">
                          📅 תאריך: <strong>${withdrawalDate}</strong>
                        </div>
                        <div style="font-size: 13px; color: #666;">
                          💳 ${paymentMethodDisplay}
                        </div>
                      </div>
                      
                      <div style="
                        background: ${remainingAfterThis === 0 ? '#fee2e2' : '#f0f9ff'}; 
                        padding: 8px; border-radius: 4px; font-size: 12px;
                        border: 1px solid ${remainingAfterThis === 0 ? '#fecaca' : '#bae6fd'};
                      ">
                        <strong>יתרה לאחר משיכה זו: 
                        <span style="color: ${remainingAfterThis === 0 ? '#dc2626' : '#0369a1'};">
                          ₪${remainingAfterThis.toLocaleString()}
                        </span></strong>
                        ${remainingAfterThis === 0 ? ' (הפקדון נמשך במלואו)' : ''}
                      </div>
                      
                      ${withdrawal.notes ? `
                        <div style="font-size: 12px; color: #999; margin-top: 5px; font-style: italic;">
                          📝 ${withdrawal.notes}
                        </div>
                      ` : ''}
                    </div>
                    
                    <div style="
                      background: #3498db; color: white; padding: 10px 15px;
                      border-radius: 5px; font-size: 14px; font-weight: bold;
                      margin-right: 15px; white-space: nowrap;
                    ">
                      📄 הדפס שובר
                    </div>
                  </div>
                </div>
              `
            }).join('')}
          </div>

          <div style="display: flex; justify-content: center; margin-top: 20px;">
            <button id="cancelSelection" style="
              background: #95a5a6; color: white; border: none; padding: 12px 24px;
              border-radius: 5px; font-size: 16px; cursor: pointer;
            ">סגור</button>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(modalContent)

    // הוספת פונקציה גלובלית לבחירת משיכה
    ;(window as any).selectWithdrawal = (withdrawalId: number) => {
      generateWithdrawalReceipt(depositId, withdrawalId)
      document.body.removeChild(modalContent)
      delete (window as any).selectWithdrawal
    }

    // כפתור ביטול
    const cancelBtn = modalContent.querySelector('#cancelSelection') as HTMLButtonElement
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modalContent)
      delete (window as any).selectWithdrawal
    })

    // סגירה בלחיצה על הרקע
    modalContent.addEventListener('click', (e) => {
      if (e.target === modalContent) {
        document.body.removeChild(modalContent)
        delete (window as any).selectWithdrawal
      }
    })
  }

  // פונקציה ליצירת שובר משיכה
  const generateWithdrawalReceipt = (depositId: number, withdrawalId: number) => {
    const deposit = deposits.find(d => d.id === depositId)
    const withdrawals = db.getWithdrawalsByDepositId(depositId)
    const withdrawal = withdrawals.find(w => w.id === withdrawalId)
    
    if (!deposit || !withdrawal) {
      showNotification('⚠️ לא ניתן להפיק שובר - נתונים חסרים', 'error')
      return
    }

    printWithdrawalReceipt(withdrawal, deposit)
  }

  const printWithdrawalReceipt = (withdrawal: DatabaseWithdrawal, deposit: DatabaseDeposit) => {
    const gemachName = db.getGemachName()
    const settings = db.getSettings()

    // כל המשיכות של ההפקדה
    const allWithdrawals = db.getWithdrawalsByDepositId(deposit.id)
    const currentWithdrawalIndex = allWithdrawals.findIndex(w => w.id === withdrawal.id)
    const previousWithdrawals = allWithdrawals.slice(0, currentWithdrawalIndex)
    
    // פרטי המשיכה הנוכחית
    const withdrawalAmount = withdrawal.amount.toLocaleString()
    const withdrawalDate = settings.showHebrewDates ?
      formatCombinedDate(withdrawal.date) :
      new Date(withdrawal.date).toLocaleDateString('he-IL')

    // פרטי ההפקדה
    const depositAmount = deposit.amount.toLocaleString()
    const depositDate = settings.showHebrewDates ?
      formatCombinedDate(deposit.depositDate) :
      new Date(deposit.depositDate).toLocaleDateString('he-IL')

    // חישוב יתרות
    const totalWithdrawnBeforeCurrent = previousWithdrawals.reduce((sum, w) => sum + w.amount, 0)
    const totalWithdrawnIncludingCurrent = totalWithdrawnBeforeCurrent + withdrawal.amount
    const remainingAmount = deposit.amount - totalWithdrawnIncludingCurrent

    // פרטי אמצעי תשלום
    const paymentMethodName = db.getPaymentMethodName(withdrawal.paymentMethod)
    const paymentMethodIcon = db.getPaymentMethodIcon(withdrawal.paymentMethod)
    const paymentDetails = db.getPaymentDetailsDisplay(withdrawal.paymentMethod, withdrawal.paymentDetails)

    // תאריך הפקת השובר
    const receiptDate = settings.showHebrewDates ?
      formatCombinedDate(new Date()) :
      new Date().toLocaleDateString('he-IL')

    // יצירת פירוט משיכות קודמות
    const previousWithdrawalsHTML = previousWithdrawals.length > 0 ? `
      <div style="text-align: right; margin: 15px 0; border: 1px solid #ddd; padding: 10px; background: #f9f9f9;">
        <h4 style="margin: 0 0 10px 0; color: #666; font-size: 14px;">📋 משיכות קודמות:</h4>
        ${previousWithdrawals.map((prevWithdrawal, index) => {
          const prevDate = settings.showHebrewDates ?
            formatCombinedDate(prevWithdrawal.date) :
            new Date(prevWithdrawal.date).toLocaleDateString('he-IL')
          return `
            <div style="margin: 5px 0; font-size: 12px; color: #555;">
              ${index + 1}. ₪${prevWithdrawal.amount.toLocaleString()} - ${prevDate}
            </div>
          `
        }).join('')}
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; font-weight: bold; color: #333;">
          סה"כ משיכות קודמות: ₪${totalWithdrawnBeforeCurrent.toLocaleString()}
        </div>
      </div>
    ` : ''

    if ((window as any).electronAPI) {
      // במצב Electron - הדפסה ישירה
      const printContent = `
        <div id="print-content" style="display: none;">
          <div style="font-family: Arial, sans-serif; direction: rtl; text-align: center; padding: 20px; line-height: 1.4; font-size: 14px; margin: 0;">
            <div style="max-width: 500px; margin: 0 auto; text-align: right;">
              <h1 style="font-size: 20px; margin-bottom: 20px; text-decoration: underline;">שובר משיכת פקדון</h1>
              
              <div style="border: 2px solid #2c3e50; padding: 15px; margin: 15px 0; background: #f8f9fa;">
                <h3 style="margin: 0 0 10px 0; color: #e67e22;">מספר משיכה: #${withdrawal.id}</h3>
                <p style="margin: 5px 0; font-weight: bold;">תאריך משיכה: ${withdrawalDate}</p>
              </div>

              <div style="text-align: right; margin: 15px 0;">
                <h3 style="margin-bottom: 10px; color: #2c3e50;">פרטי המפקיד:</h3>
                <p style="margin: 5px 0;">שם: <strong>${deposit.depositorName}</strong></p>
                ${deposit.idNumber ? `<p style="margin: 5px 0;">ת.ז: <strong>${db.formatIdNumber(deposit.idNumber)}</strong></p>` : ''}
              </div>

              <div style="text-align: right; margin: 15px 0;">
                <h3 style="margin-bottom: 10px; color: #2c3e50;">פרטי ההפקדה:</h3>
                <p style="margin: 5px 0;">סכום הפקדה מקורי: <strong>₪${depositAmount}</strong></p>
                <p style="margin: 5px 0;">תאריך הפקדה: <strong>${depositDate}</strong></p>
              </div>

              ${previousWithdrawalsHTML}

              <div style="border: 2px solid #e67e22; padding: 15px; margin: 15px 0; background: #fef2e8;">
                <h3 style="margin: 0 0 10px 0; color: #e67e22;">*** משיכה נוכחית ***</h3>
                <p style="margin: 5px 0; font-size: 16px; font-weight: bold;">סכום משיכה: <strong>₪${withdrawalAmount}</strong></p>
                <p style="margin: 5px 0;">תאריך משיכה: <strong>${withdrawalDate}</strong></p>
                <p style="margin: 5px 0;">אמצעי תשלום: <strong>${paymentMethodIcon} ${paymentMethodName}</strong></p>
                ${paymentDetails ? `
                  <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 5px;">
                    <strong>פרטי התשלום:</strong><br>
                    ${paymentDetails.split('\n').map(line => `<div style="margin: 2px 0;">${line}</div>`).join('')}
                  </div>
                ` : ''}
                ${withdrawal.notes ? `<p style="margin: 5px 0;">הערות: <strong>${withdrawal.notes}</strong></p>` : ''}
              </div>

              <div style="border: 2px solid #2c3e50; padding: 15px; margin: 15px 0; background: #f8f9fa;">
                <h3 style="margin: 0 0 10px 0; color: #2c3e50;">*** סיכום ***</h3>
                ${previousWithdrawals.length > 0 ? `
                  <p style="margin: 5px 0;">משיכות קודמות: <strong>₪${totalWithdrawnBeforeCurrent.toLocaleString()}</strong></p>
                ` : ''}
                <p style="margin: 5px 0;">משיכה נוכחית: <strong>₪${withdrawalAmount}</strong></p>
                <p style="margin: 5px 0; border-top: 1px solid #ddd; padding-top: 5px;">
                  <strong>סה"כ נמשך: ₪${totalWithdrawnIncludingCurrent.toLocaleString()}</strong>
                </p>
                <p style="margin: 5px 0; font-size: 16px; font-weight: bold; color: ${remainingAmount > 0 ? '#27ae60' : '#e74c3c'};">
                  יתרת פקדון: <strong>₪${remainingAmount.toLocaleString()}</strong>
                </p>
                ${remainingAmount === 0 ? `
                  <div style="background: #e67e22; color: white; padding: 10px; border-radius: 5px; margin: 10px 0; text-align: center;">
                    <strong>🏁 הפקדון נמשך במלואו 🏁</strong>
                  </div>
                ` : ''}
              </div>

              <div style="text-align: center; margin: 20px 0; padding: 15px; border-top: 1px solid #bdc3c7;">
                <p style="margin: 5px 0; font-weight: bold;">גמ"ח "${gemachName}"</p>
                <p style="margin: 5px 0; font-size: 12px;">תאריך הפקת השובר: ${receiptDate}</p>
              </div>

              <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #7f8c8d;">
                <p>שובר זה מהווה אישור על ביצוע המשיכה</p>
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
      // פתרון רגיל לדפדפנים - יצירת חלון הדפסה
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      if (printWindow) {
        printWindow.document.write(`
          <html dir="rtl">
            <head>
              <title>שובר משיכת פקדון - ${deposit.depositorName}</title>
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
                .withdrawal-details {
                  border: 2px solid #e67e22;
                  padding: 15px;
                  margin: 15px 0;
                  background: #fef2e8;
                }
                .payment-method-details {
                  margin: 10px 0;
                  padding: 10px;
                  background: white;
                  border-radius: 5px;
                }
                .completed-withdrawal {
                  background: #e67e22;
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
                  .receipt-header, .withdrawal-details { margin: 10px 0; }
                }
              </style>
            </head>
            <body>
              <div class="print-buttons">
                <button class="print-btn" onclick="window.print()">🖨️ הדפס</button>
                <button class="print-btn close-btn" onclick="window.close()">❌ סגור</button>
              </div>
              <div class="content">
                <h1>שובר משיכת פקדון</h1>
                
                <div class="receipt-header">
                  <h3 style="margin: 0 0 10px 0; color: #e67e22;">מספר משיכה: #${withdrawal.id}</h3>
                  <p style="margin: 5px 0; font-weight: bold;">תאריך משיכה: ${withdrawalDate}</p>
                </div>

                <div style="text-align: right; margin: 15px 0;">
                  <h3 style="margin-bottom: 10px; color: #2c3e50;">פרטי המפקיד:</h3>
                  <p style="margin: 5px 0;">שם: <strong>${deposit.depositorName}</strong></p>
                  ${deposit.idNumber ? `<p style="margin: 5px 0;">ת.ז: <strong>${db.formatIdNumber(deposit.idNumber)}</strong></p>` : ''}
                </div>

                <div style="text-align: right; margin: 15px 0;">
                  <h3 style="margin-bottom: 10px; color: #2c3e50;">פרטי ההפקדה:</h3>
                  <p style="margin: 5px 0;">סכום הפקדה מקורי: <strong>₪${depositAmount}</strong></p>
                  <p style="margin: 5px 0;">תאריך הפקדה: <strong>${depositDate}</strong></p>
                </div>

                ${previousWithdrawals.length > 0 ? `
                  <div style="text-align: right; margin: 15px 0; border: 1px solid #ddd; padding: 10px; background: #f9f9f9;">
                    <h4 style="margin: 0 0 10px 0; color: #666; font-size: 14px;">📋 משיכות קודמות:</h4>
                    ${previousWithdrawals.map((prevWithdrawal, index) => {
                      const prevDate = settings.showHebrewDates ?
                        formatCombinedDate(prevWithdrawal.date) :
                        new Date(prevWithdrawal.date).toLocaleDateString('he-IL')
                      return `
                        <div style="margin: 5px 0; font-size: 12px; color: #555;">
                          ${index + 1}. ₪${prevWithdrawal.amount.toLocaleString()} - ${prevDate}
                        </div>
                      `
                    }).join('')}
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; font-weight: bold; color: #333;">
                      סה"כ משיכות קודמות: ₪${totalWithdrawnBeforeCurrent.toLocaleString()}
                    </div>
                  </div>
                ` : ''}

                <div class="withdrawal-details">
                  <h3 style="margin: 0 0 10px 0; color: #e67e22;">*** משיכה נוכחית ***</h3>
                  <p style="margin: 5px 0; font-size: 16px; font-weight: bold;">סכום משיכה: <strong>₪${withdrawalAmount}</strong></p>
                  <p style="margin: 5px 0;">תאריך משיכה: <strong>${withdrawalDate}</strong></p>
                  <p style="margin: 5px 0;">אמצעי תשלום: <strong>${paymentMethodIcon} ${paymentMethodName}</strong></p>
                  ${paymentDetails ? `
                    <div class="payment-method-details">
                      <strong>פרטי התשלום:</strong><br>
                      ${paymentDetails.split('\n').map(line => `<div style="margin: 2px 0;">${line}</div>`).join('')}
                    </div>
                  ` : ''}
                  ${withdrawal.notes ? `<p style="margin: 5px 0;">הערות: <strong>${withdrawal.notes}</strong></p>` : ''}
                </div>

                <div style="border: 2px solid #2c3e50; padding: 15px; margin: 15px 0; background: #f8f9fa;">
                  <h3 style="margin: 0 0 10px 0; color: #2c3e50;">*** סיכום ***</h3>
                  ${previousWithdrawals.length > 0 ? `
                    <p style="margin: 5px 0;">משיכות קודמות: <strong>₪${totalWithdrawnBeforeCurrent.toLocaleString()}</strong></p>
                  ` : ''}
                  <p style="margin: 5px 0;">משיכה נוכחית: <strong>₪${withdrawalAmount}</strong></p>
                  <p style="margin: 5px 0; border-top: 1px solid #ddd; padding-top: 5px;">
                    <strong>סה"כ נמשך: ₪${totalWithdrawnIncludingCurrent.toLocaleString()}</strong>
                  </p>
                  <p style="margin: 5px 0; font-size: 16px; font-weight: bold; color: ${remainingAmount > 0 ? '#27ae60' : '#e74c3c'};">
                    יתרת פקדון: <strong>₪${remainingAmount.toLocaleString()}</strong>
                  </p>
                  ${remainingAmount === 0 ? `
                    <div style="background: #e67e22; color: white; padding: 10px; border-radius: 5px; margin: 10px 0; text-align: center;">
                      <strong>🏁 הפקדון נמשך במלואו 🏁</strong>
                    </div>
                  ` : ''}
                </div>

                <div class="footer">
                  <p style="margin: 5px 0; font-weight: bold;">גמ"ח "${gemachName}"</p>
                  <p style="margin: 5px 0; font-size: 12px;">תאריך הפקת השובר: ${receiptDate}</p>
                </div>

                <div class="disclaimer">
                  <p>שובר זה מהווה אישור על ביצוע המשיכה</p>
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

  return (
    <div>
      <header className="header">
        <h1>תרומות והפקדות</h1>
        <button className="close-btn" onClick={() => navigate('/')}>×</button>
      </header>

      {/* טאבים */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/donations')}
          style={{ marginLeft: '10px' }}
        >
          💸 תרומות
        </button>
        <button
          className="btn btn-success"
          style={{ marginLeft: '10px' }}
        >
          💵 פקדונות
        </button>
      </div>

      <div className="container">
        <div className="main-content">
          <h2 style={{ color: '#2c3e50', marginBottom: '40px' }}>ניהול פקדונות</h2>
          <p style={{ color: '#34495e', fontSize: '18px' }}>
            כאן תוכל לנהל את כל הפקדונות של הגמ"ח - ללא ריבית, גמילות חסדים נטו
          </p>
          
          <div className="form-container" style={{ marginTop: '40px' }}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>הוספת פקדון חדש</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>שם המפקיד:</label>
                <input 
                  type="text" 
                  value={newDeposit.depositorName}
                  onChange={(e) => handleInputChange('depositorName', e.target.value)}
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
                  value={newDeposit.idNumber}
                  onChange={(e) => {
                    const cleanValue = e.target.value.replace(/[^\d\s-]/g, '')
                    handleInputChange('idNumber', cleanValue)
                  }}
                  placeholder={db.getSettings().requireIdNumber ? "דוגמה: 123456782" : "דוגמה: 123456782 (אופציונלי)"}
                  maxLength={11}
                  style={{
                    borderColor: newDeposit.idNumber && !db.validateIsraeliId(newDeposit.idNumber) ? '#e74c3c' : undefined
                  }}
                />
                {newDeposit.idNumber && (
                  <small style={{ 
                    color: db.validateIsraeliId(newDeposit.idNumber) ? '#27ae60' : '#e74c3c',
                    fontSize: '12px',
                    display: 'block',
                    marginTop: '2px'
                  }}>
                    {(() => {
                      const cleanId = newDeposit.idNumber.replace(/[\s-]/g, '')
                      if (cleanId.length !== 9) {
                        return `נדרשות 9 ספרות (יש ${cleanId.length})`
                      } else if (db.validateIsraeliId(newDeposit.idNumber)) {
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
                <label>סכום הפקדון:</label>
                <NumberInput
                  value={newDeposit.amount || 0}
                  onChange={(value) => handleInputChange('amount', value)}
                  placeholder="הזן סכום"
                />
              </div>
              <div className="form-group">
                {/* שדה ריק לאיזון */}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>תאריך הפקדה:</label>
                <input 
                  type="date" 
                  max={new Date().toISOString().split('T')[0]}
                  value={newDeposit.depositDate}
                  onChange={(e) => handleInputChange('depositDate', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>תקופת הפקדה (חודשים):</label>
                <input 
                  type="number" 
                  value={newDeposit.depositPeriod}
                  onChange={(e) => handleInputChange('depositPeriod', Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>טלפון:</label>
                <input 
                  type="text" 
                  value={newDeposit.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>הערות:</label>
                <input 
                  type="text" 
                  value={newDeposit.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
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
                  💰 אמצעי קבלת ההפקדה
                </h4>
                
                <div className="form-group">
                  <label>בחר אמצעי תשלום:</label>
                  <select
                    value={newDeposit.depositPaymentMethod || ''}
                    onChange={(e) => {
                      handleInputChange('depositPaymentMethod', e.target.value)
                      // נקה פרטי תשלום קודמים כשמשנים אמצעי
                      handleInputChange('depositPaymentDetails', '')
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
                {newDeposit.depositPaymentMethod === 'check' && (
                  <div style={{ marginTop: '15px' }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>📝 פרטי הצ'ק</h5>
                    <div className="form-row">
                      <div className="form-group">
                        <label>מספר צ'ק:</label>
                        <input
                          type="text"
                          placeholder="מספר הצ'ק"
                          onChange={(e) => {
                            const details = db.parsePaymentDetails('check', newDeposit.depositPaymentDetails) || {}
                            details.checkNumber = e.target.value
                            handleInputChange('depositPaymentDetails', JSON.stringify(details))
                          }}
                          value={db.parsePaymentDetails('check', newDeposit.depositPaymentDetails)?.checkNumber || ''}
                        />
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <BankBranchSelector
                          selectedBankCode={db.parsePaymentDetails('check', newDeposit.depositPaymentDetails)?.bankCode || ''}
                          selectedBranchCode={db.parsePaymentDetails('check', newDeposit.depositPaymentDetails)?.branchCode || ''}
                          onBankChange={(bankCode, bankName) => {
                            const details = db.parsePaymentDetails('check', newDeposit.depositPaymentDetails) || {}
                            details.bankCode = bankCode
                            details.bankName = bankName
                            details.branchCode = ''
                            details.branchName = ''
                            handleInputChange('depositPaymentDetails', JSON.stringify(details))
                          }}
                          onBranchChange={(branchCode, branchName, branchAddress, city) => {
                            const details = db.parsePaymentDetails('check', newDeposit.depositPaymentDetails) || {}
                            details.branchCode = branchCode
                            details.branchName = branchName
                            details.branchAddress = branchAddress
                            details.city = city
                            details.branch = `${branchName} (${city})`
                            handleInputChange('depositPaymentDetails', JSON.stringify(details))
                          }}
                          showLabels={false}
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
                            const details = db.parsePaymentDetails('check', newDeposit.depositPaymentDetails) || {}
                            details.branch = e.target.value
                            handleInputChange('depositPaymentDetails', JSON.stringify(details))
                          }}
                          value={db.parsePaymentDetails('check', newDeposit.depositPaymentDetails)?.branch || ''}
                        />
                      </div>
                      <div className="form-group">
                        <label>תאריך פדיון:</label>
                        <input
                          type="date"
                          onChange={(e) => {
                            const details = db.parsePaymentDetails('check', newDeposit.depositPaymentDetails) || {}
                            details.dueDate = e.target.value
                            handleInputChange('depositPaymentDetails', JSON.stringify(details))
                          }}
                          value={db.parsePaymentDetails('check', newDeposit.depositPaymentDetails)?.dueDate || ''}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {newDeposit.depositPaymentMethod === 'transfer' && (
                  <div style={{ marginTop: '15px' }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>🏦 פרטי ההעברה</h5>
                    <div className="form-row">
                      <div className="form-group">
                        <label>מספר אסמכתא:</label>
                        <input
                          type="text"
                          placeholder="מספר אסמכתא"
                          onChange={(e) => {
                            const details = db.parsePaymentDetails('transfer', newDeposit.depositPaymentDetails) || {}
                            details.referenceNumber = e.target.value
                            handleInputChange('depositPaymentDetails', JSON.stringify(details))
                          }}
                          value={db.parsePaymentDetails('transfer', newDeposit.depositPaymentDetails)?.referenceNumber || ''}
                        />
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <BankBranchSelector
                          selectedBankCode={db.parsePaymentDetails('transfer', newDeposit.depositPaymentDetails)?.bankCode || ''}
                          selectedBranchCode={db.parsePaymentDetails('transfer', newDeposit.depositPaymentDetails)?.branchCode || ''}
                          onBankChange={(bankCode, bankName) => {
                            const details = db.parsePaymentDetails('transfer', newDeposit.depositPaymentDetails) || {}
                            details.bankCode = bankCode
                            details.bankName = bankName
                            details.branchCode = ''
                            details.branchName = ''
                            handleInputChange('depositPaymentDetails', JSON.stringify(details))
                          }}
                          onBranchChange={(branchCode, branchName, branchAddress, city) => {
                            const details = db.parsePaymentDetails('transfer', newDeposit.depositPaymentDetails) || {}
                            details.branchCode = branchCode
                            details.branchName = branchName
                            details.branchAddress = branchAddress
                            details.city = city
                            details.branchNumber = branchCode
                            handleInputChange('depositPaymentDetails', JSON.stringify(details))
                          }}
                          showLabels={false}
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>מספר חשבון:</label>
                        <input
                          type="text"
                          placeholder="מספר חשבון"
                          onChange={(e) => {
                            const details = db.parsePaymentDetails('transfer', newDeposit.depositPaymentDetails) || {}
                            details.accountNumber = e.target.value
                            handleInputChange('depositPaymentDetails', JSON.stringify(details))
                          }}
                          value={db.parsePaymentDetails('transfer', newDeposit.depositPaymentDetails)?.accountNumber || ''}
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
                            const details = db.parsePaymentDetails('transfer', newDeposit.depositPaymentDetails) || {}
                            details.transferDate = e.target.value
                            handleInputChange('depositPaymentDetails', JSON.stringify(details))
                          }}
                          value={db.parsePaymentDetails('transfer', newDeposit.depositPaymentDetails)?.transferDate || ''}
                        />
                      </div>
                      <div className="form-group">
                        {/* שדה ריק לאיזון */}
                      </div>
                    </div>
                  </div>
                )}

                {newDeposit.depositPaymentMethod === 'credit' && (
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
                            const details = db.parsePaymentDetails('credit', newDeposit.depositPaymentDetails) || {}
                            details.lastFourDigits = e.target.value
                            handleInputChange('depositPaymentDetails', JSON.stringify(details))
                          }}
                          value={db.parsePaymentDetails('credit', newDeposit.depositPaymentDetails)?.lastFourDigits || ''}
                        />
                      </div>
                      <div className="form-group">
                        <label>מספר עסקה:</label>
                        <input
                          type="text"
                          placeholder="מספר עסקה"
                          onChange={(e) => {
                            const details = db.parsePaymentDetails('credit', newDeposit.depositPaymentDetails) || {}
                            details.transactionNumber = e.target.value
                            handleInputChange('depositPaymentDetails', JSON.stringify(details))
                          }}
                          value={db.parsePaymentDetails('credit', newDeposit.depositPaymentDetails)?.transactionNumber || ''}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {newDeposit.depositPaymentMethod === 'other' && (
                  <div style={{ marginTop: '15px' }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>❓ פרטים נוספים</h5>
                    <div className="form-group">
                      <label>הסבר:</label>
                      <textarea
                        placeholder="הסבר על אמצעי התשלום"
                        rows={3}
                        onChange={(e) => {
                          const details = { description: e.target.value }
                          handleInputChange('depositPaymentDetails', JSON.stringify(details))
                        }}
                        value={db.parsePaymentDetails('other', newDeposit.depositPaymentDetails)?.description || ''}
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

            {editingId && (
              <div className="form-row">
                <div className="form-group">
                  <label>סכום שנמשך:</label>
                  <NumberInput
                    value={newDeposit.withdrawnAmount || 0}
                    onChange={(value) => handleInputChange('withdrawnAmount', value)}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>תאריך משיכה:</label>
                  <input 
                    type="date" 
                    max={new Date().toISOString().split('T')[0]}
                    value={newDeposit.withdrawnDate || ''}
                    onChange={(e) => handleInputChange('withdrawnDate', e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <div className="form-row" style={{ justifyContent: 'center' }}>
              <button className="btn btn-success" onClick={saveDeposit}>
                {editingId ? 'עדכן הפקדה' : 'הוסף פקדון'}
              </button>
              {editingId && (
                <button 
                  className="btn" 
                  onClick={() => {
                    setEditingId(null)
                    setNewDeposit({
                      depositorName: '',
                      idNumber: '',
                      amount: 0,
                      depositDate: '',
                      depositPeriod: 12,
                      reminderDays: 30,
                      phone: '',
                      notes: '',
                      withdrawnAmount: 0,
                      withdrawnDate: '',
                      depositPaymentMethod: '',
                      depositPaymentDetails: '',
                      withdrawalPaymentMethod: '',
                      withdrawalPaymentDetails: ''
                    })
                  }}
                  style={{ backgroundColor: '#e74c3c', color: 'white', marginRight: '10px' }}
                >
                  ביטול עריכה
                </button>
              )}
            </div>
          </div>

          {deposits.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>מספר</th>
                  <th>שם המפקיד</th>
                  <th>סכום מקורי</th>
                  <th>יתרה</th>
                  <th>תאריך הפקדה</th>
                  <th>אמצעי תשלום</th>
                  <th>סטטוס</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((deposit) => {
                  const withdrawnAmount = db.getTotalWithdrawnAmount(deposit.id)
                  const remainingAmount = deposit.amount - withdrawnAmount
                  
                  // פרטי אמצעי הפקדה
                  const depositMethodIcon = deposit.depositPaymentMethod ? 
                    (deposit.depositPaymentMethod === 'cash' ? '💵' :
                     deposit.depositPaymentMethod === 'transfer' ? '🏦' :
                     deposit.depositPaymentMethod === 'check' ? '📝' :
                     deposit.depositPaymentMethod === 'credit' ? '💳' : '❓') : ''
                  
                  const depositMethodName = deposit.depositPaymentMethod ? 
                    (deposit.depositPaymentMethod === 'cash' ? 'מזומן' :
                     deposit.depositPaymentMethod === 'transfer' ? 'העברה' :
                     deposit.depositPaymentMethod === 'check' ? 'צ\'ק' :
                     deposit.depositPaymentMethod === 'credit' ? 'אשראי' : 'אחר') : ''

                  // פרטי אמצעי משיכה
                  const withdrawalMethodIcon = deposit.withdrawalPaymentMethod ? 
                    (deposit.withdrawalPaymentMethod === 'cash' ? '💵' :
                     deposit.withdrawalPaymentMethod === 'transfer' ? '🏦' :
                     deposit.withdrawalPaymentMethod === 'check' ? '📝' :
                     deposit.withdrawalPaymentMethod === 'credit' ? '💳' : '❓') : ''
                  
                  const withdrawalMethodName = deposit.withdrawalPaymentMethod ? 
                    (deposit.withdrawalPaymentMethod === 'cash' ? 'מזומן' :
                     deposit.withdrawalPaymentMethod === 'transfer' ? 'העברה' :
                     deposit.withdrawalPaymentMethod === 'check' ? 'צ\'ק' :
                     deposit.withdrawalPaymentMethod === 'credit' ? 'אשראי' : 'אחר') : ''

                  return (
                    <tr key={deposit.id}>
                      <td>{deposit.id}</td>
                      <td>
                        <div>{deposit.depositorName}</div>
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          {db.formatIdNumber(deposit.idNumber || '')}
                        </div>
                      </td>
                      <td style={{ color: '#3498db', fontWeight: 'bold' }}>
                        ₪{deposit.amount.toLocaleString()}
                      </td>
                      <td>
                        <div style={{ color: remainingAmount > 0 ? '#27ae60' : '#999', fontWeight: 'bold' }}>
                          ₪{remainingAmount.toLocaleString()}
                        </div>
                        {withdrawnAmount > 0 && (
                          <div style={{ fontSize: '11px', color: '#e74c3c' }}>
                            נמשך: ₪{withdrawnAmount.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        {db.getSettings().showHebrewDates ? 
                          formatCombinedDate(deposit.depositDate) : 
                          new Date(deposit.depositDate).toLocaleDateString('he-IL')
                        }
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '120px' }}>
                          {/* אמצעי הפקדה */}
                          {depositMethodIcon && depositMethodName && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#e8f5e8', padding: '4px 8px', borderRadius: '4px' }}>
                              <span style={{ fontSize: '12px', color: '#27ae60', fontWeight: 'bold' }}>
                                📥 {depositMethodIcon} {depositMethodName}
                              </span>
                              {deposit.depositPaymentDetails && (
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
                                  title="פרטי הפקדה"
                                  onClick={() => {
                                    const details = db.getPaymentDetailsDisplay(deposit.depositPaymentMethod || '', deposit.depositPaymentDetails)
                                    const fullInfo = `📥 פרטי הפקדה:\n\n` +
                                      `💰 סכום הפקדה: ₪${deposit.amount.toLocaleString()}\n` +
                                      `📅 תאריך הפקדה: ${db.getSettings().showHebrewDates ? formatCombinedDate(deposit.depositDate) : new Date(deposit.depositDate).toLocaleDateString('he-IL')}\n` +
                                      `💳 אמצעי תשלום: ${db.getPaymentMethodDisplay(deposit.depositPaymentMethod)}\n\n` +
                                      (details ? `פרטים נוספים:\n${details}` : 'אין פרטים נוספים')
                                    
                                    setModalConfig({
                                      isOpen: true,
                                      title: 'פרטי הפקדה מלאים',
                                      message: fullInfo,
                                      confirmText: 'סגור',
                                      cancelText: '',
                                      type: 'info',
                                      onConfirm: () => {},
                                      onCancel: () => {}
                                    })
                                  }}
                                >
                                  ℹ️
                                </button>
                              )}
                            </div>
                          )}
                          
                          {/* אמצעי משיכה */}
                          {withdrawalMethodIcon && withdrawalMethodName && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: '#fef2e8', padding: '3px 6px', borderRadius: '3px' }}>
                              <span style={{ fontSize: '11px', color: '#e67e22' }}>
                                📤 {withdrawalMethodIcon} {withdrawalMethodName}
                              </span>
                              {deposit.withdrawalPaymentDetails && (
                                <button
                                  style={{
                                    background: '#e67e22',
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
                                  title="היסטוריית משיכות"
                                  onClick={() => {
                                    const withdrawals = db.getWithdrawalsByDepositId(deposit.id)
                                    const totalWithdrawn = db.getTotalWithdrawnAmount(deposit.id)
                                    const remainingAmount = deposit.amount - totalWithdrawn
                                    
                                    let fullInfo = `📤 היסטוריית משיכות מלאה:\n\n` +
                                      `💰 סכום הפקדה מקורי: ₪${deposit.amount.toLocaleString()}\n` +
                                      `💸 סה"כ נמשך: ₪${totalWithdrawn.toLocaleString()}\n` +
                                      `💵 יתרה נוכחית: ₪${remainingAmount.toLocaleString()}\n\n`
                                    
                                    if (withdrawals.length > 0) {
                                      fullInfo += `📋 פירוט כל המשיכות (${withdrawals.length}):\n\n`
                                      
                                      withdrawals.forEach((withdrawal, index) => {
                                        const withdrawalDate = db.getSettings().showHebrewDates ? 
                                          formatCombinedDate(withdrawal.date) : 
                                          new Date(withdrawal.date).toLocaleDateString('he-IL')
                                        
                                        // חישוב יתרה לאחר משיכה זו
                                        const withdrawalsUpToThis = withdrawals.slice(0, index + 1)
                                        const totalWithdrawnUpToThis = withdrawalsUpToThis.reduce((sum, w) => sum + w.amount, 0)
                                        const remainingAfterThis = deposit.amount - totalWithdrawnUpToThis
                                        
                                        fullInfo += `${index + 1}. משיכה #${withdrawal.id} - ₪${withdrawal.amount.toLocaleString()}\n`
                                        fullInfo += `   📅 תאריך: ${withdrawalDate}\n`
                                        fullInfo += `   💳 ${db.getPaymentMethodDisplay(withdrawal.paymentMethod)}\n`
                                        fullInfo += `   💰 יתרה לאחר משיכה: ₪${remainingAfterThis.toLocaleString()}`
                                        
                                        if (remainingAfterThis === 0) {
                                          fullInfo += ` (הפקדון נמשך במלואו)`
                                        }
                                        fullInfo += `\n`
                                        
                                        if (withdrawal.paymentDetails) {
                                          const details = db.getPaymentDetailsDisplay(withdrawal.paymentMethod || '', withdrawal.paymentDetails)
                                          if (details) {
                                            // הגבל את אורך הפרטים
                                            const shortDetails = details.length > 80 ? 
                                              details.substring(0, 80) + '...' : details
                                            fullInfo += `   📝 ${shortDetails.replace(/\n/g, '\n   ')}\n`
                                          }
                                        }
                                        
                                        if (withdrawal.notes) {
                                          fullInfo += `   📋 הערות: ${withdrawal.notes}\n`
                                        }
                                        
                                        fullInfo += '\n'
                                      })
                                    } else {
                                      fullInfo += 'אין משיכות עדיין'
                                    }
                                    
                                    setModalConfig({
                                      isOpen: true,
                                      title: 'היסטוריית משיכות מלאה',
                                      message: fullInfo,
                                      confirmText: withdrawals.length > 1 ? 'הדפס שובר' : 'סגור',
                                      cancelText: withdrawals.length > 1 ? 'סגור' : '',
                                      type: 'info',
                                      onConfirm: () => {
                                        if (withdrawals.length > 1) {
                                          showWithdrawalSelectionModal(deposit.id, withdrawals)
                                        }
                                      },
                                      onCancel: () => {}
                                    })
                                  }}
                                >
                                  ℹ️
                                </button>
                              )}
                            </div>
                          )}
                          
                          {!depositMethodIcon && !withdrawalMethodIcon && (
                            <span style={{ color: '#999', fontSize: '12px' }}>-</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          background: deposit.status === 'active' ? '#27ae60' : '#95a5a6',
                          color: 'white',
                          padding: '3px 8px',
                          borderRadius: '10px',
                          fontSize: '11px'
                        }}>
                          {deposit.status === 'active' ? '✅ פעיל' : '📤 נמשך'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setNewDeposit({
                              ...deposit,
                              reminderDays: deposit.reminderDays || 30,
                              withdrawnAmount: deposit.withdrawnAmount || 0,
                              withdrawnDate: deposit.withdrawnDate || ''
                            })
                            setEditingId(deposit.id)
                          }}
                          style={{
                            padding: '5px 10px',
                            fontSize: '12px',
                            backgroundColor: '#f39c12',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            marginLeft: '5px'
                          }}
                        >
                          ✏️ ערוך
                        </button>
                        <button
                          onClick={() => generateDepositDocument(deposit)}
                          style={{
                            padding: '5px 10px',
                            fontSize: '12px',
                            backgroundColor: '#9b59b6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            marginLeft: '5px'
                          }}
                        >
                          📄 שטר
                        </button>
                        {deposit.status === 'active' && remainingAmount > 0 && (
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                            onClick={() => withdrawDeposit(deposit.id)}
                          >
                            משיכה
                          </button>
                        )}
                        {(() => {
                          const withdrawals = db.getWithdrawalsByDepositId(deposit.id)
                          return withdrawals.length > 0 && (
                            <button 
                              className="btn btn-success" 
                              style={{ padding: '5px 10px', fontSize: '12px', marginLeft: '5px' }}
                              onClick={() => {
                                // הצג רשימת כל המשיכות לבחירה
                                showWithdrawalSelectionModal(deposit.id, withdrawals)
                              }}
                              title={`הדפס שובר למשיכה (${withdrawals.length} משיכות)`}
                            >
                              📄 שוברים
                            </button>
                          )
                        })()}
                        <button
                          onClick={() => {
                            showConfirmModal({
                              title: 'מחיקת הפקדה',
                              message: 'האם אתה בטוח שברצונך למחוק את ההפקדה?\nפעולה זו לא ניתנת לביטול.',
                              confirmText: 'מחק הפקדה',
                              cancelText: 'ביטול',
                              type: 'danger',
                              onConfirm: () => {
                                db.deleteDeposit(deposit.id)
                                loadDeposits()
                                showNotification('✅ ההפקדה נמחקה בהצלחה!')
                              }
                            })
                          }}
                          style={{
                            padding: '5px 10px',
                            fontSize: '12px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            marginLeft: '5px'
                          }}
                        >
                          🗑️ מחק
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <button className="back-btn" onClick={() => navigate('/')}>
        🏠
      </button>

      {/* מודל אישור */}
      {modalConfig && modalConfig.isOpen && (
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
              maxWidth: '500px',
              maxHeight: '80vh',
              width: '90%',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              textAlign: 'center',
              direction: 'rtl',
              overflow: 'auto'
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
            
            <p style={{
              marginBottom: modalConfig.hasInput ? '20px' : '30px',
              lineHeight: '1.5',
              fontSize: '16px',
              color: '#2c3e50',
              whiteSpace: 'pre-line'
            }}>
              {modalConfig.message}
            </p>

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
              
              {modalConfig.cancelText && modalConfig.cancelText.trim() !== '' && (
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
      )}
    </div>
  )
}

export default DepositsPage