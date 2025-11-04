// מודול לטיפול בנתוני סניפי בנקים

export interface BankBranch {
    bankCode: string
    bankName: string
    branchCode: string
    branchName: string
    branchAddress: string
    city: string
}

export interface Bank {
    code: string
    name: string
    branches: BankBranch[]
}

let banksData: Bank[] = []
let isLoaded = false

// פונקציה לטעינת נתוני הסניפים
export const loadBankBranches = async (): Promise<Bank[]> => {
    if (isLoaded) {
        return banksData
    }

    try {
        console.log('🔄 מנסה לטעון קובץ CSV...')
        const response = await fetch('/snifim_he.csv')
        console.log('📡 תגובת שרת:', response.status, response.statusText)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const bankBranchesData = await response.text()
        console.log('📄 נתוני CSV נטענו, אורך:', bankBranchesData.length, 'תווים')
        const lines = bankBranchesData.split('\n')
        console.log('📋 מספר שורות:', lines.length)
        const branches: BankBranch[] = []

        // דלג על השורה הראשונה (כותרות)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue

            // פרסור CSV - התמודדות עם מרכאות
            const columns = parseCSVLine(line)
            if (columns.length >= 6) {
                branches.push({
                    bankCode: columns[0],
                    bankName: columns[1],
                    branchCode: columns[2],
                    branchName: columns[3],
                    branchAddress: columns[4],
                    city: columns[5]
                })
            }
        }

        // קיבוץ לפי בנקים
        const bankMap = new Map<string, Bank>()

        branches.forEach(branch => {
            if (!bankMap.has(branch.bankCode)) {
                bankMap.set(branch.bankCode, {
                    code: branch.bankCode,
                    name: branch.bankName,
                    branches: []
                })
            }
            bankMap.get(branch.bankCode)!.branches.push(branch)
        })

        banksData = Array.from(bankMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'he'))
        isLoaded = true

        console.log('✅ נטענו נתוני סניפי בנקים:', banksData.length, 'בנקים')
        console.log('🏦 דוגמת בנקים:', banksData.slice(0, 3).map(b => `${b.code} - ${b.name} (${b.branches.length} סניפים)`))
        return banksData
    } catch (error) {
        console.error('❌ שגיאה בטעינת נתוני סניפי בנקים:', error)
        return []
    }
}

// פונקציה לפרסור שורת CSV עם התמודדות עם מרכאות
const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
        const char = line[i]

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // מרכאות כפולות - הוסף מרכאה אחת
                current += '"'
                i++ // דלג על המרכאה השנייה
            } else {
                // החלף מצב מרכאות
                inQuotes = !inQuotes
            }
        } else if (char === ',' && !inQuotes) {
            // פסיק מחוץ למרכאות - סוף עמודה
            result.push(current.trim())
            current = ''
        } else {
            current += char
        }
    }

    // הוסף את העמודה האחרונה
    result.push(current.trim())
    return result
}

// פונקציה לקבלת כל הבנקים
export const getAllBanks = async (): Promise<Bank[]> => {
    return await loadBankBranches()
}

// פונקציה לקבלת סניפי בנק ספציפי
export const getBankBranches = async (bankCode: string): Promise<BankBranch[]> => {
    const banks = await loadBankBranches()
    const bank = banks.find(b => b.code === bankCode)
    return bank ? bank.branches : []
}

// פונקציה לחיפוש בנק לפי קוד
export const getBankByCode = async (bankCode: string): Promise<Bank | undefined> => {
    const banks = await loadBankBranches()
    return banks.find(b => b.code === bankCode)
}

// פונקציה לחיפוש סניף ספציפי
export const getBranchByCode = async (bankCode: string, branchCode: string): Promise<BankBranch | undefined> => {
    const branches = await getBankBranches(bankCode)
    return branches.find(b => b.branchCode === branchCode)
}

// פונקציה לפורמט תצוגה של סניף
export const formatBranchDisplay = (branch: BankBranch): string => {
    return `${branch.branchCode} - ${branch.branchName} (${branch.city})`
}

// פונקציה לפורמט תצוגה של בנק
export const formatBankDisplay = (bank: Bank): string => {
    return `${bank.code} - ${bank.name}`
}