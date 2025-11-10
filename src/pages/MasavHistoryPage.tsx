import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, MasavFileRecord } from '../database/database'

function MasavHistoryPage() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<MasavFileRecord[]>([])
  const [selectedFile, setSelectedFile] = useState<MasavFileRecord | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'confirm' | 'cancel' | null>(null)

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = () => {
    const allFiles = db.getMasavFiles()
    // מיון לפי תאריך יצירה (החדשים ראשון)
    allFiles.sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime())
    setFiles(allFiles)
  }

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const colors = {
      success: '#27ae60',
      error: '#e74c3c',
      info: '#3498db'
    }

    const notification = document.createElement('div')
    notification.innerHTML = message
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 9999;
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

  const downloadFile = (file: MasavFileRecord) => {
    const blob = new Blob([file.fileContent], { type: 'text/plain;charset=windows-1255' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showNotification(`✅ הקובץ ${file.fileName} הורד בהצלחה`, 'success')
  }

  const confirmFile = (file: MasavFileRecord) => {
    setSelectedFile(file)
    setConfirmAction('confirm')
    setShowConfirmModal(true)
  }

  const cancelFile = (file: MasavFileRecord) => {
    setSelectedFile(file)
    setConfirmAction('cancel')
    setShowConfirmModal(true)
  }

  const executeAction = () => {
    if (!selectedFile || !confirmAction) return

    if (confirmAction === 'confirm') {
      // אישור גביה - רישום תשלומים
      const success = db.confirmMasavFilePayments(selectedFile.id)
      if (success) {
        db.updateMasavFileStatus(selectedFile.id, 'confirmed')
        showNotification(`✅ הגביה אושרה בהצלחה!<br>${selectedFile.chargesCount} תשלומים נרשמו`, 'success')
        loadFiles()
      } else {
        showNotification('❌ שגיאה באישור הגביה', 'error')
      }
    } else if (confirmAction === 'cancel') {
      // ביטול קובץ
      db.updateMasavFileStatus(selectedFile.id, 'cancelled')
      showNotification('✅ הקובץ בוטל בהצלחה', 'success')
      loadFiles()
    }

    setShowConfirmModal(false)
    setSelectedFile(null)
    setConfirmAction(null)
  }

  const viewDetails = (file: MasavFileRecord) => {
    setSelectedFile(file)
    setShowDetailsModal(true)
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#92400e', text: '⏳ ממתין לאישור' },
      confirmed: { bg: '#d1fae5', color: '#065f46', text: '✅ אושר' },
      cancelled: { bg: '#fee2e2', color: '#991b1b', text: '❌ בוטל' }
    }
    const style = styles[status as keyof typeof styles] || styles.pending
    return (
      <span style={{
        padding: '5px 12px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: 'bold',
        background: style.bg,
        color: style.color
      }}>
        {style.text}
      </span>
    )
  }

  return (
    <div>
      <header className="header">
        <h1>📋 היסטוריית קבצי מס"ב</h1>
        <button 
          className="close-btn" 
          onClick={() => navigate(-1)}
          title="חזור מסך אחד אחורה"
        >
          ×
        </button>
      </header>

      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* כפתורים עליונים */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/masav-generator')}
          >
            ➕ צור קובץ חדש
          </button>
          <button
            className="btn"
            onClick={loadFiles}
            style={{ background: '#6b7280', color: 'white' }}
          >
            🔄 רענן
          </button>
        </div>

        {/* סטטיסטיקות */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '32px' }}>{files.length}</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>סה"כ קבצים</p>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '32px' }}>
              {files.filter(f => f.status === 'pending').length}
            </h3>
            <p style={{ margin: 0, fontSize: '14px' }}>ממתינים לאישור</p>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '32px' }}>
              {files.filter(f => f.status === 'confirmed').length}
            </h3>
            <p style={{ margin: 0, fontSize: '14px' }}>אושרו</p>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '32px' }}>
              {db.formatCurrency(files.reduce((sum, f) => sum + f.totalAmount, 0))}
            </h3>
            <p style={{ margin: 0, fontSize: '14px' }}>סה"כ סכום</p>
          </div>
        </div>

        {/* רשימת קבצים */}
        {files.length === 0 ? (
          <div style={{
            padding: '60px',
            background: 'white',
            borderRadius: '15px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#6b7280', marginBottom: '15px' }}>📂 אין קבצי מס"ב</h3>
            <p style={{ color: '#9ca3af', marginBottom: '20px' }}>
              לא נוצרו עדיין קבצי מס"ב במערכת
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/masav-generator')}
            >
              צור קובץ ראשון
            </button>
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '15px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '15px', textAlign: 'right' }}>תאריך יצירה</th>
                  <th style={{ padding: '15px', textAlign: 'right' }}>תאריך חיוב</th>
                  <th style={{ padding: '15px', textAlign: 'right' }}>שם קובץ</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>חיובים</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>סכום</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>סטטוס</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {files.map(file => (
                  <tr
                    key={file.id}
                    style={{
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <td style={{ padding: '15px' }}>
                      {new Date(file.creationDate).toLocaleDateString('he-IL')}
                    </td>
                    <td style={{ padding: '15px' }}>
                      {new Date(file.chargeDate).toLocaleDateString('he-IL')}
                    </td>
                    <td style={{ padding: '15px', fontFamily: 'monospace' }}>
                      {file.fileName}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>
                      {file.chargesCount}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: '#3b82f6' }}>
                      {db.formatCurrency(file.totalAmount)}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      {getStatusBadge(file.status)}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          className="btn"
                          onClick={() => viewDetails(file)}
                          style={{
                            background: '#3b82f6',
                            color: 'white',
                            padding: '6px 12px',
                            fontSize: '13px'
                          }}
                          title="צפה בפרטים"
                        >
                          👁️
                        </button>
                        <button
                          className="btn"
                          onClick={() => downloadFile(file)}
                          style={{
                            background: '#10b981',
                            color: 'white',
                            padding: '6px 12px',
                            fontSize: '13px'
                          }}
                          title="הורד קובץ"
                        >
                          ⬇️
                        </button>
                        {file.status === 'pending' && (
                          <>
                            <button
                              className="btn"
                              onClick={() => confirmFile(file)}
                              style={{
                                background: '#059669',
                                color: 'white',
                                padding: '6px 12px',
                                fontSize: '13px'
                              }}
                              title="אשר גביה"
                            >
                              ✅
                            </button>
                            <button
                              className="btn"
                              onClick={() => cancelFile(file)}
                              style={{
                                background: '#dc2626',
                                color: 'white',
                                padding: '6px 12px',
                                fontSize: '13px'
                              }}
                              title="בטל קובץ"
                            >
                              ❌
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* מודל פרטי קובץ */}
      {showDetailsModal && selectedFile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '15px',
              padding: '30px',
              maxWidth: '700px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>
              📄 פרטי קובץ מס"ב
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <strong>שם קובץ:</strong> {selectedFile.fileName}
                </div>
                <div>
                  <strong>סטטוס:</strong> {getStatusBadge(selectedFile.status)}
                </div>
                <div>
                  <strong>תאריך יצירה:</strong> {new Date(selectedFile.creationDate).toLocaleDateString('he-IL')}
                </div>
                <div>
                  <strong>תאריך חיוב:</strong> {new Date(selectedFile.chargeDate).toLocaleDateString('he-IL')}
                </div>
                <div>
                  <strong>מספר חיובים:</strong> {selectedFile.chargesCount}
                </div>
                <div>
                  <strong>סכום כולל:</strong> {db.formatCurrency(selectedFile.totalAmount)}
                </div>
              </div>
            </div>

            <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>רשימת חיובים:</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {selectedFile.charges.map((charge, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    marginBottom: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <strong>{charge.borrowerName}</strong>
                    <strong style={{ color: '#3b82f6' }}>{db.formatCurrency(charge.amount)}</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    ת.ז: {charge.idNumber} | 
                    בנק: {charge.bankCode}-{charge.branchNumber}-{charge.accountNumber} | 
                    אסמכתא: {charge.referenceNumber}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={() => setShowDetailsModal(false)}
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* מודל אישור פעולה */}
      {showConfirmModal && selectedFile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '15px',
              padding: '30px',
              maxWidth: '500px',
              width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>
              {confirmAction === 'confirm' ? '✅ אישור גביה' : '❌ ביטול קובץ'}
            </h2>

            <p style={{ marginBottom: '20px', fontSize: '16px' }}>
              {confirmAction === 'confirm' ? (
                <>
                  האם אתה בטוח שברצונך לאשר את הגביה?
                  <br /><br />
                  פעולה זו תרשום <strong>{selectedFile.chargesCount} תשלומים</strong> בסך <strong>{db.formatCurrency(selectedFile.totalAmount)}</strong> למערכת.
                  <br /><br />
                  <span style={{ color: '#dc2626' }}>פעולה זו לא ניתנת לביטול!</span>
                </>
              ) : (
                <>
                  האם אתה בטוח שברצונך לבטל את הקובץ?
                  <br /><br />
                  הקובץ יסומן כ"בוטל" ולא ניתן יהיה לאשר אותו.
                </>
              )}
            </p>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                className="btn"
                onClick={() => setShowConfirmModal(false)}
                style={{ background: '#6b7280', color: 'white' }}
              >
                ביטול
              </button>
              <button
                className="btn"
                onClick={executeAction}
                style={{
                  background: confirmAction === 'confirm' ? '#059669' : '#dc2626',
                  color: 'white'
                }}
              >
                {confirmAction === 'confirm' ? 'אשר גביה' : 'בטל קובץ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* כפתור חזרה לדף הבית */}
      <button 
        onClick={() => navigate('/')}
        style={{ 
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          color: 'white',
          border: 'none',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
          transition: 'all 0.3s ease',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.6)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'
        }}
        title="חזרה לדף הבית"
      >
        🏠
      </button>
    </div>
  )
}

export default MasavHistoryPage
