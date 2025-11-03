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
  const [showHistory, setShowHistory] = useState(false)
  const [blacklistHistory, setBlacklistHistory] = useState<DatabaseBlacklistEntry[]>([])
  const [showRemovalModal, setShowRemovalModal] = useState(false)
  const [entryToRemove, setEntryToRemove] = useState<DatabaseBlacklistEntry | null>(null)
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
    // ההיסטוריה תציג רק רשומות שהוסרו
    setBlacklistHistory(db.getBlacklistHistory().filter(entry => !entry.isActive))
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

  const openRemovalModal = (entry: DatabaseBlacklistEntry) => {
    setEntryToRemove(entry)
    setRemovalReason('')
    setShowRemovalModal(true)
  }

  const closeRemovalModal = () => {
    setShowRemovalModal(false)
    setEntryToRemove(null)
    setRemovalReason('')
  }

  const confirmRemoval = () => {
    if (!entryToRemove || !removalReason.trim()) {
      showNotification('⚠️ אנא הכנס סיבת הסרה', 'error')
      return
    }

    if (db.removeFromBlacklist(entryToRemove.type, entryToRemove.personId, removalReason.trim())) {
      showNotification('✅ הוסר מהרשימה השחורה בהצלחה!')
      loadData()
      onUpdate()
      closeRemovalModal()
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#2c3e50' }}>
              📋 רשימה שחורה נוכחית ({blacklist.length})
            </h3>
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                background: showHistory ? '#e74c3c' : '#3498db',
                color: 'white',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {showHistory ? '📋 הצג פעילים' : '📚 הצג היסטוריה'}
            </button>
          </div>

          {(showHistory ? blacklistHistory : blacklist).length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#666',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <h4>✅ {showHistory ? 'אין היסטוריה' : 'אין אנשים ברשימה השחורה'}</h4>
              <p>{showHistory ? 'עדיין לא היו חסימות' : 'זה דבר טוב! כל הלווים והערבים נקיים'}</p>
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              {(showHistory ? blacklistHistory : blacklist).map(entry => (
                <div key={entry.id} style={{
                  background: entry.isActive ? '#fff' : '#f8f9fa',
                  border: entry.isActive ? '2px solid #fee2e2' : '2px solid #e9ecef',
                  borderRadius: '10px',
                  padding: '15px',
                  marginBottom: '15px',
                  opacity: entry.isActive ? 1 : 0.7
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
                        {!entry.isActive && (
                          <span style={{
                            background: '#27ae60',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '12px'
                          }}>
                            הוסר
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                        <strong>סיבת חסימה:</strong> {entry.reason}
                      </div>

                      <div style={{ fontSize: '12px', color: '#999' }}>
                        נחסם ב-{new Date(entry.blockedDate).toLocaleDateString('he-IL')}
                        על ידי {entry.blockedBy}
                      </div>

                      {!entry.isActive && entry.removedDate && (
                        <div style={{ fontSize: '12px', color: '#27ae60', marginTop: '5px' }}>
                          הוסר ב-{new Date(entry.removedDate).toLocaleDateString('he-IL')}
                          על ידי {entry.removedBy}
                          {entry.removalReason && ` - ${entry.removalReason}`}
                        </div>
                      )}
                    </div>

                    {entry.isActive && !showHistory && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button
                          onClick={() => openRemovalModal(entry)}
                          style={{
                            background: '#27ae60',
                            color: 'white',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ✅ הסר מהרשימה
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* מודל אישור הסרה */}
      {showRemovalModal && entryToRemove && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          direction: 'rtl'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '25px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#e74c3c', textAlign: 'center' }}>
              🗑️ הסרה מרשימה שחורה
            </h3>

            <div style={{
              background: '#f8f9fa',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <strong style={{ fontSize: '16px', color: '#2c3e50' }}>
                {getPersonName(entryToRemove.type, entryToRemove.personId)}
              </strong>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                {entryToRemove.type === 'borrower' ? '👤 לווה' : '🤝 ערב'}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
                סיבת ההסרה: <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <textarea
                value={removalReason}
                onChange={(e) => setRemovalReason(e.target.value)}
                placeholder="הסבר מדוע האדם מוסר מהרשימה השחורה..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  resize: 'vertical',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={closeRemovalModal}
                style={{
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ❌ ביטול
              </button>
              <button
                onClick={confirmRemoval}
                disabled={!removalReason.trim()}
                style={{
                  background: removalReason.trim() ? '#27ae60' : '#bdc3c7',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  cursor: removalReason.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px'
                }}
              >
                ✅ אשר הסרה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BlacklistManager