import React, { useState, useRef } from 'react'

interface LogoUploadModalProps {
  currentLogo: string | null
  onSave: (logoBase64: string) => void
  onRemove: () => void
  onClose: () => void
}

export const LogoUploadModal: React.FC<LogoUploadModalProps> = ({
  currentLogo,
  onSave,
  onRemove,
  onClose
}) => {
  const [previewLogo, setPreviewLogo] = useState<string | null>(currentLogo)
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // בדיקת סוג קובץ
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      setError('סוג קובץ לא נתמך. אנא בחר PNG, JPG או SVG')
      return
    }

    // בדיקת גודל קובץ (2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      setError('הקובץ גדול מדי. גודל מקסימלי: 2MB')
      return
    }

    setError('')

    // המרה ל-Base64
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setPreviewLogo(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (previewLogo) {
      onSave(previewLogo)
      onClose()
    }
  }

  const handleRemove = () => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את הלוגו?')) {
      onRemove()
      setPreviewLogo(null)
      onClose()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: '20px', color: '#2c3e50', textAlign: 'center' }}>
          🖼️ העלאת לוגו הגמ"ח
        </h2>

        {/* תצוגה מקדימה */}
        <div
          style={{
            border: '2px dashed #bdc3c7',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            minHeight: '150px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f8f9fa'
          }}
        >
          {previewLogo ? (
            <img
              src={previewLogo}
              alt="תצוגה מקדימה"
              style={{
                maxWidth: '100%',
                maxHeight: '150px',
                objectFit: 'contain'
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#7f8c8d' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🖼️</div>
              <div>אין לוגו</div>
            </div>
          )}
        </div>

        {/* הודעת שגיאה */}
        {error && (
          <div
            style={{
              backgroundColor: '#fee',
              color: '#c33',
              padding: '10px',
              borderRadius: '5px',
              marginBottom: '15px',
              textAlign: 'center'
            }}
          >
            {error}
          </div>
        )}

        {/* מידע על דרישות */}
        <div
          style={{
            backgroundColor: '#e8f5e9',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '13px'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#2e7d32' }}>
            📋 דרישות הקובץ:
          </div>
          <ul style={{ margin: 0, paddingRight: '20px' }}>
            <li>סוג: PNG, JPG, SVG</li>
            <li>גודל מקסימלי: 2MB</li>
            <li>רזולוציה מומלצת: 200-400 פיקסלים רוחב</li>
          </ul>
        </div>

        {/* כפתורים */}
        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            📁 בחר קובץ
          </button>

          {previewLogo && (
            <button
              onClick={handleSave}
              style={{
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              ✓ שמור לוגו
            </button>
          )}

          {currentLogo && (
            <button
              onClick={handleRemove}
              style={{
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              🗑️ מחק לוגו
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  )
}
