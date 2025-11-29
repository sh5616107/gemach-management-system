import React, { useState } from 'react'
import { db } from '../database/database'

interface DocumentTemplateEditorProps {
  onClose: () => void
  onSave?: () => void
}

export const DocumentTemplateEditor: React.FC<DocumentTemplateEditorProps> = ({ onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState<'loan' | 'payment' | 'deposit'>('loan')
  
  // ברירות מחדל פשוטות
  const defaultLoanText = 'מאשר בזה כי לוויתי מגמ"ח'
  const defaultPaymentText = 'תודה על הפרעון!'
  const defaultDepositText = 'מאשר בזה כי הפקדתי בגמ"ח'
  
  const [loanText, setLoanText] = useState(db.getLoanDocumentTemplate() || defaultLoanText)
  const [loanFooter, setLoanFooter] = useState(db.getLoanDocumentFooter() || '')
  const [paymentText, setPaymentText] = useState(db.getPaymentReceiptTemplate() || defaultPaymentText)
  const [paymentFooter, setPaymentFooter] = useState(db.getPaymentReceiptFooter() || '')
  const [depositText, setDepositText] = useState(db.getDepositReceiptTemplate() || defaultDepositText)
  const [depositFooter, setDepositFooter] = useState(db.getDepositReceiptFooter() || '')

  const handleSave = () => {
    db.setLoanDocumentTemplate(loanText)
    db.setLoanDocumentFooter(loanFooter)
    db.setPaymentReceiptTemplate(paymentText)
    db.setPaymentReceiptFooter(paymentFooter)
    db.setDepositReceiptTemplate(depositText)
    db.setDepositReceiptFooter(depositFooter)
    
    // הצג הודעה שלא חוסמת
    if (onSave) {
      onSave()
    }
    
    onClose()
  }

  const handleReset = (type: 'loan' | 'payment' | 'deposit') => {
    if (!window.confirm('האם אתה בטוח שברצונך לאפס את הטקסטים לברירת המחדל?')) return

    switch (type) {
      case 'loan':
        setLoanText(defaultLoanText)
        setLoanFooter('')
        break
      case 'payment':
        setPaymentText(defaultPaymentText)
        setPaymentFooter('')
        break
      case 'deposit':
        setDepositText(defaultDepositText)
        setDepositFooter('')
        break
    }
  }

  const getExampleText = (type: 'loan' | 'payment' | 'deposit') => {
    switch (type) {
      case 'loan':
        return `דוגמה לשטר הלוואה:

אני הח"מ יוסי כהן
ת.ז. 123456789
טלפון: 050-1234567

${loanText} "קרן חסד"

סכום של: 5,000 ש"ח
בתאריך: 01/01/2024
אני מתחייב להחזיר עד: 01/07/2024

ערב ראשון: משה לוי
ערב שני: דוד כהן${loanFooter ? `\n\n${loanFooter}` : ''}`
      case 'payment':
        return `דוגמה לשובר פרעון:

שובר פרעון #123
תאריך: 15/03/2024

פרטי הלווה: יוסי כהן
סכום פרעון: 1,000 ש"ח
יתרת חוב: 4,000 ש"ח

${paymentText}

גמ"ח "קרן חסד"${paymentFooter ? `\n\n${paymentFooter}` : ''}`
      case 'deposit':
        return `דוגמה לשטר הפקדה:

אני הח"מ שרה לוי
ת.ז. 987654321
טלפון: 052-9876543

${depositText} "קרן חסד"

סכום של: 10,000 ש"ח
בתאריך: 01/01/2024
תאריך החזרה משוער: 01/01/2025

תודה על ההפקדה!${depositFooter ? `\n\n${depositFooter}` : ''}`
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
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: '10px', color: '#2c3e50', textAlign: 'center' }}>
          📝 עריכת טקסטים במסמכים
        </h2>
        <p style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '14px', marginBottom: '20px' }}>
          ערוך את הטקסט הקבוע שמופיע במסמכים. הפרטים (שם, סכום וכו') יתווספו אוטומטית.
        </p>

        {/* טאבים */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #ecf0f1' }}>
          <button
            onClick={() => setActiveTab('loan')}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: activeTab === 'loan' ? '#3498db' : 'transparent',
              color: activeTab === 'loan' ? 'white' : '#2c3e50',
              border: 'none',
              borderBottom: activeTab === 'loan' ? '3px solid #2980b9' : 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '15px'
            }}
          >
            📄 שטר הלוואה
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: activeTab === 'payment' ? '#27ae60' : 'transparent',
              color: activeTab === 'payment' ? 'white' : '#2c3e50',
              border: 'none',
              borderBottom: activeTab === 'payment' ? '3px solid #229954' : 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '15px'
            }}
          >
            🧾 שובר פרעון
          </button>
          <button
            onClick={() => setActiveTab('deposit')}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: activeTab === 'deposit' ? '#9b59b6' : 'transparent',
              color: activeTab === 'deposit' ? 'white' : '#2c3e50',
              border: 'none',
              borderBottom: activeTab === 'deposit' ? '3px solid #8e44ad' : 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '15px'
            }}
          >
            💰 שטר הפקדה
          </button>
        </div>

        {/* תוכן */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* עורך */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#2c3e50' }}>ערוך טקסטים</h3>
              <button
                onClick={() => handleReset(activeTab)}
                style={{
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                🔄 אפס לברירת מחדל
              </button>
            </div>
            
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50', fontSize: '14px' }}>
              טקסט ראשי:
            </label>
            <textarea
              value={
                activeTab === 'loan' ? loanText :
                activeTab === 'payment' ? paymentText :
                depositText
              }
              onChange={(e) => {
                if (activeTab === 'loan') setLoanText(e.target.value)
                else if (activeTab === 'payment') setPaymentText(e.target.value)
                else setDepositText(e.target.value)
              }}
              placeholder="הקלד את הטקסט שיופיע במסמך..."
              style={{
                width: '100%',
                height: '100px',
                padding: '15px',
                fontSize: '16px',
                border: '2px solid #bdc3c7',
                borderRadius: '8px',
                resize: 'vertical',
                direction: 'rtl',
                marginBottom: '15px'
              }}
            />
            
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50', fontSize: '14px' }}>
              טקסט סיום (אופציונלי):
            </label>
            <textarea
              value={
                activeTab === 'loan' ? loanFooter :
                activeTab === 'payment' ? paymentFooter :
                depositFooter
              }
              onChange={(e) => {
                if (activeTab === 'loan') setLoanFooter(e.target.value)
                else if (activeTab === 'payment') setPaymentFooter(e.target.value)
                else setDepositFooter(e.target.value)
              }}
              placeholder="טקסט נוסף שיופיע בסוף המסמך (למשל: תנאים מיוחדים, הערות...)"
              style={{
                width: '100%',
                height: '100px',
                padding: '15px',
                fontSize: '16px',
                border: '2px solid #bdc3c7',
                borderRadius: '8px',
                resize: 'vertical',
                direction: 'rtl'
              }}
            />
          </div>

          {/* תצוגה מקדימה */}
          <div>
            <h3 style={{ marginBottom: '10px', color: '#2c3e50' }}>תצוגה מקדימה</h3>
            <div
              style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                border: '2px solid #e9ecef',
                height: '250px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                fontSize: '14px',
                lineHeight: '1.6',
                direction: 'rtl'
              }}
            >
              {getExampleText(activeTab)}
            </div>
          </div>
        </div>

        {/* כפתורים */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
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
            ✓ שמור טקסטים
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
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
