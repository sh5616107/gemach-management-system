import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, DatabaseDeposit } from '../database/database'
import NumberInput from '../components/NumberInput'

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
  const [newDeposit, setNewDeposit] = useState({
    depositorName: '',
    amount: 0,
    depositDate: '',
    depositPeriod: 12,
    reminderDays: 30,
    phone: '',
    notes: '',
    withdrawnAmount: 0,
    withdrawnDate: ''
  })

  useEffect(() => {
    loadDeposits()
  }, [])

  const loadDeposits = () => {
    setDeposits(db.getDeposits())
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
    const depositDate = new Date(deposit.depositDate).toLocaleDateString('he-IL')
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
              <p style="margin: 8px 0;">סכום של: <strong>${amount} ש"ח</strong></p>
              <p style="margin: 8px 0;">בתאריך: <strong>${depositDate}</strong></p>
              <p style="margin: 8px 0;">תקופת ההפקדה: <strong>${deposit.depositPeriod} חודשים</strong></p>
              <p style="margin: 8px 0;">אנו מתחייבים להחזיר את הסכום בתום התקופה או לפי דרישה</p>
              ${deposit.phone ? `<p style="margin: 8px 0;">טלפון המפקיד: <strong>${deposit.phone}</strong></p>` : ''}
              ${deposit.notes ? `<p style="margin: 8px 0;">הערות: <strong>${deposit.notes}</strong></p>` : ''}
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
              <p style="margin: 8px 0;">תאריך הפקה: <strong>${new Date().toLocaleDateString('he-IL')}</strong></p>
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
                <p>סכום של: <strong>${amount} ש"ח</strong></p>
                <p>בתאריך: <strong>${depositDate}</strong></p>
                <p>תקופת ההפקדה: <strong>${deposit.depositPeriod} חודשים</strong></p>
                <p>אנו מתחייבים להחזיר את הסכום בתום התקופה או לפי דרישה</p>
                ${deposit.phone ? `<p>טלפון המפקיד: <strong>${deposit.phone}</strong></p>` : ''}
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
    if (newDeposit.depositorName && newDeposit.amount) {
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
        db.addDeposit(newDeposit)
        showNotification('✅ הפקדון נשמר בהצלחה!')
      }
      
      loadDeposits()
      setNewDeposit({
        depositorName: '',
        amount: 0,
        depositDate: '',
        depositPeriod: 12,
        reminderDays: 30,
        phone: '',
        notes: '',
        withdrawnAmount: 0,
        withdrawnDate: ''
      })
    } else {
      showNotification('⚠️ אנא מלא את השדות החובה: שם המפקיד וסכום', 'error')
    }
  }

  const withdrawDeposit = (depositId: number) => {
    const deposit = deposits.find(d => d.id === depositId)
    if (!deposit) return

    const availableAmount = deposit.amount - (deposit.withdrawnAmount || 0)
    
    showConfirmModal({
      title: 'משיכת פקדון',
      message: `זמין למשיכה: ₪${availableAmount.toLocaleString()}`,
      confirmText: 'בצע משיכה',
      cancelText: 'ביטול',
      type: 'info',
      hasInput: true,
      inputPlaceholder: 'הכנס סכום למשיכה',
      onConfirm: (inputValue) => {
        const amount = Number(inputValue)
        if (!inputValue || isNaN(amount) || amount <= 0) {
          showNotification('⚠️ אנא הכנס סכום תקין', 'error')
          return
        }
        
        if (amount > availableAmount) {
          showNotification('⚠️ הסכום גדול מהסכום הזמין למשיכה', 'error')
          return
        }
        
        if (db.withdrawDeposit(depositId, amount)) {
          loadDeposits()
          showNotification(`✅ נמשכו ₪${amount.toLocaleString()} בהצלחה!`)
        } else {
          showNotification('❌ שגיאה במשיכת הפקדון', 'error')
        }
      }
    })
  }

  return (
    <div>
      <header className="header">
        <h1>פקדונות</h1>
        <button className="close-btn" onClick={() => navigate('/')}>×</button>
      </header>

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
                <label>סכום הפקדון:</label>
                <NumberInput
                  value={newDeposit.amount || 0}
                  onChange={(value) => handleInputChange('amount', value)}
                  placeholder="הזן סכום"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>תאריך הפקדה:</label>
                <input 
                  type="date" 
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
                      amount: 0,
                      depositDate: '',
                      depositPeriod: 12,
                      reminderDays: 30,
                      phone: '',
                      notes: '',
                      withdrawnAmount: 0,
                      withdrawnDate: ''
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
                  <th>נמשך</th>
                  <th>יתרה</th>
                  <th>תאריך הפקדה</th>
                  <th>טלפון</th>
                  <th>סטטוס</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((deposit) => {
                  const withdrawnAmount = deposit.withdrawnAmount || 0
                  const remainingAmount = deposit.amount - withdrawnAmount
                  return (
                    <tr key={deposit.id}>
                      <td>{deposit.id}</td>
                      <td>{deposit.depositorName}</td>
                      <td>₪{deposit.amount.toLocaleString()}</td>
                      <td>₪{withdrawnAmount.toLocaleString()}</td>
                      <td>₪{remainingAmount.toLocaleString()}</td>
                      <td>{new Date(deposit.depositDate).toLocaleDateString('he-IL')}</td>
                      <td>{deposit.phone}</td>
                      <td>{deposit.status === 'active' ? 'פעיל' : 'נמשך במלואו'}</td>
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DepositsPage