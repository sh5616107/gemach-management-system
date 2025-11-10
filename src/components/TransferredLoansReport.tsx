import { useState, useEffect } from 'react'
import { db, DatabaseLoan, DatabaseBorrower, DatabaseGuarantor, DatabaseGuarantorDebt } from '../database/database'

interface TransferredLoansReportProps {
  isOpen: boolean
  onClose: () => void
}

interface TransferredLoanData {
  loan: DatabaseLoan
  borrower: DatabaseBorrower
  guarantorDebts: Array<{
    debt: DatabaseGuarantorDebt
    guarantor: DatabaseGuarantor
    balance: number
  }>
  totalAmount: number
  totalPaid: number
  totalBalance: number
}

function TransferredLoansReport({ isOpen, onClose }: TransferredLoansReportProps) {
  const [transferredLoans, setTransferredLoans] = useState<TransferredLoanData[]>([])
  const [filteredLoans, setFilteredLoans] = useState<TransferredLoanData[]>([])
  const [loading, setLoading] = useState(true)
  
  // פילטרים
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paid' | 'overdue'>('all')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadTransferredLoans()
    }
  }, [isOpen])

  useEffect(() => {
    applyFilters()
  }, [transferredLoans, statusFilter, dateFromFilter, dateToFilter, searchTerm])

  const loadTransferredLoans = () => {
    setLoading(true)
    
    try {
      const allLoans = db.getLoans().filter(l => l.transferredToGuarantors)
      const allBorrowers = db.getBorrowers()
      const allGuarantors = db.getGuarantors()
      const allGuarantorDebts = db.getGuarantorDebts()

      const data: TransferredLoanData[] = allLoans.map(loan => {
        const borrower = allBorrowers.find(b => b.id === loan.borrowerId)!
        const debts = allGuarantorDebts.filter(d => d.originalLoanId === loan.id)
        
        const guarantorDebts = debts.map(debt => {
          const guarantor = allGuarantors.find(g => g.id === debt.guarantorId)!
          const balance = db.getGuarantorDebtBalance(debt.id)
          
          return {
            debt,
            guarantor,
            balance
          }
        })

        const totalAmount = debts.reduce((sum, d) => sum + d.amount, 0)
        const totalBalance = guarantorDebts.reduce((sum, gd) => sum + gd.balance, 0)
        const totalPaid = totalAmount - totalBalance

        return {
          loan,
          borrower,
          guarantorDebts,
          totalAmount,
          totalPaid,
          totalBalance
        }
      })

      // מיין לפי תאריך העברה (החדשים ראשון)
      data.sort((a, b) => {
        const dateA = new Date(a.loan.transferDate || 0).getTime()
        const dateB = new Date(b.loan.transferDate || 0).getTime()
        return dateB - dateA
      })

      setTransferredLoans(data)
    } catch (error) {
      console.error('שגיאה בטעינת דוח הלוואות מועברות:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...transferredLoans]

    // סינון לפי סטטוס
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => {
        const hasStatus = item.guarantorDebts.some(gd => gd.debt.status === statusFilter)
        return hasStatus
      })
    }

    // סינון לפי תאריך
    if (dateFromFilter) {
      const fromDate = new Date(dateFromFilter)
      filtered = filtered.filter(item => {
        const transferDate = new Date(item.loan.transferDate || 0)
        return transferDate >= fromDate
      })
    }

    if (dateToFilter) {
      const toDate = new Date(dateToFilter)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(item => {
        const transferDate = new Date(item.loan.transferDate || 0)
        return transferDate <= toDate
      })
    }

    // חיפוש טקסט
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(item => {
        const borrowerName = `${item.borrower.firstName} ${item.borrower.lastName}`.toLowerCase()
        const guarantorNames = item.guarantorDebts.map(gd => 
          `${gd.guarantor.firstName} ${gd.guarantor.lastName}`.toLowerCase()
        ).join(' ')
        
        return borrowerName.includes(term) || guarantorNames.includes(term)
      })
    }

    setFilteredLoans(filtered)
  }

  const exportToCSV = () => {
    try {
      // כותרות
      const headers = [
        'מספר הלוואה',
        'לווה מקורי',
        'סכום מקורי',
        'סכום מועבר',
        'שולם',
        'יתרה',
        'תאריך העברה',
        'הועבר על ידי',
        'ערבים',
        'הערות'
      ]

      // נתונים
      const rows = filteredLoans.map(item => {
        const guarantorNames = item.guarantorDebts.map(gd => 
          `${gd.guarantor.firstName} ${gd.guarantor.lastName} (₪${gd.debt.amount})`
        ).join('; ')

        return [
          item.loan.id,
          `${item.borrower.firstName} ${item.borrower.lastName}`,
          item.loan.amount,
          item.totalAmount,
          item.totalPaid,
          item.totalBalance,
          item.loan.transferDate ? new Date(item.loan.transferDate).toLocaleDateString('he-IL') : '',
          item.loan.transferredBy || '',
          guarantorNames,
          item.loan.transferNotes || ''
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
      link.download = `הלוואות-מועברות-${new Date().toISOString().split('T')[0]}.csv`
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
    totalLoans: filteredLoans.length,
    totalAmount: filteredLoans.reduce((sum, item) => sum + item.totalAmount, 0),
    totalPaid: filteredLoans.reduce((sum, item) => sum + item.totalPaid, 0),
    totalBalance: filteredLoans.reduce((sum, item) => sum + item.totalBalance, 0),
    totalGuarantors: filteredLoans.reduce((sum, item) => sum + item.guarantorDebts.length, 0)
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
          <h2 style={{ margin: 0, color: '#7c3aed', fontSize: '24px' }}>
            📊 דוח הלוואות מועברות לערבים
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '25px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
            border: '2px solid #a855f7',
            borderRadius: '10px',
            padding: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#7c3aed' }}>
              {stats.totalLoans}
            </div>
            <div style={{ fontSize: '13px', color: '#6b21a8', marginTop: '5px' }}>
              הלוואות מועברות
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            border: '2px solid #3b82f6',
            borderRadius: '10px',
            padding: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb' }}>
              ₪{stats.totalAmount.toLocaleString()}
            </div>
            <div style={{ fontSize: '13px', color: '#1e40af', marginTop: '5px' }}>
              סכום כולל
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
            border: '2px solid #22c55e',
            borderRadius: '10px',
            padding: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a' }}>
              ₪{stats.totalPaid.toLocaleString()}
            </div>
            <div style={{ fontSize: '13px', color: '#15803d', marginTop: '5px' }}>
              שולם
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: '2px solid #ef4444',
            borderRadius: '10px',
            padding: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc2626' }}>
              ₪{stats.totalBalance.toLocaleString()}
            </div>
            <div style={{ fontSize: '13px', color: '#991b1b', marginTop: '5px' }}>
              יתרה
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
            border: '2px solid #fb923c',
            borderRadius: '10px',
            padding: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ea580c' }}>
              {stats.totalGuarantors}
            </div>
            <div style={{ fontSize: '13px', color: '#c2410c', marginTop: '5px' }}>
              ערבים מעורבים
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>
                סטטוס:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px'
                }}
              >
                <option value="all">הכל</option>
                <option value="active">פעיל</option>
                <option value="paid">שולם</option>
                <option value="overdue">באיחור</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>
                מתאריך:
              </label>
              <input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>
                עד תאריך:
              </label>
              <input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>
                חיפוש:
              </label>
              <input
                type="text"
                placeholder="שם לווה או ערב..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {(statusFilter !== 'all' || dateFromFilter || dateToFilter || searchTerm) && (
            <button
              onClick={() => {
                setStatusFilter('all')
                setDateFromFilter('')
                setDateToFilter('')
                setSearchTerm('')
              }}
              style={{
                marginTop: '10px',
                background: '#64748b',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              🔄 נקה פילטרים
            </button>
          )}
        </div>

        {/* תוכן */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>טוען נתונים...</p>
            </div>
          ) : filteredLoans.length === 0 ? (
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
                {transferredLoans.length === 0 
                  ? 'לא נמצאו הלוואות שהועברו לערבים'
                  : 'לא נמצאו תוצאות התואמות לפילטרים שנבחרו'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {filteredLoans.map(item => (
                <div
                  key={item.loan.id}
                  style={{
                    background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                    border: '2px solid #a855f7',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 4px 10px rgba(168, 85, 247, 0.2)'
                  }}
                >
                  {/* כותרת הלוואה */}
                  <div style={{ marginBottom: '15px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#7c3aed', fontSize: '18px' }}>
                      🔄 הלוואה #{item.loan.id} - {item.borrower.firstName} {item.borrower.lastName}
                    </h4>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                      gap: '10px', 
                      fontSize: '14px',
                      background: 'rgba(255, 255, 255, 0.7)',
                      padding: '12px',
                      borderRadius: '8px'
                    }}>
                      <div>
                        <strong style={{ color: '#6b21a8' }}>סכום מקורי:</strong>
                        <div style={{ color: '#7c3aed', marginTop: '2px' }}>₪{item.loan.amount.toLocaleString()}</div>
                      </div>
                      <div>
                        <strong style={{ color: '#6b21a8' }}>סכום מועבר:</strong>
                        <div style={{ color: '#7c3aed', marginTop: '2px' }}>₪{item.totalAmount.toLocaleString()}</div>
                      </div>
                      <div>
                        <strong style={{ color: '#6b21a8' }}>שולם:</strong>
                        <div style={{ color: '#16a34a', marginTop: '2px', fontWeight: 'bold' }}>₪{item.totalPaid.toLocaleString()}</div>
                      </div>
                      <div>
                        <strong style={{ color: '#6b21a8' }}>יתרה:</strong>
                        <div style={{ color: '#dc2626', marginTop: '2px', fontWeight: 'bold' }}>₪{item.totalBalance.toLocaleString()}</div>
                      </div>
                      <div>
                        <strong style={{ color: '#6b21a8' }}>תאריך העברה:</strong>
                        <div style={{ color: '#7c3aed', marginTop: '2px' }}>
                          {item.loan.transferDate ? new Date(item.loan.transferDate).toLocaleDateString('he-IL') : '-'}
                        </div>
                      </div>
                      <div>
                        <strong style={{ color: '#6b21a8' }}>הועבר על ידי:</strong>
                        <div style={{ color: '#7c3aed', marginTop: '2px' }}>{item.loan.transferredBy || '-'}</div>
                      </div>
                    </div>
                  </div>

                  {/* ערבים */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    padding: '12px',
                    borderRadius: '8px'
                  }}>
                    <strong style={{ color: '#6b21a8', fontSize: '14px' }}>🤝 ערבים שחויבו ({item.guarantorDebts.length}):</strong>
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {item.guarantorDebts.map(({ debt, guarantor, balance }) => (
                        <div key={debt.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 12px',
                          background: 'white',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 'bold', fontSize: '15px' }}>
                              {guarantor.firstName} {guarantor.lastName}
                            </span>
                            <span style={{
                              marginRight: '10px',
                              padding: '3px 10px',
                              borderRadius: '5px',
                              fontSize: '12px',
                              background: debt.status === 'paid' ? '#dcfce7' : debt.status === 'overdue' ? '#fee2e2' : '#fef3c7',
                              color: debt.status === 'paid' ? '#166534' : debt.status === 'overdue' ? '#991b1b' : '#92400e',
                              fontWeight: 'bold'
                            }}>
                              {debt.status === 'paid' ? '✅ שולם' : debt.status === 'overdue' ? '⚠️ באיחור' : '⏳ פעיל'}
                            </span>
                          </div>
                          <div style={{ fontSize: '14px', textAlign: 'left' }}>
                            <div style={{ color: '#6b7280' }}>
                              סכום: <strong>₪{debt.amount.toLocaleString()}</strong>
                            </div>
                            {balance > 0 && (
                              <div style={{ color: '#dc2626', fontWeight: 'bold', marginTop: '2px' }}>
                                יתרה: ₪{balance.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* הערות */}
                  {item.loan.transferNotes && (
                    <div style={{
                      marginTop: '12px',
                      padding: '10px',
                      background: 'rgba(255, 255, 255, 0.5)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#6b21a8',
                      fontStyle: 'italic'
                    }}>
                      💬 {item.loan.transferNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TransferredLoansReport
