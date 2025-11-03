import { useState, useEffect } from 'react'
import { db, DatabaseBorrower, DatabaseGuarantor, DatabaseBlacklistEntry } from '../database/database'

interface BlacklistManagerProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

function BlacklistManager({ isOpen, onClose, onUpdate }: BlacklistManagerProps) {
  const [borrowers, setBorrowers] = useState<DatabaseBorrower[]>([])
  const [guarantors, setGuarantors] = useState<DatabaseGuarantor[]>([])
  const [blacklist, setBlacklist] = useState<DatabaseBlacklistEntry[]>([])
  const [selectedType, setSelectedType] = useState<'borrower' | 'guarantor'>('borrower')
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null)
  const [blockReason, setBlockReason] = useState('')
  const [removalReason, setRemovalReason] = useState('')

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
      position: fixed; top: 20px; right: 20px; z-index: 10001;
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

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  const loadData = () => {
    setBorrowers(db.getBorrowers())
    setGuarantors(db.getGuarantors())
    setBlacklist(db.getActiveBlacklist())
  }

  const addToBlacklist = () => {
    if (!selectedPersonId || !blockReason.trim()) {
      showNotification('⚠️ אנא בחר אדם והכנס סיבת חסימה', 'error')
      return
    }

    if (db.addToBlacklist(selectedType, selectedPersonId, blockReason.trim())) {
      showNotification('✅ נוסף לרשימה השחורה בהצלחה!')
      loadData()
      onUpdate()
      setSelectedPersonId(null)
      setBlockReason('')
    } else {
      showNotification('❌ שגיאה בהוספה לרשימה השחורה', 'error')
    }
  }

  const removeFromBlacklist = (entry: DatabaseBlacklistEntry) => {
    if (!removalReason.trim()) {
      showNotification('⚠️ אנא הכנס סיבת הסרה', 'error')
      return
    }

    if (db.removeFromBlacklist(entry.type, entry.personId, removalReason.trim())) {
      showNotification('✅ הוסר מהרשימה השחורה בהצלחה!')
      loadData()
      onUpdate()
      setRemovalReason('')
    } else {
      showNotification('❌ שגיאה בהסרה מהרשימה השחורה', 'error')
    }
  }

  const getPersonName = (type: 'borrower' | 'guarantor', personId: number): string => {
    if (type === 'borrower') {
      const borrower = borrowers.find(b => b.id === personId)
      return borrower ? `${borrower.firstName} ${borrower.lastName}` : 'לא נמצא'
    } else {
      const guarantor = guarantors.find(g => g.id === personId)
      return guarantor ? `${guarantor.firstName} ${guarantor.lastName}` : 'לא נמצא'
    }
  }

  const getAvailablePeople = () => {
    if (selectedType === 'borrower') {
      return borrowers.filter(b => !db.isBlacklisted('borrower', b.id))
    } else {
      return guarantors.filter(g => !db.isBlacklisted('guarantor', g.id))
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      direction: 'rtl'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '30px',
        maxWidth: '800px',
        maxHeight: '90vh',
        width: '90%',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#e74c3c' }}>🚫 ניהול רשימה שחורה</h2>
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

        <p style={{ color: '#666', marginBottom: '25px', fontSize: '16px' }}>
          כאן תוכל לנהל את הרשימה השחורה של לווים וערבים בעייתיים
        </p>

        {/* הוספה לרשימה שחורה */}
        <div style={{ 
          background: '#fff5f5', 
          padding: '20px', 
          borderRadius: '10px', 
          border: '2px solid #fee2e2',
          marginBottom: '25px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#e74c3c' }}>➕ הוספה לרשימה שחורה</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>סוג:</label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value as 'borrower' | 'guarantor')
                  setSelectedPersonId(null)
                }}
                style={{ width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '5px' }}
              >
                <option value="borrower">👤 לווה</option>
                <option value="guarantor">🤝 ערב</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                {selectedType === 'borrower' ? 'בחר לווה:' : 'בחר ערב:'}
              </label>
              <select
                value={selectedPersonId || ''}
                onChange={(e) => setSelectedPersonId(e.target.value ? Number(e.target.value) : null)}
                style={{ width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '5px' }}
              >
                <option value="">בחר...</option>
                {getAvailablePeople().map(person => (
                  <option key={person.id} value={person.id}>
                    {selectedType === 'borrower' 
                      ? `${(person as DatabaseBorrower).firstName} ${(person as DatabaseBorrower).lastName}`
                      : `${(person as DatabaseGuarantor).firstName} ${(person as DatabaseGuarantor).lastName}`
                    }
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>סיבת החסימה:</label>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="הסבר מדוע האדם נחסם (חובה)"
              rows={3}
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '2px solid #ddd', 
                borderRadius: '5px',
                resize: 'vertical'
              }}
            />
          </div>

          <button
            onClick={addToBlacklist}
            disabled={!selectedPersonId || !blockReason.trim()}
            style={{
              background: selectedPersonId && blockReason.trim() ? '#e74c3c' : '#bdc3c7',
              color: 'white',
              border: 'none',
              padding: '12px 25px',
              borderRadius: '8px',
              cursor: selectedPersonId && blockReason.trim() ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            🚫 הוסף לרשימה שחורה
          </button>
        </div>

        {/* רשימה שחורה נוכחית */}
        <div>
          <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>
            📋 רשימה שחורה נוכחית ({blacklist.length})
          </h3>
          
          {blacklist.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#666',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <h4>✅ אין אנשים ברשימה השחורה</h4>
              <p>זה דבר טוב! כל הלווים והערבים נקיים</p>
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              {blacklist.map(entry => (
                <div key={entry.id} style={{
                  background: '#fff',
                  border: '2px solid #fee2e2',
                  borderRadius: '10px',
                  padding: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '18px' }}>
                          {entry.type === 'borrower' ? '👤' : '🤝'}
                        </span>
                        <strong style={{ fontSize: '16px', color: '#2c3e50' }}>
                          {getPersonName(entry.type, entry.personId)}
                        </strong>
                        <span style={{
                          background: entry.type === 'borrower' ? '#3498db' : '#f39c12',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '12px'
                        }}>
                          {entry.type === 'borrower' ? 'לווה' : 'ערב'}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                        <strong>סיבת חסימה:</strong> {entry.reason}
                      </div>
                      
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        נחסם ב-{new Date(entry.blockedDate).toLocaleDateString('he-IL')} 
                        על ידי {entry.blockedBy}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '200px' }}>
                      <input
                        type="text"
                        placeholder="סיבת הסרה..."
                        value={removalReason}
                        onChange={(e) => setRemovalReason(e.target.value)}
                        style={{
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                      />
                      <button
                        onClick={() => removeFromBlacklist(entry)}
                        disabled={!removalReason.trim()}
                        style={{
                          background: removalReason.trim() ? '#27ae60' : '#bdc3c7',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '5px',
                          cursor: removalReason.trim() ? 'pointer' : 'not-allowed',
                          fontSize: '12px'
                        }}
                      >
                        ✅ הסר מהרשימה
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BlacklistManager