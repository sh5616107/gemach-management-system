import { DatabaseGuarantorDebt, db } from '../database/database'

interface GuarantorDebtCardProps {
  debt: DatabaseGuarantorDebt
  onPaymentClick: (debt: DatabaseGuarantorDebt) => void
}

function GuarantorDebtCard({ debt, onPaymentClick }: GuarantorDebtCardProps) {
  // טען נתונים נוספים
  const originalLoan = db.getLoans().find(l => l.id === debt.originalLoanId)
  const originalBorrower = db.getBorrowers().find(b => b.id === debt.originalBorrowerId)
  const guarantor = db.getGuarantors().find(g => g.id === debt.guarantorId)
  const balance = db.getGuarantorDebtBalance(debt.id)

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
      border: '2px solid #fb923c',
      borderRadius: '15px',
      padding: '20px',
      marginBottom: '15px',
      boxShadow: '0 4px 10px rgba(251, 146, 60, 0.2)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px' }}>🤝</span>
            <h3 style={{ margin: 0, color: '#ea580c', fontSize: '18px' }}>
              חוב ערב - {guarantor ? `${guarantor.firstName} ${guarantor.lastName}` : 'לא ידוע'}
            </h3>
            <span style={{
              background: debt.status === 'paid' ? '#22c55e' : debt.status === 'overdue' ? '#dc2626' : '#f59e0b',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 'bold'
            }}>
              {debt.status === 'paid' ? '✅ שולם' : debt.status === 'overdue' ? '⚠️ באיחור' : '⏳ פעיל'}
            </span>
          </div>

          <div style={{ 
            background: 'rgba(255, 255, 255, 0.7)', 
            padding: '12px', 
            borderRadius: '8px',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '14px' }}>
              <div>
                <strong style={{ color: '#9a3412' }}>לווה מקורי:</strong>
                <div style={{ color: '#c2410c', marginTop: '2px' }}>
                  {originalBorrower ? `${originalBorrower.firstName} ${originalBorrower.lastName}` : 'לא ידוע'}
                </div>
              </div>
              <div>
                <strong style={{ color: '#9a3412' }}>סכום חוב:</strong>
                <div style={{ color: '#c2410c', marginTop: '2px', fontSize: '16px', fontWeight: 'bold' }}>
                  ₪{debt.amount.toLocaleString()}
                </div>
              </div>
              <div>
                <strong style={{ color: '#9a3412' }}>יתרה:</strong>
                <div style={{ color: '#c2410c', marginTop: '2px', fontSize: '16px', fontWeight: 'bold' }}>
                  ₪{balance.toLocaleString()}
                </div>
              </div>
              <div>
                <strong style={{ color: '#9a3412' }}>תאריך העברה:</strong>
                <div style={{ color: '#c2410c', marginTop: '2px' }}>
                  {new Date(debt.transferDate).toLocaleDateString('he-IL')}
                </div>
              </div>
            </div>
          </div>

          {/* קישור להלוואה המקורית */}
          {originalLoan && (
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.5)', 
              padding: '8px 12px', 
              borderRadius: '6px',
              fontSize: '13px',
              color: '#9a3412',
              marginBottom: '12px'
            }}>
              <strong>הלוואה מקורית:</strong> #{originalLoan.id} | 
              סכום: ₪{originalLoan.amount.toLocaleString()} | 
              תאריך פירעון: {new Date(originalLoan.returnDate).toLocaleDateString('he-IL')}
            </div>
          )}

          {/* תוכנית תשלומים */}
          {debt.paymentType === 'installments' && debt.installmentDates && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.7)',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '12px'
            }}>
              <strong style={{ color: '#9a3412', fontSize: '14px' }}>📅 תוכנית תשלומים:</strong>
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {debt.installmentDates.map((date, index) => (
                  <div key={index} style={{ 
                    fontSize: '13px', 
                    color: '#c2410c',
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 8px',
                    background: 'rgba(255, 255, 255, 0.5)',
                    borderRadius: '4px'
                  }}>
                    <span>תשלום {index + 1}:</span>
                    <span>₪{debt.installmentAmount?.toFixed(2)} - {new Date(date).toLocaleDateString('he-IL')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* הערות */}
          {debt.notes && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.5)',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#9a3412',
              fontStyle: 'italic'
            }}>
              💬 {debt.notes}
            </div>
          )}
        </div>

        {/* כפתור רישום פרעון */}
        {balance > 0 && (
          <button
            onClick={() => onPaymentClick(debt)}
            style={{
              background: '#ea580c',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              marginRight: '15px',
              boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#c2410c'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ea580c'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            💰 רשום פרעון
          </button>
        )}
      </div>
    </div>
  )
}

export default GuarantorDebtCard
