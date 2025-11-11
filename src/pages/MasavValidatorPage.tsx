import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function MasavValidatorPage() {
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState<any>(null)
  const [analysis2, setAnalysis2] = useState<any>(null)
  const [compareMode, setCompareMode] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isSecondFile = false) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        const result = analyzeFile(content)
        if (isSecondFile) {
          setAnalysis2(result)
        } else {
          setAnalysis(result)
        }
      }
      // קרא בקידוד UTF-8 (ברירת מחדל)
      reader.readAsText(file)
    }
  }

  const analyzeFile = (content: string) => {
    const lines = content.split('\r\n').filter(line => line.length > 0)
    const results: any = {
      totalLines: lines.length,
      records: [],
      rawContent: content
    }

    lines.forEach((line, index) => {
      const recordType = line[0]
      let record: any = { line: index + 1, type: recordType, length: line.length, raw: line }

      if (recordType === 'K') {
        // רשומת כותרת
        record.name = 'כותרת'
        record.fields = {
          'סוג רשומה (1)': line.substring(0, 1),
          'קוד מוסד (2-9)': line.substring(1, 9),
          'מטבע (10-11)': line.substring(9, 11),
          'תאריך חיוב (12-17)': line.substring(11, 17),
          'FILLER (18)': line.substring(17, 18),
          'מספר סידורי (19-21)': line.substring(18, 21),
          'FILLER (22)': line.substring(21, 22),
          'תאריך יצירה (23-28)': line.substring(22, 28),
          'קוד מוסד מלא (29-36)': line.substring(28, 36),
          'אפסים (37-38)': line.substring(36, 38),
          'שם מוסד (39-68)': line.substring(38, 68),
          'BLANK (69-125)': line.substring(68, 125),
          'KOT (126-128)': line.substring(125, 128)
        }
      } else if (recordType === '1') {
        // רשומת תנועה
        record.name = 'תנועה'
        record.fields = {
          'סוג רשומה (1)': line.substring(0, 1),
          'קוד מוסד (2-9)': line.substring(1, 9),
          'מטבע (10-11)': line.substring(9, 11),
          'FILLER (12-17)': line.substring(11, 17),
          'קוד בנק (18-19)': line.substring(17, 19),
          'מספר סניף (20-22)': line.substring(19, 22),
          'סוג חשבון (23-26)': line.substring(22, 26),
          'מספר חשבון (27-35)': line.substring(26, 35),
          'FILLER (36)': line.substring(35, 36),
          'מספר זהות (37-45)': line.substring(36, 45),
          'שם לקוח (46-61)': line.substring(45, 61),
          'סכום (62-74)': line.substring(61, 74),
          'אסמכתא (75-94)': line.substring(74, 94),
          'תקופה (95-102)': line.substring(94, 102),
          'קוד מלל (103-105)': line.substring(102, 105),
          'סוג תנועה (106-108)': line.substring(105, 108),
          'FILLER (109-126)': line.substring(108, 126),
          'BLANK (127-128)': line.substring(126, 128)
        }
      } else if (recordType === '5') {
        // רשומת סיכום
        record.name = 'סיכום'
        record.fields = {
          'סוג רשומה (1)': line.substring(0, 1),
          'קוד מוסד (2-9)': line.substring(1, 9),
          'מטבע (10-11)': line.substring(9, 11),
          'תאריך חיוב (12-17)': line.substring(11, 17),
          'FILLER (18)': line.substring(17, 18),
          'מספר סידורי (19-21)': line.substring(18, 21),
          'FILLER (22-36)': line.substring(21, 36),
          'סכום כולל (37-51)': line.substring(36, 51),
          'FILLER (52-58)': line.substring(51, 58),
          'מספר תנועות (59-65)': line.substring(58, 65),
          'BLANK (66-128)': line.substring(65, 128)
        }
      } else if (recordType === '9') {
        // רשומת סיום
        record.name = 'סיום'
        record.fields = {
          'תשיעיות (1-128)': line
        }
      }

      // הוסף ולידציות
      record.validations = validateRecord(record, line)
      
      results.records.push(record)
    })

    return results
  }

  const validateRecord = (record: any, line: string) => {
    const errors: string[] = []
    const warnings: string[] = []

    // בדיקת אורך
    if (line.length !== 128) {
      errors.push(`אורך שגוי: ${line.length} במקום 128`)
    }

    if (record.type === 'K') {
      // ולידציות רשומת כותרת
      if (line.substring(9, 11) !== '00') {
        warnings.push('מטבע צריך להיות 00')
      }
      if (line.substring(125, 128) !== 'KOT') {
        errors.push('חתימה צריכה להיות KOT')
      }
      // בדוק שתאריך תקין (YYMMDD)
      const chargeDate = line.substring(11, 17)
      if (!/^\d{6}$/.test(chargeDate)) {
        errors.push('תאריך חיוב לא תקין')
      }
    } else if (record.type === '1') {
      // ולידציות רשומת תנועה
      const transactionType = line.substring(105, 108)
      if (transactionType !== '504' && transactionType !== '505') {
        warnings.push(`סוג תנועה ${transactionType} לא מוכר (צריך 504 או 505)`)
      }
      // בדוק שסכום תקין
      const amount = line.substring(61, 74)
      if (!/^\d{13}$/.test(amount)) {
        errors.push('סכום לא תקין (צריך 13 ספרות)')
      }
      if (parseInt(amount) === 0) {
        errors.push('סכום לא יכול להיות 0')
      }
    } else if (record.type === '5') {
      // ולידציות רשומת סיכום
      const totalAmount = line.substring(36, 51)
      if (!/^\d{15}$/.test(totalAmount)) {
        errors.push('סכום כולל לא תקין (צריך 15 ספרות)')
      }
      const transactionCount = line.substring(58, 65)
      if (!/^\d{7}$/.test(transactionCount)) {
        errors.push('מספר תנועות לא תקין (צריך 7 ספרות)')
      }
      if (parseInt(transactionCount) === 0) {
        errors.push('מספר תנועות לא יכול להיות 0')
      }
    } else if (record.type === '9') {
      // ולידציות רשומת סיום
      if (!/^9{128}$/.test(line)) {
        errors.push('רשומת סיום צריכה להכיל 128 תשיעיות')
      }
    }

    return { errors, warnings, isValid: errors.length === 0 }
  }

  const findDifferences = (line1: string, line2: string) => {
    const diffs: { pos: number; char1: string; char2: string }[] = []
    const maxLen = Math.max(line1.length, line2.length)
    
    for (let i = 0; i < maxLen; i++) {
      if (line1[i] !== line2[i]) {
        diffs.push({
          pos: i + 1,
          char1: line1[i] || '(חסר)',
          char2: line2[i] || '(חסר)'
        })
      }
    }
    
    return diffs
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>🔍 ולידציה קובץ מס"ב (זמני)</h1>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 20px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ← חזרה
        </button>
      </div>

      <div style={{
        background: '#fff3cd',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #ffc107'
      }}>
        <strong>⚠️ דף זמני לבדיקה</strong> - דף זה נועד לבדיקת תקינות קבצי מס"ב בזמן הפיתוח
      </div>

      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>העלה קובץ מס"ב</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={compareMode}
              onChange={(e) => {
                setCompareMode(e.target.checked)
                if (!e.target.checked) {
                  setAnalysis2(null)
                }
              }}
            />
            <span>מצב השוואה</span>
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: compareMode ? '1fr 1fr' : '1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#0066cc' }}>
              {compareMode ? 'קובץ 1 (תקין)' : 'קובץ מס"ב'}
            </label>
            <input
              type="file"
              accept=".txt,.001"
              onChange={(e) => handleFileUpload(e, false)}
              style={{
                padding: '10px',
                border: '2px dashed #0066cc',
                borderRadius: '5px',
                width: '100%',
                cursor: 'pointer'
              }}
            />
          </div>

          {compareMode && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#28a745' }}>
                קובץ 2 (מהתוכנה)
              </label>
              <input
                type="file"
                accept=".txt,.001"
                onChange={(e) => handleFileUpload(e, true)}
                style={{
                  padding: '10px',
                  border: '2px dashed #28a745',
                  borderRadius: '5px',
                  width: '100%',
                  cursor: 'pointer'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {compareMode && analysis && analysis2 && (
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h3>🔍 השוואה בין קבצים</h3>
          
          {analysis.records.map((record1: any, index: number) => {
            const record2 = analysis2.records[index]
            if (!record2) return null
            
            const diffs = findDifferences(record1.raw, record2.raw)
            
            if (diffs.length === 0) {
              return (
                <div key={index} style={{
                  padding: '10px',
                  background: '#d4edda',
                  borderRadius: '5px',
                  marginBottom: '10px',
                  border: '2px solid #28a745'
                }}>
                  ✅ שורה {index + 1} ({record1.name}): זהה לחלוטין
                </div>
              )
            }
            
            return (
              <div key={index} style={{
                padding: '15px',
                background: '#fff3cd',
                borderRadius: '8px',
                marginBottom: '15px',
                border: '2px solid #ffc107'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>
                  ⚠️ שורה {index + 1} ({record1.name}): {diffs.length} הבדלים
                </h4>
                
                <div style={{ marginBottom: '10px' }}>
                  <strong>אורך:</strong> קובץ 1: {record1.length} | קובץ 2: {record2.length}
                </div>
                
                <div style={{
                  background: 'white',
                  padding: '10px',
                  borderRadius: '5px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {diffs.map((diff, i) => (
                    <div key={i} style={{
                      padding: '8px',
                      marginBottom: '5px',
                      background: '#f8d7da',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '13px'
                    }}>
                      <strong>פוזיציה {diff.pos}:</strong>{' '}
                      <span style={{ color: '#0066cc' }}>[{diff.char1}]</span>
                      {' → '}
                      <span style={{ color: '#28a745' }}>[{diff.char2}]</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {analysis && !compareMode && (
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3>תוצאות ניתוח</h3>
          <div style={{ marginBottom: '20px' }}>
            <strong>סה"כ שורות:</strong> {analysis.totalLines}
          </div>

          {analysis.records.map((record: any, index: number) => (
            <div
              key={index}
              style={{
                marginBottom: '30px',
                padding: '15px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '2px solid #dee2e6'
              }}
            >
              <h4 style={{
                margin: '0 0 15px 0',
                color: record.type === 'K' ? '#0066cc' : record.type === '1' ? '#28a745' : record.type === '5' ? '#ffc107' : '#6c757d'
              }}>
                שורה {record.line}: {record.name} (אורך: {record.length} תווים)
                {record.validations && !record.validations.isValid && (
                  <span style={{ color: '#dc3545', marginRight: '10px' }}>
                    ❌ שגיאות
                  </span>
                )}
                {record.validations && record.validations.isValid && record.validations.warnings.length > 0 && (
                  <span style={{ color: '#ffc107', marginRight: '10px' }}>
                    ⚠️ אזהרות
                  </span>
                )}
                {record.validations && record.validations.isValid && record.validations.warnings.length === 0 && (
                  <span style={{ color: '#28a745', marginRight: '10px' }}>
                    ✅ תקין
                  </span>
                )}
              </h4>

              {/* הצגת שגיאות ואזהרות */}
              {record.validations && (record.validations.errors.length > 0 || record.validations.warnings.length > 0) && (
                <div style={{ marginBottom: '15px' }}>
                  {record.validations.errors.map((error: string, i: number) => (
                    <div key={`error-${i}`} style={{
                      padding: '8px 12px',
                      background: '#f8d7da',
                      border: '1px solid #f5c6cb',
                      borderRadius: '4px',
                      color: '#721c24',
                      marginBottom: '5px',
                      fontSize: '13px'
                    }}>
                      ❌ {error}
                    </div>
                  ))}
                  {record.validations.warnings.map((warning: string, i: number) => (
                    <div key={`warning-${i}`} style={{
                      padding: '8px 12px',
                      background: '#fff3cd',
                      border: '1px solid #ffeaa7',
                      borderRadius: '4px',
                      color: '#856404',
                      marginBottom: '5px',
                      fontSize: '13px'
                    }}>
                      ⚠️ {warning}
                    </div>
                  ))}
                </div>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '10px'
              }}>
                {Object.entries(record.fields).map(([key, value]: [string, any]) => (
                  <div
                    key={key}
                    style={{
                      padding: '8px',
                      background: 'white',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontFamily: 'monospace'
                    }}
                  >
                    <div style={{ color: '#666', marginBottom: '3px', fontSize: '11px' }}>{key}</div>
                    <div style={{ fontWeight: 'bold', direction: value.match(/[\u0590-\u05FF]/) ? 'rtl' : 'ltr' }}>
                      [{value}]
                    </div>
                  </div>
                ))}
              </div>

              <details style={{ marginTop: '10px' }}>
                <summary style={{ cursor: 'pointer', color: '#666' }}>הצג שורה מלאה</summary>
                <pre style={{
                  background: '#2d2d2d',
                  color: '#f8f8f2',
                  padding: '10px',
                  borderRadius: '5px',
                  overflow: 'auto',
                  fontSize: '12px',
                  marginTop: '10px'
                }}>
                  {record.raw}
                </pre>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MasavValidatorPage
