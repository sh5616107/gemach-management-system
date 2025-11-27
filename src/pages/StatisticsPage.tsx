import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../database/database'
import AllAccountsReport from '../components/AllAccountsReport'

function StatisticsPage() {
  const navigate = useNavigate()
  const [paymentStats, setPaymentStats] = useState<any>(null)
  const [guarantorStats, setGuarantorStats] = useState<any>(null)
  const [showAccountsReport, setShowAccountsReport] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText: string
    cancelText?: string
    onConfirm: () => void
    type: 'warning' | 'danger'
  } | null>(null)

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

  const showConfirmModal = (config: any) => {
    setModalConfig({
      isOpen: true,
      cancelText: 'ביטול',
      ...config
    })
  }

  const closeModal = () => {
    setModalConfig(null)
  }

  const handleDeleteExpense = (expenseId: number) => {
    showConfirmModal({
      title: 'מחיקת הוצאה',
      message: 'האם אתה בטוח שברצונך למחוק את ההוצאה?',
      confirmText: 'מחק',
      type: 'danger',
      onConfirm: () => {
        db.deleteExpense(expenseId)
        showNotification('✅ ההוצאה נמחקה בהצלחה')
        loadStatistics()
      }
    })
  }

  const loadStatistics = () => {
    try {
      const stats: any = db.getDetailedPaymentMethodReport()
      
      // הוסף הוצאות לסטטיסטיקות
      const expenses = db.getExpenses()
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
      
      // עדכן את הסיכום הכללי להכיל גם הוצאות
      stats.totals.totalExpenses = totalExpenses
      stats.totals.totalNetWithExpenses = stats.totals.totalNet - totalExpenses
      stats.expenses = expenses
      
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
        {/* כפתורים עליונים */}
        <div style={{ marginBottom: '20px', textAlign: 'center', display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAccountsReport(true)}
            style={{
              padding: '15px 30px',
              backgroundColor: '#9b59b6',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(155, 89, 182, 0.3)'
            }}
          >
            📊 דוח חשבונות - לווים ומפקידים
          </button>
          
          <button
            onClick={() => setShowAddExpense(true)}
            style={{
              padding: '15px 30px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)'
            }}
          >
            ➕ הוצאה חדשה
          </button>
        </div>

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
              <div style={{ fontSize: '14px', opacity: 0.9 }}>📈 נטו (לפני הוצאות)</div>
            </div>
            {paymentStats.totals.totalExpenses !== undefined && (
              <>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px', color: '#e74c3c' }}>
                    {formatCurrency(paymentStats.totals.totalExpenses)}
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>💸 הוצאות</div>
                </div>
                <div>
                  <div style={{ 
                    fontSize: '28px', 
                    fontWeight: 'bold', 
                    marginBottom: '5px',
                    color: paymentStats.totals.totalNetWithExpenses >= 0 ? '#2ecc71' : '#e74c3c'
                  }}>
                    {formatCurrency(paymentStats.totals.totalNetWithExpenses)}
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>💰 נטו סופי</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* מודל דוח חשבונות */}
        {showAccountsReport && (
          <AllAccountsReport onClose={() => setShowAccountsReport(false)} />
        )}

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

          {/* הוצאות */}
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ 
              color: '#e74c3c', 
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              💸 הוצאות הגמ"ח
            </h4>

            {paymentStats.expenses && paymentStats.expenses.length > 0 ? (
              <>
              
              
              {/* סיכום הוצאות לפי סוג */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '15px',
                marginBottom: '20px'
              }}>
                {(() => {
                  const expensesByType = paymentStats.expenses.reduce((acc: any, exp: any) => {
                    if (!acc[exp.type]) {
                      acc[exp.type] = { count: 0, amount: 0 }
                    }
                    acc[exp.type].count++
                    acc[exp.type].amount += exp.amount
                    return acc
                  }, {})
                  
                  const typeLabels: any = {
                    'bank_fee': { label: '🏦 עמלת בנק', color: '#3498db' },
                    'office': { label: '🏢 הוצאות משרד', color: '#9b59b6' },
                    'salary': { label: '💼 שכר טרחה', color: '#e67e22' },
                    'other': { label: '📌 אחר', color: '#95a5a6' }
                  }
                  
                  return Object.entries(expensesByType).map(([type, data]: [string, any]) => (
                    <div key={type} style={{
                      background: 'white',
                      border: `2px solid ${typeLabels[type]?.color || '#95a5a6'}`,
                      borderRadius: '10px',
                      padding: '15px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                        {typeLabels[type]?.label || type}
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: typeLabels[type]?.color || '#95a5a6', marginBottom: '5px' }}>
                        {formatCurrency(data.amount)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                        {data.count} הוצאות
                      </div>
                    </div>
                  ))
                })()}
              </div>

              {/* טבלת הוצאות מפורטת */}
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>תאריך</th>
                      <th>סוג</th>
                      <th>תיאור</th>
                      <th>שולם ע"י</th>
                      <th>סכום</th>
                      <th>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentStats.expenses
                      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 10)
                      .map((expense: any) => {
                        const typeLabels: any = {
                          'bank_fee': '🏦 עמלת בנק',
                          'office': '🏢 הוצאות משרד',
                          'salary': '💼 שכר טרחה',
                          'other': '📌 אחר'
                        }
                        
                        return (
                          <tr key={expense.id}>
                            <td>{new Date(expense.date).toLocaleDateString('he-IL')}</td>
                            <td>{typeLabels[expense.type] || expense.type}</td>
                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {expense.description}
                            </td>
                            <td>
                              {expense.paidBy === 'gemach' ? 'הגמ"ח' :
                               expense.paidBy === 'borrower' ? `לווה: ${expense.borrowerName || ''}` :
                               expense.paidBy === 'donor' ? `תורם: ${expense.donorName || ''}` :
                               'לא צוין'}
                            </td>
                            <td style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                              {formatCurrency(expense.amount)}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                <button
                                  onClick={() => setEditingExpense(expense)}
                                  style={{
                                    padding: '5px 10px',
                                    backgroundColor: '#f39c12',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  style={{
                                    padding: '5px 10px',
                                    backgroundColor: '#e74c3c',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
              {paymentStats.expenses.length > 10 && (
                <div style={{ textAlign: 'center', marginTop: '10px', color: '#7f8c8d', fontSize: '14px' }}>
                  מוצגות 10 הוצאות אחרונות מתוך {paymentStats.expenses.length}
                </div>
              )}
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#7f8c8d',
                fontSize: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '10px'
              }}>
                📭 אין הוצאות רשומות
              </div>
            )}
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

      {/* מודל הוספת הוצאה */}
      {showAddExpense && (
        <AddExpenseModal
          onClose={() => setShowAddExpense(false)}
          onSuccess={() => {
            setShowAddExpense(false)
            showNotification('✅ ההוצאה נוספה בהצלחה')
            loadStatistics()
          }}
        />
      )}

      {/* מודל עריכת הוצאה */}
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSuccess={() => {
            setEditingExpense(null)
            showNotification('✅ ההוצאה עודכנה בהצלחה')
            loadStatistics()
          }}
        />
      )}

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
              color: modalConfig.type === 'danger' ? '#e74c3c' : '#f39c12',
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
                  backgroundColor: modalConfig.type === 'danger' ? '#e74c3c' : '#f39c12',
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
                onClick={closeModal}
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

// קומפוננטת מודל להוספת הוצאה
function AddExpenseModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    type: 'other' as 'bank_fee' | 'office' | 'salary' | 'other',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    paidBy: 'gemach' as 'gemach' | 'borrower' | 'donor',
    paidByName: ''
  })

  // טען רשימת לווים
  const borrowers = db.getBorrowers()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('נא להזין סכום תקין')
      return
    }

    if (!formData.description.trim()) {
      alert('נא להזין תיאור')
      return
    }

    db.addExpense({
      type: formData.type,
      amount: Number(formData.amount),
      date: formData.date,
      description: formData.description,
      paidBy: formData.paidBy,
      borrowerName: formData.paidBy === 'borrower' ? formData.paidByName : undefined,
      donorName: formData.paidBy === 'donor' ? formData.paidByName : undefined
    })

    onSuccess()
  }

  return (
    <div style={{
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
    onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '30px',
        maxWidth: '500px',
        width: '90%',
        direction: 'rtl',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: '20px' }}>➕ הוצאה חדשה</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              סוג הוצאה:
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            >
              <option value="bank_fee">🏦 עמלת בנק</option>
              <option value="office">🏢 הוצאות משרד</option>
              <option value="salary">💼 שכר טרחה</option>
              <option value="other">📌 אחר</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              סכום:
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
              placeholder="0"
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              תאריך:
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              תיאור:
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px',
                minHeight: '80px'
              }}
              placeholder="תיאור ההוצאה..."
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              שולם על ידי:
            </label>
            <select
              value={formData.paidBy}
              onChange={(e) => setFormData({ ...formData, paidBy: e.target.value as any })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            >
              <option value="gemach">הגמ"ח</option>
              <option value="borrower">לווה</option>
              <option value="donor">תורם</option>
            </select>
          </div>

          {formData.paidBy === 'borrower' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                בחר לווה:
              </label>
              <select
                value={formData.paidByName}
                onChange={(e) => setFormData({ ...formData, paidByName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              >
                <option value="">-- בחר לווה --</option>
                {borrowers.map(borrower => (
                  <option key={borrower.id} value={`${borrower.firstName} ${borrower.lastName}`}>
                    {borrower.firstName} {borrower.lastName} - {borrower.idNumber}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.paidBy === 'donor' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                שם התורם:
              </label>
              <input
                type="text"
                value={formData.paidByName}
                onChange={(e) => setFormData({ ...formData, paidByName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
                placeholder="שם התורם"
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              ✅ שמור
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ❌ ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// קומפוננטת מודל לעריכת הוצאה
function EditExpenseModal({ expense, onClose, onSuccess }: { 
  expense: any; 
  onClose: () => void; 
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    type: expense.type as 'bank_fee' | 'office' | 'salary' | 'other',
    amount: expense.amount.toString(),
    date: expense.date,
    description: expense.description,
    paidBy: expense.paidBy as 'gemach' | 'borrower' | 'donor',
    paidByName: expense.borrowerName || expense.donorName || ''
  })

  // טען רשימת לווים
  const borrowers = db.getBorrowers()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('נא להזין סכום תקין')
      return
    }

    if (!formData.description.trim()) {
      alert('נא להזין תיאור')
      return
    }

    db.updateExpense(expense.id, {
      type: formData.type,
      amount: Number(formData.amount),
      date: formData.date,
      description: formData.description,
      paidBy: formData.paidBy,
      borrowerName: formData.paidBy === 'borrower' ? formData.paidByName : undefined,
      donorName: formData.paidBy === 'donor' ? formData.paidByName : undefined
    })

    onSuccess()
  }

  return (
    <div style={{
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
    onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '30px',
        maxWidth: '500px',
        width: '90%',
        direction: 'rtl',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: '20px' }}>✏️ עריכת הוצאה</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              סוג הוצאה:
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            >
              <option value="bank_fee">🏦 עמלת בנק</option>
              <option value="office">🏢 הוצאות משרד</option>
              <option value="salary">💼 שכר טרחה</option>
              <option value="other">📌 אחר</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              סכום:
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              תאריך:
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              תיאור:
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px',
                minHeight: '80px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              שולם על ידי:
            </label>
            <select
              value={formData.paidBy}
              onChange={(e) => setFormData({ ...formData, paidBy: e.target.value as any })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            >
              <option value="gemach">הגמ"ח</option>
              <option value="borrower">לווה</option>
              <option value="donor">תורם</option>
            </select>
          </div>

          {formData.paidBy === 'borrower' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                בחר לווה:
              </label>
              <select
                value={formData.paidByName}
                onChange={(e) => setFormData({ ...formData, paidByName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              >
                <option value="">-- בחר לווה --</option>
                {borrowers.map(borrower => (
                  <option key={borrower.id} value={`${borrower.firstName} ${borrower.lastName}`}>
                    {borrower.firstName} {borrower.lastName} - {borrower.idNumber}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.paidBy === 'donor' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                שם התורם:
              </label>
              <input
                type="text"
                value={formData.paidByName}
                onChange={(e) => setFormData({ ...formData, paidByName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
                placeholder="שם התורם"
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              ✅ שמור
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ❌ ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StatisticsPage