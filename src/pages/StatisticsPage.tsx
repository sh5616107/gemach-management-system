import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../database/database'

function StatisticsPage() {
  const navigate = useNavigate()
  const [paymentStats, setPaymentStats] = useState<any>(null)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = () => {
    try {
      const stats = db.getDetailedPaymentMethodReport()
      setPaymentStats(stats)
      console.log('📊 סטטיסטיקות אמצעי תשלום:', stats)
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