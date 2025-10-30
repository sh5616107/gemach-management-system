// מודול לטיפול בתאריכים עבריים עם ספרייה מקצועית
import { HDate, HebrewCalendar, HolidayEvent, flags } from '@hebcal/core'

export interface DateInfo {
    gregorian: string
    hebrew: string
    hebrewWithDay: string
    isShabbat: boolean
    isHoliday: boolean
    holidayName?: string
    isErev?: boolean
    warnings: string[]
}

// המרת תאריך גרגוריאני לעברי
export function getHebrewDate(gregorianDate: Date | string): HDate {
    const date = typeof gregorianDate === 'string' ? new Date(gregorianDate) : gregorianDate
    return new HDate(date)
}

// פורמט תאריך עברי בסיסי
export function formatHebrewDate(gregorianDate: Date | string): string {
    try {
        // בדיקה אם התאריך תקין
        if (!gregorianDate || gregorianDate === '') {
            return ''
        }

        const hdate = getHebrewDate(gregorianDate)
        const hebrewDate = hdate.renderGematriya()
        // הסרת ניקוד
        return hebrewDate.replace(/[\u0591-\u05C7]/g, '')
    } catch (error) {
        console.error('Error formatting Hebrew date:', error)
        return ''
    }
}

// פורמט תאריך עברי עם יום בשבוע
export function formatHebrewDateWithDay(gregorianDate: Date | string): string {
    try {
        const date = typeof gregorianDate === 'string' ? new Date(gregorianDate) : gregorianDate
        const hdate = getHebrewDate(date)
        const dayName = date.toLocaleDateString('he-IL', { weekday: 'long' })
        return `יום ${dayName}, ${hdate.toString()}`
    } catch (error) {
        console.error('Error formatting Hebrew date with day:', error)
        return ''
    }
}

// בדיקה אם תאריך הוא שבת
export function isShabbat(gregorianDate: Date | string): boolean {
    const date = typeof gregorianDate === 'string' ? new Date(gregorianDate) : gregorianDate
    return date.getDay() === 6
}

// קבלת חגים ומועדים לתאריך
export function getHolidays(gregorianDate: Date | string): HolidayEvent[] {
    const date = typeof gregorianDate === 'string' ? new Date(gregorianDate) : gregorianDate
    const hdate = new HDate(date)

    // קבלת חגים לתאריך הספציפי
    const events = HebrewCalendar.getHolidaysOnDate(hdate) || []

    return events
}

// בדיקה אם תאריך הוא חג
export function isHoliday(gregorianDate: Date | string): {
    isHoliday: boolean
    holidayName?: string
    isErev?: boolean
    isMajor?: boolean
} {
    const holidays = getHolidays(gregorianDate)

    if (holidays.length === 0) {
        return { isHoliday: false }
    }

    const holiday = holidays[0]
    const holidayName = holiday.getDesc()
    const isMajor = holiday.getFlags() & flags.CHAG
    const isErev = holidayName.includes('ערב') || holidayName.includes('Erev')

    return {
        isHoliday: true,
        holidayName,
        isErev,
        isMajor: !!isMajor
    }
}

// בדיקה אם מחר הוא חג (ערב חג)
export function isTomorrowHoliday(gregorianDate: Date | string): {
    isErev: boolean
    holidayName?: string
} {
    const date = typeof gregorianDate === 'string' ? new Date(gregorianDate) : gregorianDate
    const tomorrow = new Date(date)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const tomorrowHoliday = isHoliday(tomorrow)

    return {
        isErev: tomorrowHoliday.isHoliday && !tomorrowHoliday.isErev,
        holidayName: tomorrowHoliday.holidayName
    }
}

// קבלת אזהרות לתאריך
export function getDateWarnings(gregorianDate: Date | string): string[] {
    const warnings: string[] = []

    // בדיקת שבת
    if (isShabbat(gregorianDate)) {
        warnings.push('🕯️ שבת - לא מומלץ לשלוח תזכורות')
    }

    // בדיקת חגים
    const holiday = isHoliday(gregorianDate)
    if (holiday.isHoliday && holiday.holidayName) {
        if (holiday.isErev) {
            warnings.push(`🕯️ ${holiday.holidayName} - לא מומלץ לשלוח תזכורות`)
        } else if (holiday.isMajor) {
            warnings.push(`🎉 ${holiday.holidayName} - חג גדול`)
        } else {
            warnings.push(`📅 ${holiday.holidayName}`)
        }
    }

    // בדיקת ערב חג
    const tomorrow = isTomorrowHoliday(gregorianDate)
    if (tomorrow.isErev && tomorrow.holidayName) {
        warnings.push(`🕯️ ערב ${tomorrow.holidayName} - לא מומלץ לשלוח תזכורות`)
    }

    return warnings
}

// פורמט תאריך משולב (גרגוריאני + עברי)
export function formatCombinedDate(gregorianDate: Date | string): string {
    // בדיקה אם התאריך תקין
    if (!gregorianDate || gregorianDate === '') {
        return ''
    }

    const date = typeof gregorianDate === 'string' ? new Date(gregorianDate) : gregorianDate

    // בדיקה אם התאריך תקין אחרי ההמרה
    if (isNaN(date.getTime())) {
        return ''
    }

    const gregorian = date.toLocaleDateString('he-IL')
    const hebrew = formatHebrewDate(date)

    // אם אין תאריך עברי, החזר רק גרגוריאני
    if (!hebrew) {
        return gregorian
    }

    return `${gregorian} (${hebrew})`
}

// פורמט תאריך עברי בלבד
export function formatHebrewDateOnly(gregorianDate: Date | string): string {
    const hebrew = formatHebrewDate(gregorianDate)
    return hebrew || ''
}

// קבלת מידע מלא על תאריך
export function getDateInfo(gregorianDate: Date | string): DateInfo {
    const date = typeof gregorianDate === 'string' ? new Date(gregorianDate) : gregorianDate
    const gregorian = date.toLocaleDateString('he-IL')
    const hebrew = formatHebrewDate(date)
    const hebrewWithDay = formatHebrewDateWithDay(date)
    const sabbath = isShabbat(date)
    const holiday = isHoliday(date)
    const warnings = getDateWarnings(date)

    return {
        gregorian,
        hebrew,
        hebrewWithDay,
        isShabbat: sabbath,
        isHoliday: holiday.isHoliday,
        holidayName: holiday.holidayName,
        isErev: holiday.isErev,
        warnings
    }
}

// קבלת חגים לחודש (לתכנון מראש)
export function getMonthHolidays(year: number, month: number): Array<{
    date: Date
    hebrew: string
    holidayName: string
    isMajor: boolean
}> {
    // const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0)
    const holidays: Array<{
        date: Date
        hebrew: string
        holidayName: string
        isMajor: boolean
    }> = []

    // עבור על כל יום בחודש
    for (let day = 1; day <= endDate.getDate(); day++) {
        const currentDate = new Date(year, month, day)
        const dayHolidays = getHolidays(currentDate)

        dayHolidays.forEach(holiday => {
            const isMajor = !!(holiday.getFlags() & flags.CHAG)
            holidays.push({
                date: currentDate,
                hebrew: formatHebrewDate(currentDate),
                holidayName: holiday.getDesc(),
                isMajor
            })
        })
    }

    return holidays
}

// בדיקה אם תאריך מתאים לשליחת תזכורות
export function isSuitableForReminders(gregorianDate: Date | string): {
    suitable: boolean
    reason?: string
} {
    const warnings = getDateWarnings(gregorianDate)

    if (warnings.length === 0) {
        return { suitable: true }
    }

    // אם יש אזהרות על שבת או חגים
    const hasShabbatOrHoliday = warnings.some(warning =>
        warning.includes('שבת') ||
        warning.includes('ערב') ||
        warning.includes('חג גדול')
    )

    if (hasShabbatOrHoliday) {
        return {
            suitable: false,
            reason: warnings.join(', ')
        }
    }

    return { suitable: true }
}