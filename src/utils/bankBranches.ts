// מודול לטיפול בנתוני סניפי בנקים
import { bankBranchesData } from '../data/bankBranchesData'

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

// איפוס קאש (לפיתוח)
export const resetCache = () => {
    banksData = []
    isLoaded = false
    console.log('🔄 קאש נתוני בנקים אופס')
}

// פונקציה לטעינת נתוני הסניפים
export const loadBankBranches = async (): Promise<Bank[]> => {
    if (isLoaded) {
        return banksData
    }

    try {
        console.log('🔄 טוען נתוני סניפי בנקים מובנים...')
        
        // שימוש בנתונים מובנים מקובץ TypeScript
        const branches: BankBranch[] = bankBranchesData.map(item => ({
            bankCode: item.bankCode,
            bankName: item.bankName,
            branchCode: item.branchCode,
            branchName: item.branchName,
            branchAddress: item.branchAddress,
            city: item.city
        }))
        
        console.log('📊 סה"כ סניפים נטענו:', branches.length)

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

        banksData = Array.from(bankMap.values()).sort((a, b) => parseInt(a.code) - parseInt(b.code))
        isLoaded = true

        console.log('✅ נטענו נתוני סניפי בנקים:', banksData.length, 'בנקים')
        console.log('🏦 כל הבנקים:', banksData.map(b => `${b.code} - ${b.name} (${b.branches.length} סניפים)`))
        return banksData
    } catch (error) {
        console.error('❌ שגיאה בטעינת נתוני סניפי בנקים:', error)
        return []
    }
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