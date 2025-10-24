export interface Borrower {
  id: number
  firstName: string
  lastName: string
  city: string
  phone: string
  address: string
  email: string
  idNumber?: string
}

export interface Loan {
  id: number
  borrowerId: number
  amount: number
  returnDate: string
  createdDate: string
  status: 'active' | 'completed' | 'overdue'
  notes?: string
  guarantor1?: string
  guarantor2?: string
}

export interface Payment {
  id: number
  loanId: number
  amount: number
  date: string
  type: 'loan' | 'payment'
  notes?: string
}

export interface Deposit {
  id: number
  depositorName: string
  amount: number
  depositDate: string
  depositPeriod: number // תקופה בחודשים
  phone: string
  notes?: string
  status: 'active' | 'withdrawn'
}

export interface Donation {
  id: number
  donorName: string
  amount: number
  donationDate: string
  method: 'cash' | 'transfer' | 'check' | 'other'
  phone?: string
  address?: string
  notes?: string
  needsReceipt: boolean
}