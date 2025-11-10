import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../database/database'

function StatisticsPage() {
  const navigate = useNavigate()
  const [paymentStats, setPaymentStats] = useState<any>(null)
  const [guarantorStats, setGuarantorStats] = useState<any>(null)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadGuarantorStats = () => {
    try {
      const transferredLoans = db.getLoans().filter(l => l.transferredToGuarantors)
      const guarantorDebts = db.getGuarantorDebts()
      
      // חישוב סטטיסטיקות הלוואות מועברות
      const totalTransferredAmount = transferredLoans.reduce((sum, loan) => sum + loan.amount, 0)
      
      // חישוב סטטיסטיקות חובות ערבים
      const totalDebtsAmount = guarantorDebts.reduce((sum, debt) => sum + debt.amount, 0)
      const totalDebtsPaid = guarantorDebts.reduce((sum, debt) => {
        const balance = db.getGuarantorDebtBalance(debt.id)
        return sum + (debt.amount - balance)
      }, 0)
      const totalDebtsBalance = guarantorDebts.reduce((sum, debt) => {
        return sum + db.getGuarantorDebtBalance(debt.id)
      }, 0)
      
      // ספירת סטטוסים
      const paidDebts = guarantorDebts.filter(d => d.status === 'paid').length
      const activeDebts = guarantorDebts.filter(d => d.status === 'active').length
      const overdueDebts = guarantorDebts.filter(d => d.status === 'overdue').length
      
      // ערבים ייחודיים
      const uniqueGuarantors = new Set(guarantorDebts.map(d => d.guarantorId)).size
      
      setGuarantorStats({
        transferredLoans: {
          count: transferredLoans.length,
          totalAmount: totalTransferredAmount
        },
        guarantorDebts: {
          count: guarantorDebts.length,
          totalAmount: totalDebtsAmount,
          totalPaid: totalDebtsPaid,
          totalBalance: totalDebtsBalance,
          paidCount: paidDebts,
          activeCount: activeDebts,
          overdueCount: overdueDebts,
          uniqueGuarantors: uniqueGuarantors
        }
      })
    } catch (error) {
      console.error('שגיאה בטעינת סטטיסטיקות ערבים:', error)
      setGuarantorStats({
        transferredLoans: { count: 0, totalAmount: 0 },
        guarantorDebts: {
          count: 0,
          totalAmount: 0,
          totalPaid: 0,
          totalBalance: 0,
          paidCount: 0,
          activeCount: 0,
          overdueCount: 0,
          uniqueGuarantors: 0
        }
      })
    }
  }

  const loadStatistics = () => {
    try {
      const stats = db.getDetailedPaymentMethodReport()
      setPaymentStats(stats)
      console.log('📊 סטטיסטיקות אמצעי תשלום:', stats)
      
      // טען גם סטטיסטיקות של הלוואות מועברות וחובות ערבים
      loadGuarantorStats()
    } catch (error) {
      console.error('שגיאה בטעינת סטטיסטיקות:', error)
      setPaymentStats({
        summary: {
          cash: { in: 0, out: 0, net: 0 },
          transfer: { in: 0, out: 0, net: 0 },
          check: { in: 0, out: 0, net: 0 },
          credit: { in: 0, out: 0, net: 0 },
          other: { in: 0, out: 0, net: 0 },
          unknown: { in: 0, out: 0, net: 0 }
        },
        detailed: {
          loans: { cash: { count: 0, amount: 0 }, transfer: { count: 0, amount: 0 }, check: { count: 0, amount: 0 }, credit: { count: 0, amount: 0 }, other: { count: 0, amount: 0 }, unknown: { count: 0, amount: 0 } },
          payments: { cash: { count: 0, amount: 0 }, transfer: { count: 0, amount: 0 }, check: { count: 0, amount: 0 }, credit: { count: 0, amount: 0 }, other: { count: 0, amount: 0 }, unknown: { count: 0, amount: 0 } },
          deposits: { cash: { count: 0, amount: 0 }, transfer: { count: 0, amount: 0 }, check: { count: 0, amount: 0 }, credit: { count: 0, amount: 0 }, other: { count: 0, amount: 0 }, unknown: { count: 0, amount: 0 } },
          withdrawals: { cash: { count: 0, amount: 0 }, transfer: { count: 0, amount: 0 }, check: { count: 0, amount: 0 }, credit: { count: 0, amount: 0 }, other: { count: 0, amount: 0 }, unknown: { count: 0, amount: 0 } },
          donations: { cash: { count: 0, amount: 0 }, transfer: { count: 0, amount: 0 }, check: { count: 0, amount: 0 }, credit: { count: 0, amount: 0 }, other: { count: 0, amount: 0 }, unknown: { count: 0, amount: 0 } }
        },
        totals: {
          totalIn: 0,
          totalOut: 0,
          totalNet: 0
        }
      })
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return '💵'
      case 'transfer': return '🏦'
      case 'check': return '📝'
      case 'credit': return '💳'
      case 'other': return '❓'
      default: return '❔'
    }
  }

  const getMethodName = (method: string) => {
    switch (method) {
      case 'cash': return 'מזומן'
      case 'transfer': return 'העברה בנקאית'
      case 'check': return 'צ\'ק'
      case 'credit': return 'אשראי'
      case 'other': return 'אחר'
      case 'unknown': return 'לא ידוע'
      default: return method
    }
  }

  const formatCurrency = (amount: number) => {
    return `₪${amount.toLocaleString()}`
  }

  if (!paymentStats) {
    return (
      <div>
        <header className="header">
          <h1>סטטיסטיקות אמצעי תשלום</h1>
          <button className="close-btn" onClick={() => navigate('/')}>×</button>
        </header>
        <div className="container">
          <p>טוען נתונים...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <header className="header">
        <h1>📊 סטטיסטיקות אמצעי תשלום</h1>
        <button className="close-btn" onClick={() => navigate('/')}>×</button>
      </header>

      <div className="container">
        {/* סיכום כללי */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '25px',
          borderRadius: '15px',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '24px' }}>💰 סיכום כספי כללי</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
                {formatCurrency(paymentStats.totals.totalIn)}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>💰 סה"כ נכנס</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
                {formatCurrency(paymentStats.totals.totalOut)}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>💸 סה"כ יצא</div>
            </div>
            <div>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                marginBottom: '5px',
                color: paymentStats.totals.totalNet >= 0 ? '#2ecc71' : '#e74c3c'
              }}>
                {formatCurrency(paymentStats.totals.totalNet)}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>📈 נטו</div>
            </div>
          </div>
        </div>

        {/* סיכום לפי אמצעי תשלום */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '20px', color: '#2c3e50', fontSize: '20px' }}>
            📋 סיכום לפי אמצעי תשלום
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {Object.entries(paymentStats.summary).map(([method, data]: [string, any]) => (
              <div key={method} style={{
                background: 'white',
                border: '2px solid #ecf0f1',
                borderRadius: '10px',
                padding: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '15px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#2c3e50'
                }}>
                  <span style={{ fontSize: '24px', marginLeft: '10px' }}>
                    {getMethodIcon(method)}
                  </span>
                  {getMethodName(method)}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#27ae60' }}>
                      {formatCurrency(data.in)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>נכנס</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#e74c3c' }}>
                      {formatCurrency(data.out)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>יצא</div>
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: 'bold', 
                      color: data.net >= 0 ? '#27ae60' : '#e74c3c'
                    }}>
                      {formatCurrency(data.net)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>נטו</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* פירוט מפורט */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '20px', color: '#2c3e50', fontSize: '20px' }}>
            📊 פירוט מפורט לפי סוג פעולה
          </h3>
          
          {/* הלוואות שניתנו */}
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ 
              color: '#e74c3c', 
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              💸 הלוואות שניתנו
            </h4>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>אמצעי תשלום</th>
                    <th>מספר הלוואות</th>
                    <th>סכום כולל</th>
                    <th>ממוצע להלוואה</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(paymentStats.detailed.loans).map(([method, data]: [string, any]) => (
                    data.count > 0 && (
                      <tr key={method}>
                        <td>
                          <span style={{ marginLeft: '8px' }}>{getMethodIcon(method)}</span>
                          {getMethodName(method)}
                        </td>
                        <td>{data.count}</td>
                        <td style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                          {formatCurrency(data.amount)}
                        </td>
                        <td>{formatCurrency(Math.round(data.amount / data.count))}</td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* פרעונות שהתקבלו */}
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ 
              color: '#27ae60', 
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              💰 פרעונות שהתקבלו
            </h4>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>אמצעי תשלום</th>
                    <th>מספר פרעונות</th>
                    <th>סכום כולל</th>
                    <th>ממוצע לפרעון</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(paymentStats.detailed.payments).map(([method, data]: [string, any]) => (
                    data.count > 0 && (
                      <tr key={method}>
                        <td>
                          <span style={{ marginLeft: '8px' }}>{getMethodIcon(method)}</span>
                          {getMethodName(method)}
                        </td>
                        <td>{data.count}</td>
                        <td style={{ color: '#27ae60', fontWeight: 'bold' }}>
                          {formatCurrency(data.amount)}
                        </td>
                        <td>{formatCurrency(Math.round(data.amount / data.count))}</td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* הפקדות שהתקבלו */}
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ 
              color: '#3498db', 
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🏦 הפקדות שהתקבלו
            </h4>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>אמצעי תשלום</th>
                    <th>מספר הפקדות</th>
                    <th>סכום כולל</th>
                    <th>ממוצע להפקדה</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(paymentStats.detailed.deposits).map(([method, data]: [string, any]) => (
                    data.count > 0 && (
                      <tr key={method}>
                        <td>
                          <span style={{ marginLeft: '8px' }}>{getMethodIcon(method)}</span>
                          {getMethodName(method)}
                        </td>
                        <td>{data.count}</td>
                        <td style={{ color: '#3498db', fontWeight: 'bold' }}>
                          {formatCurrency(data.amount)}
                        </td>
                        <td>{formatCurrency(Math.round(data.amount / data.count))}</td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* תרומות שהתקבלו */}
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ 
              color: '#9b59b6', 
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🎁 תרומות שהתקבלו
            </h4>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>אמצעי תשלום</th>
                    <th>מספר תרומות</th>
                    <th>סכום כולל</th>
                    <th>ממוצע לתרומה</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(paymentStats.detailed.donations).map(([method, data]: [string, any]) => (
                    data.count > 0 && (
                      <tr key={method}>
                        <td>
                          <span style={{ marginLeft: '8px' }}>{getMethodIcon(method)}</span>
                          {getMethodName(method)}
                        </td>
                        <td>{data.count}</td>
                        <td style={{ color: '#9b59b6', fontWeight: 'bold' }}>
                          {formatCurrency(data.amount)}
                        </td>
                        <td>{formatCurrency(Math.round(data.amount / data.count))}</td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* סטטיסטיקות הלוואות מועברות וחובות ערבים */}
        {guarantorStats && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50', fontSize: '20px' }}>
              🔄 הלוואות מועברות לערבים
            </h3>
            
            {/* סיכום הלוואות מועברות */}
            <div style={{
              background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
              border: '2px solid #a855f7',
              borderRadius: '15px',
              padding: '25px',
              marginBottom: '25px'
            }}>
              <h4 style={{ margin: '0 0 20px 0', color: '#7c3aed', fontSize: '18px' }}>
                📊 סיכום הלוואות מועברות
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  padding: '15px',
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#7c3aed', marginBottom: '5px' }}>
                    {guarantorStats.transferredLoans.count}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b21a8' }}>הלוואות מועברות</div>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  padding: '15px',
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#7c3aed', marginBottom: '5px' }}>
                    {formatCurrency(guarantorStats.transferredLoans.totalAmount)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b21a8' }}>סכום כולל</div>
                </div>
              </div>
            </div>

            {/* סיכום חובות ערבים */}
            <div style={{
              background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
              border: '2px solid #fb923c',
              borderRadius: '15px',
              padding: '25px',
              marginBottom: '25px'
            }}>
              <h4 style={{ margin: '0 0 20px 0', color: '#ea580c', fontSize: '18px' }}>
                🤝 סיכום חובות ערבים
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ea580c', marginBottom: '5px' }}>
                    {guarantorStats.guarantorDebts.count}
                  </div>
                  <div style={{ fontSize: '12px', color: '#c2410c' }}>חובות ערבים</div>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ea580c', marginBottom: '5px' }}>
                    {guarantorStats.guarantorDebts.uniqueGuarantors}
                  </div>
                  <div style={{ fontSize: '12px', color: '#c2410c' }}>ערבים מעורבים</div>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '5px' }}>
                    {formatCurrency(guarantorStats.guarantorDebts.totalAmount)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#1e40af' }}>סכום כולל</div>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a', marginBottom: '5px' }}>
                    {formatCurrency(guarantorStats.guarantorDebts.totalPaid)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#15803d' }}>שולם</div>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc2626', marginBottom: '5px' }}>
                    {formatCurrency(guarantorStats.guarantorDebts.totalBalance)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#991b1b' }}>יתרה</div>
                </div>
              </div>

              {/* פירוט סטטוסים */}
              <div style={{ 
                marginTop: '20px', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: '12px' 
              }}>
                <div style={{
                  background: 'rgba(220, 252, 231, 0.7)',
                  border: '2px solid #22c55e',
                  padding: '10px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a', marginBottom: '3px' }}>
                    {guarantorStats.guarantorDebts.paidCount}
                  </div>
                  <div style={{ fontSize: '11px', color: '#15803d' }}>✅ שולם במלואו</div>
                </div>
                <div style={{
                  background: 'rgba(254, 243, 199, 0.7)',
                  border: '2px solid #f59e0b',
                  padding: '10px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d97706', marginBottom: '3px' }}>
                    {guarantorStats.guarantorDebts.activeCount}
                  </div>
                  <div style={{ fontSize: '11px', color: '#92400e' }}>⏳ פעיל</div>
                </div>
                <div style={{
                  background: 'rgba(254, 226, 226, 0.7)',
                  border: '2px solid #ef4444',
                  padding: '10px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', marginBottom: '3px' }}>
                    {guarantorStats.guarantorDebts.overdueCount}
                  </div>
                  <div style={{ fontSize: '11px', color: '#991b1b' }}>⚠️ באיחור</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* כפתור רענון */}
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button 
            className="btn btn-primary"
            onClick={loadStatistics}
            style={{ fontSize: '16px', padding: '12px 24px' }}
          >
            🔄 רענן סטטיסטיקות
          </button>
        </div>
      </div>

      <button className="back-btn" onClick={() => navigate('/')}>
        🏠
      </button>
    </div>
  )
}

export default StatisticsPage