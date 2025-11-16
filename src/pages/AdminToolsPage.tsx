import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../database/database'
import BlacklistManager from '../components/BlacklistManager'
import WarningLetterGenerator from '../components/WarningLetterGenerator'
import TransferredLoansReport from '../components/TransferredLoansReport'
import GuarantorDebtsReport from '../components/GuarantorDebtsReport'
import { CategoryIcons, ActionIcons, StatusIcons, MiscIcons, PeopleIcons, iconSizes } from '../components/Icons'

function AdminToolsPage() {
  const navigate = useNavigate()
  const [showBlacklistManager, setShowBlacklistManager] = useState(false)
  const [showWarningLetterGenerator, setShowWarningLetterGenerator] = useState(false)
  const [showTransferredLoansReport, setShowTransferredLoansReport] = useState(false)
  const [showGuarantorDebtsReport, setShowGuarantorDebtsReport] = useState(false)

  const refreshData = () => {
    // פונקציה לרענון נתונים אם נדרש
  }

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

  const exportData = () => {
    const data = db.exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gemach-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showNotification('✅ הנתונים יוצאו בהצלחה!')
  }

  const importData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          if (db.importData(content)) {
            showNotification('✅ הנתונים יובאו בהצלחה!')
          } else {
            showNotification('❌ שגיאה בייבוא הנתונים', 'error')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  return (
    <div className="page-container" style={{ direction: 'rtl' }}>
      <header className="header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
          <CategoryIcons.AdminTools size={iconSizes.lg} color="#9b59b6" strokeWidth={2.5} />
          כלי ניהול מתקדמים
        </h1>
        <button className="close-btn" onClick={() => navigate('/')}>×</button>
      </header>

      <div className="page-header">
        <p style={{ color: '#666', fontSize: '16px', marginTop: '10px' }}>
          כלים מתקדמים לניהול הגמ"ח - רשימה שחורה, מכתבי אזהרה ועוד
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '25px',
        padding: '20px 0'
      }}>

        {/* כרטיס הלוואות שפג תוקפן */}
        <div style={{
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          border: '2px solid #ef4444',
          borderRadius: '15px',
          padding: '25px',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)',
          transition: 'transform 0.2s ease',
          cursor: 'pointer'
        }}
          onClick={() => navigate('/overdue-loans')}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ marginBottom: '15px' }}>
            <MiscIcons.Clock size={iconSizes.xxl} color="#dc2626" strokeWidth={2} />
          </div>
          <h3 style={{ margin: '0 0 10px 0', color: '#dc2626' }}>הלוואות שפג תוקפן</h3>
          <p style={{ color: '#7f1d1d', fontSize: '14px', lineHeight: '1.5' }}>
            ריכוז הלוואות שעבר מועד הפירעון.<br />
            העברה לאחריות הערבים.
          </p>
          <button style={{
            background: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            marginTop: '15px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            צפה בהלוואות שפג תוקפן
          </button>
        </div>

        {/* כרטיס רשימה שחורה */}
        <div style={{
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          border: '2px solid #f87171',
          borderRadius: '15px',
          padding: '25px',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(248, 113, 113, 0.2)',
          transition: 'transform 0.2s ease',
          cursor: 'pointer'
        }}
          onClick={() => setShowBlacklistManager(true)}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ marginBottom: '15px' }}>
            <MiscIcons.Ban size={iconSizes.xxl} color="#dc2626" strokeWidth={2.5} />
          </div>
          <h3 style={{ margin: '0 0 10px 0', color: '#dc2626' }}>רשימה שחורה</h3>
          <p style={{ color: '#7f1d1d', fontSize: '14px', lineHeight: '1.5' }}>
            ניהול רשימת לווים וערבים בעייתיים.<br />
            חסימה, הסרה והצגת היסטוריה מלאה.
          </p>
          <button style={{
            background: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            marginTop: '15px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            פתח ניהול רשימה שחורה
          </button>
        </div>

        {/* כרטיס מכתבי אזהרה */}
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '2px solid #f59e0b',
          borderRadius: '15px',
          padding: '25px',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(245, 158, 11, 0.2)',
          transition: 'transform 0.2s ease',
          cursor: 'pointer'
        }}
          onClick={() => setShowWarningLetterGenerator(true)}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ marginBottom: '15px' }}>
            <StatusIcons.Warning size={iconSizes.xxl} color="#d97706" strokeWidth={2.5} />
          </div>
          <h3 style={{ margin: '0 0 10px 0', color: '#d97706' }}>מכתבי אזהרה</h3>
          <p style={{ color: '#92400e', fontSize: '14px', lineHeight: '1.5' }}>
            יצירת מכתבי התראה ללווים<br />
            עם פיגורים בפרעון הלוואות.
          </p>
          <button style={{
            background: '#d97706',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            marginTop: '15px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            צור מכתב אזהרה
          </button>
        </div>

        {/* כרטיס סטטיסטיקות */}
        <div style={{
          background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
          border: '2px solid #6366f1',
          borderRadius: '15px',
          padding: '25px',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(99, 102, 241, 0.2)',
          transition: 'transform 0.2s ease',
          cursor: 'pointer'
        }}
          onClick={() => navigate('/statistics')}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ marginBottom: '15px' }}>
            <CategoryIcons.Statistics size={iconSizes.xxl} color="#4f46e5" strokeWidth={2.5} />
          </div>
          <h3 style={{ margin: '0 0 10px 0', color: '#4f46e5' }}>סטטיסטיקות</h3>
          <p style={{ color: '#3730a3', fontSize: '14px', lineHeight: '1.5' }}>
            דוחות מפורטים וניתוחים<br />
            סטטיסטיים של הגמ"ח.
          </p>
          <button style={{
            background: '#4f46e5',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            marginTop: '15px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            צפה בסטטיסטיקות
          </button>
        </div>

        {/* כרטיס קבצי מס"ב - זמנית מושבת */}
        {/* <div style={{
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
          border: '2px solid #3b82f6',
          borderRadius: '15px',
          padding: '25px',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)',
          transition: 'transform 0.2s ease',
          cursor: 'pointer'
        }}
          onClick={() => navigate('/masav-generator')}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ marginBottom: '15px' }}>
            <MiscIcons.Bank size={iconSizes.xxl} color="#2563eb" strokeWidth={2.5} />
          </div>
          <h3 style={{ margin: '0 0 10px 0', color: '#2563eb' }}>קבצי מס"ב</h3>
          <p style={{ color: '#1e40af', fontSize: '14px', lineHeight: '1.5' }}>
            יצירת קבצים לגביית תשלומים<br />
            באמצעות הרשאה לחיוב חשבון.
          </p>
          <button style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            marginTop: '15px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            צור קובץ מס"ב
          </button>
        </div> */}

        {/* כרטיס היסטוריית מס"ב - זמנית מושבת */}
        {/* <div style={{
          background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
          border: '2px solid #0ea5e9',
          borderRadius: '15px',
          padding: '25px',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(14, 165, 233, 0.2)',
          transition: 'transform 0.2s ease',
          cursor: 'pointer'
        }}
          onClick={() => navigate('/masav-history')}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ marginBottom: '15px' }}>
            <MiscIcons.History size={iconSizes.xxl} color="#0284c7" strokeWidth={2.5} />
          </div>
          <h3 style={{ margin: '0 0 10px 0', color: '#0284c7' }}>היסטוריית מס"ב</h3>
          <p style={{ color: '#075985', fontSize: '14px', lineHeight: '1.5' }}>
            צפייה בקבצים שנוצרו,<br />
            אישור גבייה ורישום תשלומים.
          </p>
          <button style={{
            background: '#0284c7',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            marginTop: '15px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            צפה בהיסטוריה
          </button>
        </div> */}

        {/* כרטיס יצוא נתונים */}
        <div style={{
          background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
          border: '2px solid #22c55e',
          borderRadius: '15px',
          padding: '25px',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)',
          transition: 'transform 0.2s ease',
          cursor: 'pointer'
        }}
          onClick={exportData}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ marginBottom: '15px' }}>
            <ActionIcons.Download size={iconSizes.xxl} color="#16a34a" strokeWidth={2.5} />
          </div>
          <h3 style={{ margin: '0 0 10px 0', color: '#16a34a' }}>יצוא נתונים</h3>
          <p style={{ color: '#15803d', fontSize: '14px', lineHeight: '1.5' }}>
            יצירת קובץ גיבוי של כל<br />
            נתוני הגמ"ח למחשב.
          </p>
          <button style={{
            background: '#16a34a',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            marginTop: '15px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            📤 יצא נתונים
          </button>
        </div>

        {/* כרטיס יבוא נתונים */}
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '2px solid #eab308',
          borderRadius: '15px',
          padding: '25px',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(234, 179, 8, 0.2)',
          transition: 'transform 0.2s ease',
          cursor: 'pointer'
        }}
          onClick={importData}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ marginBottom: '15px' }}>
            <ActionIcons.Upload size={iconSizes.xxl} color="#ca8a04" strokeWidth={2.5} />
          </div>
          <h3 style={{ margin: '0 0 10px 0', color: '#ca8a04' }}>יבוא נתונים</h3>
          <p style={{ color: '#a16207', fontSize: '14px', lineHeight: '1.5' }}>
            שחזור נתונים מקובץ<br />
            גיבוי קיים.
          </p>
          <button style={{
            background: '#ca8a04',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            marginTop: '15px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            📥 יבא נתונים
          </button>
        </div>

        {/* כרטיס דוח הלוואות מועברות */}
        <div style={{
          background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
          border: '2px solid #a855f7',
          borderRadius: '15px',
          padding: '25px',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(168, 85, 247, 0.2)',
          transition: 'transform 0.2s ease',
          cursor: 'pointer'
        }}
          onClick={() => setShowTransferredLoansReport(true)}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ marginBottom: '15px' }}>
            <MiscIcons.Transfer size={iconSizes.xxl} color="#7c3aed" strokeWidth={2.5} />
          </div>
          <h3 style={{ margin: '0 0 10px 0', color: '#7c3aed' }}>הלוואות מועברות</h3>
          <p style={{ color: '#6b21a8', fontSize: '14px', lineHeight: '1.5' }}>
            דוח מפורט של הלוואות<br />
            שהועברו לאחריות ערבים.
          </p>
          <button style={{
            background: '#7c3aed',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            marginTop: '15px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            📊 צפה בדוח
          </button>
        </div>

        {/* כרטיס דוח חובות ערבים */}
        <div style={{
          background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
          border: '2px solid #fb923c',
          borderRadius: '15px',
          padding: '25px',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(251, 146, 60, 0.2)',
          transition: 'transform 0.2s ease',
          cursor: 'pointer'
        }}
          onClick={() => setShowGuarantorDebtsReport(true)}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ marginBottom: '15px' }}>
            <PeopleIcons.Guarantor size={iconSizes.xxl} color="#ea580c" strokeWidth={2.5} />
          </div>
          <h3 style={{ margin: '0 0 10px 0', color: '#ea580c' }}>חובות ערבים</h3>
          <p style={{ color: '#c2410c', fontSize: '14px', lineHeight: '1.5' }}>
            דוח מפורט של חובות ערבים<br />
            וסטטוס תשלומים.
          </p>
          <button style={{
            background: '#ea580c',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            marginTop: '15px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            🤝 צפה בדוח
          </button>
        </div>

      </div>

      {/* הערות חשובות */}
      <div style={{
        background: '#f8fafc',
        border: '2px solid #e2e8f0',
        borderRadius: '10px',
        padding: '20px',
        marginTop: '30px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>📝 הערות חשובות:</h4>
        <ul style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6' }}>
          <li>כלים אלו מיועדים למנהלי הגמ"ח בלבד</li>
          <li>כל פעולה נרשמת ומתועדת במערכת</li>
          <li>מומלץ לבצע יצוא נתונים (גיבוי) באופן קבוע</li>
          <li>יבוא נתונים ימחק את הנתונים הקיימים - שימו לב!</li>
          <li>בכל בעיה או שאלה, פנה לתמיכה טכנית</li>
        </ul>
      </div>

      {/* רכיבי המודלים */}
      <BlacklistManager
        isOpen={showBlacklistManager}
        onClose={() => setShowBlacklistManager(false)}
        onUpdate={refreshData}
      />

      {showWarningLetterGenerator && (
        <WarningLetterGenerator
          onClose={() => setShowWarningLetterGenerator(false)}
        />
      )}

      <TransferredLoansReport
        isOpen={showTransferredLoansReport}
        onClose={() => setShowTransferredLoansReport(false)}
      />

      <GuarantorDebtsReport
        isOpen={showGuarantorDebtsReport}
        onClose={() => setShowGuarantorDebtsReport(false)}
      />

      <button className="back-btn" onClick={() => navigate('/')}>
        🏠
      </button>
    </div>
  )
}

export default AdminToolsPage