import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, DatabaseBorrower, DatabaseLoan, MasavCharge } from '../database/database'
import { buildMasavFile } from '../utils/masavFileBuilder'

interface SelectedBorrower {
  borrower: DatabaseBorrower
  loans: DatabaseLoan[]
  balance: number
  amount: number
  selected: boolean
}

function MasavFileGeneratorPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [borrowers, setBorrowers] = useState<SelectedBorrower[]>([])
  const [chargeDate, setChargeDate] = useState(new Date().toISOString().split('T')[0])
  const [transactionType, setTransactionType] = useState<'504' | '505'>('504')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadBorrowers()
  }, [])

  const loadBorrowers = () => {
    const allBorrowers = db.getBorrowers()
    const allLoans = db.getLoans()

    // סנן רק לווים עם פרטי בנק מלאים והלוואות פעילות
    const eligibleBorrowers = allBorrowers
      .filter(b => 
        b.bankCode?.length === 2 && 
        b.branchNumber?.length === 3 && 
        b.accountNumber?.length === 9
      )
      .map(borrower => {
        const borrowerLoans = allLoans.filter(
          l => l.borrowerId === borrower.id && l.status === 'active'
        )
        const balance = borrowerLoans.reduce((sum, loan) => {
          return sum + db.getLoanBalance(loan.id)
        }, 0)

        return {
          borrower,
          loans: borrowerLoans,
          balance,
          amount: balance, // ברירת מחדל: כל היתרה
          selected: false
        }
      })
      .filter(b => b.balance > 0) // רק לווים עם יתרה

    setBorrowers(eligibleBorrowers)
  }

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

  const toggleBorrower = (index: number) => {
    const newBorrowers = [...borrowers]
    newBorrowers[index].selected = !newBorrowers[index].selected
    setBorrowers(newBorrowers)
  }

  const toggleAll = () => {
    const filteredBorrowers = getFilteredBorrowers()
    const allSelected = filteredBorrowers.every(b => b.selected)
    const newBorrowers = borrowers.map(b => {
      if (filteredBorrowers.includes(b)) {
        return { ...b, selected: !allSelected }
      }
      return b
    })
    setBorrowers(newBorrowers)
  }

  const updateAmount = (index: number, amount: number) => {
    const newBorrowers = [...borrowers]
    // וודא שהסכום הוא מספר תקין
    newBorrowers[index].amount = isNaN(amount) || amount < 0 ? 0 : amount
    setBorrowers(newBorrowers)
  }

  const getFilteredBorrowers = () => {
    if (!searchTerm) return borrowers
    const term = searchTerm.toLowerCase()
    return borrowers.filter(b =>
      b.borrower.firstName.toLowerCase().includes(term) ||
      b.borrower.lastName.toLowerCase().includes(term) ||
      b.borrower.idNumber.includes(term)
    )
  }

  const getSelectedBorrowers = () => borrowers.filter(b => b.selected)

  const getTotalAmount = () => getSelectedBorrowers().reduce((sum, b) => sum + b.amount, 0)

  const canProceedToStep2 = () => getSelectedBorrowers().length > 0

  const canProceedToStep3 = () => {
    const selected = getSelectedBorrowers()
    return selected.every(b => b.amount && !isNaN(b.amount) && b.amount > 0 && b.amount <= b.balance)
  }

  const canProceedToStep4 = () => {
    const date = new Date(chargeDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date >= today
  }

  const generateFile = () => {
    // בדיקת הגדרות מוסד
    const settings = db.getMasavSettings()
    if (!settings || 
        settings.institutionCode.length !== 8 || 
        settings.senderCode.length !== 5 || 
        !settings.institutionName) {
      showNotification('❌ לא הוגדרו פרטי מוסד למס"ב. אנא הגדר בהגדרות המערכת.', 'error')
      return
    }

    const selected = getSelectedBorrowers()
    
    // בדיקה שכל הסכומים תקינים
    const invalidAmounts = selected.filter(sb => !sb.amount || sb.amount <= 0)
    if (invalidAmounts.length > 0) {
      const names = invalidAmounts.map(sb => `${sb.borrower.firstName} ${sb.borrower.lastName}`).join(', ')
      showNotification(`❌ שגיאה: סכומים לא תקינים עבור: ${names}`, 'error')
      return
    }
    
    // יצירת charges
    const charges: MasavCharge[] = selected.map(sb => {
      const refNum = db.getNextReferenceNumber()
      
      return {
        borrowerId: sb.borrower.id,
        borrowerName: `${sb.borrower.firstName} ${sb.borrower.lastName}`,
        idNumber: sb.borrower.idNumber,
        bankCode: sb.borrower.bankCode!,
        branchNumber: sb.borrower.branchNumber!,
        accountNumber: sb.borrower.accountNumber!,
        amount: sb.amount,
        referenceNumber: refNum.toString(),
        chargeDate: chargeDate,
        loanId: sb.loans[0]?.id // קישור להלוואה הראשונה
      }
    })

    // בניית הקובץ
    const fileContent = buildMasavFile(settings, charges, chargeDate, transactionType)

    // שם קובץ
    const date = new Date(chargeDate)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2)
    const fileName = `Msv${day}-${month}-${year}.001`

    // שמירה בהיסטוריה
    db.addMasavFile({
      creationDate: new Date().toISOString().split('T')[0],
      chargeDate: chargeDate,
      totalAmount: getTotalAmount(),
      chargesCount: charges.length,
      charges: charges,
      fileName: fileName,
      fileContent: fileContent,
      status: 'pending'
    })

    // הורדת הקובץ
    const blob = new Blob([fileContent], { type: 'text/plain;charset=windows-1255' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showNotification(`✅ קובץ מס"ב נוצר בהצלחה!<br>הקובץ ${fileName} הורד למחשב`, 'success')

    // חזרה לדף הבית או להיסטוריה
    setTimeout(() => {
      navigate('/masav-history')
    }, 2000)
  }

  const renderProgressBar = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      padding: '20px',
      background: 'white',
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      {[1, 2, 3, 4].map(step => (
        <div key={step} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: currentStep >= step ? '#3b82f6' : '#e5e7eb',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '18px'
          }}>
            {step}
          </div>
          <div style={{ marginRight: '10px', flex: 1 }}>
            <div style={{ fontWeight: 'bold', color: currentStep >= step ? '#3b82f6' : '#9ca3af' }}>
              {step === 1 && 'בחירת לווים'}
              {step === 2 && 'הגדרת סכומים'}
              {step === 3 && 'תאריך חיוב'}
              {step === 4 && 'סיכום ואישור'}
            </div>
          </div>
          {step < 4 && (
            <div style={{
              flex: 1,
              height: '2px',
              background: currentStep > step ? '#3b82f6' : '#e5e7eb',
              marginLeft: '10px'
            }} />
          )}
        </div>
      ))}
    </div>
  )

  const renderStep1 = () => {
    const filtered = getFilteredBorrowers()
    const selected = getSelectedBorrowers()

    return (
      <div>
        <h2 style={{ color: '#2c3e50', marginBottom: '20px', textAlign: 'center' }}>
          שלב 1: בחירת לווים לגביה
        </h2>

        {borrowers.length === 0 && (
          <div style={{
            padding: '40px',
            background: '#fff3cd',
            borderRadius: '10px',
            textAlign: 'center',
            color: '#856404'
          }}>
            <h3>⚠️ אין לווים זמינים לגביה</h3>
            <p>לא נמצאו לווים עם פרטי בנק מלאים והלוואות פעילות.</p>
            <p>אנא הוסף פרטי בנק ללווים בדף הלווים.</p>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/loans')}
              style={{ marginTop: '20px' }}
            >
              מעבר לדף לווים
            </button>
          </div>
        )}

        {borrowers.length > 0 && (
          <>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="🔍 חיפוש לפי שם או ת.ז..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              />
              <button
                className="btn"
                onClick={toggleAll}
                style={{ background: '#6366f1', color: 'white' }}
              >
                {filtered.every(b => b.selected) ? '❌ בטל הכל' : '✅ בחר הכל'}
              </button>
            </div>

            <div style={{
              background: '#e0f2fe',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <strong>נבחרו:</strong> {selected.length} לווים | 
              <strong style={{ marginRight: '15px' }}>סה"כ:</strong> {db.formatCurrency(getTotalAmount())}
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {filtered.map((sb) => {
                const actualIndex = borrowers.indexOf(sb)
                return (
                  <div
                    key={sb.borrower.id}
                    onClick={() => toggleBorrower(actualIndex)}
                    style={{
                      padding: '15px',
                      background: sb.selected ? '#dbeafe' : 'white',
                      border: `2px solid ${sb.selected ? '#3b82f6' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      marginBottom: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <input
                          type="checkbox"
                          checked={sb.selected}
                          onChange={() => {}}
                          style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                            {sb.borrower.firstName} {sb.borrower.lastName}
                          </div>
                          <div style={{ fontSize: '13px', color: '#666' }}>
                            ת.ז: {sb.borrower.idNumber} | 
                            בנק: {sb.borrower.bankCode}-{sb.borrower.branchNumber}-{sb.borrower.accountNumber}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>
                          {db.formatCurrency(sb.balance)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {sb.loans.length} הלוואות פעילות
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  }

  const renderStep2 = () => {
    const selected = getSelectedBorrowers()

    return (
      <div>
        <h2 style={{ color: '#2c3e50', marginBottom: '20px', textAlign: 'center' }}>
          שלב 2: הגדרת סכומים לגביה
        </h2>

        <div style={{
          background: '#e0f2fe',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <strong>סה"כ לגביה:</strong> {db.formatCurrency(getTotalAmount())}
        </div>

        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {selected.map((sb) => {
            const actualIndex = borrowers.indexOf(sb)
            const isValid = sb.amount > 0 && sb.amount <= sb.balance

            return (
              <div
                key={sb.borrower.id}
                style={{
                  padding: '20px',
                  background: 'white',
                  border: `2px solid ${isValid ? '#e5e7eb' : '#fca5a5'}`,
                  borderRadius: '8px',
                  marginBottom: '15px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                      {sb.borrower.firstName} {sb.borrower.lastName}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      יתרה: {db.formatCurrency(sb.balance)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold', minWidth: '100px' }}>סכום לגביה:</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={sb.amount || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value)
                      updateAmount(actualIndex, isNaN(value) ? 0 : value)
                    }}
                    onBlur={(e) => {
                      // אם השדה ריק, מלא את היתרה
                      if (!e.target.value || parseFloat(e.target.value) <= 0) {
                        updateAmount(actualIndex, sb.balance)
                      }
                    }}
                    placeholder={db.formatCurrency(sb.balance)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: `2px solid ${isValid ? '#ddd' : '#ef4444'}`,
                      borderRadius: '5px',
                      fontSize: '16px'
                    }}
                  />
                  <button
                    className="btn"
                    onClick={() => updateAmount(actualIndex, sb.balance)}
                    style={{ background: '#10b981', color: 'white' }}
                  >
                    מלא
                  </button>
                </div>

                {!isValid && (
                  <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '5px' }}>
                    {sb.amount <= 0 && '⚠️ הסכום חייב להיות גדול מאפס'}
                    {sb.amount > sb.balance && '⚠️ הסכום עולה על היתרה'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderStep3 = () => {
    const today = new Date().toISOString().split('T')[0]
    const isValid = chargeDate >= today

    return (
      <div>
        <h2 style={{ color: '#2c3e50', marginBottom: '20px', textAlign: 'center' }}>
          שלב 3: הגדרות קובץ מס"ב
        </h2>

        <div style={{
          maxWidth: '500px',
          margin: '0 auto',
          padding: '30px',
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          {/* סוג תנועה */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', fontSize: '16px' }}>
              סוג תנועה:
            </label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value as '504' | '505')}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px',
                background: 'white'
              }}
            >
              <option value="504">חיוב (גביה מלקוחות)</option>
              <option value="505">זיכוי (החזר ללקוחות)</option>
            </select>
            
            <div style={{
              marginTop: '10px',
              padding: '12px',
              background: transactionType === '504' ? '#fef3c7' : '#d1fae5',
              borderRadius: '5px',
              fontSize: '13px',
              color: transactionType === '504' ? '#92400e' : '#065f46'
            }}>
              {transactionType === '504' ? (
                <>
                  <strong>חיוב:</strong> גביית תשלומים מחשבונות הלווים (למשל: החזר הלוואה, תשלום חודשי)
                </>
              ) : (
                <>
                  <strong>זיכוי:</strong> החזרת כספים לחשבונות הלווים (למשל: החזר הפקדה, ביטול גביה מיותרת)
                </>
              )}
            </div>
          </div>

          {/* תאריך */}
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', fontSize: '16px' }}>
              תאריך {transactionType === '504' ? 'חיוב' : 'זיכוי'}:
            </label>
            <input
              type="date"
              value={chargeDate}
              onChange={(e) => setChargeDate(e.target.value)}
              min={today}
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${isValid ? '#ddd' : '#ef4444'}`,
                borderRadius: '5px',
                fontSize: '16px'
              }}
            />

            {!isValid && (
              <div style={{ color: '#ef4444', marginTop: '10px', fontSize: '14px' }}>
                ⚠️ התאריך לא יכול להיות בעבר
              </div>
            )}

            <div style={{
              marginTop: '15px',
              padding: '15px',
              background: '#f0f9ff',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#0369a1'
            }}>
              <strong>💡 הסבר:</strong> התאריך שבו הבנק יבצע את הפעולה בחשבונות הלקוחות.
              מומלץ לבחור תאריך מספר ימים קדימה כדי לאפשר זמן עיבוד.
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderStep4 = () => {
    const selected = getSelectedBorrowers()
    const date = new Date(chargeDate)
    const formattedDate = date.toLocaleDateString('he-IL')

    return (
      <div>
        <h2 style={{ color: '#2c3e50', marginBottom: '20px', textAlign: 'center' }}>
          שלב 4: סיכום ואישור
        </h2>

        <div style={{
          maxWidth: '700px',
          margin: '0 auto',
          padding: '30px',
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            background: '#dbeafe',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>סיכום הקובץ</h3>
            <div style={{ fontSize: '18px' }}>
              <strong>סוג תנועה:</strong> {transactionType === '504' ? '🔴 חיוב (גביה)' : '🟢 זיכוי (החזר)'} |
              <strong style={{ marginRight: '20px' }}>מספר תנועות:</strong> {selected.length}
            </div>
            <div style={{ fontSize: '18px', marginTop: '5px' }}>
              <strong>סכום כולל:</strong> {db.formatCurrency(getTotalAmount())}
            </div>
            <div style={{ fontSize: '16px', marginTop: '10px' }}>
              <strong>תאריך ביצוע:</strong> {formattedDate}
            </div>
          </div>

          <h4 style={{ marginBottom: '15px' }}>רשימת לווים:</h4>
          <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
            {selected.map(sb => (
              <div
                key={sb.borrower.id}
                style={{
                  padding: '12px',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <span>{sb.borrower.firstName} {sb.borrower.lastName}</span>
                <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>
                  {db.formatCurrency(sb.amount)}
                </span>
              </div>
            ))}
          </div>

          <div style={{
            background: '#fef3c7',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#92400e'
          }}>
            <strong>⚠️ שים לב:</strong> לאחר יצירת הקובץ, הוא יישמר בהיסטוריה עם סטטוס "ממתין לאישור".
            לאחר העלאת הקובץ למס"ב ואישור הגביה, יש לאשר את הקובץ בהיסטוריה כדי לרשום את התשלומים.
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              className="btn btn-success"
              onClick={generateFile}
              style={{ fontSize: '18px', padding: '15px 40px' }}
            >
              🏦 צור קובץ מס"ב
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <header className="header">
        <h1>🏦 יצירת קובץ מס"ב</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/masav-validator')}
            style={{
              padding: '8px 15px',
              background: '#ffc107',
              color: '#000',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            title="בדיקת תקינות קובץ מס״ב"
          >
            🔍 ולידציה
          </button>
          <button 
            className="close-btn" 
            onClick={() => navigate(-1)}
            title="חזור מסך אחד אחורה"
          >
            ×
          </button>
        </div>
      </header>

      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {renderProgressBar()}

        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          minHeight: '500px'
        }}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '2px solid #e5e7eb'
          }}>
            <button
              className="btn"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              style={{
                background: currentStep === 1 ? '#e5e7eb' : '#6b7280',
                color: 'white'
              }}
            >
              ← הקודם
            </button>

            {currentStep < 4 && (
              <button
                className="btn btn-primary"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={
                  (currentStep === 1 && !canProceedToStep2()) ||
                  (currentStep === 2 && !canProceedToStep3()) ||
                  (currentStep === 3 && !canProceedToStep4())
                }
              >
                הבא →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* כפתור חזרה לדף הבית */}
      <button 
        onClick={() => navigate('/')}
        style={{ 
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          color: 'white',
          border: 'none',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
          transition: 'all 0.3s ease',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.6)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'
        }}
        title="חזרה לדף הבית"
      >
        🏠
      </button>
    </div>
  )
}

export default MasavFileGeneratorPage
