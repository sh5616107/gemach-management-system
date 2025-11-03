import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, DatabaseGuarantor } from '../database/database'

function GuarantorsPage() {
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

  const [guarantors, setGuarantors] = useState<DatabaseGuarantor[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [newGuarantor, setNewGuarantor] = useState({
    firstName: '',
    lastName: '',
    idNumber: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    status: 'active' as 'active' | 'blacklisted' | 'at_risk'
  })

  useEffect(() => {
    loadGuarantors()
  }, [])

  const loadGuarantors = () => {
    const allGuarantors = db.getGuarantors()
    // עדכן סטטיסטיקות לכל הערבים
    db.updateAllGuarantorStats()
    setGuarantors(allGuarantors)
    console.log('🔄 רענון טבלת ערבים:', allGuarantors.length)
  }

  const handleInputChange = (field: string, value: string) => {
    setNewGuarantor(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const saveGuarantor = () => {
    if (!newGuarantor.firstName || !newGuarantor.lastName || !newGuarantor.phone) {
      showNotification('⚠️ אנא מלא את השדות החובה: שם מלא וטלפון', 'error')
      return
    }

    // בדוק מספר זהות רק אם זה חובה
    if (db.getSettings().requireIdNumber && (!newGuarantor.idNumber || newGuarantor.idNumber.trim() === '')) {
      showNotification('⚠️ מספר זהות הוא שדה חובה (ניתן לשנות בהגדרות)', 'error')
      return
    }

    if (editingId) {
      // עדכון ערב קיים
      if (db.updateGuarantor(editingId, newGuarantor)) {
        setEditingId(null)
        showNotification('✅ הערב עודכן בהצלחה!')
      } else {
        showNotification('❌ שגיאה בעדכון הערב', 'error')
        return
      }
    } else {
      // ערב חדש
      const result = db.addGuarantor(newGuarantor)
      if ('error' in result) {
        showNotification(`❌ ${result.error}`, 'error')
        return
      } else {
        showNotification('✅ ערב חדש נוסף בהצלחה!')
      }
    }
    
    loadGuarantors()
    setNewGuarantor({
      firstName: '',
      lastName: '',
      idNumber: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      status: 'active'
    })
  }

  const editGuarantor = (guarantor: DatabaseGuarantor) => {
    setNewGuarantor({
      firstName: guarantor.firstName,
      lastName: guarantor.lastName,
      idNumber: guarantor.idNumber || '',
      phone: guarantor.phone,
      email: guarantor.email || '',
      address: guarantor.address || '',
      notes: guarantor.notes || '',
      status: guarantor.status
    })
    setEditingId(guarantor.id)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setNewGuarantor({
      firstName: '',
      lastName: '',
      idNumber: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      status: 'active'
    })
  }

  // סינון ערבים לפי חיפוש
  const filteredGuarantors = guarantors.filter(guarantor => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      guarantor.firstName.toLowerCase().includes(search) ||
      guarantor.lastName.toLowerCase().includes(search) ||
      guarantor.phone.includes(search) ||
      (guarantor.idNumber && guarantor.idNumber.includes(search)) ||
      (guarantor.email && guarantor.email.toLowerCase().includes(search))
    )
  })

  return (
    <div>
      <header className="header">
        <h1>🤝 ניהול ערבים</h1>
        <button className="close-btn" onClick={() => navigate('/')}>×</button>
      </header>

      <div className="container">
        <div className="main-content">
          <h2 style={{ color: '#2c3e50', marginBottom: '20px', textAlign: 'center' }}>
            מערכת ניהול ערבים מתקדמת
          </h2>
          <p style={{ color: '#34495e', fontSize: '16px', textAlign: 'center', marginBottom: '30px' }}>
            נהל את כל הערבים של הגמ"ח במקום אחד - עם מעקב אחר ערבויות פעילות וסיכונים
          </p>
          
          {/* סטטיסטיקות מהירות */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px', 
            marginBottom: '30px' 
          }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #3498db, #2980b9)', 
              color: 'white', 
              padding: '20px', 
              borderRadius: '10px', 
              textAlign: 'center' 
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{guarantors.length}</h3>
              <p style={{ margin: 0, fontSize: '14px' }}>סה"כ ערבים</p>
            </div>
            <div style={{ 
              background: 'linear-gradient(135deg, #27ae60, #229954)', 
              color: 'white', 
              padding: '20px', 
              borderRadius: '10px', 
              textAlign: 'center' 
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
                {guarantors.filter(g => g.status === 'active').length}
              </h3>
              <p style={{ margin: 0, fontSize: '14px' }}>ערבים פעילים</p>
            </div>
            <div style={{ 
              background: 'linear-gradient(135deg, #f39c12, #e67e22)', 
              color: 'white', 
              padding: '20px', 
              borderRadius: '10px', 
              textAlign: 'center' 
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
                {guarantors.filter(g => g.status === 'at_risk').length}
              </h3>
              <p style={{ margin: 0, fontSize: '14px' }}>ערבים בסיכון</p>
            </div>
            <div style={{ 
              background: 'linear-gradient(135deg, #e74c3c, #c0392b)', 
              color: 'white', 
              padding: '20px', 
              borderRadius: '10px', 
              textAlign: 'center' 
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
                {guarantors.reduce((sum, g) => sum + g.activeGuarantees, 0)}
              </h3>
              <p style={{ margin: 0, fontSize: '14px' }}>ערבויות פעילות</p>
            </div>
          </div>

          {/* חיפוש */}
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="🔍 חפש ערב לפי שם, טלפון או מספר זהות..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                marginBottom: '10px'
              }}
            />
          </div>
          
          <div className="form-container" style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50', textAlign: 'center' }}>
              {editingId ? 'עריכת ערב' : 'הוספת ערב חדש'}
            </h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>שם פרטי: <span style={{ color: '#e74c3c' }}>*</span></label>
                <input 
                  type="text" 
                  value={newGuarantor.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="הכנס שם פרטי"
                />
              </div>
              <div className="form-group">
                <label>שם משפחה: <span style={{ color: '#e74c3c' }}>*</span></label>
                <input 
                  type="text" 
                  value={newGuarantor.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="הכנס שם משפחה"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>טלפון: <span style={{ color: '#e74c3c' }}>*</span></label>
                <input 
                  type="text" 
                  value={newGuarantor.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="הכנס מספר טלפון"
                />
              </div>
              <div className="form-group">
                <label>
                  מספר זהות: {db.getSettings().requireIdNumber && <span style={{ color: '#e74c3c' }}>*</span>}
                  <span 
                    style={{ 
                      fontSize: '12px', 
                      color: '#666', 
                      marginRight: '5px',
                      cursor: 'help'
                    }}
                    title={db.getSettings().requireIdNumber ? 
                      "מספר זהות ישראלי תקין עם ספרת ביקורת נכונה (חובה)" : 
                      "מספר זהות ישראלי תקין עם ספרת ביקורת נכונה (אופציונלי)"
                    }
                  >
                    ℹ️
                  </span>
                </label>
                <input
                  type="text"
                  value={newGuarantor.idNumber}
                  onChange={(e) => {
                    const cleanValue = e.target.value.replace(/[^\d\s-]/g, '')
                    handleInputChange('idNumber', cleanValue)
                  }}
                  placeholder={db.getSettings().requireIdNumber ? "דוגמה: 123456782" : "דוגמה: 123456782 (אופציונלי)"}
                  maxLength={11}
                  style={{
                    borderColor: newGuarantor.idNumber && !db.validateIsraeliId(newGuarantor.idNumber) ? '#e74c3c' : undefined
                  }}
                />
                {newGuarantor.idNumber && (
                  <small style={{ 
                    color: db.validateIsraeliId(newGuarantor.idNumber) ? '#27ae60' : '#e74c3c',
                    fontSize: '12px',
                    display: 'block',
                    marginTop: '2px'
                  }}>
                    {(() => {
                      const cleanId = newGuarantor.idNumber.replace(/[\s-]/g, '')
                      if (cleanId.length !== 9) {
                        return `נדרשות 9 ספרות (יש ${cleanId.length})`
                      } else if (db.validateIsraeliId(newGuarantor.idNumber)) {
                        return '✓ מספר זהות תקין'
                      } else {
                        return '❌ מספר זהות לא תקין (ספרת ביקורת שגויה)'
                      }
                    })()}
                  </small>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>כתובת:</label>
                <input 
                  type="text" 
                  value={newGuarantor.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="הכנס כתובת (אופציונלי)"
                />
              </div>
              <div className="form-group">
                <label>אימייל:</label>
                <input 
                  type="email" 
                  value={newGuarantor.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="הכנס אימייל (אופציונלי)"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>הערות:</label>
                <textarea 
                  value={newGuarantor.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="הערות נוספות (אופציונלי)"
                  rows={3}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>
            
            <div className="form-row" style={{ justifyContent: 'center' }}>
              <button className="btn btn-success" onClick={saveGuarantor}>
                {editingId ? '💾 עדכן ערב' : '➕ הוסף ערב'}
              </button>
              {editingId && (
                <button 
                  className="btn" 
                  onClick={cancelEdit}
                  style={{ backgroundColor: '#e74c3c', color: 'white', marginRight: '10px' }}
                >
                  ❌ ביטול עריכה
                </button>
              )}
            </div>
          </div>

          {filteredGuarantors.length > 0 && (
            <div>
              <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>
                רשימת ערבים ({filteredGuarantors.length})
              </h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>מספר</th>
                    <th>שם מלא</th>
                    <th>טלפון</th>
                    <th>מספר זהות</th>
                    <th>ערבויות פעילות</th>
                    <th>סיכון כולל</th>
                    <th>סטטוס</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuarantors.map((guarantor) => (
                    <tr key={guarantor.id}>
                      <td>{guarantor.id}</td>
                      <td>
                        <div style={{ fontWeight: 'bold' }}>
                          {guarantor.firstName} {guarantor.lastName}
                        </div>
                        {guarantor.email && (
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            📧 {guarantor.email}
                          </div>
                        )}
                      </td>
                      <td>
                        <div>{guarantor.phone}</div>
                        {guarantor.address && (
                          <div style={{ fontSize: '11px', color: '#666' }}>
                            📍 {guarantor.address}
                          </div>
                        )}
                      </td>
                      <td>{db.formatIdNumber(guarantor.idNumber || '')}</td>
                      <td style={{ 
                        color: guarantor.activeGuarantees > 0 ? '#e74c3c' : '#27ae60',
                        fontWeight: 'bold',
                        textAlign: 'center'
                      }}>
                        {guarantor.activeGuarantees}
                      </td>
                      <td style={{ 
                        color: guarantor.totalRisk > 50000 ? '#e74c3c' : 
                               guarantor.totalRisk > 20000 ? '#f39c12' : '#27ae60',
                        fontWeight: 'bold',
                        textAlign: 'center'
                      }}>
                        ₪{guarantor.totalRisk.toLocaleString()}
                      </td>
                      <td>
                        <span style={{
                          background: guarantor.status === 'active' ? '#27ae60' : 
                                     guarantor.status === 'at_risk' ? '#f39c12' : '#e74c3c',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}>
                          {guarantor.status === 'active' ? '✅ פעיל' : 
                           guarantor.status === 'at_risk' ? '⚠️ בסיכון גבוה' : '🚫 חסום'}
                        </span>
                        {guarantor.notes && (
                          <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                            📝 {guarantor.notes.length > 20 ? guarantor.notes.substring(0, 20) + '...' : guarantor.notes}
                          </div>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => editGuarantor(guarantor)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            backgroundColor: '#f39c12',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginLeft: '5px'
                          }}
                          title="ערוך פרטי ערב"
                        >
                          ✏️ ערוך
                        </button>
                        <button
                          onClick={() => {
                            if (guarantor.activeGuarantees > 0) {
                              showNotification('❌ לא ניתן למחוק ערב עם ערבויות פעילות', 'error')
                              return
                            }
                            
                            if (window.confirm(`האם אתה בטוח שברצונך למחוק את הערב ${guarantor.firstName} ${guarantor.lastName}?\n\nפעולה זו לא ניתנת לביטול.`)) {
                              if (db.deleteGuarantor(guarantor.id)) {
                                loadGuarantors()
                                showNotification('✅ הערב נמחק בהצלחה!')
                              } else {
                                showNotification('❌ שגיאה במחיקת הערב', 'error')
                              }
                            }
                          }}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                          title="מחק ערב (רק אם אין ערבויות פעילות)"
                        >
                          🗑️ מחק
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredGuarantors.length === 0 && searchTerm && (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#666',
              background: '#f8f9fa',
              borderRadius: '8px',
              margin: '20px 0'
            }}>
              <h3>🔍 לא נמצאו ערבים</h3>
              <p>לא נמצאו ערבים התואמים לחיפוש "{searchTerm}"</p>
              <button 
                onClick={() => setSearchTerm('')}
                className="btn btn-primary"
                style={{ marginTop: '10px' }}
              >
                נקה חיפוש
              </button>
            </div>
          )}

          {guarantors.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#666',
              background: '#f8f9fa',
              borderRadius: '8px',
              margin: '20px 0'
            }}>
              <h3>🤝 אין ערבים במערכת</h3>
              <p>התחל בהוספת הערב הראשון באמצעות הטופס למעלה</p>
            </div>
          )}
        </div>
      </div>

      <button className="back-btn" onClick={() => navigate('/')}>
        🏠
      </button>
    </div>
  )
}

export default GuarantorsPage