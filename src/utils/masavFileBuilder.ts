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
 * פורמט סכום: 11 ספרות ש"ח + 2 ספרות אגורות
 * דוגמה: 1500.00 -> 0000000150000
 */
export function formatAmount(amount: number): string {
  const amountInAgorot = Math.round(amount * 100)
  return padLeft(amountInAgorot.toString(), 13, '0')
}

/**
 * פורמט תאריך: YYMMDD
 * דוגמה: 2024-12-15 -> 241215
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
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
  senderCode: string,
  institutionName: string
): string {
  let record = ''
  
  record += 'K'                                          // 1: סוג רשומה
  record += padLeft(institutionCode, 8, '0')            // 2-9: קוד מוסד
  record += '00'                                        // 10-11: מטבע
  record += formatDate(chargeDate)                      // 12-17: תאריך חיוב
  record += '0'                                         // 18: 0
  record += '001'                                       // 19-21: מספר סידורי
  record += '0'                                         // 22: 0
  record += formatDate(creationDate)                    // 23-28: תאריך יצירה
  record += padLeft(senderCode, 5, '0')                 // 29-33: מוסד שולח
  record += '000000'                                    // 34-39: אפסים
  record += padRight(institutionName, 30, ' ')          // 40-69: שם מוסד
  record += padRight('', 56, ' ')                       // 70-125: רווחים
  record += 'KOT'                                       // 126-128: KOT
  
  return record + '\r\n'
}

/**
 * בניית רשומת תנועה (128 תווים)
 */
export function buildTransactionRecord(
  institutionCode: string,
  charge: MasavCharge
): string {
  let record = ''
  
  record += '1'                                         // 1: סוג רשומה
  record += padLeft(institutionCode, 8, '0')            // 2-9: קוד מוסד
  record += '00'                                        // 10-11: מטבע
  record += '000000'                                    // 12-17: אפסים
  record += padLeft(charge.bankCode, 2, '0')            // 18-19: קוד בנק
  record += padLeft(charge.branchNumber, 3, '0')        // 20-22: מספר סניף
  record += '0000'                                      // 23-26: סוג חשבון
  record += padLeft(charge.accountNumber, 9, '0')       // 27-35: מספר חשבון
  record += '0'                                         // 36: 0
  record += padLeft(charge.idNumber, 9, '0')            // 37-45: מספר זהות
  
  // שם לקוח - מהופך (RTL) - 16 תווים
  const reversedName = reverseHebrew(charge.borrowerName)
  record += padRight(reversedName.slice(0, 16), 16, ' ') // 46-61: שם לקוח
  
  record += formatAmount(charge.amount)                 // 62-74: סכום (13 תווים)
  record += padLeft(charge.referenceNumber, 20, '0')    // 75-94: אסמכתא
  record += '00000000'                                  // 95-102: תקופה
  record += '000'                                       // 103-105: קוד מלל
  record += '504'                                       // 106-108: סוג תנועה
  record += '000000000000000000'                        // 109-126: אפסים
  record += '  '                                        // 127-128: רווחים
  
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
  record += '0'                                         // 18: 0
  record += '001'                                       // 19-21: מספר סידורי
  record += '000000000000000'                           // 22-36: אפסים
  record += padLeft(Math.round(totalAmount * 100).toString(), 15, '0') // 37-51: סכום כולל
  record += '0000000'                                   // 52-58: אפסים
  record += padLeft(transactionsCount.toString(), 7, '0') // 59-65: מספר תנועות
  record += padRight('', 63, ' ')                       // 66-128: רווחים
  
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
  chargeDate: string
): string {
  const creationDate = new Date().toISOString().split('T')[0]
  let fileContent = ''
  
  // רשומת כותרת
  fileContent += buildHeaderRecord(
    settings.institutionCode,
    chargeDate,
    creationDate,
    settings.senderCode,
    settings.institutionName
  )
  
  // רשומות תנועה
  for (const charge of charges) {
    fileContent += buildTransactionRecord(settings.institutionCode, charge)
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
