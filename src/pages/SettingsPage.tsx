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
    trackPaymentMethods: false
  })

  useEffect(() => {
    loadSettings()
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
    setSettings(db.getSettings())
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
          trackPaymentMethods: false
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

          {/* תצוגה נוכחית */}
          <div className="info-section" style={{ marginBottom: '30px' }}>
            <h3 className="info-title">📊 תצוגה נוכחית</h3>
            <div style={{
              padding: '20px',
              background: 'rgba(52, 152, 219, 0.1)',
              borderRadius: '8px',
              marginTop: '15px'
            }}>
              <p><strong>מטבע:</strong> {settings.currency === 'ILS' ? 'שקל ישראלי' : 'דולר אמריקאי'}</p>
              <p><strong>דוגמה:</strong> {settings.currencySymbol}1,000</p>
              <p><strong>תקופת הלוואה ברירת מחדל:</strong> {settings.defaultLoanPeriod} חודשים</p>
              <p><strong>התראות איחור:</strong> {settings.showOverdueWarnings ? 'מופעל' : 'כבוי'}</p>
              <p><strong>ייצוא אוטומטי:</strong> {settings.autoExport ? `מופעל (${settings.exportFrequency})` : 'כבוי'}</p>
              <p><strong>הלוואות מחזוריות:</strong> {settings.enableRecurringLoans ? 'מופעל' : 'כבוי'}</p>
              <p><strong>פרעונות מחזוריים:</strong> {settings.enableRecurringPayments ? 'מופעל' : 'כבוי'}</p>
              <p><strong>חובת מספר זהות:</strong> {settings.requireIdNumber ? 'חובה' : 'אופציונלי'}</p>
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