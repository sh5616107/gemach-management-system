import { useState, useEffect } from 'react'
import { db } from '../database/database'
import { TIME, STORAGE_KEYS, VALIDATION } from '../utils/constants'

interface LoginPageProps {
  onLogin: () => void
}

function LoginPage({ onLogin }: LoginPageProps) {
  const [password, setPassword] = useState('')
  const [passwordHint, setPasswordHint] = useState('')
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockTimer, setLockTimer] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  
  // State למודלים
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText: string
    type: 'success' | 'error' | 'info'
  } | null>(null)

  // פונקציה ליצירת קוד שחזור מאסטר
  // מבוסס על תאריך נוכחי + מזהה מכונה (hash פשוט)
  const generateMasterRecoveryCode = (): string => {
    const today = new Date()
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)
    const year = today.getFullYear()
    
    // נוסחה: YYYY + יום בשנה + מספר קסם
    const magicNumber = 7391 // מספר סודי שידוע רק למפתח
    const code = ((year * dayOfYear) + magicNumber) % 999999
    
    return code.toString().padStart(6, '0')
  }

  // בדיקת נעילה
  useEffect(() => {
    const lockUntil = localStorage.getItem(STORAGE_KEYS.LOGIN_LOCK_UNTIL)
    if (lockUntil) {
      const lockTime = parseInt(lockUntil)
      const now = Date.now()
      if (now < lockTime) {
        setIsLocked(true)
        setLockTimer(Math.ceil((lockTime - now) / TIME.SECOND))
      } else {
        localStorage.removeItem(STORAGE_KEYS.LOGIN_LOCK_UNTIL)
        localStorage.removeItem(STORAGE_KEYS.LOGIN_ATTEMPTS)
      }
    }
  }, [])

  // טיימר נעילה
  useEffect(() => {
    if (lockTimer > 0) {
      const timer = setTimeout(() => {
        setLockTimer(lockTimer - 1)
        if (lockTimer === 1) {
          setIsLocked(false)
          setAttempts(0)
          localStorage.removeItem(STORAGE_KEYS.LOGIN_LOCK_UNTIL)
          localStorage.removeItem(STORAGE_KEYS.LOGIN_ATTEMPTS)
        }
      }, TIME.SECOND)
      return () => clearTimeout(timer)
    }
  }, [lockTimer])

  const handleLogin = () => {
    if (isLocked) {
      return
    }

    const settings = db.getSettings()
    const savedPassword = settings.appPassword

    // אם אין סיסמה שמורה, זו הגדרה ראשונה
    if (!savedPassword) {
      if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
        setModalConfig({
          isOpen: true,
          title: '⚠️ סיסמה קצרה מדי',
          message: 'הסיסמה חייבת להכיל לפחות 4 תווים.\n\nאנא בחר סיסמה ארוכה יותר.',
          confirmText: 'הבנתי',
          type: 'error'
        })
        return
      }
      
      db.updateSettings({ 
        appPassword: password,
        passwordHint: passwordHint.trim() || undefined
      })
      setModalConfig({
        isOpen: true,
        title: '✅ הסיסמה נשמרה בהצלחה',
        message: 'הסיסמה החדשה נשמרה במערכת.\n\n💡 שים לב: אם תשכח את הסיסמה, תוכל להשתמש בקוד שחזור מאסטר.',
        confirmText: 'המשך',
        type: 'success'
      })
      // המתן שהמשתמש יסגור את המודל ואז התחבר
      setTimeout(() => {
        onLogin()
      }, 100)
      return
    }

    // בדיקת סיסמה
    if (password === savedPassword) {
      // סיסמה נכונה
      setAttempts(0)
      localStorage.removeItem(STORAGE_KEYS.LOGIN_ATTEMPTS)
      onLogin()
    } else {
      // סיסמה שגויה
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      localStorage.setItem(STORAGE_KEYS.LOGIN_ATTEMPTS, newAttempts.toString())

      if (newAttempts >= TIME.MAX_LOGIN_ATTEMPTS) {
        // נעילה ל-5 דקות
        const lockUntil = Date.now() + TIME.LOGIN_LOCK_DURATION
        localStorage.setItem(STORAGE_KEYS.LOGIN_LOCK_UNTIL, lockUntil.toString())
        setIsLocked(true)
        setLockTimer(300)
        setModalConfig({
          isOpen: true,
          title: '🔒 המערכת ננעלה',
          message: 'יותר מדי ניסיונות שגויים!\n\nהמערכת ננעלה ל-5 דקות.\n\nתוכל לנסות שוב לאחר מכן או להשתמש בקוד שחזור.',
          confirmText: 'הבנתי',
          type: 'error'
        })
      } else {
        // הצג רמז אם קיים
        const passwordHint = settings.passwordHint
        let message = `הסיסמה שהזנת אינה נכונה.\n\nנותרו ${TIME.MAX_LOGIN_ATTEMPTS - newAttempts} ניסיונות לפני נעילה.`
        
        if (passwordHint && passwordHint.trim() !== '') {
          message += `\n\n💡 רמז: ${passwordHint}`
        }
        
        setModalConfig({
          isOpen: true,
          title: '❌ סיסמה שגויה',
          message: message,
          confirmText: 'הבנתי',
          type: 'error'
        })
      }
      setPassword('')
    }
  }

  const handleRecovery = () => {
    const masterCode = generateMasterRecoveryCode()
    
    if (recoveryCode === masterCode) {
      // קוד שחזור נכון - אפס סיסמה
      db.updateSettings({ appPassword: '' })
      setAttempts(0)
      setIsLocked(false)
      localStorage.removeItem(STORAGE_KEYS.LOGIN_ATTEMPTS)
      localStorage.removeItem(STORAGE_KEYS.LOGIN_LOCK_UNTIL)
      setShowRecovery(false)
      setRecoveryCode('')
      setModalConfig({
        isOpen: true,
        title: '✅ הסיסמה אופסה בהצלחה',
        message: 'הסיסמה הישנה נמחקה מהמערכת.\n\nכעת תוכל להגדיר סיסמה חדשה.',
        confirmText: 'הבנתי',
        type: 'success'
      })
    } else {
      setModalConfig({
        isOpen: true,
        title: '❌ קוד שחזור שגוי',
        message: 'קוד השחזור שהזנת אינו תקין.\n\nוודא שהקוד נכון או פנה למפתח התוכנה.\n\n📧 sh5616107@gmail.com',
        confirmText: 'הבנתי',
        type: 'error'
      })
      setRecoveryCode('')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      direction: 'rtl'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        maxWidth: '400px',
        width: '90%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', color: '#667eea', marginBottom: '10px' }}>
            🔐
          </h1>
          <h2 style={{ fontSize: '24px', color: '#2c3e50', margin: '0' }}>
            {db.getGemachName() || 'מערכת ניהול גמ"ח'}
          </h2>
          <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
            {db.getSettings().appPassword ? 'הזן סיסמה להמשך' : 'הגדר סיסמה חדשה'}
          </p>
        </div>

        {!showRecovery ? (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#2c3e50',
                fontWeight: 'bold'
              }}>
                סיסמה:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLocked && handleLogin()}
                disabled={isLocked}
                placeholder="הזן סיסמה..."
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  letterSpacing: '2px'
                }}
                autoFocus
              />
            </div>

            {!db.getSettings().appPassword && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#2c3e50',
                  fontWeight: 'bold'
                }}>
                  רמז לסיסמה (אופציונלי):
                </label>
                <input
                  type="text"
                  value={passwordHint}
                  onChange={(e) => setPasswordHint(e.target.value)}
                  placeholder="למשל: שם הכלב שלי..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    boxSizing: 'border-box',
                    textAlign: 'right'
                  }}
                />
                <p style={{ 
                  fontSize: '12px', 
                  color: '#666', 
                  margin: '5px 0 0 0',
                  textAlign: 'right'
                }}>
                  💡 הרמז יוצג אם תשכח את הסיסמה
                </p>
              </div>
            )}

            {isLocked && (
              <div style={{
                background: '#fee',
                border: '2px solid #e74c3c',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px',
                textAlign: 'center',
                color: '#c0392b'
              }}>
                <strong>🔒 המערכת ננעלה</strong>
                <p style={{ margin: '10px 0 0 0' }}>
                  נותרו {Math.floor(lockTimer / 60)}:{(lockTimer % 60).toString().padStart(2, '0')} דקות
                </p>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={isLocked || !password}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'white',
                background: isLocked || !password ? '#95a5a6' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '8px',
                cursor: isLocked || !password ? 'not-allowed' : 'pointer',
                marginBottom: '15px'
              }}
            >
              {db.getSettings().appPassword ? '🔓 כניסה' : '✅ הגדר סיסמה'}
            </button>

            {!db.getSettings().appPassword && (
              <>
                <button
                  onClick={() => {
                    if (dontShowAgain) {
                      localStorage.setItem(STORAGE_KEYS.SKIP_PASSWORD_SETUP, 'true')
                    }
                    onLogin()
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    color: '#7f8c8d',
                    background: 'transparent',
                    border: '2px dashed #bdc3c7',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: '10px'
                  }}
                >
                  ⏭️ דלג לעת עתה
                </button>
                
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  color: '#666',
                  cursor: 'pointer',
                  marginBottom: '15px'
                }}>
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>אל תבקש ממני להגדיר סיסמה שוב</span>
                </label>
              </>
            )}

            {db.getSettings().appPassword && (
              <button
                onClick={() => setShowRecovery(true)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  color: '#667eea',
                  background: 'transparent',
                  border: '1px solid #667eea',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                🔑 שכחתי את הסיסמה
              </button>
            )}
          </>
        ) : (
          <>
            <div style={{
              background: '#e8f4f8',
              border: '2px solid #3498db',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px',
              fontSize: '13px',
              lineHeight: '1.6'
            }}>
              <strong>💡 קוד שחזור מאסטר:</strong>
              <p style={{ margin: '10px 0 0 0' }}>
                פנה למפתח התוכנה עם התאריך הנוכחי והוא יספק לך קוד שחזור.
              </p>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                תאריך היום: <strong>{new Date().toLocaleDateString('he-IL')}</strong>
              </p>
              <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#2c3e50' }}>
                📧 <strong>מייל המפתח:</strong><br />
                <a href="mailto:sh5616107@gmail.com" style={{ color: '#3498db', textDecoration: 'none' }}>
                  sh5616107@gmail.com
                </a>
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#2c3e50',
                fontWeight: 'bold'
              }}>
                קוד שחזור:
              </label>
              <input
                type="text"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRecovery()}
                placeholder="הזן קוד בן 6 ספרות..."
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '20px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  letterSpacing: '4px'
                }}
                autoFocus
              />
            </div>

            <button
              onClick={handleRecovery}
              disabled={recoveryCode.length !== 6}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'white',
                background: recoveryCode.length !== 6 ? '#95a5a6' : '#27ae60',
                border: 'none',
                borderRadius: '8px',
                cursor: recoveryCode.length !== 6 ? 'not-allowed' : 'pointer',
                marginBottom: '10px'
              }}
            >
              ✅ אפס סיסמה
            </button>

            <button
              onClick={() => {
                setShowRecovery(false)
                setRecoveryCode('')
              }}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                color: '#666',
                background: 'transparent',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              ← חזור
            </button>
          </>
        )}

        <div style={{
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #eee',
          textAlign: 'center',
          fontSize: '12px',
          color: '#999'
        }}>
          <p style={{ margin: 0 }}>
            🔒 המערכת מאובטחת ומוגנת
          </p>
        </div>
      </div>

      {/* מודל הודעות */}
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
          onClick={() => setModalConfig(null)}
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
              color: modalConfig.type === 'error' ? '#e74c3c' :
                modalConfig.type === 'success' ? '#27ae60' : '#3498db',
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

            <button
              onClick={() => setModalConfig(null)}
              style={{
                backgroundColor: modalConfig.type === 'error' ? '#e74c3c' :
                  modalConfig.type === 'success' ? '#27ae60' : '#3498db',
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
          </div>
        </div>
      )}
    </div>
  )
}

export default LoginPage
