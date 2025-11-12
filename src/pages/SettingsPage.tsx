import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, DatabaseSettings } from '../database/database'

function SettingsPage() {
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

  const [settings, setSettings] = useState<DatabaseSettings>({
    currency: 'ILS',
    currencySymbol: '₪',
    autoExport: false,
    exportFrequency: 'weekly',
    showOverdueWarnings: true,
    defaultLoanPeriod: 12,
    theme: 'light',
    customBackgroundColor: '#87CEEB',
    headerTitle: 'מערכת לניהול גמ"ח כספים',
    footerText: 'אמר רבי אבא אמר רבי שמעון בן לקיש גדול המלוה יותר מן העושה צדקה (שבת סג.)',
    contactText: 'ניתן להפצה לזיכוי הרבים\n⭐ עולם חסד יבנה',
    enableRecurringLoans: false,
    enableRecurringPayments: false,
    requireIdNumber: false,
    showHebrewDates: false,
    showDateWarnings: true,
    trackPaymentMethods: false,
    quickActions: ['loans', 'deposits', 'donations', 'statistics', 'borrower-report', 'admin-tools'],
    enableMasav: false
  })

  // הגדרות מס"ב
  const [masavSettings, setMasavSettings] = useState({
    institutionCode: '',
    senderCode: '',
    institutionName: '',
    lastReferenceNumber: 0
  })

  useEffect(() => {
    loadSettings()
    loadMasavSettings()
  }, [])

  useEffect(() => {
    // החלפת ערכת נושא
    if (settings.theme === 'dark') {
      document.body.classList.add('dark-theme')
      document.body.classList.remove('custom-theme')
    } else if (settings.theme === 'custom') {
      document.body.classList.remove('dark-theme')
      document.body.classList.add('custom-theme')

      // החלת צבע רקע מותאם
      document.documentElement.style.setProperty('--custom-bg-color', settings.customBackgroundColor)
    } else {
      document.body.classList.remove('dark-theme')
      document.body.classList.remove('custom-theme')
    }
  }, [settings.theme, settings.customBackgroundColor])

  const loadSettings = () => {
    const currentSettings = db.getSettings()
    // וודא שיש quickActions - אם לא, הוסף ברירת מחדל
    if (!currentSettings.quickActions) {
      currentSettings.quickActions = ['loans', 'deposits', 'donations', 'statistics', 'borrower-report', 'admin-tools']
      db.updateSettings(currentSettings)
    }
    setSettings(currentSettings)
  }

  const loadMasavSettings = () => {
    const settings = db.getMasavSettings()
    if (settings) {
      setMasavSettings(settings)
    } else {
      // אם אין הגדרות, צור ברירת מחדל
      const defaultSettings = {
        institutionCode: '',
        senderCode: '',
        institutionName: '',
        lastReferenceNumber: 0
      }
      setMasavSettings(defaultSettings)
      db.updateMasavSettings(defaultSettings)
    }
  }

  const handleMasavSettingChange = (key: string, value: string | number) => {
    const newSettings = { ...masavSettings, [key]: value }
    setMasavSettings(newSettings)
  }

  const saveMasavSettings = () => {
    db.updateMasavSettings(masavSettings)
    showNotification('הגדרות מס"ב נשמרו בהצלחה', 'success')
  }

  const handleSettingChange = (key: keyof DatabaseSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }

    // עדכון סמל המטבע אוטומטית
    if (key === 'currency') {
      newSettings.currencySymbol = value === 'USD' ? '$' : '₪'
    }

    setSettings(newSettings)
    db.updateSettings(newSettings)
  }

  const exportSettings = () => {
    const settingsData = JSON.stringify(settings, null, 2)
    const blob = new Blob([settingsData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gemach-settings-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showNotification('✅ הגדרות יוצאו בהצלחה!')
  }

  const resetSettings = () => {
    showConfirmModal({
      title: 'איפוס הגדרות',
      message: 'האם אתה בטוח שברצונך לאפס את כל ההגדרות לברירת המחדל?\n\nפעולה זו תחזיר את כל ההגדרות למצב המקורי.',
      confirmText: 'אפס הגדרות',
      cancelText: 'ביטול',
      type: 'warning',
      onConfirm: () => {
        const defaultSettings: DatabaseSettings = {
          currency: 'ILS',
          currencySymbol: '₪',
          autoExport: false,
          exportFrequency: 'weekly',
          showOverdueWarnings: true,
          defaultLoanPeriod: 12,
          theme: 'light',
          customBackgroundColor: '#87CEEB',
          headerTitle: 'מערכת לניהול גמ"ח כספים',
          footerText: 'אמר רבי אבא אמר רבי שמעון בן לקיש גדול המלוה יותר מן העושה צדקה (שבת סג.)',
          contactText: 'ניתן להפצה לזיכוי הרבים\n⭐ עולם חסד יבנה',
          enableRecurringLoans: false,
          enableRecurringPayments: false,
          requireIdNumber: false,
          showHebrewDates: false,
          showDateWarnings: true,
          trackPaymentMethods: false,
          quickActions: ['loans', 'deposits', 'donations', 'statistics', 'borrower-report', 'admin-tools'],
          enableMasav: false
        }
        setSettings(defaultSettings)
        db.updateSettings(defaultSettings)
        showNotification('✅ ההגדרות אופסו לברירת המחדל!')
      }
    })
  }



  return (
    <div>
      <header className="header">
        <h1>הגדרות מערכת</h1>
        <button className="close-btn" onClick={() => navigate('/')}>×</button>
      </header>

      <div className="container">
        <div className="main-content">
          <h2 style={{ color: '#2c3e50', marginBottom: '40px' }}>הגדרות הגמ"ח</h2>

          {/* הגדרות מטבע */}
          <div className="form-container" style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>💰 הגדרות מטבע</h3>

            <div className="form-row">
              <div className="form-group">
                <label>מטבע עיקרי:</label>
                <select
                  value={settings.currency}
                  onChange={(e) => handleSettingChange('currency', e.target.value)}
                >
                  <option value="ILS">שקל ישראלי (₪)</option>
                  <option value="USD">דולר אמריקאי ($)</option>
                </select>
              </div>
              <div className="form-group">
                <label>סמל מטבע:</label>
                <input
                  type="text"
                  value={settings.currencySymbol}
                  onChange={(e) => handleSettingChange('currencySymbol', e.target.value)}
                  maxLength={3}
                />
              </div>
            </div>
          </div>

          {/* הגדרות הלוואות */}
          <div className="form-container" style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>📋 הגדרות הלוואות</h3>

            <div className="form-row">
              <div className="form-group">
                <label>תקופת הלוואה ברירת מחדל (חודשים):</label>
                <input
                  type="number"
                  value={settings.defaultLoanPeriod}
                  onChange={(e) => handleSettingChange('defaultLoanPeriod', Number(e.target.value))}
                  min="1"
                  max="120"
                />
              </div>
              <div className="form-group">
                <label>הצג התראות על הלוואות באיחור:</label>
                <select
                  value={settings.showOverdueWarnings ? 'true' : 'false'}
                  onChange={(e) => handleSettingChange('showOverdueWarnings', e.target.value === 'true')}
                >
                  <option value="true">כן</option>
                  <option value="false">לא</option>
                </select>
              </div>
            </div>
          </div>

          {/* הגדרות פונקציות מתקדמות */}
          <div className="form-container" style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>⚙️ פונקציות מתקדמות</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
              💡 פונקציות אלו מיועדות למשתמשים מתקדמים. ניתן להפעיל או לכבות אותן לפי הצורך.
            </p>

            <div className="form-row">
              <div className="form-group">
                <label>הלוואות מחזוריות:</label>
                <select
                  value={settings.enableRecurringLoans ? 'true' : 'false'}
                  onChange={(e) => handleSettingChange('enableRecurringLoans', e.target.value === 'true')}
                >
                  <option value="false">כבוי</option>
                  <option value="true">מופעל</option>
                </select>
                <small style={{ display: 'block', color: '#666', marginTop: '5px' }}>
                  הלוואות שחוזרות על עצמן באופן אוטומטי
                </small>
              </div>
              <div className="form-group">
                <label>פרעונות מחזוריים:</label>
                <select
                  value={settings.enableRecurringPayments ? 'true' : 'false'}
                  onChange={(e) => handleSettingChange('enableRecurringPayments', e.target.value === 'true')}
                >
                  <option value="false">כבוי</option>
                  <option value="true">מופעל</option>
                </select>
                <small style={{ display: 'block', color: '#666', marginTop: '5px' }}>
                  פרעונות קבועים שחוזרים על עצמם
                </small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>חובת מספר זהות:</label>
                <select
                  value={settings.requireIdNumber ? 'true' : 'false'}
                  onChange={(e) => handleSettingChange('requireIdNumber', e.target.value === 'true')}
                >
                  <option value="false">אופציונלי (מומלץ לשימוש אישי)</option>
                  <option value="true">חובה (מומלץ לגמ"ח רשמי)</option>
                </select>
                <small style={{ display: 'block', color: '#666', marginTop: '5px' }}>
                  האם לדרוש מספר זהות לכל לווה כדי למנוע כפילויות
                </small>
              </div>
              <div className="form-group">
                <label>תאריכים עבריים:</label>
                <select
                  value={settings.showHebrewDates ? 'true' : 'false'}
                  onChange={(e) => handleSettingChange('showHebrewDates', e.target.value === 'true')}
                >
                  <option value="false">כבוי</option>
                  <option value="true">מופעל</option>
                </select>
                <small style={{ display: 'block', color: '#666', marginTop: '5px' }}>
                  הצגת תאריכים עבריים לצד התאריכים הגרגוריאניים
                </small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>אזהרות חגים ושבתות:</label>
                <select
                  value={settings.showDateWarnings ? 'true' : 'false'}
                  onChange={(e) => handleSettingChange('showDateWarnings', e.target.value === 'true')}
                >
                  <option value="false">כבוי</option>
                  <option value="true">מופעל</option>
                </select>
                <small style={{ display: 'block', color: '#666', marginTop: '5px' }}>
                  התראות כשתאריך חל בשבת או בחג (לא מומלץ לשלוח תזכורות)
                </small>
              </div>
              <div className="form-group">
                <label>מעקב אמצעי תשלום:</label>
                <select
                  value={settings.trackPaymentMethods ? 'true' : 'false'}
                  onChange={(e) => handleSettingChange('trackPaymentMethods', e.target.value === 'true')}
                >
                  <option value="false">כבוי</option>
                  <option value="true">מופעל</option>
                </select>
                <small style={{ display: 'block', color: '#666', marginTop: '5px' }}>
                  מעקב מפורט אחרי אמצעי תשלום (מזומן, העברה, צ'ק, אשראי) בהלוואות, פרעונות, הפקדות ותרומות. מאפשר יצירת סטטיסטיקות מפורטות.
                </small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>מערכת מס"ב:</label>
                <select
                  value={settings.enableMasav ? 'true' : 'false'}
                  onChange={(e) => handleSettingChange('enableMasav', e.target.value === 'true')}
                >
                  <option value="false">כבוי</option>
                  <option value="true">מופעל</option>
                </select>
                <small style={{ display: 'block', color: '#666', marginTop: '5px' }}>
                  הפעלת מערכת מס"ב לגביית תשלומים אוטומטית מחשבונות בנק
                </small>
              </div>
              <div className="form-group">
                {/* שדה ריק לאיזון */}
              </div>
            </div>
          </div>

          {/* הגדרות ייצוא */}
          <div className="form-container" style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>💾 הגדרות ייצוא אוטומטי</h3>

            <div className="form-row">
              <div className="form-group">
                <label>ייצוא אוטומטי לקובץ:</label>
                <select
                  value={settings.autoExport ? 'true' : 'false'}
                  onChange={(e) => handleSettingChange('autoExport', e.target.value === 'true')}
                >
                  <option value="true">מופעל</option>
                  <option value="false">כבוי</option>
                </select>
              </div>
              <div className="form-group">
                <label>תדירות ייצוא:</label>
                <select
                  value={settings.exportFrequency}
                  onChange={(e) => handleSettingChange('exportFrequency', e.target.value)}
                  disabled={!settings.autoExport}
                >
                  <option value="daily">יומי</option>
                  <option value="weekly">שבועי</option>
                  <option value="monthly">חודשי</option>
                </select>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
              💡 ייצוא אוטומטי יוריד קובץ גיבוי לתיקיית ההורדות שלך באופן קבוע
            </p>
          </div>

          {/* הגדרות תצוגה */}
          <div className="form-container" style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>🎨 הגדרות תצוגה</h3>

            <div className="form-row">
              <div className="form-group">
                <label>ערכת נושא:</label>
                <select
                  value={settings.theme}
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                >
                  <option value="light">בהיר</option>
                  <option value="dark">כהה</option>
                  <option value="custom">מותאם אישית</option>
                </select>
              </div>
              <div className="form-group">
                <label>🚀 מצב ביצועים:</label>
                <select
                  value={localStorage.getItem('performance_mode') || 'normal'}
                  onChange={(e) => {
                    localStorage.setItem('performance_mode', e.target.value)
                    
                    // הצג הודעה ורענן אוטומטית
                    showNotification('✅ מצב ביצועים שונה! המערכת תרענן עכשיו...', 'info')
                    
                    // רענן את החלון אחרי שנייה
                    setTimeout(() => {
                      window.location.reload()
                    }, 1000)
                  }}
                >
                  <option value="normal">רגיל (עם אפקטים ויזואליים)</option>
                  <option value="light">קל (ללא אפקטים - מומלץ למחשבים חלשים)</option>
                </select>
              </div>
            </div>
            <div style={{ 
              marginTop: '15px', 
              padding: '15px', 
              backgroundColor: '#f0f9ff', 
              borderRadius: '8px',
              border: '1px solid #bfdbfe'
            }}>
              <p style={{ fontSize: '14px', color: '#1e40af', fontWeight: 'bold', marginBottom: '10px' }}>
                💡 מה ההבדל בין המצבים?
              </p>
              <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
                <p style={{ margin: '5px 0' }}>
                  <strong>מצב רגיל:</strong> כולל אנימציות רקע, אפקטי hover מתקדמים, זוהר, blur ועוד
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>מצב קל:</strong> ללא אנימציות כבדות - רק עיצוב בסיסי ונקי
                </p>
                <p style={{ margin: '10px 0 5px 0', fontSize: '12px', color: '#6b7280' }}>
                  ⚡ מצב קל משפר ביצועים ב-50-70% במחשבים חלשים
                </p>
              </div>
            </div>

            {settings.theme === 'custom' && (
              <div className="form-row">
                <div className="form-group">
                  <label>צבע רקע:</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="color"
                      value={settings.customBackgroundColor}
                      onChange={(e) => handleSettingChange('customBackgroundColor', e.target.value)}
                      style={{ width: '50px', height: '35px', border: 'none', borderRadius: '5px' }}
                    />
                    <input
                      type="text"
                      value={settings.customBackgroundColor}
                      onChange={(e) => handleSettingChange('customBackgroundColor', e.target.value)}
                      placeholder="#87CEEB"
                      style={{ width: '100px' }}
                    />
                  </div>
                </div>
              </div>
            )}


          </div>

          {/* כפתורי פעולות מהירות */}
          <div className="info-section" style={{ marginBottom: '30px' }}>
            <h3 className="info-title">⚡ כפתורי פעולות מהירות</h3>
            <p style={{ marginBottom: '15px', color: '#666' }}>
              בחר איזה כפתורים יופיעו בתפריט הפעולות המהירות בדף הבית
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '10px',
              marginTop: '15px'
            }}>
              {[
                { id: 'loans', name: '💰 הלוואות', description: 'ניהול הלוואות חדשות וקיימות' },
                { id: 'deposits', name: '🏦 הפקדות', description: 'ניהול הפקדות חדשות וקיימות' },
                { id: 'donations', name: '❤️ תרומות', description: 'ניהול תרומות חדשות וקיימות' },
                { id: 'statistics', name: '📊 סטטיסטיקות', description: 'צפייה בנתונים וגרפים' },
                { id: 'borrower-report', name: '📋 דוח לווה', description: 'יצירת דוחות מפורטים ללווים' },
                { id: 'admin-tools', name: '🔧 כלים מנהליים', description: 'כלים מתקדמים לניהול המערכת' }
              ].map(action => (
                <label key={action.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: (settings.quickActions || []).includes(action.id) ? 'rgba(52, 152, 219, 0.1)' : 'transparent'
                }}>
                  <input
                    type="checkbox"
                    checked={(settings.quickActions || []).includes(action.id)}
                    onChange={(e) => {
                      const currentQuickActions = settings.quickActions || ['loans', 'deposits', 'donations', 'statistics', 'borrower-report', 'admin-tools']
                      const newQuickActions = e.target.checked
                        ? [...currentQuickActions, action.id]
                        : currentQuickActions.filter(id => id !== action.id)
                      
                      const newSettings = { ...settings, quickActions: newQuickActions }
                      setSettings(newSettings)
                      db.updateSettings(newSettings)
                      showNotification('✅ הגדרות כפתורי פעולות מהירות נשמרו')
                    }}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{action.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{action.description}</div>
                  </div>
                </label>
              ))}
            </div>
            
            <div style={{
              marginTop: '15px',
              padding: '10px',
              backgroundColor: 'rgba(52, 152, 219, 0.1)',
              borderRadius: '5px',
              fontSize: '14px'
            }}>
              💡 <strong>טיפ:</strong> כפתורים שלא נבחרו לא יופיעו בתפריט הצף בדף הבית
            </div>
          </div>

          {/* תצוגה נוכחית */}
          <div className="info-section" style={{ marginBottom: '30px' }}>
            <h3 className="info-title">📊 תצוגה נוכחית</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
              marginTop: '15px'
            }}>
              {/* הגדרות כלליות */}
              <div style={{
                padding: '15px',
                background: 'rgba(52, 152, 219, 0.1)',
                borderRadius: '8px'
              }}>
                <h4 style={{ marginBottom: '10px', color: '#2c3e50' }}>💰 הגדרות כלליות</h4>
                <p><strong>מטבע:</strong> {settings.currency === 'ILS' ? 'שקל ישראלי' : 'דולר אמריקאי'}</p>
                <p><strong>סמל מטבע:</strong> {settings.currencySymbol}</p>
                <p><strong>דוגמה:</strong> {settings.currencySymbol}1,000</p>
                <p><strong>תקופת הלוואה ברירת מחדל:</strong> {settings.defaultLoanPeriod} חודשים</p>
                <p><strong>התראות איחור:</strong> {settings.showOverdueWarnings ? '✅ מופעל' : '❌ כבוי'}</p>
              </div>

              {/* הגדרות פונקציות מתקדמות */}
              <div style={{
                padding: '15px',
                background: 'rgba(155, 89, 182, 0.1)',
                borderRadius: '8px'
              }}>
                <h4 style={{ marginBottom: '10px', color: '#2c3e50' }}>⚙️ פונקציות מתקדמות</h4>
                <p><strong>הלוואות מחזוריות:</strong> {settings.enableRecurringLoans ? '✅ מופעל' : '❌ כבוי'}</p>
                <p><strong>פרעונות מחזוריים:</strong> {settings.enableRecurringPayments ? '✅ מופעל' : '❌ כבוי'}</p>
                <p><strong>חובת מספר זהות:</strong> {settings.requireIdNumber ? '🔒 חובה' : '🔓 אופציונלי'}</p>
                <p><strong>תאריכים עבריים:</strong> {settings.showHebrewDates ? '✅ מופעל' : '❌ כבוי'}</p>
                <p><strong>אזהרות חגים ושבתות:</strong> {settings.showDateWarnings ? '✅ מופעל' : '❌ כבוי'}</p>
                <p><strong>מעקב אמצעי תשלום:</strong> {settings.trackPaymentMethods ? '✅ מופעל' : '❌ כבוי'}</p>
                <p><strong>מערכת מס"ב:</strong> {settings.enableMasav ? '✅ מופעל' : '❌ כבוי'}</p>
              </div>

              {/* הגדרות ייצוא ותצוגה */}
              <div style={{
                padding: '15px',
                background: 'rgba(39, 174, 96, 0.1)',
                borderRadius: '8px'
              }}>
                <h4 style={{ marginBottom: '10px', color: '#2c3e50' }}>💾 ייצוא ותצוגה</h4>
                <p><strong>ייצוא אוטומטי:</strong> {settings.autoExport ? `✅ מופעל (${
                  settings.exportFrequency === 'daily' ? 'יומי' :
                  settings.exportFrequency === 'weekly' ? 'שבועי' : 'חודשי'
                })` : '❌ כבוי'}</p>
                <p><strong>ערכת נושא:</strong> {
                  settings.theme === 'light' ? '☀️ בהיר' :
                  settings.theme === 'dark' ? '🌙 כהה' : '🎨 מותאם אישית'
                }</p>
                {settings.theme === 'custom' && (
                  <p><strong>צבע רקע מותאם:</strong> <span style={{
                    display: 'inline-block',
                    width: '20px',
                    height: '20px',
                    backgroundColor: settings.customBackgroundColor,
                    border: '1px solid #ccc',
                    borderRadius: '3px',
                    verticalAlign: 'middle',
                    marginLeft: '5px'
                  }}></span> {settings.customBackgroundColor}</p>
                )}
              </div>

              {/* כפתורי פעולות מהירות */}
              <div style={{
                padding: '15px',
                background: 'rgba(243, 156, 18, 0.1)',
                borderRadius: '8px'
              }}>
                <h4 style={{ marginBottom: '10px', color: '#2c3e50' }}>⚡ פעולות מהירות</h4>
                <p><strong>כפתורים פעילים:</strong> {(settings.quickActions || []).length} מתוך 6</p>
                <div style={{ fontSize: '12px', marginTop: '5px' }}>
                  {(settings.quickActions || []).map(actionId => {
                    const actionNames: { [key: string]: string } = {
                      'loans': '💰 הלוואות',
                      'deposits': '🏦 הפקדות',
                      'donations': '❤️ תרומות',
                      'statistics': '📊 סטטיסטיקות',
                      'borrower-report': '📋 דוח לווה',
                      'admin-tools': '🔧 כלים מנהליים'
                    }
                    return actionNames[actionId] || actionId
                  }).join(', ')}
                </div>
              </div>

              {/* הגדרות מס"ב - מוצג רק אם מופעל */}
              {settings.enableMasav && (
                <div style={{
                  padding: '15px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '8px',
                  gridColumn: 'span 2'
                }}>
                  <h4 style={{ marginBottom: '15px', color: '#2c3e50' }}>🏦 הגדרות מס"ב</h4>
                
                <div style={{ display: 'grid', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      קוד מוסד/נושא (8 ספרות):
                    </label>
                    <input
                      type="text"
                      value={masavSettings.institutionCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 8)
                        handleMasavSettingChange('institutionCode', value)
                      }}
                      onBlur={saveMasavSettings}
                      placeholder="12345678"
                      maxLength={8}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                    {masavSettings.institutionCode && masavSettings.institutionCode.length !== 8 && (
                      <small style={{ color: '#e74c3c' }}>חייב להיות בדיוק 8 ספרות</small>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      מספר מוסד שולח (5 ספרות):
                    </label>
                    <input
                      type="text"
                      value={masavSettings.senderCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 5)
                        handleMasavSettingChange('senderCode', value)
                      }}
                      onBlur={saveMasavSettings}
                      placeholder="12345"
                      maxLength={5}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                    {masavSettings.senderCode && masavSettings.senderCode.length !== 5 && (
                      <small style={{ color: '#e74c3c' }}>חייב להיות בדיוק 5 ספרות</small>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      שם המוסד (עד 30 תווים):
                    </label>
                    <input
                      type="text"
                      value={masavSettings.institutionName}
                      onChange={(e) => {
                        const value = e.target.value.slice(0, 30)
                        handleMasavSettingChange('institutionName', value)
                      }}
                      onBlur={saveMasavSettings}
                      placeholder='גמ"ח חסד ואמת'
                      maxLength={30}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                    <small style={{ color: '#7f8c8d' }}>
                      {masavSettings.institutionName.length}/30 תווים
                    </small>
                  </div>

                  <div style={{
                    padding: '10px',
                    background: 'rgba(52, 152, 219, 0.1)',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}>
                    <strong>💡 הסבר:</strong> הגדרות אלו נדרשות ליצירת קבצי מס"ב לגביית תשלומים.
                    יש לקבל את הקודים מהבנק או מחברת הסליקה.
                  </div>
                </div>
                </div>
              )}
            </div>
          </div>

          {/* כפתורי פעולה */}
          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '30px'
          }}>
            <button className="btn btn-success" onClick={loadSettings}>
              🔄 רענן הגדרות
            </button>
            <button className="btn btn-primary" onClick={exportSettings}>
              📤 ייצא הגדרות
            </button>

            <button
              className="btn"
              onClick={resetSettings}
              style={{ backgroundColor: '#f39c12', color: 'white' }}
            >
              🔄 אפס לברירת מחדל
            </button>
            
            <button
              className="btn"
              onClick={() => navigate('/')}
              style={{ backgroundColor: '#27ae60', color: 'white' }}
            >
              🏠 חזור לדף הבית
            </button>
          </div>
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

export default SettingsPage