import { useState } from 'react'
import { db } from '../database/database'

interface WithdrawDepositModalProps {
  depositId: number
  availableBalance: number
  depositorName: string
  onSuccess: () => void
  onCancel: () => void
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void
}

function WithdrawDepositModal({
  depositId,
  availableBalance,
  depositorName,
  onSuccess,
  onCancel,
  showNotification
}: WithdrawDepositModalProps) {
  const [amount, setAmount] = useState('')
  const [withdrawalDate, setWithdrawalDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'check' | 'credit' | 'other'>('cash')
  const [paymentDetails, setPaymentDetails] = useState({
    // העברה בנקאית
    referenceNumber: '',
    bankCode: '',
    bankName: '',
    branchNumber: '',
    accountNumber: '',
    transferDate: new Date().toISOString().split('T')[0],
    
    // צ'ק
    checkNumber: '',
    checkBank: '',
    checkBankCode: '',
    checkBankName: '',
    checkBranch: '',
    checkDueDate: new Date().toISOString().split('T')[0],
    
    // כרטיס אשראי
    lastFourDigits: '',
    transactionNumber: '',
    
    // אחר
    description: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const amountNum = Number(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      showNotification('⚠️ סכום לא תקין', 'error')
      return
    }

    if (amountNum > availableBalance) {
      showNotification('⚠️ הסכום גדול מהיתרה הזמינה', 'error')
      return
    }

    // הכנת פרטי התשלום לפי האמצעי
    let detailsJson = ''
    
    if (paymentMethod === 'transfer') {
      detailsJson = JSON.stringify({
        referenceNumber: paymentDetails.referenceNumber,
        bankCode: paymentDetails.bankCode,
        bankName: paymentDetails.bankName,
        branchNumber: paymentDetails.branchNumber,
        accountNumber: paymentDetails.accountNumber,
        transferDate: paymentDetails.transferDate
      })
    } else if (paymentMethod === 'check') {
      detailsJson = JSON.stringify({
        checkNumber: paymentDetails.checkNumber,
        bankCode: paymentDetails.checkBankCode,
        bankName: paymentDetails.checkBankName,
        branch: paymentDetails.checkBranch,
        dueDate: paymentDetails.checkDueDate
      })
    } else if (paymentMethod === 'credit') {
      detailsJson = JSON.stringify({
        lastFourDigits: paymentDetails.lastFourDigits,
        transactionNumber: paymentDetails.transactionNumber
      })
    } else if (paymentMethod === 'other') {
      detailsJson = JSON.stringify({
        description: paymentDetails.description
      })
    }

    // ביצוע המשיכה
    if (db.withdrawDeposit(depositId, amountNum, paymentMethod, detailsJson, withdrawalDate)) {
      showNotification(`✅ נמשכו ₪${amountNum.toLocaleString()} בהצלחה!`)
      onSuccess()
    } else {
      showNotification('❌ שגיאה במשיכת הפקדון', 'error')
    }
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
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '30px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{ marginTop: 0, color: '#2c3e50', textAlign: 'center' }}>
          💸 משיכת הפקדה
        </h2>

        <div style={{
          backgroundColor: '#e3f2fd',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p style={{ margin: '5px 0', fontSize: '16px' }}>
            <strong>מפקיד:</strong> {depositorName}
          </p>
          <p style={{ margin: '5px 0', fontSize: '18px', color: '#27ae60' }}>
            <strong>יתרה זמינה:</strong> ₪{availableBalance.toLocaleString()}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* סכום */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              💰 סכום למשיכה *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="הזן סכום"
              required
              min="0.01"
              step="0.01"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '2px solid #ddd',
                borderRadius: '5px'
              }}
            />
          </div>

          {/* תאריך משיכה */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              📅 תאריך משיכה *
            </label>
            <input
              type="date"
              value={withdrawalDate}
              onChange={(e) => setWithdrawalDate(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '2px solid #ddd',
                borderRadius: '5px'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '5px' }}>
              💡 ניתן לשנות את התאריך למשיכה שבוצעה בעבר
            </small>
          </div>

          {/* אמצעי תשלום */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              💳 אמצעי תשלום *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '2px solid #ddd',
                borderRadius: '5px'
              }}
            >
              <option value="cash">💵 מזומן</option>
              <option value="transfer">🏦 העברה בנקאית</option>
              <option value="check">📝 צ'ק</option>
              <option value="credit">💳 כרטיס אשראי</option>
              <option value="other">📋 אחר</option>
            </select>
          </div>

          {/* פרטי העברה בנקאית */}
          {paymentMethod === 'transfer' && (
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginTop: 0, fontSize: '16px', color: '#2c3e50' }}>פרטי העברה בנקאית</h3>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  מספר אסמכתא
                </label>
                <input
                  type="text"
                  value={paymentDetails.referenceNumber}
                  onChange={(e) => setPaymentDetails({...paymentDetails, referenceNumber: e.target.value})}
                  placeholder="מספר אסמכתא"
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '14px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    קוד בנק
                  </label>
                  <input
                    type="text"
                    value={paymentDetails.bankCode}
                    onChange={(e) => setPaymentDetails({...paymentDetails, bankCode: e.target.value})}
                    placeholder="12"
                    maxLength={2}
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '14px',
                      border: '1px solid #ddd',
                      borderRadius: '5px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    שם בנק
                  </label>
                  <input
                    type="text"
                    value={paymentDetails.bankName}
                    onChange={(e) => setPaymentDetails({...paymentDetails, bankName: e.target.value})}
                    placeholder="שם הבנק"
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '14px',
                      border: '1px solid #ddd',
                      borderRadius: '5px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    מספר סניף
                  </label>
                  <input
                    type="text"
                    value={paymentDetails.branchNumber}
                    onChange={(e) => setPaymentDetails({...paymentDetails, branchNumber: e.target.value})}
                    placeholder="123"
                    maxLength={3}
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '14px',
                      border: '1px solid #ddd',
                      borderRadius: '5px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    מספר חשבון
                  </label>
                  <input
                    type="text"
                    value={paymentDetails.accountNumber}
                    onChange={(e) => setPaymentDetails({...paymentDetails, accountNumber: e.target.value})}
                    placeholder="123456789"
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '14px',
                      border: '1px solid #ddd',
                      borderRadius: '5px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  תאריך העברה
                </label>
                <input
                  type="date"
                  value={paymentDetails.transferDate}
                  onChange={(e) => setPaymentDetails({...paymentDetails, transferDate: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '14px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                />
              </div>
            </div>
          )}

          {/* פרטי צ'ק */}
          {paymentMethod === 'check' && (
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginTop: 0, fontSize: '16px', color: '#2c3e50' }}>פרטי צ'ק</h3>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  מספר צ'ק
                </label>
                <input
                  type="text"
                  value={paymentDetails.checkNumber}
                  onChange={(e) => setPaymentDetails({...paymentDetails, checkNumber: e.target.value})}
                  placeholder="מספר הצ'ק"
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '14px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    קוד בנק
                  </label>
                  <input
                    type="text"
                    value={paymentDetails.checkBankCode}
                    onChange={(e) => setPaymentDetails({...paymentDetails, checkBankCode: e.target.value})}
                    placeholder="12"
                    maxLength={2}
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '14px',
                      border: '1px solid #ddd',
                      borderRadius: '5px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    שם בנק
                  </label>
                  <input
                    type="text"
                    value={paymentDetails.checkBankName}
                    onChange={(e) => setPaymentDetails({...paymentDetails, checkBankName: e.target.value})}
                    placeholder="שם הבנק"
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '14px',
                      border: '1px solid #ddd',
                      borderRadius: '5px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    מספר סניף
                  </label>
                  <input
                    type="text"
                    value={paymentDetails.checkBranch}
                    onChange={(e) => setPaymentDetails({...paymentDetails, checkBranch: e.target.value})}
                    placeholder="123"
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '14px',
                      border: '1px solid #ddd',
                      borderRadius: '5px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    תאריך פירעון
                  </label>
                  <input
                    type="date"
                    value={paymentDetails.checkDueDate}
                    onChange={(e) => setPaymentDetails({...paymentDetails, checkDueDate: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '14px',
                      border: '1px solid #ddd',
                      borderRadius: '5px'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* פרטי כרטיס אשראי */}
          {paymentMethod === 'credit' && (
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginTop: 0, fontSize: '16px', color: '#2c3e50' }}>פרטי כרטיס אשראי</h3>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  4 ספרות אחרונות
                </label>
                <input
                  type="text"
                  value={paymentDetails.lastFourDigits}
                  onChange={(e) => setPaymentDetails({...paymentDetails, lastFourDigits: e.target.value})}
                  placeholder="1234"
                  maxLength={4}
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '14px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  מספר אישור
                </label>
                <input
                  type="text"
                  value={paymentDetails.transactionNumber}
                  onChange={(e) => setPaymentDetails({...paymentDetails, transactionNumber: e.target.value})}
                  placeholder="מספר אישור"
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '14px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                />
              </div>
            </div>
          )}

          {/* פרטי אחר */}
          {paymentMethod === 'other' && (
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginTop: 0, fontSize: '16px', color: '#2c3e50' }}>פרטים נוספים</h3>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  תיאור
                </label>
                <textarea
                  value={paymentDetails.description}
                  onChange={(e) => setPaymentDetails({...paymentDetails, description: e.target.value})}
                  placeholder="תאר את אמצעי התשלום"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '14px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          )}

          {/* כפתורים */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
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
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              ביטול
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              ✅ אישור משיכה
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default WithdrawDepositModal
