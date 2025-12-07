// קבועים גלובליים למערכת

// זמנים (במילישניות)
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  
  // זמני נעילה ואבטחה
  LOGIN_LOCK_DURATION: 5 * 60 * 1000, // 5 דקות
  MAX_LOGIN_ATTEMPTS: 5,
  NOTIFICATION_DURATION: 3000, // 3 שניות
  AUTO_REFRESH_INTERVAL: 5000, // 5 שניות
  
  // זמני המתנה
  MODAL_CLOSE_DELAY: 100,
  PAGE_RELOAD_DELAY: 1000,
} as const

// צבעים
export const COLORS = {
  SUCCESS: '#27ae60',
  ERROR: '#e74c3c',
  WARNING: '#f39c12',
  INFO: '#3498db',
  PRIMARY: '#667eea',
  SECONDARY: '#764ba2',
  
  // רמות חומרה
  SEVERITY: {
    HIGH: '#e74c3c',
    MEDIUM: '#f39c12',
    LOW: '#27ae60',
  }
} as const

// ברירות מחדל
export const DEFAULTS = {
  LOAN_PERIOD_MONTHS: 12,
  CURRENCY: 'ILS' as const,
  CURRENCY_SYMBOL: '₪',
  GEMACH_NAME: 'נר שרה',
  
  // הגדרות תצוגה
  ITEMS_PER_PAGE: 20,
  SEARCH_DEBOUNCE_MS: 300,
  
  // הגדרות מסמכים
  HEADER_TITLE: 'מערכת לניהול גמ"ח כספים',
  FOOTER_TEXT: 'אמר רבי אבא אמר רבי שמעון בן לקיש גדול המלוה יותר מן העושה צדקה (שבת סג.)',
  CONTACT_TEXT: 'ניתן להפצה לזיכוי הרבים\n⭐ עולם חסד יבנה',
} as const

// מפתחות localStorage
export const STORAGE_KEYS = {
  // נתונים
  BORROWERS: 'gemach_borrowers',
  LOANS: 'gemach_loans',
  DEPOSITS: 'gemach_deposits',
  DEPOSITORS: 'gemach_depositors',
  DONATIONS: 'gemach_donations',
  PAYMENTS: 'gemach_payments',
  WITHDRAWALS: 'gemach_withdrawals',
  GUARANTORS: 'gemach_guarantors',
  BLACKLIST: 'gemach_blacklist',
  WARNING_LETTERS: 'gemach_warning_letters',
  GUARANTOR_DEBTS: 'gemach_guarantor_debts',
  EXPENSES: 'gemach_expenses',
  
  // הגדרות
  SETTINGS: 'gemach_settings',
  MASAV_SETTINGS: 'gemach_masav_settings',
  GEMACH_NAME: 'gemach_name',
  GEMACH_LOGO: 'gemach_logo',
  FULL_DATA: 'gemach_full_data',
  
  // מצב משתמש
  SESSION: 'gemach_session',
  LOGIN_LOCK_UNTIL: 'loginLockUntil',
  LOGIN_ATTEMPTS: 'loginAttempts',
  SKIP_PASSWORD_SETUP: 'skipPasswordSetup',
  HIDE_WELCOME_MODAL: 'hideWelcomeModal',
  
  // מיגרציות
  DEPOSITS_MIGRATED: 'gemach_deposits_migrated',
  MIGRATION_MESSAGE: 'gemach_migration_message',
  RECURRING_MESSAGE: 'gemach_recurring_message',
} as const

// סטטוסים
export const STATUS = {
  LOAN: {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    OVERDUE: 'overdue',
    REMINDER_SENT: 'reminder_sent',
  },
  DEPOSIT: {
    ACTIVE: 'active',
    WITHDRAWN: 'withdrawn',
  },
  GUARANTOR: {
    ACTIVE: 'active',
    BLACKLISTED: 'blacklisted',
    AT_RISK: 'at_risk',
  },
  GUARANTOR_DEBT: {
    ACTIVE: 'active',
    PAID: 'paid',
    OVERDUE: 'overdue',
  },
} as const

// אמצעי תשלום
export const PAYMENT_METHODS = {
  CASH: 'cash',
  TRANSFER: 'transfer',
  CHECK: 'check',
  CREDIT: 'credit',
  OTHER: 'other',
} as const

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'מזומן',
  transfer: 'העברה בנקאית',
  check: "צ'ק",
  credit: 'כרטיס אשראי',
  other: 'אחר',
}

// סוגי הלוואות
export const LOAN_TYPES = {
  FIXED: 'fixed',
  FLEXIBLE: 'flexible',
} as const

export const LOAN_TYPE_LABELS: Record<string, string> = {
  fixed: 'קבוע',
  flexible: 'גמיש',
}

// רמות חומרה לאיחור
export const OVERDUE_SEVERITY = {
  HIGH_THRESHOLD_DAYS: 30,
  MEDIUM_THRESHOLD_DAYS: 7,
} as const

// ולידציה
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 4,
  ID_NUMBER_LENGTH: 9,
  RECOVERY_CODE_LENGTH: 6,
  BANK_CODE_LENGTH: 2,
  BRANCH_NUMBER_LENGTH: 3,
  ACCOUNT_NUMBER_MAX_LENGTH: 9,
} as const
