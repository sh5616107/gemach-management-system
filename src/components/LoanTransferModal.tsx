import { useState, useEffect } from 'react'
import { db, DatabaseLoan, DatabaseBorrower, DatabaseGuarantor } from '../database/database'

interface LoanTransferModalProps {
  isOpen: boolean
  onClose: () => void
  loan: DatabaseLoan
  borrower: DatabaseBorrower
  guarantors: DatabaseGuarantor[]
  onTransferComplete: () => void
}

type TransferStep = 'select-guarantors' | 'split-amount' | 'payment-terms' | 'confirm'

function LoanTransferModal({ 
  isOpen, 
  onClose, 
  loan, 
  borrower, 
  guarantors,
  onTransferComplete 
}: LoanTransferModalProps) {
  const [currentStep, setCurrentStep] = useState<TransferStep>('select-guarantors')
  const [selectedGuarantorIds, setSelectedGuarantorIds] = useState<number[]>([])
  const [guarantorSplits, setGuarantorSplits] = useState<Map<number, number>>(new Map())
  
  // תנאי תשלום לכל ערב בנפרד
  const [guarantorPaymentTerms, setGuarantorPaymentTerms] = useState<Map<number, {
    paymentType: 'single' | 'installments'
    installmentsCount: number
    installmentDates: string[]
  }>>(new Map())
  
  // תנאי תשלום גלובליים (לתאימות לאחור - כרגע משמש לכל הערבים)
  const [paymentType, setPaymentType] = useState<'single' | 'installments'>('single')
  const [installmentsCount, setInstallmentsCount] = useState(3)
  const [installmentDates, setInstallmentDates] = useState<string[]>([])
  
  const [transferNotes, setTransferNotes] = useState('')

  // חישוב יתרת ההלוואה
  const balance = isOpen ? db.getLoanBalance(loan.id) : 0

  // פונקציה להצגת הודעות
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const colors = {
      success: '#27ae60',
      error: '#e74c3c',
      info: '#3498db'
    }

    const notification = document.createElement('div')
    notification.innerHTML = message
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10002;
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

  // איפוס כשנפתח המודל
  useEffect(() => {
    if (isOpen) {
      // אם יש רק ערב אחד, דלג ישר לשלב תנאי התשלום
      if (guarantors.length === 1) {
        setCurrentStep('payment-terms')
        setSelectedGuarantorIds([guarantors[0].id])
        const splits = new Map<number, number>()
        splits.set(guarantors[0].id, balance)
        setGuarantorSplits(splits)
        
        // אתחל תנאי תשלום לערב היחיד
        const terms = new Map()
        terms.set(guarantors[0].id, {
          paymentType: 'single' as const,
          installmentsCount: 3,
          installmentDates: []
        })
        setGuarantorPaymentTerms(terms)
      } else {
        setCurrentStep('select-guarantors')
        setSelectedGuarantorIds([])
        setGuarantorSplits(new Map())
        setGuarantorPaymentTerms(new Map())
      }
      setPaymentType('single')
      setInstallmentsCount(3)
      setInstallmentDates([])
      setTransferNotes('')
    }
  }, [isOpen, guarantors, balance])

  // אתחול תנאי תשלום כשעוברים לשלב payment-terms
  useEffect(() => {
    if (currentStep === 'payment-terms' && selectedGuarantorIds.length > 0) {
      // אתחל תנאי תשלום לכל ערב שנבחר אם עדיין לא קיים
      const newTerms = new Map(guarantorPaymentTerms)
      let hasChanges = false
      
      for (const guarantorId of selectedGuarantorIds) {
        if (!newTerms.has(guarantorId)) {
          newTerms.set(guarantorId, {
            paymentType: 'single',
            installmentsCount: 3,
            installmentDates: []
          })
          hasChanges = true
        }
      }
      
      if (hasChanges) {
        setGuarantorPaymentTerms(newTerms)
      }
    }
  }, [currentStep, selectedGuarantorIds])

  // חישוב חלוקה אוטומטית
  const calculateEqualSplit = () => {
    if (selectedGuarantorIds.length === 0) return

    const count = selectedGuarantorIds.length
    const baseAmount = Math.floor((balance * 100) / count) / 100 // עיגול לאגורה
    const remainder = Math.round((balance - (baseAmount * count)) * 100) / 100

    const newSplits = new Map<number, number>()
    selectedGuarantorIds.forEach((id, index) => {
      // הערב הראשון מקבל את ההפרש
      newSplits.set(id, index === 0 ? baseAmount + remainder : baseAmount)
    })

    setGuarantorSplits(newSplits)
  }

  // חישוב חלוקה אוטומטית כשעוברים לשלב חלוקת סכומים
  useEffect(() => {
    if (currentStep === 'split-amount' && selectedGuarantorIds.length > 0) {
      calculateEqualSplit()
    }
  }, [currentStep, selectedGuarantorIds])

  // עדכון סכום ידני לערב
  const updateGuarantorAmount = (guarantorId: number, amount: number) => {
    const newSplits = new Map(guarantorSplits)
    newSplits.set(guarantorId, amount)
    setGuarantorSplits(newSplits)
  }

  // חישוב סכום כולל
  const getTotalSplit = (): number => {
    return Array.from(guarantorSplits.values()).reduce((sum, amount) => sum + amount, 0)
  }

  // ביצוע ההעברה
  const executeTransfer = () => {
    try {
      // הכנת נתוני תשלומים לכל ערב
      const guarantorPaymentData = new Map<number, {
        paymentType: 'single' | 'installments'
        installmentsCount?: number
        installmentAmount?: number
        installmentDates: string[]
      }>()

      for (const guarantorId of selectedGuarantorIds) {
        const terms = guarantorPaymentTerms.get(guarantorId)
        const amount = guarantorSplits.get(guarantorId) || 0
        
        if (terms) {
          guarantorPaymentData.set(guarantorId, {
            paymentType: terms.paymentType,
            installmentsCount: terms.paymentType === 'installments' ? terms.installmentsCount : undefined,
            installmentAmount: terms.paymentType === 'installments' ? amount / terms.installmentsCount : undefined,
            installmentDates: terms.installmentDates
          })
        }
      }

      // קריאה למתודת ההעברה
      const result = db.transferLoanToGuarantorsWithIndividualTerms(
        loan.id,
        guarantorSplits,
        guarantorPaymentData,
        'מנהל', // TODO: להוסיף ניהול משתמשים בעתיד
        transferNotes
      )

      if (result.success) {
        showNotification(`✅ ${result.message}`, 'success')
        onTransferComplete()
        onClose()
      } else {
        showNotification(`❌ ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('שגיאה בביצוע העברה:', error)
      showNotification('❌ שגיאה בביצוע ההעברה', 'error')
    }
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
        maxWidth: '700px',
        maxHeight: '90vh',
        width: '90%',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#dc2626' }}>🔄 העברת הלוואה לערבים</h2>
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
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>

        {/* פרטי הלוואה */}
        <div style={{
          background: '#fef2f2',
          padding: '15px',
          borderRadius: '10px',
          marginBottom: '25px',
          border: '2px solid #fca5a5'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#dc2626' }}>
            👤 {borrower.firstName} {borrower.lastName}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
            <div><strong>סכום הלוואה:</strong> ₪{loan.amount.toLocaleString()}</div>
            <div><strong>יתרה:</strong> ₪{balance.toLocaleString()}</div>
            <div><strong>תאריך פירעון:</strong> {new Date(loan.returnDate).toLocaleDateString('he-IL')}</div>
            <div><strong>ערבים:</strong> {guarantors.length}</div>
          </div>
        </div>

        {/* תוכן המודל לפי שלב */}
        <div style={{ minHeight: '300px' }}>
          {currentStep === 'select-guarantors' && (
            <div>
              <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>שלב 1: בחירת ערבים</h3>
              
              {guarantors.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  background: '#fff3cd',
                  borderRadius: '10px',
                  border: '2px solid #ffc107'
                }}>
                  <p style={{ color: '#856404', fontSize: '16px' }}>
                    ⚠️ אין ערבים להלוואה זו
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#2c3e50' }}>
                      בחר אפשרות:
                    </label>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <button
                        onClick={() => {
                          setSelectedGuarantorIds([])
                        }}
                        style={{
                          flex: 1,
                          padding: '15px',
                          border: selectedGuarantorIds.length === 0 ? '3px solid #3498db' : '2px solid #ddd',
                          borderRadius: '10px',
                          background: selectedGuarantorIds.length === 0 ? '#e3f2fd' : 'white',
                          cursor: 'pointer',
                          fontSize: '15px',
                          fontWeight: selectedGuarantorIds.length === 0 ? 'bold' : 'normal'
                        }}
                      >
                        👤 ערב אחד
                      </button>
                      <button
                        onClick={() => {
                          setSelectedGuarantorIds(guarantors.map(g => g.id))
                        }}
                        style={{
                          flex: 1,
                          padding: '15px',
                          border: selectedGuarantorIds.length === guarantors.length && guarantors.length > 0 ? '3px solid #3498db' : '2px solid #ddd',
                          borderRadius: '10px',
                          background: selectedGuarantorIds.length === guarantors.length && guarantors.length > 0 ? '#e3f2fd' : 'white',
                          cursor: 'pointer',
                          fontSize: '15px',
                          fontWeight: selectedGuarantorIds.length === guarantors.length && guarantors.length > 0 ? 'bold' : 'normal'
                        }}
                      >
                        👥 כל הערבים ({guarantors.length})
                      </button>
                    </div>
                  </div>

                  {selectedGuarantorIds.length === 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#2c3e50' }}>
                        בחר ערב:
                      </label>
                      <select
                        onChange={(e) => {
                          const id = Number(e.target.value)
                          if (id) setSelectedGuarantorIds([id])
                        }}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '15px'
                        }}
                      >
                        <option value="">בחר ערב...</option>
                        {guarantors.map(g => {
                          const isBlacklisted = db.isBlacklisted('guarantor', g.id)
                          return (
                            <option key={g.id} value={g.id} disabled={isBlacklisted}>
                              {g.firstName} {g.lastName} {isBlacklisted ? '(ברשימה שחורה)' : ''}
                            </option>
                          )
                        })}
                      </select>
                    </div>
                  )}

                  {/* הצגת ערבים נבחרים */}
                  {selectedGuarantorIds.length > 0 && (
                    <div style={{
                      background: '#f0f9ff',
                      padding: '15px',
                      borderRadius: '10px',
                      border: '2px solid #bfdbfe'
                    }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>
                        ערבים שיחויבו:
                      </h4>
                      {selectedGuarantorIds.map(id => {
                        const guarantor = guarantors.find(g => g.id === id)
                        if (!guarantor) return null
                        const isBlacklisted = db.isBlacklisted('guarantor', id)
                        return (
                          <div key={id} style={{
                            padding: '10px',
                            background: isBlacklisted ? '#fee2e2' : 'white',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            border: isBlacklisted ? '2px solid #fca5a5' : '1px solid #e5e7eb'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 'bold' }}>
                                {guarantor.firstName} {guarantor.lastName}
                              </span>
                              {isBlacklisted && (
                                <span style={{
                                  background: '#dc2626',
                                  color: 'white',
                                  padding: '4px 10px',
                                  borderRadius: '5px',
                                  fontSize: '12px'
                                }}>
                                  🚫 ברשימה שחורה
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      {selectedGuarantorIds.some(id => db.isBlacklisted('guarantor', id)) && (
                        <div style={{
                          marginTop: '10px',
                          padding: '10px',
                          background: '#fef2f2',
                          borderRadius: '8px',
                          color: '#991b1b',
                          fontSize: '14px'
                        }}>
                          ⚠️ אזהרה: אחד או יותר מהערבים נמצאים ברשימה השחורה
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {currentStep === 'split-amount' && (
            <div>
              <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>שלב 2: חלוקת סכומים</h3>
              
              <div style={{
                background: '#f0f9ff',
                padding: '15px',
                borderRadius: '10px',
                marginBottom: '20px',
                border: '2px solid #bfdbfe'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#1e40af' }}>יתרת הלוואה:</strong>
                    <span style={{ marginRight: '10px', fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>
                      ₪{balance.toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={calculateEqualSplit}
                    style={{
                      background: '#3498db',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    🔄 חלוקה שווה
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                {selectedGuarantorIds.map(id => {
                  const guarantor = guarantors.find(g => g.id === id)
                  if (!guarantor) return null
                  const amount = guarantorSplits.get(id) || 0

                  return (
                    <div key={id} style={{
                      background: 'white',
                      padding: '15px',
                      borderRadius: '10px',
                      marginBottom: '12px',
                      border: '2px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
                        <div style={{ flex: 1 }}>
                          <strong style={{ color: '#2c3e50' }}>
                            {guarantor.firstName} {guarantor.lastName}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: '#666' }}>₪</span>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => updateGuarantorAmount(id, Number(e.target.value))}
                            step="0.01"
                            min="0"
                            max={balance}
                            style={{
                              width: '120px',
                              padding: '8px',
                              border: '2px solid #ddd',
                              borderRadius: '6px',
                              fontSize: '16px',
                              textAlign: 'left'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* סיכום */}
              <div style={{
                background: getTotalSplit() === balance ? '#f0fdf4' : '#fef2f2',
                padding: '15px',
                borderRadius: '10px',
                border: getTotalSplit() === balance ? '2px solid #86efac' : '2px solid #fca5a5'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: getTotalSplit() === balance ? '#16a34a' : '#dc2626' }}>
                    סכום כולל:
                  </strong>
                  <span style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: getTotalSplit() === balance ? '#16a34a' : '#dc2626'
                  }}>
                    ₪{getTotalSplit().toLocaleString()}
                  </span>
                </div>
                {getTotalSplit() !== balance && (
                  <div style={{ marginTop: '10px', color: '#dc2626', fontSize: '14px' }}>
                    ⚠️ הסכום הכולל חייב להיות שווה ליתרת ההלוואה (₪{balance.toLocaleString()})
                  </div>
                )}
              </div>
            </div>
          )}
          {currentStep === 'payment-terms' && (
            <div>
              <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>שלב 3: תנאי תשלום לכל ערב</h3>
              
              <div style={{ marginBottom: '15px', padding: '12px', background: '#e0f2fe', borderRadius: '8px', border: '2px solid #0ea5e9' }}>
                <p style={{ margin: 0, color: '#0c4a6e', fontSize: '14px' }}>
                  💡 <strong>הגדר תנאי תשלום נפרדים לכל ערב</strong> - כל ערב יכול לבחור בין תשלום אחד או תשלומים
                </p>
              </div>

              {selectedGuarantorIds.map((guarantorId) => {
                const guarantor = guarantors.find(g => g.id === guarantorId)
                const amount = guarantorSplits.get(guarantorId) || 0
                const terms = guarantorPaymentTerms.get(guarantorId) || {
                  paymentType: 'single',
                  installmentsCount: 3,
                  installmentDates: []
                }

                return (
                  <div key={guarantorId} style={{
                    background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
                    border: '2px solid #fb923c',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#ea580c', fontSize: '16px' }}>
                      🤝 {guarantor?.firstName} {guarantor?.lastName} - ₪{amount.toLocaleString()}
                    </h4>

                    {/* בחירת סוג תשלום */}
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#9a3412', fontSize: '14px' }}>
                        סוג תשלום:
                      </label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => {
                            const newTerms = new Map(guarantorPaymentTerms)
                            newTerms.set(guarantorId, {
                              ...terms,
                              paymentType: 'single',
                              installmentDates: []
                            })
                            setGuarantorPaymentTerms(newTerms)
                          }}
                          style={{
                            flex: 1,
                            padding: '12px',
                            border: terms.paymentType === 'single' ? '2px solid #ea580c' : '1px solid #ddd',
                            borderRadius: '8px',
                            background: terms.paymentType === 'single' ? '#fff7ed' : 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: terms.paymentType === 'single' ? 'bold' : 'normal'
                          }}
                        >
                          💰 תשלום אחד
                        </button>
                        <button
                          onClick={() => {
                            const newTerms = new Map(guarantorPaymentTerms)
                            // אתחל תאריכים
                            const dates: string[] = []
                            const today = new Date()
                            for (let i = 0; i < 3; i++) {
                              const date = new Date(today)
                              date.setMonth(date.getMonth() + i + 1)
                              dates.push(date.toISOString().split('T')[0])
                            }
                            newTerms.set(guarantorId, {
                              paymentType: 'installments',
                              installmentsCount: 3,
                              installmentDates: dates
                            })
                            setGuarantorPaymentTerms(newTerms)
                          }}
                          style={{
                            flex: 1,
                            padding: '12px',
                            border: terms.paymentType === 'installments' ? '2px solid #ea580c' : '1px solid #ddd',
                            borderRadius: '8px',
                            background: terms.paymentType === 'installments' ? '#fff7ed' : 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: terms.paymentType === 'installments' ? 'bold' : 'normal'
                          }}
                        >
                          📅 תשלומים
                        </button>
                      </div>
                    </div>

                    {/* תשלום אחד */}
                    {terms.paymentType === 'single' && (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.7)',
                        padding: '15px',
                        borderRadius: '8px'
                      }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#9a3412', fontSize: '14px' }}>
                          תאריך פירעון:
                        </label>
                        <input
                          type="date"
                          value={terms.installmentDates[0] || ''}
                          onChange={(e) => {
                            const newTerms = new Map(guarantorPaymentTerms)
                            newTerms.set(guarantorId, {
                              ...terms,
                              installmentDates: [e.target.value]
                            })
                            setGuarantorPaymentTerms(newTerms)
                          }}
                          min={new Date().toISOString().split('T')[0]}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '2px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    )}

                    {/* תשלומים */}
                    {terms.paymentType === 'installments' && (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.7)',
                        padding: '15px',
                        borderRadius: '8px'
                      }}>
                        <div style={{ marginBottom: '15px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#9a3412', fontSize: '14px' }}>
                            מספר תשלומים:
                          </label>
                          <input
                            type="number"
                            value={terms.installmentsCount}
                            onChange={(e) => {
                              const count = Math.max(2, Math.min(12, Number(e.target.value)))
                              const dates: string[] = []
                              const today = new Date()
                              for (let i = 0; i < count; i++) {
                                const date = new Date(today)
                                date.setMonth(date.getMonth() + i + 1)
                                dates.push(date.toISOString().split('T')[0])
                              }
                              const newTerms = new Map(guarantorPaymentTerms)
                              newTerms.set(guarantorId, {
                                paymentType: 'installments',
                                installmentsCount: count,
                                installmentDates: dates
                              })
                              setGuarantorPaymentTerms(newTerms)
                            }}
                            min="2"
                            max="12"
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '2px solid #ddd',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                          <div style={{ fontSize: '12px', color: '#9a3412', marginTop: '5px' }}>
                            סכום כל תשלום: ₪{(amount / terms.installmentsCount).toFixed(2)}
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#9a3412', fontSize: '14px' }}>
                            תאריכי פירעון:
                          </label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {Array.from({ length: terms.installmentsCount }).map((_, index) => (
                              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ minWidth: '80px', color: '#9a3412', fontSize: '13px' }}>
                                  תשלום {index + 1}:
                                </span>
                                <input
                                  type="date"
                                  value={terms.installmentDates[index] || ''}
                                  onChange={(e) => {
                                    const newDate = e.target.value
                                    const newDates = [...terms.installmentDates]
                                    
                                    // ולידציה
                                    if (newDate && newDates.some((d, i) => i !== index && d === newDate)) {
                                      showNotification('⚠️ לא ניתן להגדיר שני תשלומים באותו תאריך', 'error')
                                      return
                                    }
                                    
                                    if (index > 0 && newDate && newDates[index - 1]) {
                                      if (new Date(newDate) <= new Date(newDates[index - 1])) {
                                        showNotification('⚠️ כל תאריך חייב להיות מאוחר מהקודם', 'error')
                                        return
                                      }
                                    }
                                    
                                    if (index < newDates.length - 1 && newDate && newDates[index + 1]) {
                                      if (new Date(newDate) >= new Date(newDates[index + 1])) {
                                        showNotification('⚠️ כל תאריך חייב להיות מוקדם מהבא', 'error')
                                        return
                                      }
                                    }
                                    
                                    newDates[index] = newDate
                                    const newTerms = new Map(guarantorPaymentTerms)
                                    newTerms.set(guarantorId, {
                                      ...terms,
                                      installmentDates: newDates
                                    })
                                    setGuarantorPaymentTerms(newTerms)
                                  }}
                                  min={index === 0 ? new Date().toISOString().split('T')[0] : terms.installmentDates[index - 1] || new Date().toISOString().split('T')[0]}
                                  style={{
                                    flex: 1,
                                    padding: '8px',
                                    border: '2px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '13px'
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              <div style={{ marginTop: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#2c3e50' }}>
                  הערות (אופציונלי):
                </label>
                <textarea
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="הערות נוספות על ההעברה..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          )}
          {currentStep === 'confirm' && (
            <div>
              <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>שלב 4: אישור סופי</h3>
              
              <div style={{
                background: '#fff3cd',
                padding: '20px',
                borderRadius: '10px',
                border: '2px solid #ffc107',
                marginBottom: '25px'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>
                  ⚠️ אישור העברת הלוואה לערבים
                </h4>
                <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
                  פעולה זו תעביר את האחריות לתשלום לערבים והלווה המקורי ייכנס אוטומטית לרשימה השחורה.
                </p>
              </div>

              {/* סיכום פרטי הלוואה */}
              <div style={{
                background: '#fef2f2',
                padding: '15px',
                borderRadius: '10px',
                marginBottom: '20px',
                border: '2px solid #fca5a5'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#dc2626' }}>פרטי הלוואה:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                  <div><strong>לווה:</strong> {borrower.firstName} {borrower.lastName}</div>
                  <div><strong>סכום הלוואה:</strong> ₪{loan.amount.toLocaleString()}</div>
                  <div><strong>יתרה:</strong> ₪{balance.toLocaleString()}</div>
                  <div><strong>תאריך פירעון מקורי:</strong> {new Date(loan.returnDate).toLocaleDateString('he-IL')}</div>
                </div>
              </div>

              {/* סיכום ערבים וסכומים */}
              <div style={{
                background: '#f0f9ff',
                padding: '15px',
                borderRadius: '10px',
                marginBottom: '20px',
                border: '2px solid #bfdbfe'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>ערבים שיחויבו:</h4>
                {selectedGuarantorIds.map(id => {
                  const guarantor = guarantors.find(g => g.id === id)
                  if (!guarantor) return null
                  const amount = guarantorSplits.get(id) || 0
                  return (
                    <div key={id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '10px',
                      background: 'white',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <span><strong>{guarantor.firstName} {guarantor.lastName}</strong></span>
                      <span style={{ fontWeight: 'bold', color: '#1e40af' }}>₪{amount.toLocaleString()}</span>
                    </div>
                  )
                })}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px',
                  background: '#e0f2fe',
                  borderRadius: '6px',
                  marginTop: '10px',
                  fontWeight: 'bold'
                }}>
                  <span>סה"כ:</span>
                  <span style={{ color: '#1e40af' }}>₪{getTotalSplit().toLocaleString()}</span>
                </div>
              </div>

              {/* סיכום תנאי תשלום לכל ערב */}
              <div style={{
                background: '#f0fdf4',
                padding: '15px',
                borderRadius: '10px',
                marginBottom: '20px',
                border: '2px solid #86efac'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#16a34a' }}>תנאי תשלום לכל ערב:</h4>
                {selectedGuarantorIds.map(id => {
                  const guarantor = guarantors.find(g => g.id === id)
                  const amount = guarantorSplits.get(id) || 0
                  const terms = guarantorPaymentTerms.get(id) || {
                    paymentType: 'single',
                    installmentsCount: 3,
                    installmentDates: []
                  }

                  return (
                    <div key={id} style={{
                      background: 'rgba(255, 255, 255, 0.7)',
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      border: '1px solid #86efac'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#16a34a' }}>
                        🤝 {guarantor?.firstName} {guarantor?.lastName} - ₪{amount.toLocaleString()}
                      </div>
                      {terms.paymentType === 'single' ? (
                        <div style={{ fontSize: '14px', paddingRight: '15px' }}>
                          • תשלום אחד בתאריך: {terms.installmentDates[0] ? new Date(terms.installmentDates[0]).toLocaleDateString('he-IL') : '-'}
                        </div>
                      ) : (
                        <div style={{ fontSize: '14px', paddingRight: '15px' }}>
                          • {terms.installmentsCount} תשלומים × ₪{(amount / terms.installmentsCount).toFixed(2)}
                          <div style={{ marginTop: '5px', fontSize: '13px', color: '#15803d' }}>
                            תאריכים: {terms.installmentDates.map((date, index) => 
                              `${index + 1}. ${date ? new Date(date).toLocaleDateString('he-IL') : '-'}`
                            ).join(' | ')}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* הערות */}
              {transferNotes && (
                <div style={{
                  background: '#f8fafc',
                  padding: '15px',
                  borderRadius: '10px',
                  border: '2px solid #e2e8f0'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#475569' }}>הערות:</h4>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b', whiteSpace: 'pre-wrap' }}>
                    {transferNotes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* כפתורי ניווט */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', marginTop: '25px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px'
              }}
            >
              ביטול
            </button>
            {currentStep !== 'select-guarantors' && (
              <button
                onClick={() => {
                  if (currentStep === 'split-amount') setCurrentStep('select-guarantors')
                  else if (currentStep === 'payment-terms') setCurrentStep('split-amount')
                  else if (currentStep === 'confirm') setCurrentStep('payment-terms')
                }}
                style={{
                  background: '#7f8c8d',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                ← חזור
              </button>
            )}
          </div>
          <button
            onClick={() => {
              if (currentStep === 'select-guarantors') {
                if (selectedGuarantorIds.length === 0) {
                  showNotification('⚠️ אנא בחר לפחות ערב אחד', 'error')
                  return
                }
                if (selectedGuarantorIds.some(id => db.isBlacklisted('guarantor', id))) {
                  showNotification('⚠️ לא ניתן להעביר לערב שנמצא ברשימה שחורה', 'error')
                  return
                }
                setCurrentStep('split-amount')
              } else if (currentStep === 'split-amount') {
                if (getTotalSplit() !== balance) {
                  showNotification('⚠️ הסכום הכולל חייב להיות שווה ליתרת ההלוואה', 'error')
                  return
                }
                setCurrentStep('payment-terms')
              } else if (currentStep === 'payment-terms') {
                // ולידציה לתאריכים
                if (paymentType === 'single') {
                  if (!installmentDates[0]) {
                    showNotification('⚠️ אנא בחר תאריך פירעון', 'error')
                    return
                  }
                  const dueDate = new Date(installmentDates[0])
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  if (dueDate < today) {
                    showNotification('⚠️ תאריך הפירעון לא יכול להיות בעבר', 'error')
                    return
                  }
                } else {
                  // תשלומים
                  if (installmentDates.length !== installmentsCount) {
                    showNotification('⚠️ אנא הגדר את כל תאריכי הפירעון', 'error')
                    return
                  }
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  for (const dateStr of installmentDates) {
                    if (!dateStr) {
                      showNotification('⚠️ אנא הגדר את כל תאריכי הפירעון', 'error')
                      return
                    }
                    const date = new Date(dateStr)
                    if (date < today) {
                      showNotification('⚠️ תאריכי הפירעון לא יכולים להיות בעבר', 'error')
                      return
                    }
                  }
                }
                setCurrentStep('confirm')
              } else if (currentStep === 'confirm') {
                // ביצוע ההעברה
                executeTransfer()
              }
            }}
            disabled={guarantors.length === 0}
            style={{
              background: guarantors.length === 0 ? '#bdc3c7' : '#dc2626',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: guarantors.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: 'bold'
            }}
          >
            {currentStep === 'confirm' ? '✅ אשר העברה' : 'המשך ←'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoanTransferModal
