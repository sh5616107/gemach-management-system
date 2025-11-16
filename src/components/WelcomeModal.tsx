import { useState } from 'react'
import { CategoryIcons, iconSizes } from './Icons'

interface WelcomeModalProps {
  onClose: () => void
}

function WelcomeModal({ onClose }: WelcomeModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideWelcomeModal', 'true')
    }
    onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      direction: 'rtl'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '15px',
        padding: '30px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
      }}>
        {/* כותרת */}
        <div style={{
          textAlign: 'center',
          marginBottom: '25px',
          borderBottom: '2px solid #3498db',
          paddingBottom: '15px'
        }}>
          <h2 style={{
            color: '#3498db',
            margin: '0 0 10px 0',
            fontSize: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <CategoryIcons.Settings size={iconSizes.lg} color="#3498db" strokeWidth={2.5} />
            ברוכים הבאים למערכת ניהול הגמ"ח!
          </h2>
          <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
            גרסה 2.9.9
          </p>
        </div>

        {/* תוכן */}
        <div style={{ textAlign: 'right', lineHeight: '1.8' }}>
          <div style={{
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            border: '2px solid #2196f3'
          }}>
            <h3 style={{ color: '#1976d2', margin: '0 0 15px 0', fontSize: '20px' }}>
              💡 האם ידעת? תכונות אופציונליות בהגדרות!
            </h3>
            <p style={{ color: '#0d47a1', fontSize: '15px', marginBottom: '15px' }}>
              המערכת כוללת תכונות רבות שניתן להפעיל או לכבות לפי הצורך שלך:
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#27ae60', marginBottom: '10px', fontSize: '18px' }}>
              ⚙️ תכונות שניתן להתאים אישית:
            </h4>
            <ul style={{ paddingRight: '20px', fontSize: '15px', color: '#2c3e50' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>תאריכים עבריים</strong> - הצגת תאריכים לועזיים או עבריים
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>התראות איחור</strong> - הצגת התראות על הלוואות באיחור
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>מעקב אחר אמצעי תשלום</strong> - מעקב מפורט אחר מזומן/צ'ק/העברה
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>הלוואות מחזוריות</strong> - יצירה אוטומטית של הלוואות חוזרות
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>פרעונות אוטומטיים</strong> - רישום אוטומטי של תשלומים קבועים
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>ערכת נושא</strong> - בחירה בין מצב רגיל למצב ביצועים גבוהים
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>מטבע</strong> - בחירת סמל המטבע המועדף
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>פעולות מהירות</strong> - התאמה אישית של כפתורי הגישה המהירה
              </li>
            </ul>
          </div>

          <div style={{
            background: '#fff3cd',
            padding: '15px',
            borderRadius: '8px',
            border: '2px solid #ffc107',
            marginBottom: '20px'
          }}>
            <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
              <strong>💡 טיפ:</strong> כדי להתאים את המערכת לצרכים שלך, עבור ל
              <strong style={{ color: '#d97706' }}> הגדרות (⚙️) </strong>
              ובחר את התכונות שמתאימות לך!
            </p>
          </div>

          <div style={{
            background: '#f0f0f0',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h4 style={{ color: '#e74c3c', margin: '0 0 10px 0', fontSize: '16px' }}>
              🆕 חדש בגרסה 2.9.9:
            </h4>
            <ul style={{ paddingRight: '20px', fontSize: '14px', color: '#555', margin: 0 }}>
              <li>שיפורים כלליים ותיקוני באגים</li>
              <li>אופטימיזציה של ביצועי המערכת</li>
            </ul>
          </div>

          {/* תיבת סימון */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '15px',
            background: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <input
              type="checkbox"
              id="dontShowAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label
              htmlFor="dontShowAgain"
              style={{ cursor: 'pointer', fontSize: '15px', color: '#555' }}
            >
              אל תציג הודעה זו שוב
            </label>
          </div>

          {/* כפתור סגירה */}
          <button
            onClick={handleClose}
            style={{
              width: '100%',
              padding: '15px',
              background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            הבנתי, תודה! 👍
          </button>
        </div>
      </div>
    </div>
  )
}

export default WelcomeModal
