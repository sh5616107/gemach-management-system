import { db, DatabaseDepositor } from '../database/database'

interface DepositorDetailedReportProps {
  depositor: DatabaseDepositor
  onClose: () => void
}

function DepositorDetailedReport({ depositor, onClose }: DepositorDetailedReportProps) {
  const deposits = db.getDepositorDeposits(depositor.id)
  const recurringDeposits = db.getDepositorRecurringDeposits(depositor.id)
  
  // אסוף את כל הפעולות (הפקדות ומשיכות) למיון כרונולוגי
  const allTransactions: Array<{
    date: string
    type: 'deposit' | 'withdrawal'
    amount: number
    depositId: number
    balance: number
    notes?: string
  }> = []

  let runningBalance = 0

  // הוסף הפקדות
  deposits.forEach(deposit => {
    allTransactions.push({
      date: deposit.depositDate,
      type: 'deposit',
      amount: deposit.amount,
      depositId: deposit.id,
      balance: 0, // נחשב אחר כך
      notes: deposit.notes
    })
  })

  // הוסף משיכות
  deposits.forEach(deposit => {
    const withdrawals = db.getWithdrawalsByDepositId(deposit.id)
    withdrawals.forEach(withdrawal => {
      allTransactions.push({
        date: withdrawal.date,
        type: 'withdrawal',
        amount: withdrawal.amount,
        depositId: deposit.id,
        balance: 0, // נחשב אחר כך
        notes: withdrawal.notes
      })
    })
  })

  // מיין לפי תאריך
  allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // חשב יתרה רצה
  allTransactions.forEach(transaction => {
    if (transaction.type === 'deposit') {
      runningBalance += transaction.amount
    } else {
      runningBalance -= transaction.amount
    }
    transaction.balance = runningBalance
  })

  const handlePrint = async () => {
    // בדוק אם רצים ב-Electron
    if (window.electronAPI && window.electronAPI.printReport) {
      // הכן את תוכן הדוח להדפסה
      const reportContent = document.querySelector('.report-content')
      if (reportContent) {
        try {
          const result = await window.electronAPI.printReport(reportContent.innerHTML)
          if (!result.success) {
            alert('שגיאה בהדפסה: ' + (result.error || 'שגיאה לא ידועה'))
          }
        } catch (error) {
          console.error('שגיאה בהדפסה:', error)
          alert('שגיאה בהדפסה')
        }
      }
    } else {
      // דפדפן רגיל - הדפס רק את תוכן הדוח
      window.print()
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="report-content" style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '30px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div className="no-print" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>📊 דוח מפורט - {depositor.name}</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handlePrint}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              🖨️ הדפס
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              ❌ סגור
            </button>
          </div>
        </div>

        {/* פרטי מפקיד */}
        <div style={{
          backgroundColor: '#ecf0f1',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <p style={{ margin: '5px 0' }}><strong>שם:</strong> {depositor.name}</p>
          {depositor.idNumber && <p style={{ margin: '5px 0' }}><strong>ת.ז.:</strong> {depositor.idNumber}</p>}
          {depositor.phone && <p style={{ margin: '5px 0' }}><strong>טלפון:</strong> {depositor.phone}</p>}
          <p style={{ margin: '5px 0' }}><strong>יתרה נוכחית:</strong> ₪{db.getDepositorBalance(depositor.id).toLocaleString()}</p>
        </div>

        {/* הפקדות מתוכננות */}
        {recurringDeposits.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#9b59b6' }}>🔄 הפקדות מתוכננות (עתידיות)</h3>
            <div style={{
              backgroundColor: '#f3e5f5',
              border: '2px dashed #9b59b6',
              borderRadius: '8px',
              padding: '15px',
              marginTop: '10px'
            }}>
              {recurringDeposits.map((recurring, index) => {
                const nextDate = recurring.lastRecurringDate 
                  ? new Date(recurring.lastRecurringDate)
                  : new Date(recurring.depositDate)
                nextDate.setMonth(nextDate.getMonth() + 1)
                if (recurring.recurringDay) {
                  nextDate.setDate(recurring.recurringDay)
                }
                
                return (
                  <div key={index} style={{
                    padding: '10px',
                    backgroundColor: 'white',
                    borderRadius: '5px',
                    marginBottom: index < recurringDeposits.length - 1 ? '10px' : '0'
                  }}>
                    <p style={{ margin: '5px 0', fontWeight: 'bold', color: '#9b59b6' }}>
                      💰 ₪{recurring.amount.toLocaleString()} - כל {recurring.recurringDay} לחודש
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                      📅 הפקדה הבאה: {nextDate.toLocaleDateString('he-IL')}
                    </p>
                    {recurring.recurringEndDate && (
                      <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                        🏁 עד: {new Date(recurring.recurringEndDate).toLocaleDateString('he-IL')}
                      </p>
                    )}
                    {recurring.notes && (
                      <p style={{ margin: '5px 0', fontSize: '13px', color: '#999', fontStyle: 'italic' }}>
                        📝 {recurring.notes}
                      </p>
                    )}
                  </div>
                )
              })}
              <div style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#fff3cd',
                borderRadius: '5px',
                fontSize: '13px',
                color: '#856404'
              }}>
                ℹ️ הפקדות אלו ייווצרו אוטומטית בתאריכים המתוכננים
              </div>
            </div>
          </div>
        )}

        {/* טבלת תנועות */}
        <h3>תנועות</h3>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '10px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#3498db', color: 'white' }}>
              <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>תאריך</th>
              <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>סוג</th>
              <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>זכות/חובה</th>
              <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>סכום</th>
              <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>יתרה</th>
              <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>הערות</th>
            </tr>
          </thead>
          <tbody>
            {allTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
                  אין תנועות
                </td>
              </tr>
            ) : (
              allTransactions.map((transaction, index) => (
                <tr key={index} style={{
                  backgroundColor: transaction.type === 'deposit' ? '#d5f4e6' : '#fadbd8'
                }}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {new Date(transaction.date).toLocaleDateString('he-IL')}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {transaction.type === 'deposit' ? '💰 הפקדה' : '💸 משיכה'}
                  </td>
                  <td style={{ 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: transaction.type === 'deposit' ? '#27ae60' : '#e74c3c',
                    textAlign: 'center'
                  }}>
                    {transaction.type === 'deposit' ? '⬆️ זכות' : '⬇️ חובה'}
                  </td>
                  <td style={{ 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    fontWeight: 'bold',
                    color: transaction.type === 'deposit' ? '#27ae60' : '#e74c3c'
                  }}>
                    ₪{transaction.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                    ₪{transaction.balance.toLocaleString()}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '12px', color: '#7f8c8d' }}>
                    {transaction.notes || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* סיכום */}
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#ecf0f1',
          borderRadius: '5px'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>סיכום</h4>
          <p style={{ margin: '5px 0' }}>
            <strong>סה"כ הפקדות:</strong> ₪{allTransactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>סה"כ משיכות:</strong> ₪{allTransactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
          </p>
          <p style={{ margin: '5px 0', fontSize: '18px', color: '#27ae60' }}>
            <strong>יתרה סופית:</strong> ₪{db.getDepositorBalance(depositor.id).toLocaleString()}
          </p>
        </div>

        <style>{`
          @media print {
            .no-print {
              display: none !important;
            }
            
            /* הסתר את הרקע האפור והמודל */
            body > div:first-child {
              background: white !important;
            }
            
            /* הצג רק את תוכן הדוח */
            .report-content {
              position: static !important;
              max-width: 100% !important;
              max-height: none !important;
              overflow: visible !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              padding: 20px !important;
            }
            
            /* הסתר את כל האלמנטים מלבד הדוח */
            body * {
              visibility: hidden;
            }
            
            .report-content,
            .report-content * {
              visibility: visible;
            }
            
            .report-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  )
}

export default DepositorDetailedReport
