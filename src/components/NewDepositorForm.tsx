import { useState } from 'react'
import { db } from '../database/database'

interface NewDepositorFormProps {
  onSuccess: () => void
  onCancel: () => void
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void
}

function NewDepositorForm({ onSuccess, onCancel, showNotification }: NewDepositorFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    idNumber: '',
    phone: '',
    notes: '',
    // פרטי בנק אופציונליים
    bankCode: '',
    branchNumber: '',
    accountNumber: '',
    // הפקדה ראשונה
    depositAmount: 0,
    depositDate: new Date().toISOString().split('T')[0],
    depositPeriod: 12,
    reminderDays: 30,
    depositNotes: '',
    // הפקדה מחזורית
    isRecurring: false,
    recurringDay: 1,
    recurringMonths: 12
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // ולידציה
    if (!formData.name.trim()) {
      showNotification('⚠️ אנא הכנס שם מלא', 'error')
      return
    }

    if (!formData.depositAmount || formData.depositAmount <= 0) {
      showNotification('⚠️ אנא הכנס סכום הפקדה תקין', 'error')
      return
    }

    // צור מפקיד
    const depositorResult = db.addDepositor({
      name: formData.name.trim(),
      idNumber: formData.idNumber.trim(),
      phone: formData.phone.trim(),
      notes: formData.notes.trim(),
      bankCode: formData.bankCode.trim() || undefined,
      branchNumber: formData.branchNumber.trim() || undefined,
      accountNumber: formData.accountNumber.trim() || undefined
    })

    if ('error' in depositorResult) {
      showNotification(`❌ ${depositorResult.error}`, 'error')
      return
    }

    // צור הפקדה ראשונה
    let recurringEndDate: string | undefined
    if (formData.isRecurring && formData.recurringMonths > 0) {
      const endDate = new Date(formData.depositDate)
      endDate.setMonth(endDate.getMonth() + formData.recurringMonths)
      recurringEndDate = endDate.toISOString().split('T')[0]
    }

    const depositResult = db.addDepositToDepositor(depositorResult.id, {
      amount: formData.depositAmount,
      depositDate: formData.depositDate,
      depositPeriod: formData.depositPeriod,
      reminderDays: formData.reminderDays,
      notes: formData.depositNotes.trim(),
      isRecurring: formData.isRecurring,
      recurringDay: formData.isRecurring ? formData.recurringDay : undefined,
      recurringMonths: formData.isRecurring ? formData.recurringMonths : undefined,
      recurringEndDate: formData.isRecurring ? recurringEndDate : undefined,
      lastRecurringDate: formData.depositDate
    })

    if ('error' in depositResult) {
      showNotification(`❌ ${depositResult.error}`, 'error')
      return
    }

    showNotification(`✅ מפקיד "${formData.name}" נוצר בהצלחה עם הפקדה ראשונה!`)
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
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ marginTop: 0 }}>➕ מפקיד חדש</h2>

        <form onSubmit={handleSubmit}>
          {/* פרטי מפקיד */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '15px', color: '#3498db' }}>👤 פרטי מפקיד</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                שם מלא *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  מספר זהות {db.getSettings().requireIdNumber && '*'}
                </label>
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                  placeholder="123456789"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  טלפון
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                  placeholder="050-1234567"
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
                  minHeight: '60px'
                }}
              />
            </div>
          </div>

          {/* הפקדה ראשונה */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '15px', color: '#27ae60' }}>💰 הפקדה ראשונה</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  סכום *
                </label>
                <input
                  type="number"
                  value={formData.depositAmount || ''}
                  onChange={(e) => setFormData({ ...formData, depositAmount: Number(e.target.value) })}
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
                הערות להפקדה
              </label>
              <textarea
                value={formData.depositNotes}
                onChange={(e) => setFormData({ ...formData, depositNotes: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px',
                  minHeight: '60px'
                }}
              />
            </div>

            {/* הפקדה מחזורית */}
            <div style={{
              marginTop: '15px',
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
                        (1-31)
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
                    </div>
                  </div>

                  <div style={{
                    padding: '10px',
                    backgroundColor: '#fff3cd',
                    borderRadius: '5px',
                    fontSize: '13px',
                    color: '#856404'
                  }}>
                    💡 המערכת תיצור אוטומטית הפקדה חדשה כל חודש
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* פרטי בנק אופציונליים */}
          <details style={{ marginBottom: '20px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '10px' }}>
              🏦 פרטי בנק (אופציונלי - למס"ב)
            </summary>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  קוד בנק
                </label>
                <input
                  type="text"
                  value={formData.bankCode}
                  onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                  placeholder="12"
                  maxLength={2}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  מספר סניף
                </label>
                <input
                  type="text"
                  value={formData.branchNumber}
                  onChange={(e) => setFormData({ ...formData, branchNumber: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                  placeholder="345"
                  maxLength={3}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  מספר חשבון
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                  placeholder="123456789"
                  maxLength={9}
                />
              </div>
            </div>
          </details>

          {/* כפתורים */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
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

export default NewDepositorForm
