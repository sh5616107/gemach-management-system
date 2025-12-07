// פונקציות פורמט משותפות

import { DEFAULTS } from './constants'

/**
 * פורמט מטבע
 */
export function formatCurrency(
  amount: number,
  symbol: string = DEFAULTS.CURRENCY_SYMBOL
): string {
  // בדיקת בטיחות - אם amount הוא undefined או null, החזר 0
  const safeAmount = amount ?? 0
  return `${symbol}${safeAmount.toLocaleString('he-IL')}`
}

/**
 * פורמט תאריך בעברית
 */
export function formatDateHebrew(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * פורמט תאריך קצר
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('he-IL')
}

/**
 * פורמט תאריך ושעה
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * פורמט תאריך לשדה input
 */
export function formatDateForInput(dateString: string): string {
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

/**
 * חישוב ימים מתאריך
 */
export function daysSince(dateString: string): number {
  const date = new Date(dateString)
  const today = new Date()
  date.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * חישוב ימים עד תאריך
 */
export function daysUntil(dateString: string): number {
  const date = new Date(dateString)
  const today = new Date()
  date.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * פורמט אחוזים
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * פורמט מספר עם פסיקים
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('he-IL')
}

/**
 * קיצור טקסט ארוך
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * פורמט שם מלא
 */
export function formatFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim()
}

/**
 * פורמט זמן יחסי (לפני X דקות/שעות/ימים)
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'עכשיו'
  if (diffMins < 60) return `לפני ${diffMins} דקות`
  if (diffHours < 24) return `לפני ${diffHours} שעות`
  if (diffDays < 7) return `לפני ${diffDays} ימים`
  if (diffDays < 30) return `לפני ${Math.floor(diffDays / 7)} שבועות`
  if (diffDays < 365) return `לפני ${Math.floor(diffDays / 30)} חודשים`
  return `לפני ${Math.floor(diffDays / 365)} שנים`
}

/**
 * פורמט גודל קובץ
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
