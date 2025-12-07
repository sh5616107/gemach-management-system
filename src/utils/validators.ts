// פונקציות ולידציה משותפות

import { VALIDATION } from './constants'

/**
 * בדיקת תקינות מספר זהות ישראלי
 * @param id מספר הזהות לבדיקה
 * @returns האם המספר תקין
 */
export function validateIsraeliId(id: string): boolean {
  // הסר רווחים ומקפים
  const cleanId = id.replace(/[\s-]/g, '')

  // בדוק שהמספר מכיל רק ספרות ואורכו 9
  if (!/^\d{9}$/.test(cleanId)) {
    return false
  }

  // בדיקת ספרת ביקורת (אלגוריתם לוהן)
  let sum = 0
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(cleanId[i])
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10)
      }
    }
    sum += digit
  }

  return sum % 10 === 0
}

/**
 * ניקוי מספר זהות (הסרת רווחים ומקפים)
 */
export function cleanIdNumber(id: string): string {
  return id.replace(/[\s-]/g, '')
}

/**
 * פורמט יפה למספר זהות (XXX-XX-XXXX)
 */
export function formatIdNumber(idNumber: string): string {
  const cleanId = cleanIdNumber(idNumber)
  if (cleanId.length === VALIDATION.ID_NUMBER_LENGTH) {
    return `${cleanId.slice(0, 3)}-${cleanId.slice(3, 5)}-${cleanId.slice(5)}`
  }
  return cleanId
}

/**
 * בדיקת תקינות מספר טלפון ישראלי
 */
export function validateIsraeliPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/[\s-]/g, '')
  // טלפון נייד או קווי
  return /^0[2-9]\d{7,8}$/.test(cleanPhone)
}

/**
 * פורמט מספר טלפון
 */
export function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/[\s-]/g, '')
  if (cleanPhone.length === 10) {
    return `${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`
  }
  if (cleanPhone.length === 9) {
    return `${cleanPhone.slice(0, 2)}-${cleanPhone.slice(2, 5)}-${cleanPhone.slice(5)}`
  }
  return cleanPhone
}

/**
 * בדיקת תקינות כתובת אימייל
 */
export function validateEmail(email: string): boolean {
  if (!email || email.trim() === '') return true // אימייל אופציונלי
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * בדיקת תקינות קוד בנק
 */
export function validateBankCode(code: string): boolean {
  return /^\d{2}$/.test(code)
}

/**
 * בדיקת תקינות מספר סניף
 */
export function validateBranchNumber(branch: string): boolean {
  return /^\d{3}$/.test(branch)
}

/**
 * בדיקת תקינות מספר חשבון
 */
export function validateAccountNumber(account: string): boolean {
  return /^\d{1,9}$/.test(account)
}

/**
 * בדיקת תקינות סכום (מספר חיובי)
 */
export function validateAmount(amount: number): boolean {
  return typeof amount === 'number' && amount > 0 && isFinite(amount)
}

/**
 * בדיקת תקינות תאריך
 */
export function validateDate(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

/**
 * בדיקה אם תאריך בעבר
 */
export function isDateInPast(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return date < today
}

/**
 * בדיקה אם תאריך בעתיד
 */
export function isDateInFuture(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return date > today
}

/**
 * בדיקת אורך מינימלי לסיסמה
 */
export function validatePassword(password: string): boolean {
  return password.length >= VALIDATION.MIN_PASSWORD_LENGTH
}

/**
 * בדיקת קוד שחזור
 */
export function validateRecoveryCode(code: string): boolean {
  return /^\d{6}$/.test(code)
}
