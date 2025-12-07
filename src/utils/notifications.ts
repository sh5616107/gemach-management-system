// מערכת הודעות משותפת לכל האפליקציה

import { COLORS, TIME } from './constants'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

interface NotificationOptions {
  duration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

/**
 * הצגת הודעה ויזואלית שלא חוסמת
 */
export function showNotification(
  message: string,
  type: NotificationType = 'success',
  options: NotificationOptions = {}
): void {
  const { 
    duration = TIME.NOTIFICATION_DURATION,
    position = 'top-right'
  } = options

  const colors: Record<NotificationType, string> = {
    success: COLORS.SUCCESS,
    error: COLORS.ERROR,
    info: COLORS.INFO,
    warning: COLORS.WARNING,
  }

  const positions: Record<string, string> = {
    'top-right': 'top: 20px; right: 20px;',
    'top-left': 'top: 20px; left: 20px;',
    'bottom-right': 'bottom: 20px; right: 20px;',
    'bottom-left': 'bottom: 20px; left: 20px;',
  }

  const notification = document.createElement('div')
  notification.innerHTML = message
  notification.style.cssText = `
    position: fixed;
    ${positions[position]}
    z-index: 9999;
    background: ${colors[type]};
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    font-size: 16px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    max-width: 300px;
    word-wrap: break-word;
    direction: rtl;
    animation: slideIn 0.3s ease-out;
  `

  // הוסף אנימציה
  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(${position.includes('right') ? '100%' : '-100%'});
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    @keyframes slideOut {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(${position.includes('right') ? '100%' : '-100%'});
      }
    }
  `
  document.head.appendChild(style)
  document.body.appendChild(notification)

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in'
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style)
      }
    }, 300)
  }, duration)
}

/**
 * הודעת הצלחה
 */
export function showSuccess(message: string, options?: NotificationOptions): void {
  showNotification(message, 'success', options)
}

/**
 * הודעת שגיאה
 */
export function showError(message: string, options?: NotificationOptions): void {
  showNotification(message, 'error', options)
}

/**
 * הודעת מידע
 */
export function showInfo(message: string, options?: NotificationOptions): void {
  showNotification(message, 'info', options)
}

/**
 * הודעת אזהרה
 */
export function showWarning(message: string, options?: NotificationOptions): void {
  showNotification(message, 'warning', options)
}
