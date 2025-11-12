import { db, DatabaseDepositor } from '../database/database'

interface DepositorDetailedReportProps {
  depositor: DatabaseDepositor
  onClose: () => void
}

function DepositorDetailedReport({ depositor, onClose }: DepositorDetailedReportProps) {
  const deposits = db.getDepositorDeposits(depositor.id)
  
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

  const handlePrint = () => {
    window.print()
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
      <div style={{
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
              <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>סכום</th>
              <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>יתרה</th>
              <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>הערות</th>
            </tr>
          </thead>
          <tbody>
            {allTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
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
                  <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                    {transaction.type === 'deposit' ? '+' : '-'}₪{transaction.amount.toLocaleString()}
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
            body {
              padding: 20px;
            }
          }
        `}</style>
      </div>
    </div>
  )
}

export default DepositorDetailedReport
