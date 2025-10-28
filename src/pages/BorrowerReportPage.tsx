import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { db, DatabaseLoan, DatabaseBorrower } from '../database/database'

function BorrowerReportPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const [borrowers, setBorrowers] = useState<DatabaseBorrower[]>([])
    const [selectedBorrowerId, setSelectedBorrowerId] = useState<number | null>(null)
    const [reportData, setReportData] = useState<any>(null)

    useEffect(() => {
        loadData()
    }, [])

    // טיפול בפרמטר borrowerId מה-URL
    useEffect(() => {
        const borrowerId = searchParams.get('borrowerId')
        if (borrowerId && borrowers.length > 0) {
            const borrower = borrowers.find(b => b.id === Number(borrowerId))
            if (borrower) {
                selectBorrower(Number(borrowerId))
                // נקה את הפרמטר מה-URL
                window.history.replaceState({}, '', '/borrower-report')
            }
        }
    }, [borrowers, searchParams])

    const loadData = () => {
        const newBorrowers = db.getBorrowers()
        setBorrowers(newBorrowers)
    }

    const selectBorrower = (borrowerId: number) => {
        const borrower = borrowers.find(b => b.id === borrowerId)
        if (!borrower) return

        setSelectedBorrowerId(borrowerId)

        // טען את כל הנתונים של הלווה
        const allLoans = db.getLoans().filter(loan => loan.borrowerId === borrowerId)

        // הלוואות מחזוריות ופרעונות אוטומטיים
        const recurringLoans = allLoans.filter(loan => loan.isRecurring)
        const autoPaymentLoans = allLoans.filter(loan => loan.autoPayment)

        // הלוואות רגילות (לא מחזוריות ולא אוטומטיות)
        const regularActiveLoans = allLoans.filter(loan =>
            db.isLoanActive(loan) && !loan.isRecurring && !loan.autoPayment
        )
        const regularFutureLoans = allLoans.filter(loan =>
            db.isLoanFuture(loan) && !loan.isRecurring && !loan.autoPayment
        )

        // חשב נתונים סטטיסטיים (כולל הכל)
        const allActiveLoans = allLoans.filter(loan => db.isLoanActive(loan))
        const allFutureLoans = allLoans.filter(loan => db.isLoanFuture(loan))
        const totalBalance = allActiveLoans.reduce((sum, loan) => sum + db.getLoanBalance(loan.id), 0)

        const recurringGroups = groupRecurringLoans(recurringLoans)

        setReportData({
            borrower,
            regularActiveLoans: regularActiveLoans.map(loan => ({
                ...loan,
                balance: db.getLoanBalance(loan.id),
                payments: db.getPaymentsByLoanId(loan.id).filter(p => p.type === 'payment')
            })),
            regularFutureLoans,
            recurringGroups,
            autoPaymentLoans: autoPaymentLoans.map(loan => ({
                ...loan,
                balance: db.getLoanBalance(loan.id)
            })),
            statistics: {
                totalBalance,
                activeLoansCount: allActiveLoans.length,
                futureLoansCount: allFutureLoans.length
            }
        })
    }

    // קיבוץ הלוואות מחזוריות לפי סדרות
    const groupRecurringLoans = (recurringLoans: DatabaseLoan[]) => {
        const groups = new Map<string, DatabaseLoan[]>()

        recurringLoans.forEach(loan => {
            const key = `${loan.amount}-${loan.recurringDay}-${loan.recurringMonths}`
            if (!groups.has(key)) {
                groups.set(key, [])
            }
            groups.get(key)!.push(loan)
        })

        return Array.from(groups.entries()).map(([key, loans]) => {
            const sortedLoans = loans.sort((a, b) => new Date(a.loanDate).getTime() - new Date(b.loanDate).getTime())
            const firstLoan = sortedLoans[0]

            return {
                key,
                amount: firstLoan.amount,
                recurringDay: firstLoan.recurringDay,
                totalMonths: firstLoan.recurringMonths,
                actualLoans: sortedLoans.length,
                loans: sortedLoans.map(loan => ({
                    ...loan,
                    balance: db.getLoanBalance(loan.id),
                    payments: db.getPaymentsByLoanId(loan.id).filter(p => p.type === 'payment')
                }))
            }
        })
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS'
        }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('he-IL')
    }

    const printReport = () => {
        window.print()
    }

    return (
        <div>
            <header className="header">
                <h1>📊 דו"ח לווה</h1>
            </header>

            <main className="main-content">


                {/* בחירת לווה */}
                <div className="form-section">
                    <h2>בחר לווה לדו"ח</h2>
                    <select
                        value={selectedBorrowerId || ''}
                        onChange={(e) => selectBorrower(Number(e.target.value))}
                        className="form-input"
                        style={{ fontSize: '16px', padding: '10px' }}
                    >
                        <option value="">בחר לווה...</option>
                        {borrowers.map(borrower => (
                            <option key={borrower.id} value={borrower.id}>
                                {borrower.firstName} {borrower.lastName} - {borrower.phone}
                            </option>
                        ))}
                    </select>
                </div>

                {/* דו"ח הלווה */}
                {reportData && (
                    <div style={{ marginTop: '30px' }}>
                        {/* פרטי הלווה */}
                        <div className="info-section">
                            <h3 className="info-title">פרטי הלווה</h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '20px',
                                marginTop: '15px'
                            }}>
                                <div>
                                    <strong>שם מלא:</strong> {reportData.borrower.firstName} {reportData.borrower.lastName}
                                </div>
                                <div>
                                    <strong>טלפון:</strong> {reportData.borrower.phone}
                                </div>
                                <div>
                                    <strong>עיר:</strong> {reportData.borrower.city || 'לא צוין'}
                                </div>
                                <div>
                                    <strong>כתובת:</strong> {reportData.borrower.address || 'לא צוין'}
                                </div>
                            </div>
                        </div>

                        {/* סטטיסטיקות כלליות */}
                        <div className="info-section">
                            <h3 className="info-title">סיכום כללי</h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '15px',
                                marginTop: '15px'
                            }}>
                                <div className="stat-card">
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
                                        {reportData.statistics.activeLoansCount}
                                    </div>
                                    <div>הלוואות פעילות</div>
                                </div>
                                <div className="stat-card">
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>
                                        {reportData.statistics.futureLoansCount}
                                    </div>
                                    <div>הלוואות עתידיות</div>
                                </div>
                                <div className="stat-card">
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e74c3c' }}>
                                        {formatCurrency(reportData.statistics.totalBalance)}
                                    </div>
                                    <div>יתרת חוב</div>
                                </div>
                            </div>
                        </div>

                        {/* הלוואות רגילות פעילות */}
                        {reportData.regularActiveLoans.length > 0 && (
                            <div className="info-section">
                                <h3 className="info-title">הלוואות רגילות פעילות ({reportData.regularActiveLoans.length})</h3>
                                <div className="table-container">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>תאריך הלוואה</th>
                                                <th>סכום</th>
                                                <th>יתרה</th>
                                                <th>תאריך החזרה</th>
                                                <th>סטטוס</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.regularActiveLoans.map((loan: any) => (
                                                <tr key={loan.id}>
                                                    <td>{formatDate(loan.loanDate)}</td>
                                                    <td>{formatCurrency(loan.amount)}</td>
                                                    <td style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                                                        {formatCurrency(loan.balance)}
                                                    </td>
                                                    <td>{formatDate(loan.returnDate)}</td>
                                                    <td>
                                                        <span style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold',
                                                            backgroundColor: loan.status === 'active' ? '#d4edda' : '#f8d7da',
                                                            color: loan.status === 'active' ? '#155724' : '#721c24'
                                                        }}>
                                                            {loan.status === 'active' ? 'פעיל' : 'באיחור'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* הלוואות רגילות עתידיות */}
                        {reportData.regularFutureLoans.length > 0 && (
                            <div className="info-section">
                                <h3 className="info-title">הלוואות רגילות עתידיות ({reportData.regularFutureLoans.length})</h3>
                                <div className="table-container">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>תאריך הלוואה</th>
                                                <th>סכום</th>
                                                <th>תאריך החזרה</th>
                                                <th>הערות</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.regularFutureLoans.map((loan: DatabaseLoan) => (
                                                <tr key={loan.id}>
                                                    <td>{formatDate(loan.loanDate)}</td>
                                                    <td>{formatCurrency(loan.amount)}</td>
                                                    <td>{formatDate(loan.returnDate)}</td>
                                                    <td>{loan.notes || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* הלוואות מחזוריות */}
                        {reportData.recurringGroups.length > 0 && (
                            <div className="info-section">
                                <h3 className="info-title">הלוואות מחזוריות</h3>
                                {reportData.recurringGroups.map((group: any, index: number) => (
                                    <div key={index} style={{
                                        marginBottom: '20px',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        padding: '15px'
                                    }}>
                                        <h4 style={{
                                            margin: '0 0 15px 0',
                                            color: '#2c3e50',
                                            fontSize: '16px'
                                        }}>
                                            🔄 סדרה מחזורית: {formatCurrency(group.amount)} כל {group.recurringDay} לחודש
                                            <br />
                                            <small style={{ color: '#666' }}>
                                                ({group.actualLoans}/{group.totalMonths} הלוואות)
                                            </small>
                                        </h4>
                                        <div className="table-container">
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>תאריך</th>
                                                        <th>סכום</th>
                                                        <th>יתרה</th>
                                                        <th>סטטוס</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {group.loans.map((loan: any) => (
                                                        <tr key={loan.id}>
                                                            <td>{formatDate(loan.loanDate)}</td>
                                                            <td>{formatCurrency(loan.amount)}</td>
                                                            <td>{formatCurrency(loan.balance)}</td>
                                                            <td>
                                                                <span style={{
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '12px',
                                                                    fontWeight: 'bold',
                                                                    backgroundColor:
                                                                        loan.status === 'active' ? '#d4edda' :
                                                                            loan.status === 'overdue' ? '#f8d7da' : '#d1ecf1',
                                                                    color:
                                                                        loan.status === 'active' ? '#155724' :
                                                                            loan.status === 'overdue' ? '#721c24' : '#0c5460'
                                                                }}>
                                                                    {loan.status === 'active' ? 'פעיל' :
                                                                        loan.status === 'overdue' ? 'באיחור' : 'הושלם'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* הלוואות עם פירעון אוטומטי */}
                        {reportData.autoPaymentLoans.length > 0 && (
                            <div className="info-section">
                                <h3 className="info-title">הלוואות עם פרעון אוטומטי ({reportData.autoPaymentLoans.length})</h3>
                                <div className="table-container">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>תאריך הלוואה</th>
                                                <th>סכום הלוואה</th>
                                                <th>יתרה נוכחית</th>
                                                <th>יום פירעון</th>
                                                <th>סכום פירעון</th>
                                                <th>סטטוס</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.autoPaymentLoans.map((loan: any) => (
                                                <tr key={loan.id}>
                                                    <td>{formatDate(loan.loanDate)}</td>
                                                    <td>{formatCurrency(loan.amount)}</td>
                                                    <td style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                                                        {formatCurrency(loan.balance)}
                                                    </td>
                                                    <td>כל {loan.autoPaymentDay} לחודש</td>
                                                    <td>{formatCurrency(loan.autoPaymentAmount || 0)}</td>
                                                    <td>
                                                        <span style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold',
                                                            backgroundColor:
                                                                loan.status === 'active' ? '#d4edda' :
                                                                    loan.status === 'overdue' ? '#f8d7da' : '#d1ecf1',
                                                            color:
                                                                loan.status === 'active' ? '#155724' :
                                                                    loan.status === 'overdue' ? '#721c24' : '#0c5460'
                                                        }}>
                                                            {loan.status === 'active' ? 'פעיל' :
                                                                loan.status === 'overdue' ? 'באיחור' : 'הושלם'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* כפתור הדפסה */}
                        <div style={{ textAlign: 'center', marginTop: '30px' }}>
                            <button
                                onClick={printReport}
                                className="btn"
                                style={{
                                    backgroundColor: '#27ae60',
                                    color: 'white',
                                    fontSize: '16px',
                                    padding: '12px 24px'
                                }}
                            >
                                🖨️ הדפס דו"ח
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <button className="back-btn" onClick={() => navigate('/')}>
                🏠
            </button>
        </div>
    )
}

export default BorrowerReportPage