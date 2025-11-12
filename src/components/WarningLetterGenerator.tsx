import { useState, useEffect } from 'react'
import { db, DatabaseLoan, DatabaseBorrower, DatabaseGuarantor, DatabaseWarningLetter } from '../database/database'
import { formatCombinedDate } from '../utils/hebrewDate'

interface WarningLetterGeneratorProps {
    onClose: () => void
    selectedLoanId?: number
}

function WarningLetterGenerator({ onClose, selectedLoanId }: WarningLetterGeneratorProps) {
    const [loans, setLoans] = useState<DatabaseLoan[]>([])
    const [borrowers, setBorrowers] = useState<DatabaseBorrower[]>([])
    const [guarantors, setGuarantors] = useState<DatabaseGuarantor[]>([])
    const [warningLetters, setWarningLetters] = useState<DatabaseWarningLetter[]>([])
    const [selectedLoan, setSelectedLoan] = useState<DatabaseLoan | null>(null)
    const [letterType, setLetterType] = useState<'borrower' | 'guarantor' | 'both'>('borrower')
    const [recipientType, setRecipientType] = useState<'borrower' | 'guarantor'>('borrower')
    const [recipientId, setRecipientId] = useState<number>(0)
    const [customContent, setCustomContent] = useState('')
    const [method, setMethod] = useState<'print' | 'email' | 'sms' | 'phone'>('print')
    const [showPreview, setShowPreview] = useState(false)
    const [previewContent, setPreviewContent] = useState('')

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

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        if (selectedLoanId) {
            const loan = loans.find(l => l.id === selectedLoanId)
            if (loan) {
                setSelectedLoan(loan)
                setRecipientId(loan.borrowerId)
            }
        }
    }, [selectedLoanId, loans])

    const loadData = () => {
        setLoans(db.getLoans().filter(loan => loan.status === 'active'))
        setBorrowers(db.getBorrowers())
        setGuarantors(db.getGuarantors())
        setWarningLetters(db.getWarningLetters())
    }

    const generatePreview = () => {
        if (!selectedLoan) {
            showNotification('⚠️ אנא בחר הלוואה', 'error')
            return
        }

        const borrower = borrowers.find(b => b.id === selectedLoan.borrowerId)
        if (!borrower) {
            showNotification('⚠️ לא נמצא לווה', 'error')
            return
        }

        const overdueDays = Math.floor((new Date().getTime() - new Date(selectedLoan.returnDate).getTime()) / (1000 * 60 * 60 * 24))
        const paidAmount = db.getTotalPaidAmount(selectedLoan.id)
        const remainingAmount = selectedLoan.amount - paidAmount
        const gemachName = db.getGemachName()
        const settings = db.getSettings()

        let content = customContent
        if (!content) {
            if (recipientType === 'borrower') {
                content = `
שלום ${borrower.firstName} ${borrower.lastName},

אנו פונים אליך בנוגע להלוואה מספר ${selectedLoan.id} בסכום ${selectedLoan.amount.toLocaleString()} ש"ח.

תאריך החזרה שנקבע: ${settings.showHebrewDates ? formatCombinedDate(selectedLoan.returnDate) : new Date(selectedLoan.returnDate).toLocaleDateString('he-IL')}
${overdueDays > 0 ? `ימי איחור: ${overdueDays}` : 'סטטוס: בתוקף'}
סכום שנותר להחזרה: ${remainingAmount.toLocaleString()} ש"ח

${overdueDays > 0 ?
                        'אנא פנה אלינו להסדרת ההחזרה בהקדם האפשרי.' :
                        'זוהי תזכורת ידידותית לקראת תאריך ההחזרה.'
                    }

בברכה,
גמ"ח ${gemachName}
        `.trim()
            } else {
                const guarantor = guarantors.find(g => g.id === recipientId)
                if (!guarantor) {
                    showNotification('⚠️ לא נמצא ערב', 'error')
                    return
                }

                content = `
שלום ${guarantor.firstName} ${guarantor.lastName},

אנו פונים אליך כערב להלוואה מספר ${selectedLoan.id} של ${borrower.firstName} ${borrower.lastName}.

פרטי ההלוואה:
סכום: ${selectedLoan.amount.toLocaleString()} ש"ח
תאריך החזרה: ${settings.showHebrewDates ? formatCombinedDate(selectedLoan.returnDate) : new Date(selectedLoan.returnDate).toLocaleDateString('he-IL')}
${overdueDays > 0 ? `ימי איחור: ${overdueDays}` : 'סטטוס: בתוקף'}
סכום שנותר: ${remainingAmount.toLocaleString()} ש"ח

${overdueDays > 0 ?
                        'כערב להלוואה זו, אנו מבקשים את עזרתך ביצירת קשר עם הלווה להסדרת ההחזרה.' :
                        'זוהי תזכורת ידידותית לקראת תאריך ההחזרה.'
                    }

בברכה,
גמ"ח ${gemachName}
        `.trim()
            }
        }

        setPreviewContent(content)
        setShowPreview(true)
    }

    const sendWarningLetter = () => {
        if (!selectedLoan || !recipientId) {
            showNotification('⚠️ אנא בחר הלוואה ונמען', 'error')
            return
        }

        const result = db.createWarningLetter(
            selectedLoan.id,
            letterType,
            recipientType,
            recipientId,
            method,
            customContent || undefined
        )

        if (result) {
            showNotification('✅ מכתב התראה נשלח בהצלחה!')
            loadData()
            setCustomContent('')
            setShowPreview(false)
        } else {
            showNotification('❌ שגיאה בשליחת מכתב התראה', 'error')
        }
    }

    const printLetter = () => {
        if (!previewContent) return

        const printWindow = window.open('', '_blank', 'width=800,height=600')
        if (printWindow) {
            printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
          <head>
            <meta charset="UTF-8">
            <title>מכתב התראה</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              html, body {
                width: 100%;
                height: 100%;
                background: white;
              }
              body {
                font-family: Arial, sans-serif;
                direction: rtl;
                padding: 40px;
                line-height: 1.8;
                font-size: 16px;
                color: #000;
              }
              .header {
                text-align: center;
                margin-bottom: 40px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
              }
              .header h1 {
                font-size: 28px;
                margin-bottom: 10px;
              }
              .content {
                white-space: pre-line;
                margin-bottom: 40px;
                text-align: right;
              }
              .footer {
                text-align: center;
                margin-top: 60px;
                border-top: 1px solid #ccc;
                padding-top: 20px;
                font-size: 14px;
                color: #666;
              }
              @media print {
                @page {
                  margin: 2cm;
                  size: A4;
                }
                body {
                  padding: 0;
                  background: white !important;
                }
                * {
                  background: white !important;
                  color: black !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>מכתב התראה</h1>
              <p>גמ"ח ${db.getGemachName()}</p>
            </div>
            <div class="content">${previewContent.replace(/\n/g, '<br>')}</div>
            <div class="footer">
              <p>תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}</p>
            </div>
          </body>
        </html>
      `)
            printWindow.document.close()
            printWindow.focus()
            
            // המתן רגע ואז הדפס אוטומטית
            setTimeout(() => {
                printWindow.print()
            }, 250)
        }
    }

    const getAvailableGuarantors = () => {
        if (!selectedLoan) return []

        const loanGuarantors = []
        if (selectedLoan.guarantor1Id) {
            const guarantor1 = guarantors.find(g => g.id === selectedLoan.guarantor1Id)
            if (guarantor1) loanGuarantors.push(guarantor1)
        }
        if (selectedLoan.guarantor2Id) {
            const guarantor2 = guarantors.find(g => g.id === selectedLoan.guarantor2Id)
            if (guarantor2) loanGuarantors.push(guarantor2)
        }

        return loanGuarantors
    }

    const getPersonName = (type: 'borrower' | 'guarantor', id: number): string => {
        if (type === 'borrower') {
            const borrower = borrowers.find(b => b.id === id)
            return borrower ? `${borrower.firstName} ${borrower.lastName}` : 'לא נמצא'
        } else {
            const guarantor = guarantors.find(g => g.id === id)
            return guarantor ? `${guarantor.firstName} ${guarantor.lastName}` : 'לא נמצא'
        }
    }

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
                borderRadius: '10px',
                padding: '30px',
                maxWidth: '900px',
                maxHeight: '90vh',
                width: '90%',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                overflow: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: '#f39c12', margin: 0 }}>📧 מכתבי התראה</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '30px',
                            height: '30px',
                            cursor: 'pointer',
                            fontSize: '18px'
                        }}
                    >
                        ×
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr', gap: '20px' }}>
                    {/* טופס יצירת מכתב */}
                    <div>
                        <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>יצירת מכתב התראה</h3>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>בחר הלוואה:</label>
                            <select
                                value={selectedLoan?.id || ''}
                                onChange={(e) => {
                                    const loan = loans.find(l => l.id === Number(e.target.value))
                                    setSelectedLoan(loan || null)
                                    if (loan) {
                                        setRecipientId(loan.borrowerId)
                                        setRecipientType('borrower')
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '2px solid #ddd',
                                    borderRadius: '5px',
                                    fontSize: '14px'
                                }}
                            >
                                <option value="">בחר הלוואה</option>
                                {loans.map((loan) => {
                                    const borrower = borrowers.find(b => b.id === loan.borrowerId)
                                    const overdueDays = Math.floor((new Date().getTime() - new Date(loan.returnDate).getTime()) / (1000 * 60 * 60 * 24))
                                    const statusIcon = overdueDays > 0 ? '🔴' : overdueDays > -7 ? '🟡' : '🟢'

                                    return (
                                        <option key={loan.id} value={loan.id}>
                                            {statusIcon} הלוואה #{loan.id} - {borrower ? `${borrower.firstName} ${borrower.lastName}` : 'לא ידוע'} - ₪{loan.amount.toLocaleString()}
                                            {overdueDays > 0 && ` (איחור ${overdueDays} ימים)`}
                                        </option>
                                    )
                                })}
                            </select>
                        </div>

                        {selectedLoan && (
                            <>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>סוג מכתב:</label>
                                    <select
                                        value={letterType}
                                        onChange={(e) => setLetterType(e.target.value as 'borrower' | 'guarantor' | 'both')}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '2px solid #ddd',
                                            borderRadius: '5px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        <option value="borrower">ללווה בלבד</option>
                                        <option value="guarantor">לערב בלבד</option>
                                        <option value="both">ללווה ולערב</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>נמען:</label>
                                    <select
                                        value={recipientType}
                                        onChange={(e) => {
                                            setRecipientType(e.target.value as 'borrower' | 'guarantor')
                                            if (e.target.value === 'borrower') {
                                                setRecipientId(selectedLoan.borrowerId)
                                            } else {
                                                const availableGuarantors = getAvailableGuarantors()
                                                setRecipientId(availableGuarantors.length > 0 ? availableGuarantors[0].id : 0)
                                            }
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '2px solid #ddd',
                                            borderRadius: '5px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        <option value="borrower">🏃‍♂️ לווה</option>
                                        <option value="guarantor">🤝 ערב</option>
                                    </select>
                                </div>

                                {recipientType === 'borrower' && (
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>לווה:</label>
                                        <input
                                            type="text"
                                            value={getPersonName('borrower', selectedLoan.borrowerId)}
                                            disabled
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '2px solid #ddd',
                                                borderRadius: '5px',
                                                fontSize: '14px',
                                                background: '#f8f9fa'
                                            }}
                                        />
                                    </div>
                                )}

                                {recipientType === 'guarantor' && (
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>בחר ערב:</label>
                                        <select
                                            value={recipientId}
                                            onChange={(e) => setRecipientId(Number(e.target.value))}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '2px solid #ddd',
                                                borderRadius: '5px',
                                                fontSize: '14px'
                                            }}
                                        >
                                            <option value={0}>בחר ערב</option>
                                            {getAvailableGuarantors().map((guarantor) => (
                                                <option key={guarantor.id} value={guarantor.id}>
                                                    {guarantor.firstName} {guarantor.lastName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>אמצעי שליחה:</label>
                                    <select
                                        value={method}
                                        onChange={(e) => setMethod(e.target.value as 'print' | 'email' | 'sms' | 'phone')}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '2px solid #ddd',
                                            borderRadius: '5px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        <option value="print">🖨️ הדפסה</option>
                                        <option value="email">📧 אימייל</option>
                                        <option value="sms">📱 SMS</option>
                                        <option value="phone">📞 טלפון</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        תוכן מותאם אישית (אופציונלי):
                                    </label>
                                    <textarea
                                        value={customContent}
                                        onChange={(e) => setCustomContent(e.target.value)}
                                        placeholder="השאר ריק לתוכן אוטומטי, או כתב תוכן מותאם אישית..."
                                        rows={6}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '2px solid #ddd',
                                            borderRadius: '5px',
                                            fontSize: '14px',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                    <button
                                        onClick={generatePreview}
                                        style={{
                                            background: '#3498db',
                                            color: 'white',
                                            border: 'none',
                                            padding: '12px 20px',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        👁️ תצוגה מקדימה
                                    </button>
                                    <button
                                        onClick={sendWarningLetter}
                                        disabled={!showPreview}
                                        style={{
                                            background: showPreview ? '#27ae60' : '#95a5a6',
                                            color: 'white',
                                            border: 'none',
                                            padding: '12px 20px',
                                            borderRadius: '5px',
                                            cursor: showPreview ? 'pointer' : 'not-allowed',
                                            fontSize: '14px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        📧 שלח מכתב
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* תצוגה מקדימה */}
                    {showPreview && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3 style={{ color: '#2c3e50', margin: 0 }}>תצוגה מקדימה</h3>
                                <button
                                    onClick={printLetter}
                                    style={{
                                        background: '#9b59b6',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    🖨️ הדפס
                                </button>
                            </div>
                            <div style={{
                                border: '2px solid #ddd',
                                borderRadius: '8px',
                                padding: '20px',
                                background: '#f8f9fa',
                                whiteSpace: 'pre-line',
                                lineHeight: '1.6',
                                fontSize: '14px',
                                maxHeight: '400px',
                                overflowY: 'auto'
                            }}>
                                {previewContent}
                            </div>
                        </div>
                    )}
                </div>

                {/* היסטוריית מכתבים */}
                {warningLetters.length > 0 && (
                    <div style={{ marginTop: '30px' }}>
                        <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>
                            מכתבי התראה שנשלחו ({warningLetters.length})
                        </h3>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <thead>
                                    <tr style={{ background: '#f8f9fa' }}>
                                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>הלוואה</th>
                                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>נמען</th>
                                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>תאריך</th>
                                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>אמצעי</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {warningLetters.slice(0, 10).map((letter) => (
                                        <tr key={letter.id}>
                                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>#{letter.loanId}</td>
                                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                                {getPersonName(letter.recipientType, letter.recipientId)}
                                            </td>
                                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                                {new Date(letter.sentDate).toLocaleDateString('he-IL')}
                                            </td>
                                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                                {letter.method === 'print' ? '🖨️' :
                                                    letter.method === 'email' ? '📧' :
                                                        letter.method === 'sms' ? '📱' : '📞'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default WarningLetterGenerator