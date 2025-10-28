import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { db } from '../database/database'

function HomePage() {
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
    onConfirm: () => void
    onCancel?: () => void
    type: 'warning' | 'danger' | 'info'
  } | null>(null)

  // פונקציה להצגת מודל אישור
  const showConfirmModal = (config: {
    title: string
    message: string
    confirmText: string
    cancelText?: string
    onConfirm: () => void
    onCancel?: () => void
    type?: 'warning' | 'danger' | 'info'
  }) => {
    setModalConfig({
      isOpen: true,
      cancelText: 'ביטול',
      type: 'warning',
      ...config
    })
  }

  // פונקציה לסגירת המודל
  const closeModal = () => {
    setModalConfig(null)
  }

  const [stats, setStats] = useState({
    totalLoans: 0,
    activeLoans: 0,
    futureLoans: 0,
    totalDeposits: 0,
    totalDonations: 0,
    totalLoansAmount: 0,
    activeLoansAmount: 0,
    futureLoansAmount: 0,
    totalLoansBalance: 0,
    totalDepositsAmount: 0,
    totalDonationsAmount: 0,
    balance: 0,
    lastUpdated: ''
  })
  const [gemachName, setGemachName] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [headerTitle, setHeaderTitle] = useState('')
  const [isEditingHeader, setIsEditingHeader] = useState(false)
  const [footerText, setFooterText] = useState('')
  const [isEditingFooter, setIsEditingFooter] = useState(false)
  const [contactText, setContactText] = useState('')
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [showOverdueAlert, setShowOverdueAlert] = useState(false)
  const [pendingRecurringLoans, setPendingRecurringLoans] = useState<any[]>([])
  const [pendingAutoPayments, setPendingAutoPayments] = useState<any[]>([])
  const [automationAlertDismissed, setAutomationAlertDismissed] = useState(false)



  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = () => {
    setStats(db.getStats())
    setGemachName(db.getGemachName())
    setHeaderTitle(db.getHeaderTitle())
    setFooterText(db.getFooterText())
    setContactText(db.getContactText())

    // בדוק התראות איחור
    const settings = db.getSettings()
    if (settings.showOverdueWarnings && db.hasOverdueLoans()) {
      setShowOverdueAlert(true)
    }

    // בדוק הלוואות מחזוריות ופרעונות אוטומטיים
    const recurringLoans = db.getPendingRecurringLoans()
    const autoPayments = db.getPendingAutoPayments()

    console.log('🏠 loadStats - בדיקת אוטומציה:', {
      recurringLoans: recurringLoans.length,
      autoPayments: autoPayments.length,
      recurringDetails: recurringLoans.map(l => ({ id: l.id, name: l.borrowerName, day: l.recurringDay })),
      autoDetails: autoPayments.map(p => ({ id: p.id, name: p.borrowerName, day: p.autoPaymentDay, amount: p.paymentAmount }))
    })

    setPendingRecurringLoans(recurringLoans)
    setPendingAutoPayments(autoPayments)

    // אפס את הדגל של סגירת ההתראה אם יש פעולות חדשות
    if (recurringLoans.length > 0 || autoPayments.length > 0) {
      setAutomationAlertDismissed(false)
      console.log('🚨 יש התראות אוטומציה!')
    } else {
      console.log('✅ אין התראות אוטומציה')
    }

    // בדוק אם יש לווים עם מספרי זהות זמניים
    const borrowersWithTempIds = db.getBorrowers().filter(b =>
      b.idNumber && b.idNumber.startsWith('000000')
    )
    if (borrowersWithTempIds.length > 0) {
      console.log(`⚠️ יש ${borrowersWithTempIds.length} לווים עם מספרי זהות זמניים`)
    }
  }

  // פונקציה לאישור הלוואה מחזורית
  const approveRecurringLoan = (loan: any) => {
    const newLoan = db.createRecurringLoan(loan.id)
    if (newLoan) {
      showNotification(`✅ הלוואה חדשה נוצרה עבור ${loan.borrowerName} - ${db.formatCurrency(loan.amount)}`, 'success')
    } else {
      showNotification('❌ שגיאה ביצירת הלוואה חדשה או שכבר נוצרה הלוואה היום', 'error')
    }
  }

  // פונקציה לאישור פרעון אוטומטי
  const approveAutoPayment = (payment: any) => {
    const success = db.executeAutoPayment(payment.id, payment.paymentAmount)
    if (success) {
      showNotification(`✅ פרעון נרשם עבור ${payment.borrowerName} - ${db.formatCurrency(payment.paymentAmount)}`, 'success')
    } else {
      showNotification('❌ שגיאה ברישום הפרעון או שכבר בוצע פרעון היום', 'error')
    }
  }

  // פונקציה לאישור מהיר של כל הפעולות
  const approveAllActions = () => {
    let successCount = 0

    // אשר כל ההלוואות המחזוריות
    pendingRecurringLoans.forEach(loan => {
      if (db.createRecurringLoan(loan.id)) {
        successCount++
      }
    })

    // אשר כל הפרעונות האוטומטיים
    pendingAutoPayments.forEach(payment => {
      if (db.executeAutoPayment(payment.id, payment.paymentAmount)) {
        successCount++
      }
    })

    const totalActions = pendingRecurringLoans.length + pendingAutoPayments.length
    showNotification(`✅ ${successCount} מתוך ${totalActions} פעולות בוצעו בהצלחה`, 'success')
    loadStats() // רענן את הנתונים
  }

  // רענון הדף כל 5 שניות כדי לעדכן נתונים (אבל לא כשעורכים)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isEditingName && !isEditingHeader && !isEditingFooter && !isEditingContact) {
        const newStats = db.getStats()
        // עדכן רק אם יש שינוי אמיתי בנתונים
        if (newStats.lastUpdated !== stats.lastUpdated) {
          setStats(newStats)
        }
      }
    }, 5000) // כל 5 שניות במקום כל שנייה

    return () => clearInterval(interval)
  }, [isEditingName, isEditingHeader, isEditingFooter, isEditingContact, stats.lastUpdated])

  const exportData = () => {
    const data = db.exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gemach-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showNotification('✅ הנתונים יוצאו בהצלחה!')
  }

  const importData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          if (db.importData(content)) {
            loadStats()
            showNotification('✅ הנתונים יובאו בהצלחה!')
          } else {
            showNotification('❌ שגיאה בייבוא הנתונים', 'error')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  return (
    <div>
      <header className="header">
        {isEditingHeader ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
            <input
              type="text"
              value={headerTitle}
              onChange={(e) => setHeaderTitle(e.target.value)}
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                textAlign: 'center',
                border: '2px solid #3498db',
                borderRadius: '5px',
                padding: '5px 10px',
                background: 'white'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  db.setHeaderTitle(headerTitle)
                  setIsEditingHeader(false)
                }
              }}
              autoFocus
            />
            <button
              onClick={() => {
                db.setHeaderTitle(headerTitle)
                setIsEditingHeader(false)
              }}
              style={{
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                padding: '8px 12px',
                cursor: 'pointer'
              }}
            >
              ✓
            </button>
            <button
              onClick={() => {
                setHeaderTitle(db.getHeaderTitle())
                setIsEditingHeader(false)
              }}
              style={{
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                padding: '8px 12px',
                cursor: 'pointer'
              }}
            >
              ✗
            </button>
          </div>
        ) : (
          <h1
            onClick={() => setIsEditingHeader(true)}
            style={{ cursor: 'pointer', position: 'relative' }}
            title="לחץ לעריכת הכותרת"
          >
            {headerTitle}
            <span style={{ fontSize: '14px', marginLeft: '10px', opacity: 0.7 }}>✏️</span>
          </h1>
        )}
      </header>

      <main className="main-content">
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          {isEditingName ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
              <input
                type="text"
                value={gemachName}
                onChange={(e) => setGemachName(e.target.value)}
                style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  border: '2px solid #3498db',
                  borderRadius: '5px',
                  padding: '5px 10px'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    db.setGemachName(gemachName)
                    setIsEditingName(false)
                  }
                }}
                autoFocus
              />
              <button
                onClick={() => {
                  db.setGemachName(gemachName)
                  setIsEditingName(false)
                }}
                style={{
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '8px 12px',
                  cursor: 'pointer'
                }}
              >
                ✓
              </button>
              <button
                onClick={() => {
                  setGemachName(db.getGemachName())
                  setIsEditingName(false)
                }}
                style={{
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '8px 12px',
                  cursor: 'pointer'
                }}
              >
                ✗
              </button>
            </div>
          ) : (
            <h1
              className="main-title"
              onClick={() => setIsEditingName(true)}
              onDoubleClick={() => setIsEditingName(true)}
              style={{ cursor: 'pointer', position: 'relative' }}
              title="לחץ או לחץ פעמיים לעריכת שם הגמח"
            >
              {gemachName}
              <span style={{ fontSize: '14px', marginLeft: '10px', opacity: 0.7 }}>✏️</span>
            </h1>
          )}
        </div>

        {/* התראות הלוואות עתידיות שצריכות להיות מופעלות */}
        {(() => {
          const futureLoansToActivate = db.getFutureLoans().filter(loan => {
            const today = new Date()
            const loanDate = new Date(loan.loanDate)
            return loanDate <= today
          })

          return futureLoansToActivate.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
              color: 'white',
              padding: '20px',
              borderRadius: '10px',
              margin: '20px auto',
              maxWidth: '800px',
              boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)',
              textAlign: 'center'
            }}>
              <h3 style={{ marginBottom: '15px', fontSize: '20px' }}>
                🚀 הלוואות מוכנות להפעלה!
              </h3>
              <p style={{ fontSize: '16px', marginBottom: '15px' }}>
                יש {futureLoansToActivate.length} הלוואות מתוכננות שמועד ההפעלה שלהן הגיע
              </p>
              <button
                onClick={() => navigate('/loans')}
                style={{
                  background: 'white',
                  color: '#3498db',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                📋 עבור לניהול הלוואות
              </button>
            </div>
          )
        })()}

        {/* התראות הלוואות מחזוריות ופרעונות אוטומטיים */}
        {!automationAlertDismissed && (pendingRecurringLoans.length > 0 || pendingAutoPayments.length > 0) && (
          <div style={{
            background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            margin: '20px auto',
            maxWidth: '800px',
            boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)',
            position: 'relative'
          }}>
            <button
              onClick={() => {
                // הסתר את ההתראה באופן מיידי
                setAutomationAlertDismissed(true)
                setPendingRecurringLoans([])
                setPendingAutoPayments([])
              }}
              style={{
                position: 'absolute',
                top: '10px',
                left: '15px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                borderRadius: '50%',
                width: '25px',
                height: '25px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ×
            </button>

            <div style={{ textAlign: 'center' }}>
              <h3 style={{ marginBottom: '15px', fontSize: '20px' }}>
                🔄 פעולות אוטומטיות מחכות לאישור!
              </h3>

              {pendingRecurringLoans.length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ fontSize: '16px', marginBottom: '10px' }}>
                    📅 {pendingRecurringLoans.length} הלוואות מחזוריות צריכות להיווצר היום
                  </p>
                  <div style={{ fontSize: '14px', marginBottom: '10px' }}>
                    {pendingRecurringLoans.slice(0, 3).map((loan, index) => (
                      <div key={index} style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '5px 10px',
                        borderRadius: '15px',
                        margin: '5px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>{loan.borrowerName} - {db.formatCurrency(loan.amount)}</span>
                        <button
                          onClick={() => {
                            approveRecurringLoan(loan)
                            // הסר את ההלוואה מהרשימה מיידית
                            setPendingRecurringLoans(prev => prev.filter(l => l.id !== loan.id))
                            loadStats() // רענן את הנתונים
                          }}
                          style={{
                            background: '#27ae60',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          title="אשר הלוואה זו"
                        >
                          ✓
                        </button>
                      </div>
                    ))}
                    {pendingRecurringLoans.length > 3 && (
                      <div style={{ fontSize: '12px', marginTop: '5px' }}>
                        ועוד {pendingRecurringLoans.length - 3} הלוואות...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {pendingAutoPayments.length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ fontSize: '16px', marginBottom: '10px' }}>
                    💰 {pendingAutoPayments.length} פרעונות אוטומטיים מחכים לאישור
                  </p>
                  <div style={{ fontSize: '14px', marginBottom: '10px' }}>
                    {pendingAutoPayments.slice(0, 3).map((payment, index) => (
                      <div key={index} style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '5px 10px',
                        borderRadius: '15px',
                        margin: '5px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>{payment.borrowerName} - {db.formatCurrency(payment.paymentAmount)}</span>
                        <button
                          onClick={() => {
                            approveAutoPayment(payment)
                            // הסר את הפרעון מהרשימה מיידית
                            setPendingAutoPayments(prev => prev.filter(p => p.id !== payment.id))
                            loadStats() // רענן את הנתונים
                          }}
                          style={{
                            background: '#27ae60',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          title="אשר פרעון זה"
                        >
                          ✓
                        </button>
                      </div>
                    ))}
                    {pendingAutoPayments.length > 3 && (
                      <div style={{ fontSize: '12px', marginTop: '5px' }}>
                        ועוד {pendingAutoPayments.length - 3} פרעונות...
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    showConfirmModal({
                      title: 'אישור כל הפעולות',
                      message: `האם אתה בטוח שברצונך לאשר את כל הפעולות?\n\n${pendingRecurringLoans.length} הלוואות מחזוריות\n${pendingAutoPayments.length} פרעונות אוטומטיים`,
                      confirmText: 'אשר הכל',
                      cancelText: 'ביטול',
                      type: 'info',
                      onConfirm: () => {
                        approveAllActions()
                        // הסתר את ההתראה מיידית
                        setPendingRecurringLoans([])
                        setPendingAutoPayments([])
                        loadStats() // רענן את הנתונים
                      }
                    })
                  }}
                  style={{
                    background: 'white',
                    color: '#3498db',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  ✅ אשר הכל
                </button>
                <button
                  onClick={() => {
                    // מצא את ההלוואה המחזורית הראשונה שצריכה אישור
                    if (pendingRecurringLoans.length > 0) {
                      const firstLoan = pendingRecurringLoans[0]
                      navigate(`/loans?loanId=${firstLoan.id}`)
                    } else if (pendingAutoPayments.length > 0) {
                      const firstPayment = pendingAutoPayments[0]
                      navigate(`/loans?loanId=${firstPayment.id}`)
                    } else {
                      navigate('/loans')
                    }
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '1px solid white',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  📋 בדוק אחד אחד
                </button>
              </div>
            </div>
          </div>
        )}

        {/* התראות הלוואות באיחור */}
        {showOverdueAlert && db.getSettings().showOverdueWarnings && (
          <div style={{
            background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            margin: '20px auto',
            maxWidth: '800px',
            boxShadow: '0 4px 15px rgba(231, 76, 60, 0.3)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowOverdueAlert(false)}
              style={{
                position: 'absolute',
                top: '10px',
                left: '15px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                borderRadius: '50%',
                width: '25px',
                height: '25px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ×
            </button>

            <div style={{ textAlign: 'center' }}>
              <h3 style={{ marginBottom: '15px', fontSize: '20px' }}>
                ⚠️ התראה: הלוואות באיחור!
              </h3>

              {(() => {
                const overdueStats = db.getOverdueStats()
                return (
                  <div>
                    <p style={{ fontSize: '16px', marginBottom: '10px' }}>
                      יש {overdueStats.total} הלוואות באיחור בסכום כולל של {db.formatCurrency(overdueStats.totalAmount)}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '15px' }}>
                      {overdueStats.high > 0 && (
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 10px', borderRadius: '15px' }}>
                          🔴 {overdueStats.high} איחור חמור (30+ ימים)
                        </span>
                      )}
                      {overdueStats.medium > 0 && (
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 10px', borderRadius: '15px' }}>
                          🟡 {overdueStats.medium} איחור בינוני (7-30 ימים)
                        </span>
                      )}
                      {overdueStats.low > 0 && (
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 10px', borderRadius: '15px' }}>
                          🟠 {overdueStats.low} איחור קל (עד 7 ימים)
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        const firstOverdueLoan = db.getOverdueLoans()[0]
                        if (firstOverdueLoan) {
                          navigate(`/loans?loanId=${firstOverdueLoan.id}`)
                        } else {
                          navigate('/loans')
                        }
                      }}
                      style={{
                        background: 'white',
                        color: '#e74c3c',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      📋 עבור להלוואה הדחופה ביותר
                    </button>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        <div className="categories">
          <div className="category" onClick={() => navigate('/loans')}>
            <div className="category-image">💰</div>
            <h2 className="category-title">הלוואות</h2>
          </div>

          <div className="category" onClick={() => navigate('/deposits')}>
            <div className="category-image">💵</div>
            <h2 className="category-title">פקדונות</h2>
          </div>

          <div className="category" onClick={() => navigate('/donations')}>
            <div className="category-image">💸</div>
            <h2 className="category-title">תרומות</h2>
          </div>

          <div className="category" onClick={() => navigate('/settings')}>
            <div className="category-image">⚙️</div>
            <h2 className="category-title">הגדרות</h2>
          </div>

          <div className="category" onClick={() => navigate('/help')}>
            <div className="category-image">📖</div>
            <h2 className="category-title">מדריך שימוש</h2>
          </div>
        </div>

        <div className="info-section">
          <h3 className="info-title">מצב הגמ"ח הנוכחי</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: '#e74c3c', marginBottom: '10px' }}>הלוואות</h4>
              <p>{stats.activeLoans} הלוואות פעילות</p>
              {stats.futureLoans > 0 && (
                <p style={{ color: '#3498db', fontSize: '14px' }}>
                  🕐 {stats.futureLoans} מתוכננות
                </p>
              )}
              <p>סכום פעיל: {db.formatCurrency(stats.activeLoansAmount)}</p>
              <p style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                יתרה לפרעון: {db.formatCurrency(stats.totalLoansBalance)}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: '#27ae60', marginBottom: '10px' }}>פקדונות</h4>
              <p>{stats.totalDeposits} פקדונות פעילות</p>
              <p>{db.formatCurrency(stats.totalDepositsAmount)}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: '#3498db', marginBottom: '10px' }}>תרומות</h4>
              <p>{stats.totalDonations} תרומות</p>
              <p>{db.formatCurrency(stats.totalDonationsAmount)}</p>
            </div>
          </div>
          <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
            <h4 style={{ color: stats.balance >= 0 ? '#27ae60' : '#e74c3c' }}>
              {stats.balance >= 0 ? '💰 יתרה כוללת: ' : '⚠️ גרעון: '}{db.formatCurrency(Math.abs(stats.balance))}
            </h4>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              {stats.balance >= 0 ? 'הגמ"ח במצב חיובי' : 'הגמ"ח במצב גרעון - יש יותר התחייבויות מאשר כסף זמין'}
            </p>
            <p style={{ fontSize: '11px', color: '#888', marginTop: '3px', fontStyle: 'italic' }}>
              חישוב: תרומות ({db.formatCurrency(stats.totalDonationsAmount)}) + פקדונות פעילות ({db.formatCurrency(stats.totalDepositsAmount)}) - הלוואות שניתנו ({db.formatCurrency(stats.totalLoansBalance)})
            </p>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              עדכון אחרון: {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString('he-IL') : 'לא זמין'}
            </p>
          </div>
        </div>

        {/* הלוואות באיחור */}
        {db.getSettings().showOverdueWarnings && db.getOverdueLoans().length > 0 && (
          <div className="info-section" style={{
            marginTop: '30px',
            background: 'rgba(231, 76, 60, 0.1)',
            border: '2px solid rgba(231, 76, 60, 0.3)'
          }}>
            <h3 className="info-title" style={{ color: '#e74c3c' }}>⚠️ הלוואות באיחור</h3>
            <div style={{ marginTop: '20px' }}>
              <table className="table" style={{ fontSize: '14px' }}>
                <thead>
                  <tr>
                    <th>שם הלווה</th>
                    <th>טלפון</th>
                    <th>יתרה לפרעון</th>
                    <th>תאריך החזרה</th>
                    <th>ימי איחור</th>
                    <th>רמת חומרה</th>
                  </tr>
                </thead>
                <tbody>
                  {db.getOverdueLoans().slice(0, 5).map((loan) => (
                    <tr
                      key={loan.id}
                      onClick={() => navigate(`/loans?loanId=${loan.id}`)}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(231, 76, 60, 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ fontWeight: 'bold' }}>{loan.borrowerName}</td>
                      <td>{loan.borrowerPhone}</td>
                      <td style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                        {db.formatCurrency(loan.balance)}
                      </td>
                      <td>{new Date(loan.returnDate).toLocaleDateString('he-IL')}</td>
                      <td style={{ fontWeight: 'bold' }}>{loan.daysOverdue}</td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: loan.severity === 'high' ? '#e74c3c' :
                            loan.severity === 'medium' ? '#f39c12' : '#e67e22',
                          color: 'white'
                        }}>
                          {loan.severity === 'high' ? '🔴 חמור' :
                            loan.severity === 'medium' ? '🟡 בינוני' : '🟠 קל'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {db.getOverdueLoans().length > 5 && (
                <p style={{ textAlign: 'center', marginTop: '10px', color: '#666' }}>
                  ועוד {db.getOverdueLoans().length - 5} הלוואות באיחור...
                </p>
              )}
            </div>
          </div>
        )}

        {/* סיכום לווים */}
        <div className="info-section" style={{ marginTop: '30px' }}>
          <h3 className="info-title">סיכום לווים פעילים</h3>
          {db.getBorrowersSummary().length > 0 ? (
            <div style={{ marginTop: '20px' }}>
              <table className="table" style={{ fontSize: '14px' }}>
                <thead>
                  <tr>
                    <th>שם הלווה</th>
                    <th>מספר זהות</th>
                    <th>עיר</th>
                    <th>טלפון</th>
                    <th>מספר הלוואות</th>
                    <th>סכום כולל</th>
                    <th>יתרה לפרעון</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {db.getBorrowersSummary().map((borrower) => {
                    // בדוק אם יש ללווה הלוואות באיחור
                    const borrowerOverdueLoans = db.getOverdueLoans().filter(loan => loan.borrowerId === borrower.id)
                    const hasOverdue = borrowerOverdueLoans.length > 0
                    const maxDaysOverdue = hasOverdue ? Math.max(...borrowerOverdueLoans.map(l => l.daysOverdue)) : 0

                    return (
                      <tr key={borrower.id} style={{
                        background: hasOverdue ? 'rgba(231, 76, 60, 0.1)' : 'transparent'
                      }}>
                        <td style={{ fontWeight: 'bold' }}>
                          {hasOverdue && '⚠️ '}
                          {borrower.name}
                          {hasOverdue && (
                            <div style={{ fontSize: '10px', color: '#e74c3c' }}>
                              איחור {maxDaysOverdue} ימים
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '12px', color: '#666' }}>
                          {db.formatIdNumber(borrower.idNumber || '')}
                        </td>
                        <td>{borrower.city}</td>
                        <td>{borrower.phone}</td>
                        <td>{borrower.loansCount}</td>
                        <td>{db.formatCurrency(borrower.totalAmount)}</td>
                        <td style={{
                          color: borrower.totalBalance > 0 ? '#e74c3c' : '#27ae60',
                          fontWeight: 'bold'
                        }}>
                          {db.formatCurrency(borrower.totalBalance)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                              onClick={() => {
                                if (hasOverdue) {
                                  const borrowerOverdueLoan = borrowerOverdueLoans[0]
                                  navigate(`/loans?loanId=${borrowerOverdueLoan.id}`)
                                } else {
                                  navigate(`/loans?borrowerId=${borrower.id}`)
                                }
                              }}
                              style={{
                                padding: '5px 10px',
                                fontSize: '12px',
                                backgroundColor: hasOverdue ? '#e74c3c' : '#3498db',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer'
                              }}
                            >
                              {hasOverdue ? '⚠️ דחוף' : 'פרטים'}
                            </button>
                            <button
                              onClick={() => navigate(`/borrower-report?borrowerId=${borrower.id}`)}
                              style={{
                                padding: '5px 8px',
                                fontSize: '12px',
                                backgroundColor: '#27ae60',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer'
                              }}
                              title="דו״ח מפורט"
                            >
                              📊
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* שורת סיכום */}
              <div style={{
                marginTop: '15px',
                padding: '10px',
                background: 'rgba(52, 73, 94, 0.1)',
                borderRadius: '5px',
                fontWeight: 'bold'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>סהכ לווים פעילים: {db.getBorrowersSummary().length}</span>
                  <span>סהכ הלוואות: {db.getBorrowersSummary().reduce((sum, b) => sum + b.loansCount, 0)}</span>
                  <span style={{ color: '#e74c3c' }}>
                    סהכ יתרה לפרעון: {db.formatCurrency(db.getBorrowersSummary()
                      .reduce((sum, b) => sum + b.totalBalance, 0))}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
              אין לווים פעילים כרגע
            </p>
          )}
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={exportData}>
            📤 ייצוא נתונים
          </button>
          <button className="btn btn-primary" onClick={importData}>
            📥 ייבוא נתונים
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              const name = prompt('הכנס שם לווה לחיפוש:')
              if (name) {
                const foundBorrowers = db.getBorrowers().filter(b =>
                  `${b.firstName} ${b.lastName}`.toLowerCase().includes(name.toLowerCase())
                )
                if (foundBorrowers.length === 1) {
                  navigate(`/loans?borrowerId=${foundBorrowers[0].id}`)
                } else if (foundBorrowers.length > 1) {
                  const names = foundBorrowers.map(b => `${b.firstName} ${b.lastName}`).join('\n')
                  showNotification(`נמצאו ${foundBorrowers.length} לווים:\n${names}\nאנא חפש בצורה יותר ספציפית`, 'info')
                } else {
                  showNotification('❌ לא נמצא לווה עם שם זה', 'error')
                }
              }
            }}
          >
            🔍 חיפוש לווה
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/borrower-report')}
          >
            📊 דו"ח לווה
          </button>



          <button
            className="btn"
            onClick={() => {
              showConfirmModal({
                title: 'נקה הכל',
                message: 'האם אתה בטוח שברצונך למחוק את כל הנתונים לברירת המחדל?\n\nפעולה זו תמחק את כל ההלוואות, ההפקדות והתרומות!\nפעולה זו לא ניתנת לביטול.',
                confirmText: 'נקה הכל',
                cancelText: 'ביטול',
                type: 'danger',
                onConfirm: () => {
                  db.clearAllData()
                  loadStats()
                  showNotification('✅ כל הנתונים נמחקו בהצלחה!')
                }
              })
            }}
            style={{ backgroundColor: '#e74c3c', color: 'white' }}
          >
            🗑️ נקה הכל
          </button>
        </div>

        <div style={{
          marginTop: '40px',
          color: '#2c3e50',
          fontSize: '16px',
          background: 'rgba(255, 255, 255, 0.3)',
          padding: '20px',
          borderRadius: '10px',
          border: '2px solid rgba(255, 255, 255, 0.4)'
        }}>
          {isEditingFooter ? (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '10px' }}>
                <textarea
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    border: '2px solid #3498db',
                    borderRadius: '5px',
                    padding: '10px',
                    background: 'white',
                    width: '500px',
                    height: '120px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    direction: 'rtl'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      db.setFooterText(footerText)
                      setIsEditingFooter(false)
                    }
                  }}
                  placeholder="הכנס את הטקסט התחתון כאן...&#10;ניתן להשתמש במספר שורות"
                  autoFocus
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <button
                    onClick={() => {
                      db.setFooterText(footerText)
                      setIsEditingFooter(false)
                    }}
                    style={{
                      backgroundColor: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      padding: '8px 12px',
                      cursor: 'pointer'
                    }}
                    title="שמור (או Ctrl+Enter)"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => {
                      setFooterText(db.getFooterText())
                      setIsEditingFooter(false)
                    }}
                    style={{
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      padding: '8px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    ✗
                  </button>
                </div>
              </div>
              <small style={{ color: '#666', fontSize: '12px', display: 'block', textAlign: 'center', marginTop: '5px' }}>
                💡 עצה: השתמש ב-Ctrl+Enter לשמירה מהירה
              </small>
            </div>
          ) : (
            <div
              style={{
                marginBottom: '15px',
                color: '#1a5490',
                fontWeight: 'bold',
                cursor: 'pointer',
                position: 'relative',
                textAlign: 'center'
              }}
              onClick={() => setIsEditingFooter(true)}
              title="לחץ לעריכת הטקסט"
            >
              <div style={{ fontSize: '18px' }}>
                🤝 {footerText.split('\n').map((line, index) => (
                  <div key={index} style={{ margin: '2px 0' }}>
                    {line}
                  </div>
                ))}
              </div>
              <span style={{
                position: 'absolute',
                top: '5px',
                left: '10px',
                fontSize: '12px',
                opacity: 0.7
              }}>
                ✏️
              </span>
            </div>
          )}
          {isEditingContact ? (
            <div style={{ marginTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#2c3e50', display: 'block', marginBottom: '5px' }}>
                    ✏️ עריכה:
                  </label>
                  <textarea
                    value={contactText}
                    onChange={(e) => setContactText(e.target.value)}
                    style={{
                      fontSize: '14px',
                      textAlign: 'right',
                      border: '2px solid #3498db',
                      borderRadius: '5px',
                      padding: '10px',
                      background: 'white',
                      width: '400px',
                      height: '120px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      direction: 'rtl'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        db.setContactText(contactText)
                        setIsEditingContact(false)
                      }
                    }}
                    placeholder="הכנס את טקסט יצירת הקשר כאן...&#10;&#10;💡 עצה: שורות שמתחילות ב-⭐ יהיו מודגשות&#10;דוגמה: ⭐ טקסט מודגש"
                    autoFocus
                  />
                </div>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#2c3e50', display: 'block', marginBottom: '5px' }}>
                    👁️ תצוגה מקדימה:
                  </label>
                  <div style={{
                    border: '2px solid #95a5a6',
                    borderRadius: '5px',
                    padding: '10px',
                    background: '#f8f9fa',
                    width: '400px',
                    height: '120px',
                    overflow: 'auto',
                    fontSize: '14px',
                    textAlign: 'right',
                    direction: 'rtl'
                  }}>
                    {contactText.split('\n').map((line, index) => (
                      <p key={index} style={{
                        margin: '3px 0',
                        fontWeight: line.includes('⭐') ? 'bold' : 'normal',
                        color: line.includes('⭐') ? '#1a5490' : '#2c3e50'
                      }}>
                        {line || '\u00A0'}
                      </p>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <button
                    onClick={() => {
                      db.setContactText(contactText)
                      setIsEditingContact(false)
                    }}
                    style={{
                      backgroundColor: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      padding: '8px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => {
                      setContactText(db.getContactText())
                      setIsEditingContact(false)
                    }}
                    style={{
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      padding: '8px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    ✗
                  </button>
                </div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <small style={{ color: '#666', fontSize: '12px', display: 'block' }}>
                  💡 עצות עריכה:
                </small>
                <small style={{ color: '#666', fontSize: '11px', display: 'block', marginTop: '5px' }}>
                  • שורות שמתחילות ב-⭐ יהיו מודגשות בכחול
                </small>
                <small style={{ color: '#666', fontSize: '11px', display: 'block' }}>
                  • Ctrl+Enter לשמירה מהירה
                </small>
                <small style={{ color: '#666', fontSize: '11px', display: 'block' }}>
                  • Enter רגיל לשורה חדשה
                </small>
              </div>
            </div>
          ) : (
            <div
              style={{
                marginTop: '15px',
                cursor: 'pointer',
                position: 'relative'
              }}
              onClick={() => setIsEditingContact(true)}
              title="לחץ לעריכת טקסט יצירת הקשר"
            >
              {contactText.split('\n').map((line, index) => (
                <p key={index} style={{
                  margin: '5px 0',
                  fontWeight: line.includes('⭐') ? 'bold' : 'normal',
                  color: line.includes('⭐') ? '#1a5490' : 'inherit'
                }}>
                  {line}
                </p>
              ))}
              <span style={{
                position: 'absolute',
                top: '5px',
                left: '10px',
                fontSize: '12px',
                opacity: 0.7
              }}>
                ✏️
              </span>
            </div>
          )}
        </div>
      </main>

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

export default HomePage