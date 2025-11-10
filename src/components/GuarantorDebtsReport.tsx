import { useState, useEffect } from 'react'
import { db, DatabaseGuarantorDebt, DatabaseGuarantor, DatabaseBorrower, DatabaseLoan } from '../database/database'

interface GuarantorDebtsReportProps {
  isOpen: boolean
  onClose: () => void
}

interface GuarantorDebtData {
  debt: DatabaseGuarantorDebt
  guarantor: DatabaseGuarantor
  originalBorrower: DatabaseBorrower
  originalLoan: DatabaseLoan
  balance: number
  paid: number
  paymentStatus: 'paid' | 'partial' | 'unpaid'
}

function GuarantorDebtsReport({ isOpen, onClose }: GuarantorDebtsReportProps) {
  const [debts, setDebts] = useState<GuarantorDebtData[]>([])
  const [filteredDebts, setFilteredDebts] = useState<GuarantorDebtData[]>([])
  const [loading, setLoading] = useState(true)
  
  // פילטרים
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paid' | 'overdue'>('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'balance' | 'guarantor'>('date')

  useEffect(() => {
    if (isOpen) {
      loadGuarantorDebts()
    }
  }, [isOpen])

  useEffect(() => {
    applyFiltersAndSort()
  }, [debts, statusFilter, paymentStatusFilter, searchTerm, sortBy])

  const loadGuarantorDebts = () => {
    setLoading(true)
    
    try {
      const allDebts = db.getGuarantorDebts()
      const allGuarantors = db.getGuarantors()
      const allBorrowers = db.getBorrowers()
      const allLoans = db.getLoans()

      const data: GuarantorDebtData[] = allDebts.map(debt => {
        const guarantor = allGuarantors.find(g => g.id === debt.guarantorId)!
        const originalBorrower = allBorrowers.find(b => b.id === debt.originalBorrowerId)!
        const originalLoan = allLoans.find(l => l.id === debt.originalLoanId)!
        const balance = db.getGuarantorDebtBalance(debt.id)
        const paid = debt.amount - balance

        let paymentStatus: 'paid' | 'partial' | 'unpaid'
        if (balance === 0) {
          paymentStatus = 'paid'
        } else if (paid > 0) {
          paymentStatus = 'partial'
        } else {
          paymentStatus = 'unpaid'
        }

        return {
          debt,
          guarantor,
          originalBorrower,
          originalLoan,
          balance,
          paid,
          paymentStatus
        }
      })

      setDebts(data)
    } catch (error) {
      console.error('שגיאה בטעינת דוח חובות ערבים:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFiltersAndSort = () => {
    let filtered = [...debts]

    // סינון לפי סטטוס חוב
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.debt.status === statusFilter)
    }

    // סינון לפי סטטוס תשלום
    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter(item => item.paymentStatus === paymentStatusFilter)
    }

    // חיפוש טקסט
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(item => {
        const guarantorName = `${item.guarantor.firstName} ${item.guarantor.lastName}`.toLowerCase()
        const borrowerName = `${item.originalBorrower.firstName} ${item.originalBorrower.lastName}`.toLowerCase()
        
        return guarantorName.includes(term) || borrowerName.includes(term)
      })
    }

    // מיון
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.debt.transferDate).getTime() - new Date(a.debt.transferDate).getTime()
        case 'amount':
          return b.debt.amount - a.debt.amount
        case 'balance':
          return b.balance - a.balance
        case 'guarantor':
          const nameA = `${a.guarantor.firstName} ${a.guarantor.lastName}`
          const nameB = `${b.guarantor.firstName} ${b.guarantor.lastName}`
          return nameA.localeCompare(nameB, 'he')
        default:
          return 0
      }
    })

    setFilteredDebts(filtered)
  }

  const exportToCSV = () => {
    try {
      // כותרות
      const headers = [
        'מספר חוב',
        'ערב',
        'לווה מקורי',
        'הלוואה מקורית',
        'סכום חוב',
        'שולם',
        'יתרה',
        'סטטוס חוב',
        'סטטוס תשלום',
        'תאריך העברה',
        'סוג תשלום',
        'הערות'
      ]

      // נתונים
      const rows = filteredDebts.map(item => {
        const paymentStatusText = item.paymentStatus === 'paid' ? 'שולם במלואו' : 
                                  item.paymentStatus === 'partial' ? 'תשלום חלקי' : 'לא שולם'
        const debtStatusText = item.debt.status === 'paid' ? 'שולם' :
                              item.debt.status === 'overdue' ? 'באיחור' : 'פעיל'
        const paymentTypeText = item.debt.paymentType === 'single' ? 'תשלום אחד' : 'תשלומים'

        return [
          item.debt.id,
          `${item.guarantor.firstName} ${item.guarantor.lastName}`,
          `${item.originalBorrower.firstName} ${item.originalBorrower.lastName}`,
          `#${item.originalLoan.id} (₪${item.originalLoan.amount})`,
          item.debt.amount,
          item.paid,
          item.balance,
          debtStatusText,
          paymentStatusText,
          new Date(item.debt.transferDate).toLocaleDateString('he-IL'),
          paymentTypeText,
          item.debt.notes || ''
        ]
      })

      // יצירת CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      // הורדה
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `חובות-ערבים-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('שגיאה בייצוא:', error)
      alert('שגיאה בייצוא הדוח')
    }
  }

  // חישוב סטטיסטיקות
  const stats = {
    totalDebts: filteredDebts.length,
    totalAmount: filteredDebts.reduce((sum, item) => sum + item.debt.amount, 0),
    totalPaid: filteredDebts.reduce((sum, item) => sum + item.paid, 0),
    totalBalance: filteredDebts.reduce((sum, item) => sum + item.balance, 0),
    paidCount: filteredDebts.filter(item => item.paymentStatus === 'paid').length,
    partialCount: filteredDebts.filter(item => item.paymentStatus === 'partial').length,
    unpaidCount: filteredDebts.filter(item => item.paymentStatus === 'unpaid').length,
    overdueCount: filteredDebts.filter(item => item.debt.status === 'overdue').length
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10001,
      direction: 'rtl'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '30px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        width: '1200px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* כותרת */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h2 style={{ margin: 0, color: '#ea580c', fontSize: '24px' }}>
            🤝 דוח חובות ערבים
          </h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => exportToCSV()}
              style={{
                background: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              📥 ייצא ל-CSV
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '35px',
                height: '35px',
                fontSize: '18px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* סטטיסטיקות */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '25px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
            border: '2px solid #fb923c',
            borderRadius: '10px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ea580c' }}>
              {stats.totalDebts}
            </div>
            <div style={{ fontSize: '12px', color: '#c2410c', marginTop: '3px' }}>
              חובות ערבים
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            border: '2px solid #3b82f6',
            borderRadius: '10px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
              ₪{stats.totalAmount.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#1e40af', marginTop: '3px' }}>
              סכום כולל
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
            border: '2px solid #22c55e',
            borderRadius: '10px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
              ₪{stats.totalPaid.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#15803d', marginTop: '3px' }}>
              שולם
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: '2px solid #ef4444',
            borderRadius: '10px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
              ₪{stats.totalBalance.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '3px' }}>
              יתרה
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
            border: '2px solid #22c55e',
            borderRadius: '10px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
              {stats.paidCount}
            </div>
            <div style={{ fontSize: '12px', color: '#15803d', marginTop: '3px' }}>
              שולם במלואו
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '2px solid #f59e0b',
            borderRadius: '10px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d97706' }}>
              {stats.partialCount}
            </div>
            <div style={{ fontSize: '12px', color: '#92400e', marginTop: '3px' }}>
              תשלום חלקי
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: '2px solid #ef4444',
            borderRadius: '10px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
              {stats.unpaidCount}
            </div>
            <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '3px' }}>
              לא שולם
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: '2px solid #dc2626',
            borderRadius: '10px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#991b1b' }}>
              {stats.overdueCount}
            </div>
            <div style={{ fontSize: '12px', color: '#7f1d1d', marginTop: '3px' }}>
              באיחור
            </div>
          </div>
        </div>

        {/* פילטרים */}
        <div style={{
          background: '#f8fafc',
          border: '2px solid #e2e8f0',
          borderRadius: '10px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>
                סטטוס חוב:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '7px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px'
                }}
              >
                <option value="all">הכל</option>
                <option value="active">פעיל</option>
                <option value="paid">שולם</option>
                <option value="overdue">באיחור</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>
                סטטוס תשלום:
              </label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '7px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px'
                }}
              >
                <option value="all">הכל</option>
                <option value="paid">שולם במלואו</option>
                <option value="partial">תשלום חלקי</option>
                <option value="unpaid">לא שולם</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>
                מיון לפי:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '7px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px'
                }}
              >
                <option value="date">תאריך העברה</option>
                <option value="amount">סכום</option>
                <option value="balance">יתרה</option>
                <option value="guarantor">שם ערב</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>
                חיפוש:
              </label>
              <input
                type="text"
                placeholder="שם ערב או לווה..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>

          {(statusFilter !== 'all' || paymentStatusFilter !== 'all' || searchTerm || sortBy !== 'date') && (
            <button
              onClick={() => {
                setStatusFilter('all')
                setPaymentStatusFilter('all')
                setSearchTerm('')
                setSortBy('date')
              }}
              style={{
                marginTop: '10px',
                background: '#64748b',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              🔄 איפוס
            </button>
          )}
        </div>

        {/* תוכן */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>טוען נתונים...</p>
            </div>
          ) : filteredDebts.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#f0fdf4',
              borderRadius: '15px',
              border: '2px solid #86efac'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>📋</div>
              <h3 style={{ color: '#16a34a', margin: '0 0 10px 0' }}>אין תוצאות</h3>
              <p style={{ color: '#15803d', fontSize: '16px' }}>
                {debts.length === 0 
                  ? 'לא נמצאו חובות ערבים'
                  : 'לא נמצאו תוצאות התואמות לפילטרים שנבחרו'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredDebts.map(item => (
                <div
                  key={item.debt.id}
                  style={{
                    background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
                    border: '2px solid #fb923c',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 4px 10px rgba(251, 146, 60, 0.2)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    {/* פרטי חוב */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <h4 style={{ margin: 0, color: '#ea580c', fontSize: '17px' }}>
                          🤝 {item.guarantor.firstName} {item.guarantor.lastName}
                        </h4>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '5px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: item.debt.status === 'paid' ? '#dcfce7' : item.debt.status === 'overdue' ? '#fee2e2' : '#fef3c7',
                          color: item.debt.status === 'paid' ? '#166534' : item.debt.status === 'overdue' ? '#991b1b' : '#92400e'
                        }}>
                          {item.debt.status === 'paid' ? '✅ שולם' : item.debt.status === 'overdue' ? '⚠️ באיחור' : '⏳ פעיל'}
                        </span>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '5px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: item.paymentStatus === 'paid' ? '#dcfce7' : item.paymentStatus === 'partial' ? '#fef3c7' : '#fee2e2',
                          color: item.paymentStatus === 'paid' ? '#166534' : item.paymentStatus === 'partial' ? '#92400e' : '#991b1b'
                        }}>
                          {item.paymentStatus === 'paid' ? '💰 שולם במלואו' : item.paymentStatus === 'partial' ? '💵 תשלום חלקי' : '❌ לא שולם'}
                        </span>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: '10px',
                        background: 'rgba(255, 255, 255, 0.7)',
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '13px'
                      }}>
                        <div>
                          <strong style={{ color: '#9a3412' }}>לווה מקורי:</strong>
                          <div style={{ color: '#c2410c', marginTop: '2px' }}>
                            {item.originalBorrower.firstName} {item.originalBorrower.lastName}
                          </div>
                        </div>
                        <div>
                          <strong style={{ color: '#9a3412' }}>הלוואה מקורית:</strong>
                          <div style={{ color: '#c2410c', marginTop: '2px' }}>
                            #{item.originalLoan.id} | ₪{item.originalLoan.amount.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <strong style={{ color: '#9a3412' }}>סכום חוב:</strong>
                          <div style={{ color: '#c2410c', marginTop: '2px', fontSize: '15px', fontWeight: 'bold' }}>
                            ₪{item.debt.amount.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <strong style={{ color: '#9a3412' }}>שולם:</strong>
                          <div style={{ color: '#16a34a', marginTop: '2px', fontSize: '15px', fontWeight: 'bold' }}>
                            ₪{item.paid.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <strong style={{ color: '#9a3412' }}>יתרה:</strong>
                          <div style={{ color: '#dc2626', marginTop: '2px', fontSize: '15px', fontWeight: 'bold' }}>
                            ₪{item.balance.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <strong style={{ color: '#9a3412' }}>תאריך העברה:</strong>
                          <div style={{ color: '#c2410c', marginTop: '2px' }}>
                            {new Date(item.debt.transferDate).toLocaleDateString('he-IL')}
                          </div>
                        </div>
                      </div>

                      {/* תוכנית תשלומים */}
                      {item.debt.paymentType === 'installments' && item.debt.installmentDates && (
                        <div style={{
                          marginTop: '10px',
                          background: 'rgba(255, 255, 255, 0.5)',
                          padding: '10px',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}>
                          <strong style={{ color: '#9a3412' }}>📅 תוכנית תשלומים:</strong>
                          <div style={{ marginTop: '5px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {item.debt.installmentDates.map((date, index) => (
                              <span key={index} style={{
                                padding: '3px 8px',
                                background: 'white',
                                borderRadius: '4px',
                                border: '1px solid #fed7aa',
                                color: '#c2410c'
                              }}>
                                {index + 1}. ₪{item.debt.installmentAmount?.toFixed(2)} - {new Date(date).toLocaleDateString('he-IL')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* הערות */}
                      {item.debt.notes && (
                        <div style={{
                          marginTop: '10px',
                          padding: '8px',
                          background: 'rgba(255, 255, 255, 0.5)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: '#9a3412',
                          fontStyle: 'italic'
                        }}>
                          💬 {item.debt.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GuarantorDebtsReport
