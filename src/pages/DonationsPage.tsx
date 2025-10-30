import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, DatabaseDonation } from '../database/database'
import NumberInput from '../components/NumberInput'
import { formatCombinedDate } from '../utils/hebrewDate'

function DonationsPage() {
  const navigate = useNavigate()

  // פונקציה להצגת הודעות ויזואליות שלא חוסמות
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

  // State למודל אישור
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText: string
    cancelText: string
    onConfirm: () => void
    onCancel?: () => void
    type: 'warning' | 'danger' | 'info'
  } | null>(null)

  // פונקציה להצגת מודל אישור
  const showConfirmModal = (config: {
    title: string
    message: string
    confirmText: string
    cancelText?: string
    onConfirm: () => void
    onCancel?: () => void
    type?: 'warning' | 'danger' | 'info'
  }) => {
    setModalConfig({
      isOpen: true,
      cancelText: 'ביטול',
      type: 'warning',
      ...config
    })
  }

  // פונקציה לסגירת המודל
  const closeModal = () => {
    setModalConfig(null)
  }

  const [donations, setDonations] = useState<DatabaseDonation[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newDonation, setNewDonation] = useState({
    donorName: '',
    donorLastName: '',
    amount: 0,
    donationDate: '',
    method: 'cash' as 'cash' | 'transfer' | 'check' | 'other',
    phone: '',
    address: '',
    notes: '',
    needsReceipt: false
  })

  useEffect(() => {
    loadDonations()
  }, [])

  const loadDonations = () => {
    setDonations(db.getDonations())
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setNewDonation(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const generateReceipt = (donation: DatabaseDonation) => {
    const gemachName = db.getGemachName()
    const donorName = `${donation.donorName} ${donation.donorLastName}`
    const amount = donation.amount.toLocaleString()
    const donationDate = db.getSettings().showHebrewDates ? 
      formatCombinedDate(donation.donationDate) : 
      new Date(donation.donationDate).toLocaleDateString('he-IL')
    const receiptNumber = donation.id

    // בדיקה אם זה Electron עם API חדש
    const isElectron = (window as any).electronAPI?.isElectron?.()

    if (isElectron) {
      // פתרון מיוחד ל-Electron
      const printContent = `
        <div id="print-content" style="display: none;">
          <div style="font-family: Arial, sans-serif; direction: rtl; text-align: center; padding: 20px; line-height: 1.4; font-size: 14px; margin: 0;">
            <div style="max-width: 400px; margin: 0 auto; text-align: right; border: 2px solid #000; padding: 20px;">
              <div style="text-align: left; font-size: 12px; margin-bottom: 20px;">קבלה מס': ${receiptNumber}</div>
              <h1 style="font-size: 20px; margin-bottom: 20px; text-decoration: underline;">קבלה על תרומה</h1>
              <p style="margin: 8px 0;">התקבל מאת: <strong>${donorName}</strong></p>
              <p style="margin: 8px 0;">תאריך: <strong>${donationDate}</strong></p>
              <div style="font-size: 18px; font-weight: bold; text-align: center; border: 1px solid #000; padding: 10px; margin: 15px 0;">סכום: ${amount} ש"ח</div>
              <p style="margin: 8px 0;">אמצעי תשלום: <strong>${getPaymentMethodText(donation.method)}</strong></p>
              ${donation.notes ? `<p style="margin: 8px 0;">הערות: <strong>${donation.notes}</strong></p>` : ''}
              <br>
              <p style="margin: 8px 0;">תודה על תרומתכם לגמ"ח "${gemachName}"</p>
              <br>
              <p style="margin: 8px 0;">תאריך הפקה: <strong>${db.getSettings().showHebrewDates ? formatCombinedDate(new Date()) : new Date().toLocaleDateString('he-IL')}</strong></p>
            </div>
          </div>
        </div>
      `

      // הוספת התוכן לעמוד
      const existingPrintContent = document.getElementById('print-content')
      if (existingPrintContent) {
        existingPrintContent.remove()
      }
      
      document.body.insertAdjacentHTML('beforeend', printContent)
      
      // הוספת CSS להדפסה
      const printStyle = document.createElement('style')
      printStyle.id = 'print-style'
      printStyle.textContent = `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-content, #print-content * {
            visibility: visible;
          }
          #print-content {
            position: absolute;
            left: 0;
            top: 0;
            display: block !important;
            width: 100%;
          }
        }
      `
      
      const existingPrintStyle = document.getElementById('print-style')
      if (existingPrintStyle) {
        existingPrintStyle.remove()
      }
      
      document.head.appendChild(printStyle)
      
      // הדפסה
      setTimeout(() => {
        window.print()
        
        // ניקוי לאחר ההדפסה
        setTimeout(() => {
          const printContentEl = document.getElementById('print-content')
          const printStyleEl = document.getElementById('print-style')
          if (printContentEl) printContentEl.remove()
          if (printStyleEl) printStyleEl.remove()
        }, 1000)
      }, 100)
      
    } else {
      // פתרון רגיל לדפדפנים - יצירת חלון הדפסה
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      if (printWindow) {
        printWindow.document.write(`
          <html dir="rtl">
            <head>
              <title>קבלה על תרומה - ${donorName}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  direction: rtl;
                  text-align: center;
                  padding: 20px;
                  line-height: 1.4;
                  font-size: 14px;
                  margin: 0;
                }
                h1 {
                  font-size: 20px;
                  margin-bottom: 20px;
                  text-decoration: underline;
                }
                .content {
                  max-width: 400px;
                  margin: 0 auto;
                  text-align: right;
                  border: 2px solid #000;
                  padding: 20px;
                }
                p {
                  margin: 8px 0;
                }
                .receipt-number {
                  text-align: left;
                  font-size: 12px;
                  margin-bottom: 20px;
                }
                .amount {
                  font-size: 18px;
                  font-weight: bold;
                  text-align: center;
                  border: 1px solid #000;
                  padding: 10px;
                  margin: 15px 0;
                }
                .print-buttons {
                  text-align: center;
                  margin: 20px 0;
                  padding: 20px;
                  background: #f5f5f5;
                  border-radius: 5px;
                }
                .print-btn {
                  background: #007bff;
                  color: white;
                  border: none;
                  padding: 10px 20px;
                  margin: 0 10px;
                  border-radius: 5px;
                  cursor: pointer;
                  font-size: 14px;
                }
                .print-btn:hover {
                  background: #0056b3;
                }
                .close-btn {
                  background: #6c757d;
                }
                .close-btn:hover {
                  background: #545b62;
                }
                @media print {
                  .print-buttons { display: none; }
                  body { 
                    padding: 10px;
                    font-size: 12px;
                  }
                  h1 { font-size: 16px; margin-bottom: 15px; }
                  p { margin: 5px 0; }
                  .content { padding: 15px; }
                }
              </style>
            </head>
            <body>
              <div class="print-buttons">
                <button class="print-btn" onclick="window.print()">🖨️ הדפס</button>
                <button class="print-btn close-btn" onclick="window.close()">❌ סגור</button>
              </div>
              <div class="content">
                <div class="receipt-number">קבלה מס': ${receiptNumber}</div>
                <h1>קבלה על תרומה</h1>
                <p>התקבל מאת: <strong>${donorName}</strong></p>
                <p>תאריך: <strong>${donationDate}</strong></p>
                <div class="amount">סכום: ${amount} ש"ח</div>
                <p>אמצעי תשלום: <strong>${getPaymentMethodText(donation.method)}</strong></p>
                ${donation.notes ? `<p>הערות: <strong>${donation.notes}</strong></p>` : ''}
                <br>
                <p>תודה על תרומתכם לגמ"ח "${gemachName}"</p>
                <br>
                <p>תאריך הפקה: <strong>${db.getSettings().showHebrewDates ? formatCombinedDate(new Date()) : new Date().toLocaleDateString('he-IL')}</strong></p>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.focus()
      }
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'מזומן'
      case 'transfer': return 'העברה בנקאית'
      case 'check': return 'צ\'ק'
      case 'other': return 'אחר'
      default: return method
    }
  }

  const saveDonation = () => {
    if (newDonation.donorName && newDonation.amount) {
      if (editingId) {
        // עדכון תרומה קיימת
        db.updateDonation(editingId, newDonation as DatabaseDonation)
        setEditingId(null)
        showNotification('✅ התרומה עודכנה בהצלחה!')
      } else {
        // תרומה חדשה
        db.addDonation(newDonation)
        showNotification('✅ התרומה נרשמה בהצלחה!')
      }

      loadDonations()
      setNewDonation({
        donorName: '',
        donorLastName: '',
        amount: 0,
        donationDate: '',
        method: 'cash',
        phone: '',
        address: '',
        notes: '',
        needsReceipt: false
      })
    } else {
      showNotification('⚠️ אנא מלא את השדות החובה: שם התורם וסכום', 'error')
    }
  }

  return (
    <div>
      <header className="header">
        <h1>תרומות</h1>
        <button className="close-btn" onClick={() => navigate('/')}>×</button>
      </header>

      <div className="container">
        <div className="main-content">
          <h2 style={{ color: '#2c3e50', marginBottom: '40px' }}>ניהול תרומות</h2>
          <p style={{ color: '#34495e', fontSize: '18px' }}>
            כאן תוכל לנהל את כל התרומות שהתקבלו בגמ"ח
          </p>

          <div className="form-container" style={{ marginTop: '40px' }}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>רישום תרומה חדשה</h3>

            <div className="form-row">
              <div className="form-group">
                <label>שם פרטי:</label>
                <input
                  type="text"
                  value={newDonation.donorName}
                  onChange={(e) => handleInputChange('donorName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>שם משפחה:</label>
                <input
                  type="text"
                  value={newDonation.donorLastName}
                  onChange={(e) => handleInputChange('donorLastName', e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>סכום התרומה:</label>
                <NumberInput
                  value={newDonation.amount || 0}
                  onChange={(value) => handleInputChange('amount', value)}
                  placeholder="הזן סכום"
                />
              </div>
              <div className="form-group">
                <label>תאריך התרומה:</label>
                <input
                  type="date"
                  value={newDonation.donationDate}
                  onChange={(e) => handleInputChange('donationDate', e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>אופן התרומה:</label>
                <select
                  value={newDonation.method}
                  onChange={(e) => handleInputChange('method', e.target.value)}
                >
                  <option value="cash">מזומן</option>
                  <option value="transfer">העברה בנקאית</option>
                  <option value="check">צ'ק</option>
                  <option value="other">אחר</option>
                </select>
              </div>
              <div className="form-group">
                <label>צריך קבלה:</label>
                <select
                  value={newDonation.needsReceipt ? 'yes' : 'no'}
                  onChange={(e) => handleInputChange('needsReceipt', e.target.value === 'yes')}
                >
                  <option value="no">לא</option>
                  <option value="yes">כן</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>טלפון:</label>
                <input
                  type="text"
                  value={newDonation.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>כתובת:</label>
                <input
                  type="text"
                  value={newDonation.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>הערות:</label>
                <input
                  type="text"
                  value={newDonation.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>
            </div>

            <div className="form-row" style={{ justifyContent: 'center' }}>
              <button className="btn btn-success" onClick={saveDonation}>
                {editingId ? 'עדכן תרומה' : 'רשום תרומה'}
              </button>
              {editingId && (
                <button
                  className="btn"
                  onClick={() => {
                    setEditingId(null)
                    setNewDonation({
                      donorName: '',
                      donorLastName: '',
                      amount: 0,
                      donationDate: '',
                      method: 'cash',
                      phone: '',
                      address: '',
                      notes: '',
                      needsReceipt: false
                    })
                  }}
                  style={{ backgroundColor: '#e74c3c', color: 'white', marginRight: '10px' }}
                >
                  ביטול עריכה
                </button>
              )}
            </div>
          </div>

          {donations.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>מספר</th>
                  <th>שם התורם</th>
                  <th>סכום</th>
                  <th>תאריך</th>
                  <th>אופן תרומה</th>
                  <th>טלפון</th>
                  <th>קבלה</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((donation) => (
                  <tr key={donation.id}>
                    <td>{donation.id}</td>
                    <td>{donation.donorName} {donation.donorLastName}</td>
                    <td>₪{donation.amount.toLocaleString()}</td>
                    <td>
                      {db.getSettings().showHebrewDates ? 
                        formatCombinedDate(donation.donationDate) : 
                        new Date(donation.donationDate).toLocaleDateString('he-IL')
                      }
                    </td>
                    <td>
                      {donation.method === 'cash' ? 'מזומן' :
                        donation.method === 'transfer' ? 'העברה' :
                          donation.method === 'check' ? 'צ\'ק' : 'אחר'}
                    </td>
                    <td>{donation.phone}</td>
                    <td>{donation.needsReceipt ? 'כן' : 'לא'}</td>
                    <td>
                      <button
                        onClick={() => {
                          setNewDonation(donation)
                          setEditingId(donation.id)
                        }}
                        style={{
                          padding: '5px 10px',
                          fontSize: '12px',
                          backgroundColor: '#f39c12',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          marginLeft: '5px'
                        }}
                      >
                        ✏️ ערוך
                      </button>
                      <button
                        onClick={() => generateReceipt(donation)}
                        style={{
                          padding: '5px 10px',
                          fontSize: '12px',
                          backgroundColor: '#27ae60',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          marginLeft: '5px'
                        }}
                      >
                        📄 קבלה
                      </button>
                      <button
                        onClick={() => {
                          showConfirmModal({
                            title: 'מחיקת תרומה',
                            message: 'האם אתה בטוח שברצונך למחוק את התרומה?\nפעולה זו לא ניתנת לביטול.',
                            confirmText: 'מחק תרומה',
                            cancelText: 'ביטול',
                            type: 'danger',
                            onConfirm: () => {
                              db.deleteDonation(donation.id)
                              loadDonations()
                              showNotification('✅ התרומה נמחקה בהצלחה!')
                            }
                          })
                        }}
                        style={{
                          padding: '5px 10px',
                          fontSize: '12px',
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          marginLeft: '5px'
                        }}
                      >
                        🗑️ מחק
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <button className="back-btn" onClick={() => navigate('/')}>
        🏠
      </button>

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
            zIndex: 10000
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
              color: modalConfig.type === 'danger' ? '#e74c3c' : 
                     modalConfig.type === 'warning' ? '#f39c12' : '#3498db',
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
                  backgroundColor: modalConfig.type === 'danger' ? '#e74c3c' :
                    modalConfig.type === 'warning' ? '#f39c12' : '#3498db',
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
                onClick={() => {
                  if (modalConfig.onCancel) modalConfig.onCancel()
                  closeModal()
                }}
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
    </div>
  )
}

export default DonationsPage