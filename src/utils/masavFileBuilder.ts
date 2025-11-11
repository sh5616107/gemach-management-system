/**
 * MasavFileBuilder - בונה קבצי מס"ב בפורמט Fixed Width
 * 
 * פורמט מס"ב:
 * - כל רשומה 128 תווים בדיוק
 * - כל רשומה מסתיימת ב-CR+LF
 * - קידוד ASCII
 * - שמות עבריים מהופכים (RTL)
 */

import { MasavSettings, MasavCharge } from '../database/database'

/**
 * מילוי משמאל
 */
export function padLeft(value: string, length: number, char: string = '0'): string {
  return value.padStart(length, char)
}

/**
 * מילוי מימין
 */
export function padRight(value: string, length: number, char: string = ' '): string {
  return value.padEnd(length, char)
}

/**
 * פורמט סכום: 11 ספרות ש"ח + 2 ספרות אגורות (סה"כ 13 תווים)
 * דוגמה: 555.00 -> 0000000055500
 * דוגמה: 1500.50 -> 0000000150050
 */
export function formatAmount(amount: number): string {
  if (!amount || isNaN(amount) || amount <= 0) {
    throw new Error(`סכום לא תקין: ${amount}. הסכום חייב להיות גדול מאפס.`)
  }
  
  // המר לאגורות (כפול 100) ועגל
  const amountInAgorot = Math.round(amount * 100)
  
  // פורמט ל-13 תווים (11 ש"ח + 2 אגורות)
  const formatted = padLeft(amountInAgorot.toString(), 13, '0')
  
  // וודא שהאורך נכון
  if (formatted.length !== 13) {
    throw new Error(`אורך סכום שגוי: ${formatted.length} במקום 13. סכום: ${amount}`)
  }
  
  return formatted
}

/**
 * פורמט תאריך: YYMMDD
 * דוגמה: 2024-12-15 -> 241215
 */
export function formatDate(date: string | Date): string {
  let d: Date
  if (typeof date === 'string') {
    // אם זה string בפורמט YYYY-MM-DD, פרש אותו כ-UTC כדי למנוע timezone issues
    const parts = date.split('-')
    if (parts.length === 3) {
      d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    } else {
      d = new Date(date)
    }
  } else {
    d = date
  }
  
  const year = d.getFullYear().toString().slice(-2)
  const month = padLeft((d.getMonth() + 1).toString(), 2, '0')
  const day = padLeft(d.getDate().toString(), 2, '0')
  return year + month + day
}

/**
 * היפוך שם עברי (RTL)
 * דוגמה: "ישראל ישראלי" -> "ילארשי לארשי"
 */
export function reverseHebrew(text: string): string {
  return text.split('').reverse().join('')
}

/**
 * בניית רשומת כותרת (128 תווים)
 */
export function buildHeaderRecord(
  institutionCode: string,
  chargeDate: string,
  creationDate: string,
  institutionName: string
): string {
  let record = ''
  
  record += 'K'                                          // 1: סוג רשומה
  record += padLeft(institutionCode, 8, '0')            // 2-9: קוד מוסד
  record += '00'                                        // 10-11: מטבע
  record += formatDate(chargeDate)                      // 12-17: תאריך חיוב
  record += '0'                                         // 18: FILLER
  record += '001'                                       // 19-21: מספר סידורי
  record += '0'                                         // 22: FILLER
  record += formatDate(creationDate)                    // 23-28: תאריך יצירה
  record += padLeft(institutionCode, 8, '0')            // 29-36: קוד מוסד (שוב!)
  record += '00'                                        // 37-38: אפסים
  record += padLeft(institutionName, 30, ' ')           // 39-68: שם מוסד (צמוד לימין!)
  record += padRight('', 57, ' ')                       // 69-125: BLANK
  record += 'KOT'                                       // 126-128: זיהוי כותרת
  
  return record + '\r\n'
}

/**
 * בניית רשומת תנועה (128 תווים)
 */
export function buildTransactionRecord(
  institutionCode: string,
  charge: MasavCharge,
  transactionType: '504' | '505' = '504'
): string {
  let record = ''
  
  record += '1'                                         // 1: סוג רשומה
  record += padLeft(institutionCode, 8, '0')            // 2-9: קוד מוסד
  record += '00'                                        // 10-11: מטבע
  record += '000000'                                    // 12-17: FILLER
  
  // וודא שפרטי הבנק תקינים
  const bankCode = charge.bankCode.slice(0, 2)
  const branchNumber = charge.branchNumber.slice(0, 3)
  const accountNumber = charge.accountNumber.slice(0, 9)
  
  record += padLeft(bankCode, 2, '0')                   // 18-19: קוד בנק
  record += padLeft(branchNumber, 3, '0')               // 20-22: מספר סניף
  record += '0000'                                      // 23-26: סוג חשבון
  record += padLeft(accountNumber, 9, '0')              // 27-35: מספר חשבון
  record += '0'                                         // 36: FILLER
  
  // נקה מספר זהות מרווחים ומקפים
  const cleanIdNumber = charge.idNumber.replace(/[\s-]/g, '').slice(0, 9)
  record += padLeft(cleanIdNumber, 9, '0')              // 37-45: מספר זהות
  
  // שם לקוח - נקה רווחים מיותרים, הפוך (RTL), 16 תווים, צמוד לימין
  const cleanName = charge.borrowerName.replace(/\s+/g, ' ').trim() // נקה רווחים כפולים
  const reversedName = reverseHebrew(cleanName)
  record += padLeft(reversedName.slice(0, 16), 16, ' ') // 46-61: שם לקוח
  
  record += formatAmount(charge.amount)                 // 62-74: סכום (13 תווים)
  record += padLeft(charge.referenceNumber, 20, '0')    // 75-94: אסמכתא (צמוד לימין)
  record += '00000000'                                  // 95-102: תקופה (8 תווים)
  record += '000'                                       // 103-105: קוד מלל (3 תווים)
  record += transactionType                             // 106-108: סוג תנועה (504=חיוב, 505=זיכוי)
  record += '000000000000000000'                        // 109-126: FILLER (18 תווים)
  record += '  '                                        // 127-128: BLANK (2 תווים)
  
  return record + '\r\n'
}

/**
 * בניית רשומת סיכום (128 תווים)
 */
export function buildSummaryRecord(
  institutionCode: string,
  chargeDate: string,
  totalAmount: number,
  transactionsCount: number
): string {
  let record = ''
  
  record += '5'                                         // 1: סוג רשומה
  record += padLeft(institutionCode, 8, '0')            // 2-9: קוד מוסד
  record += '00'                                        // 10-11: מטבע
  record += formatDate(chargeDate)                      // 12-17: תאריך חיוב
  record += '0'                                         // 18: FILLER
  record += '001'                                       // 19-21: מספר סידורי
  record += '000000000000000'                           // 22-36: FILLER אפסים (15 תווים)
  record += padLeft(Math.round(totalAmount * 100).toString(), 15, '0') // 37-51: סכום כולל (15 תווים)
  record += '0000000'                                   // 52-58: FILLER אפסים (7 תווים)
  record += padLeft(transactionsCount.toString(), 7, '0') // 59-65: מספר תנועות (7 תווים)
  record += padRight('', 63, ' ')                       // 66-128: BLANK (63 תווים)
  
  return record + '\r\n'
}

/**
 * בניית רשומת סיום (128 תשיעיות)
 */
export function buildEndRecord(): string {
  return '9'.repeat(128) + '\r\n'
}

/**
 * בניית קובץ מס"ב מלא
 */
export function buildMasavFile(
  settings: MasavSettings,
  charges: MasavCharge[],
  chargeDate: string,
  transactionType: '504' | '505' = '504'
): string {
  const creationDate = new Date().toISOString().split('T')[0]
  let fileContent = ''
  
  // רשומת כותרת
  fileContent += buildHeaderRecord(
    settings.institutionCode,
    chargeDate,
    creationDate,
    settings.institutionName
  )
  
  // רשומות תנועה
  for (const charge of charges) {
    fileContent += buildTransactionRecord(settings.institutionCode, charge, transactionType)
  }
  
  // חישוב סכום כולל
  const totalAmount = charges.reduce((sum, charge) => sum + charge.amount, 0)
  
  // רשומת סיכום
  fileContent += buildSummaryRecord(
    settings.institutionCode,
    chargeDate,
    totalAmount,
    charges.length
  )
  
  // רשומת סיום
  fileContent += buildEndRecord()
  
  return fileContent
}
