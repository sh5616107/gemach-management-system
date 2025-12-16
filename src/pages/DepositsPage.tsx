import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, DatabaseDepositor } from '../database/database'
import DepositorCard from '../components/DepositorCard'
import NewDepositorForm from '../components/NewDepositorForm'
import NewDepositForm from '../components/NewDepositForm'
import EditDepositorForm from '../components/EditDepositorForm'
import DepositorDetailedReport from '../components/DepositorDetailedReport'
import EditDepositForm from '../components/EditDepositForm'
import WithdrawDepositModal from '../components/WithdrawDepositModal'
import WithdrawalsListModal from '../components/WithdrawalsListModal'

function DepositsPage() {
  const navigate = useNavigate()
  
  // State
  const [depositors, setDepositors] = useState<DatabaseDepositor[]>([])
  const [selectedDepositor, setSelectedDepositor] = useState<DatabaseDepositor | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewDepositorForm, setShowNewDepositorForm] = useState(false)
  const [showEditDepositorForm, setShowEditDepositorForm] = useState(false)
  const [showNewDepositForm, setShowNewDepositForm] = useState(false)
  const [showDetailedReport, setShowDetailedReport] = useState(false)
  const [editingDeposit, setEditingDeposit] = useState<any>(null)
  const [withdrawingDeposit, setWithdrawingDeposit] = useState<{ id: number; balance: number } | null>(null)
  const [viewingWithdrawals, setViewingWithdrawals] = useState<number | null>(null)
  
  // State למודל אישור
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText: string
    cancelText?: string
    onConfirm: () => void
    onCancel?: () => void
    type: 'warning' | 'danger' | 'info' | 'success'
    showCancelButton?: boolean
  } | null>(null)
  
  // טעינה ראשונית
  useEffect(() => {
    loadDepositors()
    checkMigrationMessage()
  }, [])

  const loadDepositors = () => {
    const allDepositors = db.getDepositors()
    setDepositors(allDepositors)
    console.log('🔄 נטענו', allDepositors.length, 'מפקידים')
  }

  const checkMigrationMessage = () => {
    const message = localStorage.getItem('gemach_migration_message')
    if (message) {
      showNotification(message, 'info')
      localStorage.removeItem('gemach_migration_message')
    }
    
    const recurringMessage = localStorage.getItem('gemach_recurring_message')
    if (recurringMessage) {
      showNotification(recurringMessage, 'success')
      localStorage.removeItem('gemach_recurring_message')
    }
  }

  // פונקציה להצגת הודעות
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
    onConfirm: () => void
    onCancel?: () => void
    type?: 'warning' | 'danger' | 'info' | 'success'
    showCancelButton?: boolean
  }) => {
    setModalConfig({
      isOpen: true,
      cancelText: 'ביטול',
      type: 'warning',
      showCancelButton: true,
      ...config
    })
  }

  // פונקציה לסגירת המודל
  const closeModal = () => {
    setModalConfig(null)
  }

  // סינון מפקידים
  const filteredDepositors = depositors.filter(depositor => {
    const searchLower = searchTerm.toLowerCase()
    return (
      depositor.name.toLowerCase().includes(searchLower) ||
      depositor.idNumber.includes(searchTerm) ||
      depositor.phone.includes(searchTerm)
    )
  })

  // פעולות על מפקיד
  const handleViewDepositor = (depositor: DatabaseDepositor) => {
    setSelectedDepositor(depositor)
  }

  const handleEditDepositor = (depositor: DatabaseDepositor) => {
    setSelectedDepositor(depositor)
    setShowEditDepositorForm(true)
  }

  const handleDeleteDepositor = (depositor: DatabaseDepositor) => {
    showConfirmModal({
      title: 'מחיקת מפקיד',
      message: `האם אתה בטוח שברצונך למחוק את המפקיד ${depositor.name}?\n\nפעולה זו תמחק גם את כל ההפקדות הקשורות למפקיד זה.`,
      confirmText: 'מחק',
      cancelText: 'ביטול',
      type: 'danger',
      onConfirm: () => {
        const result = db.deleteDepositor(depositor.id)
        if (result.success) {
          showNotification('✅ המפקיד נמחק בהצלחה')
          setSelectedDepositor(null)
          loadDepositors()
        } else {
          showNotification(`❌ ${result.error}`, 'error')
        }
      }
    })
  }

  // פעולות על הפקדה
  const handleWithdrawDeposit = (depositId: number, availableBalance: number) => {
    setWithdrawingDeposit({ id: depositId, balance: availableBalance })
  }

  // פונקציה לביצוע משיכה מרובה
  const performMultipleWithdrawal = (activeDeposits: any[], amount: number, paymentMethod?: string, paymentDetails?: string) => {
    let remainingAmount = amount
    
    // עבור על ההפקדות לפי סדר (מהישנה לחדשה) ומשוך מכל אחת
    for (const deposit of activeDeposits) {
      if (remainingAmount <= 0) break
      
      const withdrawnAmount = db.getTotalWithdrawnAmount(deposit.id)
      const balance = deposit.amount - withdrawnAmount
      
      if (balance <= 0) continue
      
      const withdrawAmount = Math.min(balance, remainingAmount)
      
      db.addWithdrawal({
        depositId: deposit.id,
        amount: withdrawAmount,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: paymentMethod as 'cash' | 'transfer' | 'check' | 'credit' | 'other' | undefined,
        paymentDetails: paymentDetails || undefined,
        notes: `משיכה מרובה - חלק מ-₪${amount.toLocaleString()}`
      })
      
      remainingAmount -= withdrawAmount
      
      // בדוק אם ההפקדה נמשכה במלואה
      const newBalance = balance - withdrawAmount
      if (newBalance <= 0) {
        db.updateDeposit(deposit.id, { status: 'withdrawn' })
      }
    }
    
    showNotification(`✅ משיכה מרובה בוצעה בהצלחה!<br>סכום: ₪${amount.toLocaleString()}`)
    loadDepositors()
    // עדכן את המפקיד הנבחר כדי לרענן את התצוגה
    if (selectedDepositor) {
      const updated = db.getDepositorById(selectedDepositor.id)
      if (updated) setSelectedDepositor({...updated})
    }
  }

  // פונקציה להצגת מודל משיכה מרובה
  const showMultipleWithdrawalModal = () => {
    if (!selectedDepositor) return
    
    const deposits = db.getDepositorDeposits(selectedDepositor.id)
    const activeDeposits = deposits.filter(d => {
      const withdrawn = db.getTotalWithdrawnAmount(d.id)
      return d.amount - withdrawn > 0
    }).sort((a, b) => new Date(a.depositDate).getTime() - new Date(b.depositDate).getTime())
    
    if (activeDeposits.length === 0) {
      showNotification('❌ אין הפקדות פעילות למשיכה', 'error')
      return
    }
    
    const totalBalance = activeDeposits.reduce((sum, d) => {
      const withdrawn = db.getTotalWithdrawnAmount(d.id)
      return sum + (d.amount - withdrawn)
    }, 0)
    
    let withdrawalMethod = ''
    let withdrawalDetails = ''
    
    const modalContent = document.createElement('div')
    modalContent.innerHTML = `
      <div style="
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5); display: flex; align-items: center;
        justify-content: center; z-index: 10000;
      ">
        <div style="
          background: white; border-radius: 10px; padding: 30px;
          max-width: 500px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        ">
          <h3 style="margin-bottom: 20px; color: #3498db; text-align: center;">💸 משיכה מרובה</h3>
          
          <p style="margin-bottom: 15px; text-align: center;">
            הפקדות פעילות: ${activeDeposits.length}<br>
            יתרה כוללת: ₪${totalBalance.toLocaleString()}
          </p>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">סכום למשיכה:</label>
            <input type="number" id="multipleWithdrawalAmount" placeholder="הכנס סכום" style="
              width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px;
              font-size: 16px; text-align: center; box-sizing: border-box;
            " max="${totalBalance}" />
          </div>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">אמצעי משיכה:</label>
            <select id="multipleWithdrawalMethodSelect" style="
              width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px; font-size: 14px;
            ">
              <option value="">בחר אמצעי תשלום</option>
              <option value="cash">מזומן</option>
              <option value="transfer">העברה בנקאית</option>
              <option value="check">צ'ק</option>
              <option value="other">אחר</option>
            </select>
          </div>
          
          <div id="multipleWithdrawalDetailsContainer" style="margin-bottom: 15px; display: none;">
          </div>
          
          <div style="display: flex; gap: 15px; justify-content: center; margin-top: 20px;">
            <button id="confirmMultipleWithdrawal" style="
              background: #3498db; color: white; border: none; padding: 12px 24px;
              border-radius: 5px; font-size: 16px; cursor: pointer; font-weight: bold;
            ">בצע משיכה מרובה</button>
            <button id="cancelMultipleWithdrawal" style="
              background: #95a5a6; color: white; border: none; padding: 12px 24px;
              border-radius: 5px; font-size: 16px; cursor: pointer;
            ">ביטול</button>
          </div>
        </div>
      </div>
    `
    
    document.body.appendChild(modalContent)
    
    const amountInput = modalContent.querySelector('#multipleWithdrawalAmount') as HTMLInputElement
    const methodSelect = modalContent.querySelector('#multipleWithdrawalMethodSelect') as HTMLSelectElement
    const detailsContainer = modalContent.querySelector('#multipleWithdrawalDetailsContainer') as HTMLDivElement
    const confirmBtn = modalContent.querySelector('#confirmMultipleWithdrawal') as HTMLButtonElement
    const cancelBtn = modalContent.querySelector('#cancelMultipleWithdrawal') as HTMLButtonElement
    
    amountInput.focus()
    
    // אירוע שינוי אמצעי תשלום
    methodSelect.addEventListener('change', (e) => {
      const method = (e.target as HTMLSelectElement).value
      withdrawalMethod = method
      
      if (method && detailsContainer) {
        detailsContainer.style.display = 'block'
        detailsContainer.innerHTML = getPaymentDetailsHTML(method)
        addPaymentDetailsListeners(detailsContainer, method, (details) => {
          withdrawalDetails = details
        })
      } else if (detailsContainer) {
        detailsContainer.style.display = 'none'
      }
    })
    
    // אישור משיכה
    confirmBtn.addEventListener('click', () => {
      const amount = Number(amountInput.value)
      
      if (!amount || amount <= 0) {
        showNotification('❌ יש להזין סכום תקין', 'error')
        return
      }
      
      if (amount > totalBalance) {
        showNotification(`❌ הסכום גדול מהיתרה הכוללת (₪${totalBalance.toLocaleString()})`, 'error')
        return
      }
      
      performMultipleWithdrawal(activeDeposits, amount, withdrawalMethod || undefined, withdrawalDetails || undefined)
      document.body.removeChild(modalContent)
    })
    
    // ביטול
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modalContent)
    })
    
    // סגירה בלחיצה על הרקע
    modalContent.addEventListener('click', (e) => {
      if (e.target === modalContent.firstElementChild) {
        document.body.removeChild(modalContent)
      }
    })
  }
  
  // פונקציה ליצירת HTML לפרטי תשלום
  const getPaymentDetailsHTML = (method: string): string => {
    switch (method) {
      case 'check':
        return `
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
            <label style="display: block; margin-bottom: 5px;">מספר צ'ק:</label>
            <input type="text" id="checkNumber" style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box;" />
            <label style="display: block; margin-bottom: 5px;">בנק:</label>
            <input type="text" id="checkBank" style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box;" />
            <label style="display: block; margin-bottom: 5px;">סניף:</label>
            <input type="text" id="checkBranch" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box;" />
          </div>
        `
      case 'transfer':
        return `
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
            <label style="display: block; margin-bottom: 5px;">מספר אסמכתא:</label>
            <input type="text" id="transferRef" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box;" />
          </div>
        `
      case 'other':
        return `
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
            <label style="display: block; margin-bottom: 5px;">פרטים:</label>
            <textarea id="otherDetails" rows="2" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box;"></textarea>
          </div>
        `
      default:
        return ''
    }
  }
  
  // פונקציה להוספת event listeners לפרטי תשלום
  const addPaymentDetailsListeners = (container: HTMLDivElement, method: string, onUpdate: (details: string) => void) => {
    const inputs = container.querySelectorAll('input, textarea')
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        let details: any = {}
        
        switch (method) {
          case 'check':
            details = {
              checkNumber: (container.querySelector('#checkNumber') as HTMLInputElement)?.value || '',
              bank: (container.querySelector('#checkBank') as HTMLInputElement)?.value || '',
              branch: (container.querySelector('#checkBranch') as HTMLInputElement)?.value || ''
            }
            break
          case 'transfer':
            details = {
              referenceNumber: (container.querySelector('#transferRef') as HTMLInputElement)?.value || ''
            }
            break
          case 'other':
            details = {
              description: (container.querySelector('#otherDetails') as HTMLTextAreaElement)?.value || ''
            }
            break
        }
        
        onUpdate(JSON.stringify(details))
      })
    })
  }

  const handlePrintDepositDocument = (deposit: any) => {
    const gemachName = db.getGemachName()
    const depositText = db.getDepositReceiptTemplate()
    const depositFooter = db.getDepositReceiptFooter()
    const depositorName = selectedDepositor?.name || deposit.depositorName
    const amount = deposit.amount.toLocaleString()
    const depositDate = new Date(deposit.depositDate).toLocaleDateString('he-IL')
    const depositNumber = deposit.id
    
    const withdrawnAmount = db.getTotalWithdrawnAmount(deposit.id)
    const remainingAmount = deposit.amount - withdrawnAmount
    const isFullyWithdrawn = remainingAmount <= 0

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
              <p>${depositText} מאת <strong>${depositorName}</strong></p>
              ${selectedDepositor?.idNumber ? `<p>ת.ז. <strong>${db.formatIdNumber(selectedDepositor.idNumber)}</strong></p>` : ''}
              <p>סכום של: <strong>${amount} ש"ח</strong></p>
              <p>בתאריך: <strong>${depositDate}</strong></p>
              <p>תקופת ההפקדה: <strong>${deposit.depositPeriod} חודשים</strong></p>
              ${deposit.isRecurring ? `
                <div style="background: #e3f2fd; border: 2px solid #2196f3; padding: 10px; border-radius: 5px; margin: 10px 0;">
                  <p style="margin: 5px 0; color: #1976d2;"><strong>🔄 הפקדה מחזורית</strong></p>
                  <p style="margin: 5px 0; font-size: 13px;">גבייה אוטומטית ב-<strong>${deposit.recurringDay}</strong> לכל חודש</p>
                  ${deposit.recurringEndDate ? `<p style="margin: 5px 0; font-size: 13px;">עד תאריך: <strong>${new Date(deposit.recurringEndDate).toLocaleDateString('he-IL')}</strong></p>` : '<p style="margin: 5px 0; font-size: 13px;">ללא תאריך סיום</p>'}
                </div>
              ` : ''}
              <p>אנו מתחייבים להחזיר את הסכום בתום התקופה או לפי דרישה</p>
              ${selectedDepositor?.phone ? `<p>טלפון המפקיד: <strong>${selectedDepositor.phone}</strong></p>` : ''}
              ${deposit.notes ? `<p>הערות: <strong>${deposit.notes}</strong></p>` : ''}
              ${isFullyWithdrawn ? `
                <div style="background: #27ae60; color: white; padding: 10px; border-radius: 5px; margin: 15px 0; text-align: center;">
                  <strong>✅ הפקדון נמשך במלואו ✅</strong><br>
                  <small>תאריך משיכה מלאה: ${new Date().toLocaleDateString('he-IL')}</small>
                </div>
              ` : (withdrawnAmount > 0 && remainingAmount > 0) ? `
                <div style="background: #f39c12; color: white; padding: 10px; border-radius: 5px; margin: 15px 0; text-align: center;">
                  <strong>⚠️ משיכה חלקית ⚠️</strong><br>
                  <small>נמשך: ${withdrawnAmount.toLocaleString()} ש"ח | נותר: ${remainingAmount.toLocaleString()} ש"ח</small>
                </div>
              ` : ''}
              <p>תאריך הפקה: <strong>${new Date().toLocaleDateString('he-IL')}</strong></p>
              ${depositFooter ? `<div style="margin: 20px 0; padding: 15px; background: #f0f8ff; border-right: 4px solid #9b59b6; border-radius: 5px;"><p style="margin: 0; white-space: pre-wrap;">${depositFooter}</p></div>` : ''}
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

  // תצוגת רשימת מפקידים
  if (!selectedDepositor) {
    return (
      <div>
        <header className="header">
          <h1>מפקידים</h1>
          <button className="close-btn" onClick={() => navigate('/')} title="חזרה לדף הבית">×</button>
        </header>

        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <button
              onClick={() => setShowNewDepositorForm(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#229954'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#27ae60'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              ➕ מפקיד חדש
            </button>
          </div>

        {/* חיפוש */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="🔍 חפש לפי שם, ת.ז. או טלפון..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #ddd',
              borderRadius: '5px'
            }}
          />
        </div>

        {/* רשימת מפקידים */}
        <div>
          {filteredDepositors.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#7f8c8d',
              fontSize: '18px'
            }}>
              {searchTerm ? '🔍 לא נמצאו מפקידים' : '📋 אין מפקידים במערכת'}
            </div>
          ) : (
            filteredDepositors.map(depositor => (
              <DepositorCard
                key={depositor.id}
                depositor={depositor}
                balance={db.getDepositorBalance(depositor.id)}
                activeDepositsCount={db.getDepositorActiveDepositsCount(depositor.id)}
                onView={() => handleViewDepositor(depositor)}
                onEdit={() => handleEditDepositor(depositor)}
                onDelete={() => handleDeleteDepositor(depositor)}
              />
            ))
          )}
        </div>

        {/* טופס מפקיד חדש */}
        {showNewDepositorForm && (
          <NewDepositorForm
            onSuccess={() => {
              setShowNewDepositorForm(false)
              loadDepositors()
            }}
            onCancel={() => setShowNewDepositorForm(false)}
            showNotification={showNotification}
          />
        )}
        </div>

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
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                textAlign: 'center',
                direction: 'rtl'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{
                marginBottom: '20px',
                color: modalConfig.type === 'danger' ? '#e74c3c' :
                  modalConfig.type === 'warning' ? '#f39c12' :
                  modalConfig.type === 'success' ? '#27ae60' : '#3498db',
                fontSize: '20px'
              }}>
                {modalConfig.title}
              </h3>

              <p style={{
                marginBottom: '30px',
                lineHeight: '1.5',
                fontSize: '16px',
                color: '#2c3e50',
                whiteSpace: 'pre-line'
              }}>
                {modalConfig.message}
              </p>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    modalConfig.onConfirm()
                    closeModal()
                  }}
                  style={{
                    backgroundColor: modalConfig.type === 'danger' ? '#e74c3c' :
                      modalConfig.type === 'warning' ? '#f39c12' :
                      modalConfig.type === 'success' ? '#27ae60' : '#3498db',
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

                {modalConfig.showCancelButton !== false && (
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

  // תצוגת מפקיד בודד עם הפקדות
  const depositorDeposits = db.getDepositorDeposits(selectedDepositor.id)
  const recurringDeposits = db.getDepositorRecurringDeposits(selectedDepositor.id)
  const totalBalance = db.getDepositorBalance(selectedDepositor.id)
  
  console.log('🔍 Debug - Depositor:', selectedDepositor.name)
  console.log('📋 Regular deposits:', depositorDeposits.length, depositorDeposits)
  console.log('🔄 Recurring deposits:', recurringDeposits.length, recurringDeposits)
  
  // בדוק את כל ההפקדות של המפקיד (כולל מחזוריות)
  const allDeposits = db.getDeposits().filter(d => d.depositorId === selectedDepositor.id)
  console.log('📊 ALL deposits for this depositor:', allDeposits.length, allDeposits)

  return (
    <div>
      <header className="header">
        <h1>{selectedDepositor.name}</h1>
        <button className="close-btn" onClick={() => setSelectedDepositor(null)} title="חזרה לרשימת מפקידים">×</button>
      </header>

      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* פרטי מפקיד */}
      <div style={{
        backgroundColor: 'white',
        border: '2px solid #3498db',
        borderRadius: '10px',
        padding: '25px',
        marginBottom: '20px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>
          👤 {selectedDepositor.name}
        </h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          {selectedDepositor.phone && (
            <p style={{ margin: 0, color: '#7f8c8d' }}>
              📞 <strong>טלפון:</strong> {selectedDepositor.phone}
            </p>
          )}
          {selectedDepositor.idNumber && (
            <p style={{ margin: 0, color: '#7f8c8d' }}>
              🆔 <strong>ת.ז.:</strong> {selectedDepositor.idNumber}
            </p>
          )}
        </div>

        {selectedDepositor.notes && (
          <p style={{ margin: '10px 0', color: '#95a5a6', fontStyle: 'italic' }}>
            📝 {selectedDepositor.notes}
          </p>
        )}

        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#ecf0f1',
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: '0 0 10px 0', color: '#27ae60', fontSize: '28px' }}>
            💰 יתרה כוללת: ₪{totalBalance.toLocaleString()}
          </h2>
          <p style={{ margin: 0, color: '#7f8c8d' }}>
            {depositorDeposits.length} הפקדות במערכת
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={() => setShowDetailedReport(true)}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#9b59b6',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            📊 דוח מפורט
          </button>
          <button
            onClick={() => setShowEditDepositorForm(true)}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#f39c12',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            ✏️ ערוך פרטים
          </button>
          <button
            onClick={() => setShowNewDepositForm(true)}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            ➕ הפקדה חדשה
          </button>
          {totalBalance > 0 && depositorDeposits.length > 0 && (
            <button
              onClick={showMultipleWithdrawalModal}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
              title="משוך מכמה הפקדות יחד - הסכום יחולק אוטומטית"
            >
              💸 משיכה מרובה
            </button>
          )}
        </div>
      </div>

      {/* טפסים */}
      {showEditDepositorForm && (
        <EditDepositorForm
          depositor={selectedDepositor}
          onSuccess={() => {
            setShowEditDepositorForm(false)
            loadDepositors()
            // עדכן את המפקיד הנבחר
            const updated = db.getDepositorById(selectedDepositor.id)
            if (updated) setSelectedDepositor(updated)
          }}
          onCancel={() => setShowEditDepositorForm(false)}
          showNotification={showNotification}
        />
      )}

      {showNewDepositForm && (
        <NewDepositForm
          depositorId={selectedDepositor.id}
          depositorName={selectedDepositor.name}
          onSuccess={() => {
            setShowNewDepositForm(false)
            loadDepositors()
          }}
          onCancel={() => setShowNewDepositForm(false)}
          showNotification={showNotification}
        />
      )}

      {showDetailedReport && (
        <DepositorDetailedReport
          depositor={selectedDepositor}
          onClose={() => setShowDetailedReport(false)}
        />
      )}

      {editingDeposit && (
        <EditDepositForm
          deposit={editingDeposit}
          onSuccess={() => {
            setEditingDeposit(null)
            loadDepositors()
          }}
          onCancel={() => setEditingDeposit(null)}
          showNotification={showNotification}
        />
      )}

      {withdrawingDeposit && (
        <WithdrawDepositModal
          depositId={withdrawingDeposit.id}
          availableBalance={withdrawingDeposit.balance}
          depositorName={selectedDepositor.name}
          onSuccess={() => {
            setWithdrawingDeposit(null)
            loadDepositors()
          }}
          onCancel={() => setWithdrawingDeposit(null)}
          showNotification={showNotification}
        />
      )}

      {/* הפקדות מחזוריות (תבניות) */}
      {recurringDeposits.length > 0 && (
        <>
          <h2 style={{ marginBottom: '15px', color: '#9b59b6' }}>🔄 הפקדות מתוכננות (מחזוריות)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
            {recurringDeposits.map(deposit => (
              <div
                key={deposit.id}
                style={{
                  backgroundColor: '#f8f9fa',
                  border: '2px dashed #9b59b6',
                  borderRadius: '10px',
                  padding: '20px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#9b59b6' }}>
                      🔄 הפקדה מתוכננת
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <p style={{ margin: 0 }}>
                        💵 <strong>סכום:</strong> ₪{deposit.amount.toLocaleString()}
                      </p>
                      <p style={{ margin: 0 }}>
                        📅 <strong>יום בחודש:</strong> {deposit.recurringDay}
                      </p>
                      <p style={{ margin: 0 }}>
                        ⏱️ <strong>תקופה:</strong> {deposit.depositPeriod} חודשים
                      </p>
                      {deposit.recurringEndDate && (
                        <p style={{ margin: 0 }}>
                          🏁 <strong>עד:</strong> {new Date(deposit.recurringEndDate).toLocaleDateString('he-IL')}
                        </p>
                      )}
                    </div>

                    {deposit.notes && (
                      <p style={{ margin: '10px 0 0 0', color: '#95a5a6', fontSize: '14px' }}>
                        📝 {deposit.notes}
                      </p>
                    )}

                    <div style={{
                      marginTop: '10px',
                      padding: '10px',
                      backgroundColor: '#e3f2fd',
                      borderRadius: '5px',
                      fontSize: '14px',
                      color: '#1976d2'
                    }}>
                      <strong>ℹ️ הפקדה זו תיווצר אוטומטית ב-{deposit.recurringDay} לכל חודש</strong>
                      {deposit.lastRecurringDate && (
                        <div style={{ marginTop: '5px', fontSize: '12px' }}>
                          הפקדה אחרונה: {new Date(deposit.lastRecurringDate).toLocaleDateString('he-IL')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ecf0f1' }}>
                  <button
                    onClick={() => setEditingDeposit(deposit)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#f39c12',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ✏️ ערוך תבנית
                  </button>
                  <button
                    onClick={() => {
                      showConfirmModal({
                        title: 'מחיקת הפקדה מתוכננת',
                        message: 'האם אתה בטוח שברצונך למחוק את ההפקדה המתוכננת?',
                        confirmText: 'מחק',
                        cancelText: 'ביטול',
                        type: 'danger',
                        onConfirm: () => {
                          db.deleteDeposit(deposit.id)
                          loadDepositors()
                          showNotification('✅ הפקדה מתוכננת נמחקה')
                        }
                      })
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    🗑️ מחק
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* רשימת הפקדות */}
      <h2 style={{ marginBottom: '15px' }}>📋 הפקדות</h2>
      
      {depositorDeposits.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '10px',
          color: '#7f8c8d'
        }}>
          {recurringDeposits.length > 0 ? 'אין הפקדות רגילות עדיין - ההפקדות המתוכננות ייווצרו אוטומטית' : 'אין הפקדות למפקיד זה'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {depositorDeposits.map(deposit => {
            const withdrawnAmount = db.getTotalWithdrawnAmount(deposit.id)
            const balance = deposit.amount - withdrawnAmount
            const isActive = balance > 0

            return (
              <div
                key={deposit.id}
                style={{
                  backgroundColor: 'white',
                  border: `2px solid ${isActive ? '#27ae60' : '#95a5a6'}`,
                  borderRadius: '10px',
                  padding: '20px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>
                      📅 {new Date(deposit.depositDate).toLocaleDateString('he-IL')}
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <p style={{ margin: 0 }}>
                        💵 <strong>סכום:</strong> ₪{deposit.amount.toLocaleString()}
                      </p>
                      <p style={{ margin: 0 }}>
                        📊 <strong>יתרה:</strong> ₪{balance.toLocaleString()}
                      </p>
                      <p style={{ margin: 0 }}>
                        ⏱️ <strong>תקופה:</strong> {deposit.depositPeriod} חודשים
                      </p>
                      <p style={{ margin: 0 }}>
                        🔔 <strong>תזכורת:</strong> {deposit.reminderDays || 30} ימים
                      </p>
                    </div>

                    {deposit.notes && (
                      <p style={{ margin: '10px 0 0 0', color: '#95a5a6', fontSize: '14px' }}>
                        📝 {deposit.notes}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: isActive ? '#d5f4e6' : '#ecf0f1',
                        borderRadius: '5px',
                        display: 'inline-block'
                      }}>
                        <strong>{isActive ? '✅ פעילה' : '⭕ נמשכה'}</strong>
                      </div>
                      
                      {deposit.isRecurring && (
                        <div style={{
                          padding: '8px 12px',
                          backgroundColor: '#e3f2fd',
                          borderRadius: '5px',
                          display: 'inline-block',
                          border: '1px solid #2196f3'
                        }}>
                          <strong>🔄 מחזורית</strong>
                          {deposit.recurringEndDate && (
                            <span style={{ fontSize: '12px', marginRight: '5px' }}>
                              (עד {new Date(deposit.recurringEndDate).toLocaleDateString('he-IL')})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ecf0f1' }}>
                  {isActive && (
                    <>
                      <button
                        onClick={() => handleWithdrawDeposit(deposit.id, balance)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        💸 משיכה
                      </button>
                      <button
                        onClick={() => handlePrintDepositDocument(deposit)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: '#9b59b6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        📄 שטר
                      </button>
                    </>
                  )}
                  {withdrawnAmount > 0 && (
                    <button
                      onClick={() => setViewingWithdrawals(deposit.id)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: '#16a085',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      👁️ משיכות ({db.getWithdrawalsByDepositId(deposit.id).length})
                    </button>
                  )}
                  <button
                    onClick={() => setEditingDeposit(deposit)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#f39c12',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ✏️ ערוך
                  </button>
                  <button
                    onClick={() => {
                      showConfirmModal({
                        title: 'מחיקת הפקדה',
                        message: 'האם אתה בטוח שברצונך למחוק את ההפקדה?\n\nפעולה זו תמחק את ההפקדה וכל המשיכות הקשורות אליה.',
                        confirmText: 'מחק',
                        cancelText: 'ביטול',
                        type: 'danger',
                        onConfirm: () => {
                          db.deleteDeposit(deposit.id)
                          loadDepositors()
                          showNotification('✅ ההפקדה נמחקה בהצלחה')
                        }
                      })
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    🗑️ מחק
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      </div>

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
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              textAlign: 'center',
              direction: 'rtl'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              marginBottom: '20px',
              color: modalConfig.type === 'danger' ? '#e74c3c' :
                modalConfig.type === 'warning' ? '#f39c12' :
                modalConfig.type === 'success' ? '#27ae60' : '#3498db',
              fontSize: '20px'
            }}>
              {modalConfig.title}
            </h3>

            <p style={{
              marginBottom: '30px',
              lineHeight: '1.5',
              fontSize: '16px',
              color: '#2c3e50',
              whiteSpace: 'pre-line'
            }}>
              {modalConfig.message}
            </p>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  modalConfig.onConfirm()
                  closeModal()
                }}
                style={{
                  backgroundColor: modalConfig.type === 'danger' ? '#e74c3c' :
                    modalConfig.type === 'warning' ? '#f39c12' :
                    modalConfig.type === 'success' ? '#27ae60' : '#3498db',
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

              {modalConfig.showCancelButton !== false && (
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

      {/* מודל צפייה במשיכות */}
      {viewingWithdrawals && selectedDepositor && (
        <WithdrawalsListModal
          depositId={viewingWithdrawals}
          depositorName={selectedDepositor.name}
          onClose={() => setViewingWithdrawals(null)}
          onSuccess={() => {
            loadDepositors()
          }}
          showNotification={showNotification}
        />
      )}
    </div>
  )
}

export default DepositsPage
