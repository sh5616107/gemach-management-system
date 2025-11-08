import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, DatabaseLoan, DatabaseBorrower, DatabaseGuarantor } from '../database/database'
import LoanTransferModal from '../components/LoanTransferModal'

interface OverdueLoan {
  loan: DatabaseLoan
  borrower: DatabaseBorrower
  guarantors: DatabaseGuarantor[]
  daysOverdue: number
  balance: number
}

function OverdueLoansPage() {
  const navigate = useNavigate()
  const [overdueLoans, setOverdueLoans] = useState<OverdueLoan[]>([])
  const [loading, setLoading] = useState(true)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedOverdueLoan, setSelectedOverdueLoan] = useState<OverdueLoan | null>(null)

  useEffect(() => {
    loadOverdueLoans()
  }, [])

  const loadOverdueLoans = () => {
    setLoading(true)
    
    try {
      const allLoans = db.getLoans()
      const allBorrowers = db.getBorrowers()
      const allGuarantors = db.getGuarantors()
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const overdue: OverdueLoan[] = []

      for (const loan of allLoans) {
        // סנן הלוואות שתאריך הפירעון שלהן עבר
        const returnDate = new Date(loan.returnDate)
        returnDate.setHours(0, 0, 0, 0)
        
        if (returnDate >= today) {
          continue // תאריך הפירעון עדיין לא עבר
        }

        // סנן הלוואות שלא סומנו כ-transferredToGuarantors
        if (loan.transferredToGuarantors) {
          continue // כבר הועברה לערבים
        }

        // חשב יתרה לכל הלוואה
        const balance = db.getLoanBalance(loan.id)
        
        // סנן רק הלוואות עם יתרה חיובית
        if (balance <= 0) {
          continue // ההלוואה נפרעה במלואה
        }

        // חשב ימי איחור
        const diffTime = today.getTime() - returnDate.getTime()
        const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        // מצא את הלווה
        const borrower = allBorrowers.find(b => b.id === loan.borrowerId)
        if (!borrower) continue

        // מצא את הערבים
        const guarantors: DatabaseGuarantor[] = []
        if (loan.guarantor1Id) {
          const g1 = allGuarantors.find(g => g.id === loan.guarantor1Id)
          if (g1) guarantors.push(g1)
        }
        if (loan.guarantor2Id) {
          const g2 = allGuarantors.find(g => g.id === loan.guarantor2Id)
          if (g2) guarantors.push(g2)
        }

        overdue.push({
          loan,
          borrower,
          guarantors,
          daysOverdue,
          balance
        })
      }

      // מיין לפי ימי איחור (הכי דחוף ראשון)
      overdue.sort((a, b) => b.daysOverdue - a.daysOverdue)

      setOverdueLoans(overdue)
    } catch (error) {
      console.error('שגיאה בטעינת הלוואות שפג תוקפן:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container" style={{ direction: 'rtl' }}>
      <header className="header">
        <h1>⏰ הלוואות שפג תוקפן</h1>
        <button className="close-btn" onClick={() => navigate('/')}>×</button>
      </header>

      <div className="page-header">
        <p style={{ color: '#666', fontSize: '16px', marginTop: '10px' }}>
          ריכוז הלוואות שעבר מועד הפירעון שלהן - ניהול והעברה לאחריות הערבים
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>טוען הלוואות...</p>
        </div>
      ) : overdueLoans.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#f0fdf4',
          borderRadius: '15px',
          border: '2px solid #86efac'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
          <h2 style={{ color: '#16a34a', margin: '0 0 10px 0' }}>אין הלוואות שפג תוקפן!</h2>
          <p style={{ color: '#15803d', fontSize: '16px' }}>
            כל ההלוואות במצב תקין או כבר הועברו לערבים
          </p>
        </div>
      ) : (
        <div>
          <div style={{
            background: '#fef2f2',
            border: '2px solid #fca5a5',
            borderRadius: '10px',
            padding: '15px 20px',
            marginBottom: '25px'
          }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#dc2626' }}>
              ⚠️ נמצאו {overdueLoans.length} הלוואות שפג תוקפן
            </h3>
            <p style={{ margin: 0, color: '#991b1b', fontSize: '14px' }}>
              הלוואות אלו דורשות טיפול מיידי - ניתן להעביר לאחריות הערבים
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {overdueLoans.map(({ loan, borrower, guarantors, daysOverdue, balance }) => (
              <div
                key={loan.id}
                style={{
                  background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                  border: '2px solid #ef4444',
                  borderRadius: '15px',
                  padding: '20px',
                  boxShadow: '0 4px 10px rgba(239, 68, 68, 0.2)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#dc2626', fontSize: '20px' }}>
                      👤 {borrower.firstName} {borrower.lastName}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '14px' }}>
                      <div>
                        <strong style={{ color: '#7f1d1d' }}>סכום הלוואה:</strong>
                        <span style={{ marginRight: '8px', color: '#991b1b' }}>₪{loan.amount.toLocaleString()}</span>
                      </div>
                      <div>
                        <strong style={{ color: '#7f1d1d' }}>יתרה:</strong>
                        <span style={{ marginRight: '8px', color: '#991b1b', fontWeight: 'bold' }}>₪{balance.toLocaleString()}</span>
                      </div>
                      <div>
                        <strong style={{ color: '#7f1d1d' }}>תאריך פירעון:</strong>
                        <span style={{ marginRight: '8px', color: '#991b1b' }}>
                          {new Date(loan.returnDate).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                      <div>
                        <strong style={{ color: '#7f1d1d' }}>ימי איחור:</strong>
                        <span style={{ 
                          marginRight: '8px', 
                          color: '#dc2626', 
                          fontWeight: 'bold',
                          fontSize: '16px'
                        }}>
                          {daysOverdue} ימים
                        </span>
                      </div>
                    </div>

                    {guarantors.length > 0 && (
                      <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '8px' }}>
                        <strong style={{ color: '#7f1d1d', fontSize: '14px' }}>🤝 ערבים:</strong>
                        <div style={{ marginTop: '5px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                          {guarantors.map(g => (
                            <span key={g.id} style={{ 
                              color: '#991b1b', 
                              fontSize: '14px',
                              padding: '4px 10px',
                              background: 'white',
                              borderRadius: '5px',
                              border: '1px solid #fca5a5'
                            }}>
                              {g.firstName} {g.lastName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedOverdueLoan({ loan, borrower, guarantors, daysOverdue, balance })
                      setShowTransferModal(true)
                    }}
                    style={{
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      marginRight: '20px',
                      boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#b91c1c'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#dc2626'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.3)'
                    }}
                  >
                    🔄 העבר לערבים
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="back-btn" onClick={() => navigate('/')}>
        🏠
      </button>

      {/* מודל העברה לערבים */}
      {showTransferModal && selectedOverdueLoan && (
        <LoanTransferModal
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false)
            setSelectedOverdueLoan(null)
          }}
          loan={selectedOverdueLoan.loan}
          borrower={selectedOverdueLoan.borrower}
          guarantors={selectedOverdueLoan.guarantors}
          onTransferComplete={() => {
            loadOverdueLoans() // רענן את הרשימה
          }}
        />
      )}
    </div>
  )
}

export default OverdueLoansPage
