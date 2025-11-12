import { useState } from 'react'
import { db, DatabaseDeposit } from '../database/database'

interface EditDepositFormProps {
  deposit: DatabaseDeposit
  onSuccess: () => void
  onCancel: () => void
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void
}

function EditDepositForm({ 
  deposit, 
  onSuccess, 
  onCancel, 
  showNotification 
}: EditDepositFormProps) {
  const [formData, setFormData] = useState({
    amount: deposit.amount,
    depositDate: deposit.depositDate,
    depositPeriod: deposit.depositPeriod,
    reminderDays: deposit.reminderDays || 30,
    notes: deposit.notes || '',
    isRecurring: deposit.isRecurring || false,
    recurringDay: deposit.recurringDay || 1,
    recurringMonths: deposit.recurringMonths || 12,
    recurringEndDate: deposit.recurringEndDate || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.amount || formData.amount <= 0) {
      showNotification('⚠️ אנא הכנס סכום תקין', 'error')
      return
    }

    // בדוק שהסכום החדש לא קטן מהסכום שכבר נמשך
    const withdrawnAmount = db.getTotalWithdrawnAmount(deposit.id)
    if (formData.amount < withdrawnAmount) {
      showNotification(`⚠️ לא ניתן להקטין את הסכום מתחת לסכום שכבר נמשך (₪${withdrawnAmount.toLocaleString()})`, 'error')
      return
    }

    db.updateDeposit(deposit.id, {
      amount: formData.amount,
      depositDate: formData.depositDate,
      depositPeriod: formData.depositPeriod,
      reminderDays: formData.reminderDays,
      notes: formData.notes.trim(),
      isRecurring: formData.isRecurring,
      recurringDay: formData.isRecurring ? formData.recurringDay : undefined,
      recurringMonths: formData.isRecurring ? formData.recurringMonths : undefined,
      recurringEndDate: formData.isRecurring ? formData.recurringEndDate : undefined
    })

    showNotification(`✅ ההפקדה עודכנה בהצלחה!`)
    onSuccess()
  }

  const withdrawnAmount = db.getTotalWithdrawnAmount(deposit.id)
  const currentBalance = deposit.amount - withdrawnAmount

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
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ marginTop: 0 }}>✏️ ערוך הפקדה</h2>

        {withdrawnAmount > 0 && (
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '5px',
            padding: '10px',
            marginBottom: '15px',
            fontSize: '14px'
          }}>
            ⚠️ <strong>שים לב:</strong> כבר נמשכו ₪{withdrawnAmount.toLocaleString()} מהפקדה זו.
            <br />
            יתרה נוכחית: ₪{currentBalance.toLocaleString()}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                סכום *
              </label>
              <input
                type="number"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px'
                }}
                required
                min={withdrawnAmount}
              />
              {withdrawnAmount > 0 && (
                <small style={{ color: '#7f8c8d' }}>
                  מינימום: ₪{withdrawnAmount.toLocaleString()}
                </small>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                תאריך הפקדה *
              </label>
              <input
                type="date"
                value={formData.depositDate}
                onChange={(e) => setFormData({ ...formData, depositDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px'
                }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                תקופה (חודשים)
              </label>
              <input
                type="number"
                value={formData.depositPeriod}
                onChange={(e) => setFormData({ ...formData, depositPeriod: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px'
                }}
                min="1"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                ימי תזכורת
              </label>
              <input
                type="number"
                value={formData.reminderDays}
                onChange={(e) => setFormData({ ...formData, reminderDays: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px'
                }}
                min="0"
              />
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              הערות
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px',
                minHeight: '80px'
              }}
            />
          </div>

          {/* הפקדה מחזורית */}
          <div style={{
            marginBottom: '15px',
            padding: '15px',
            backgroundColor: '#e8f5e9',
            borderRadius: '5px',
            border: '2px solid #4caf50'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                style={{ marginLeft: '10px', width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                🔄 הפקדה מחזורית (אוטומטית כל חודש)
              </span>
            </label>

            {formData.isRecurring && (
              <div style={{ marginTop: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                      יום בחודש להפקדה
                    </label>
                    <input
                      type="number"
                      value={formData.recurringDay}
                      onChange={(e) => setFormData({ ...formData, recurringDay: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        fontSize: '14px'
                      }}
                      min="1"
                      max="31"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                      תאריך סיום
                    </label>
                    <input
                      type="date"
                      value={formData.recurringEndDate}
                      onChange={(e) => setFormData({ ...formData, recurringEndDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                <div style={{
                  padding: '10px',
                  backgroundColor: '#fff9c4',
                  borderRadius: '5px',
                  fontSize: '13px',
                  color: '#666'
                }}>
                  💡 <strong>טיפ:</strong> המערכת תיצור אוטומטית הפקדה חדשה כל חודש עד לתאריך הסיום
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              💾 שמור
            </button>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '12px',
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

export default EditDepositForm
