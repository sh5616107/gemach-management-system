import { useState } from 'react'
import { db } from '../database/database'

interface NewDepositFormProps {
  depositorId: number
  depositorName: string
  onSuccess: () => void
  onCancel: () => void
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void
}

function NewDepositForm({ 
  depositorId, 
  depositorName, 
  onSuccess, 
  onCancel, 
  showNotification 
}: NewDepositFormProps) {
  const [formData, setFormData] = useState({
    amount: 0,
    depositDate: new Date().toISOString().split('T')[0],
    depositPeriod: 12,
    reminderDays: 30,
    notes: '',
    isRecurring: false,
    recurringMonths: 12,
    recurringDay: 1
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.amount || formData.amount <= 0) {
      showNotification('⚠️ אנא הכנס סכום תקין', 'error')
      return
    }

    // חשב תאריך סיום אם הפקדה מחזורית
    let recurringEndDate: string | undefined
    if (formData.isRecurring && formData.recurringMonths > 0) {
      const endDate = new Date(formData.depositDate)
      endDate.setMonth(endDate.getMonth() + formData.recurringMonths)
      recurringEndDate = endDate.toISOString().split('T')[0]
    }

    const result = db.addDepositToDepositor(depositorId, {
      amount: formData.amount,
      depositDate: formData.depositDate,
      depositPeriod: formData.depositPeriod,
      reminderDays: formData.reminderDays,
      notes: formData.notes.trim(),
      isRecurring: formData.isRecurring,
      recurringDay: formData.isRecurring ? formData.recurringDay : undefined,
      recurringMonths: formData.isRecurring ? formData.recurringMonths : undefined,
      recurringEndDate: formData.isRecurring ? recurringEndDate : undefined,
      lastRecurringDate: formData.depositDate
    })

    if ('error' in result) {
      showNotification(`❌ ${result.error}`, 'error')
      return
    }

    showNotification(`✅ הפקדה חדשה נוספה בהצלחה!`)
    onSuccess()
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
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ marginTop: 0 }}>➕ הפקדה חדשה - {depositorName}</h2>

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
                min="0"
              />
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
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      (1-31, אם אין יום כזה בחודש - יבחר האחרון)
                    </small>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                      למשך כמה חודשים
                    </label>
                    <input
                      type="number"
                      value={formData.recurringMonths}
                      onChange={(e) => setFormData({ ...formData, recurringMonths: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        fontSize: '14px'
                      }}
                      min="1"
                      max="120"
                    />
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      (מספר חודשים שההפקדה תמשך)
                    </small>
                  </div>
                </div>

                <div style={{
                  padding: '10px',
                  backgroundColor: '#fff3cd',
                  borderRadius: '5px',
                  fontSize: '13px',
                  color: '#856404'
                }}>
                  💡 <strong>הסבר:</strong> המערכת תיצור אוטומטית הפקדה חדשה של ₪{formData.amount.toLocaleString()} 
                  ביום ה-{formData.recurringDay} של כל חודש, למשך {formData.recurringMonths} חודשים.
                  ההפקדות ייווצרו אוטומטית בכל פעם שתיכנס למערכת.
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

export default NewDepositForm
