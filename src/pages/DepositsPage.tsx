import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, DatabaseDepositor } from '../database/database'
import DepositorCard from '../components/DepositorCard'
import NewDepositorForm from '../components/NewDepositorForm'
import NewDepositForm from '../components/NewDepositForm'
import EditDepositorForm from '../components/EditDepositorForm'
import DepositorDetailedReport from '../components/DepositorDetailedReport'
import EditDepositForm from '../components/EditDepositForm'

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
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את המפקיד ${depositor.name}?`)) {
      const result = db.deleteDepositor(depositor.id)
      if (result.success) {
        showNotification('✅ המפקיד נמחק בהצלחה')
        loadDepositors()
      } else {
        showNotification(`❌ ${result.error}`, 'error')
      }
    }
  }

  // פעולות על הפקדה
  const handleWithdrawDeposit = (depositId: number, availableBalance: number) => {
    const amount = prompt(`כמה לשלם? (זמין: ₪${availableBalance.toLocaleString()})`)
    if (!amount) return

    const amountNum = Number(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      showNotification('⚠️ סכום לא תקין', 'error')
      return
    }

    if (amountNum > availableBalance) {
      showNotification('⚠️ הסכום גדול מהיתרה הזמינה', 'error')
      return
    }

    if (db.withdrawDeposit(depositId, amountNum)) {
      showNotification(`✅ נמשכו ₪${amountNum.toLocaleString()} בהצלחה!`)
      loadDepositors()
    } else {
      showNotification('❌ שגיאה במשיכת הפקדון', 'error')
    }
  }

  const handlePrintDepositDocument = (deposit: any) => {
    const gemachName = db.getGemachName()
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
              <p>מאשרים בזה כי קיבלנו מאת <strong>${depositorName}</strong></p>
              ${selectedDepositor?.idNumber ? `<p>ת.ז. <strong>${db.formatIdNumber(selectedDepositor.idNumber)}</strong></p>` : ''}
              <p>סכום של: <strong>${amount} ש"ח</strong></p>
              <p>בתאריך: <strong>${depositDate}</strong></p>
              <p>תקופת ההפקדה: <strong>${deposit.depositPeriod} חודשים</strong></p>
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
      </div>
    )
  }

  // תצוגת מפקיד בודד עם הפקדות
  const depositorDeposits = db.getDepositorDeposits(selectedDepositor.id)
  const totalBalance = db.getDepositorBalance(selectedDepositor.id)

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
          אין הפקדות למפקיד זה
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
                </div>
              </div>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}

export default DepositsPage
