import { useState } from 'react'
import { db } from '../database/database'

interface WithdrawalsListModalProps {
  depositId: number
  depositorName: string
  onClose: () => void
  onSuccess: () => void
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void
}

function WithdrawalsListModal({ 
  depositId, 
  depositorName, 
  onClose, 
  onSuccess,
  showNotification 
}: WithdrawalsListModalProps) {
  const [editingWithdrawal, setEditingWithdrawal] = useState<any>(null)
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText: string
    cancelText?: string
    onConfirm: () => void
    type: 'warning' | 'danger'
  } | null>(null)

  const withdrawals = db.getWithdrawalsByDepositId(depositId)
  const deposit = db.getDeposits().find(d => d.id === depositId)

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

  const handleDeleteWithdrawal = (withdrawalId: number) => {
    showConfirmModal({
      title: 'מחיקת משיכה',
      message: 'האם אתה בטוח שברצונך למחוק את המשיכה?',
      confirmText: 'מחק',
      type: 'danger',
      onConfirm: () => {
        db.deleteWithdrawal(withdrawalId)
        showNotification('✅ המשיכה נמחקה בהצלחה')
        onSuccess()
      }
    })
  }

  const handleEditWithdrawal = (withdrawal: any) => {
    setEditingWithdrawal(withdrawal)
  }

  const handleSaveEdit = () => {
    if (!editingWithdrawal) return

    if (!editingWithdrawal.amount || editingWithdrawal.amount <= 0) {
      showNotification('❌ סכום המשיכה חייב להיות גדול מ-0', 'error')
      return
    }

    db.updateWithdrawal(editingWithdrawal.id, {
      amount: Number(editingWithdrawal.amount),
      date: editingWithdrawal.date,
      notes: editingWithdrawal.notes || ''
    })

    showNotification('✅ המשיכה עודכנה בהצלחה')
    setEditingWithdrawal(null)
    onSuccess()
  }

  return (
    <>
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
          maxWidth: '800px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          direction: 'rtl'
        }}
        onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>💸 משיכות - {depositorName}</h2>
            <button
              onClick={onClose}
              style={{
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ✕
            </button>
          </div>

          {deposit && (
            <div style={{
              backgroundColor: '#ecf0f1',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '5px 0' }}>
                <strong>הפקדה:</strong> ₪{deposit.amount.toLocaleString()}
              </p>
              <p style={{ margin: '5px 0' }}>
                <strong>תאריך הפקדה:</strong> {new Date(deposit.depositDate).toLocaleDateString('he-IL')}
              </p>
              <p style={{ margin: '5px 0' }}>
                <strong>יתרה זמינה:</strong> ₪{(deposit.amount - db.getTotalWithdrawnAmount(depositId)).toLocaleString()}
              </p>
            </div>
          )}

          {withdrawals.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#7f8c8d',
              fontSize: '16px'
            }}>
              📭 אין משיכות להפקדה זו
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {withdrawals.map(withdrawal => (
                <div key={withdrawal.id} style={{
                  border: '2px solid #e74c3c',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: editingWithdrawal?.id === withdrawal.id ? '#fff3cd' : 'white'
                }}>
                  {editingWithdrawal?.id === withdrawal.id ? (
                    // מצב עריכה
                    <div>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                          סכום משיכה:
                        </label>
                        <input
                          type="number"
                          value={editingWithdrawal.amount}
                          onChange={(e) => setEditingWithdrawal({
                            ...editingWithdrawal,
                            amount: e.target.value
                          })}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '5px',
                            fontSize: '14px'
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                          תאריך משיכה:
                        </label>
                        <input
                          type="date"
                          value={editingWithdrawal.date}
                          onChange={(e) => setEditingWithdrawal({
                            ...editingWithdrawal,
                            date: e.target.value
                          })}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '5px',
                            fontSize: '14px'
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                          הערות:
                        </label>
                        <textarea
                          value={editingWithdrawal.notes || ''}
                          onChange={(e) => setEditingWithdrawal({
                            ...editingWithdrawal,
                            notes: e.target.value
                          })}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '5px',
                            fontSize: '14px',
                            minHeight: '60px'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={handleSaveEdit}
                          style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: '#27ae60',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          ✅ שמור
                        </button>
                        <button
                          onClick={() => setEditingWithdrawal(null)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: '#95a5a6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          ❌ ביטול
                        </button>
                      </div>
                    </div>
                  ) : (
                    // מצב תצוגה
                    <>
                      <div style={{ marginBottom: '10px' }}>
                        <p style={{ margin: '5px 0', fontSize: '18px', fontWeight: 'bold', color: '#e74c3c' }}>
                          💸 ₪{withdrawal.amount.toLocaleString()}
                        </p>
                        <p style={{ margin: '5px 0', color: '#7f8c8d' }}>
                          📅 {new Date(withdrawal.date).toLocaleDateString('he-IL')}
                        </p>
                        {withdrawal.notes && (
                          <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                            📝 {withdrawal.notes}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ecf0f1' }}>
                        <button
                          onClick={() => handleEditWithdrawal(withdrawal)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            backgroundColor: '#f39c12',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          ✏️ ערוך
                        </button>
                        <button
                          onClick={() => handleDeleteWithdrawal(withdrawal.id)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          🗑️ מחק
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
            zIndex: 10001
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
    </>
  )
}

export default WithdrawalsListModal
