import { db } from '../database/database'

interface AllAccountsReportProps {
  onClose: () => void
}

function AllAccountsReport({ onClose }: AllAccountsReportProps) {
  // אסוף נתונים על לווים
  const borrowers = db.getBorrowers()
  const borrowersData = borrowers.map(borrower => {
    const loans = db.getLoans().filter(l => l.borrowerId === borrower.id)
    const totalDebt = loans.reduce((sum, loan) => {
      const balance = db.getLoanBalance(loan.id)
      return sum + balance
    }, 0)
    
    return {
      type: 'borrower' as const,
      id: borrower.id,
      name: `${borrower.firstName} ${borrower.lastName}`,
      idNumber: borrower.idNumber,
      phone: borrower.phone,
      amount: totalDebt,
      loansCount: loans.filter(l => db.getLoanBalance(l.id) > 0).length
    }
  }).filter(b => b.amount > 0) // רק לווים עם חוב

  // אסוף נתונים על מפקידים
  const depositors = db.getDepositors()
  const depositorsData = depositors.map(depositor => {
    const balance = db.getDepositorBalance(depositor.id)
    const activeDeposits = db.getDepositorActiveDepositsCount(depositor.id)
    
    return {
      type: 'depositor' as const,
      id: depositor.id,
      name: depositor.name,
      idNumber: depositor.idNumber,
      phone: depositor.phone,
      amount: balance,
      depositsCount: activeDeposits
    }
  }).filter(d => d.amount > 0) // רק מפקידים עם יתרה

  // חשב סיכומים
  const totalDebt = borrowersData.reduce((sum, b) => sum + b.amount, 0)
  const totalCredit = depositorsData.reduce((sum, d) => sum + d.amount, 0)
  const netBalance = totalCredit - totalDebt

  // מיין לפי סכום (הגבוה ביותר קודם)
  borrowersData.sort((a, b) => b.amount - a.amount)
  depositorsData.sort((a, b) => b.amount - a.amount)

  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    const headers = ['סוג', 'שם', 'ת.ז.', 'טלפון', 'חובה/זכות', 'סכום', 'פריטים פעילים']
    
    const borrowersRows = borrowersData.map(b => [
      'לווה',
      b.name,
      b.idNumber || '',
      b.phone || '',
      'חובה',
      b.amount,
      b.loansCount
    ])
    
    const depositorsRows = depositorsData.map(d => [
      'מפקיד',
      d.name,
      d.idNumber || '',
      d.phone || '',
      'זכות',
      d.amount,
      d.depositsCount
    ])
    
    const csvData = [...borrowersRows, ...depositorsRows]
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `דוח_חשבונות_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
        maxWidth: '95vw',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div className="no-print" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>📊 דוח חשבונות - לווים ומפקידים</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleExportCSV}
              style={{
                padding: '10px 20px',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              📊 ייצא ל-CSV
            </button>
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

        {/* סיכום כללי */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: '#e74c3c',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>סה"כ חובות</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>₪{totalDebt.toLocaleString()}</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>{borrowersData.length} לווים</p>
          </div>
          
          <div style={{
            backgroundColor: '#27ae60',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>סה"כ זכויות</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>₪{totalCredit.toLocaleString()}</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>{depositorsData.length} מפקידים</p>
          </div>
          
          <div style={{
            backgroundColor: netBalance >= 0 ? '#3498db' : '#f39c12',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>מאזן נטו</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>₪{netBalance.toLocaleString()}</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
              {netBalance >= 0 ? 'עודף זכות' : 'עודף חובה'}
            </p>
          </div>
        </div>

        {/* טבלת לווים */}
        {borrowersData.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#e74c3c' }}>🔴 לווים (חובה)</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '10px',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#e74c3c', color: 'white' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'right', border: '1px solid #ddd' }}>שם</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', border: '1px solid #ddd' }}>ת.ז.</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', border: '1px solid #ddd' }}>טלפון</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', border: '1px solid #ddd' }}>חוב</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', border: '1px solid #ddd' }}>הלוואות פעילות</th>
                  </tr>
                </thead>
                <tbody>
                  {borrowersData.map((borrower, index) => (
                    <tr key={borrower.id} style={{
                      backgroundColor: index % 2 === 0 ? '#fff5f5' : 'white'
                    }}>
                      <td style={{ padding: '10px 8px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                        {borrower.name}
                      </td>
                      <td style={{ padding: '10px 8px', border: '1px solid #ddd', fontSize: '12px' }}>
                        {borrower.idNumber || '-'}
                      </td>
                      <td style={{ padding: '10px 8px', border: '1px solid #ddd', fontSize: '12px' }}>
                        {borrower.phone || '-'}
                      </td>
                      <td style={{ 
                        padding: '10px 8px', 
                        border: '1px solid #ddd', 
                        fontWeight: 'bold',
                        color: '#e74c3c'
                      }}>
                        ₪{borrower.amount.toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center' }}>
                        {borrower.loansCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* טבלת מפקידים */}
        {depositorsData.length > 0 && (
          <div>
            <h3 style={{ color: '#27ae60' }}>🟢 מפקידים (זכות)</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '10px',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#27ae60', color: 'white' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'right', border: '1px solid #ddd' }}>שם</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', border: '1px solid #ddd' }}>ת.ז.</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', border: '1px solid #ddd' }}>טלפון</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', border: '1px solid #ddd' }}>זכות</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', border: '1px solid #ddd' }}>הפקדות פעילות</th>
                  </tr>
                </thead>
                <tbody>
                  {depositorsData.map((depositor, index) => (
                    <tr key={depositor.id} style={{
                      backgroundColor: index % 2 === 0 ? '#f0fdf4' : 'white'
                    }}>
                      <td style={{ padding: '10px 8px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                        {depositor.name}
                      </td>
                      <td style={{ padding: '10px 8px', border: '1px solid #ddd', fontSize: '12px' }}>
                        {depositor.idNumber || '-'}
                      </td>
                      <td style={{ padding: '10px 8px', border: '1px solid #ddd', fontSize: '12px' }}>
                        {depositor.phone || '-'}
                      </td>
                      <td style={{ 
                        padding: '10px 8px', 
                        border: '1px solid #ddd', 
                        fontWeight: 'bold',
                        color: '#27ae60'
                      }}>
                        ₪{depositor.amount.toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center' }}>
                        {depositor.depositsCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {borrowersData.length === 0 && depositorsData.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#7f8c8d'
          }}>
            אין חשבונות פעילים
          </div>
        )}

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

export default AllAccountsReport
