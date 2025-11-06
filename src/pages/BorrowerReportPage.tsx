import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { db, DatabaseLoan, DatabaseBorrower } from '../database/database'
import { formatCombinedDate } from '../utils/hebrewDate'

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
        return db.getSettings().showHebrewDates ? 
            formatCombinedDate(dateString) : 
            new Date(dateString).toLocaleDateString('he-IL')
    }

    const printReport = () => {
        if (!reportData) return

        // פתח חלון חדש להדפסה
        const printWindow = window.open('', '_blank', 'width=800,height=600')
        if (!printWindow) return

        const printContent = `
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>דו"ח לווה - ${reportData.borrower.firstName} ${reportData.borrower.lastName}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        direction: rtl;
                        margin: 20px;
                        line-height: 1.4;
                        font-size: 14px;
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    h1 {
                        font-size: 24px;
                        margin-bottom: 20px;
                        text-decoration: underline;
                        text-align: center;
                    }
                    h2 {
                        font-size: 18px;
                        margin-bottom: 15px;
                        text-decoration: underline;
                    }
                    h3 {
                        font-size: 16px;
                        margin-bottom: 10px;
                    }
                    .section {
                        margin-bottom: 30px;
                        border: 1px solid #000;
                        padding: 15px;
                    }
                    .summary-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr;
                        gap: 15px;
                        text-align: center;
                    }
                    .summary-item {
                        padding: 10px;
                    }
                    .summary-value {
                        font-size: 20px;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        border: 1px solid #000;
                        margin-top: 10px;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 8px;
                        text-align: center;
                    }
                    th {
                        background-color: #f0f0f0;
                        font-weight: bold;
                    }
                    .recurring-group {
                        margin-bottom: 20px;
                        border: 1px solid #000;
                        padding: 10px;
                    }
                    .footer {
                        margin-top: 40px;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                    }
                    .print-buttons {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .print-btn {
                        background: #3498db;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        margin: 0 10px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                    }
                    .close-btn {
                        background: #e74c3c;
                    }
                    @media print {
                        .print-buttons {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="print-buttons">
                    <button class="print-btn" onclick="window.print()">🖨️ הדפס</button>
                    <button class="print-btn close-btn" onclick="window.close()">❌ סגור</button>
                </div>
                
                <div class="container">
                    <h1>דו"ח לווה מפורט</h1>
                    
                    <!-- פרטי הלווה -->
                    <div class="section">
                        <h2>פרטי הלווה</h2>
                        <p><strong>שם מלא:</strong> ${reportData.borrower.firstName} ${reportData.borrower.lastName}</p>
                        <p><strong>טלפון:</strong> ${reportData.borrower.phone}</p>
                        <p><strong>עיר:</strong> ${reportData.borrower.city || 'לא צוין'}</p>
                        <p><strong>כתובת:</strong> ${reportData.borrower.address || 'לא צוין'}</p>
                    </div>

                    <!-- סיכום כללי -->
                    <div class="section">
                        <h2>סיכום כללי</h2>
                        <div class="summary-grid">
                            <div class="summary-item">
                                <div class="summary-value">${reportData.statistics.activeLoansCount}</div>
                                <div>הלוואות פעילות</div>
                            </div>
                            <div class="summary-item">
                                <div class="summary-value">${reportData.statistics.futureLoansCount}</div>
                                <div>הלוואות עתידיות</div>
                            </div>
                            <div class="summary-item">
                                <div class="summary-value">${formatCurrency(reportData.statistics.totalBalance)}</div>
                                <div>יתרת חוב</div>
                            </div>
                        </div>
                    </div>

                    ${reportData.regularActiveLoans.length > 0 ? `
                    <!-- הלוואות רגילות פעילות -->
                    <div class="section">
                        <h2>הלוואות רגילות פעילות (${reportData.regularActiveLoans.length})</h2>
                        <table>
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
                                ${reportData.regularActiveLoans.map((loan: any) => `
                                    <tr>
                                        <td>${formatDate(loan.loanDate)}</td>
                                        <td>${formatCurrency(loan.amount)}</td>
                                        <td style="font-weight: bold;">${formatCurrency(loan.balance)}</td>
                                        <td>${formatDate(loan.returnDate)}</td>
                                        <td>${loan.status === 'active' ? 'פעיל' : 'באיחור'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ` : ''}

                    ${reportData.regularFutureLoans.length > 0 ? `
                    <!-- הלוואות רגילות עתידיות -->
                    <div class="section">
                        <h2>הלוואות רגילות עתידיות (${reportData.regularFutureLoans.length})</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>תאריך הלוואה</th>
                                    <th>סכום</th>
                                    <th>תאריך החזרה</th>
                                    <th>הערות</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${reportData.regularFutureLoans.map((loan: any) => `
                                    <tr>
                                        <td>${formatDate(loan.loanDate)}</td>
                                        <td>${formatCurrency(loan.amount)}</td>
                                        <td>${formatDate(loan.returnDate)}</td>
                                        <td>${loan.notes || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ` : ''}

                    ${reportData.recurringGroups.length > 0 ? `
                    <!-- הלוואות מחזוריות -->
                    <div class="section">
                        <h2>הלוואות מחזוריות</h2>
                        ${reportData.recurringGroups.map((group: any) => `
                            <div class="recurring-group">
                                <h3>🔄 סדרה מחזורית: ${formatCurrency(group.amount)} כל ${group.recurringDay} לחודש (${group.actualLoans}/${group.totalMonths} הלוואות)</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>תאריך</th>
                                            <th>סכום</th>
                                            <th>יתרה</th>
                                            <th>סטטוס</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${group.loans.map((loan: any) => `
                                            <tr>
                                                <td>${formatDate(loan.loanDate)}</td>
                                                <td>${formatCurrency(loan.amount)}</td>
                                                <td>${formatCurrency(loan.balance)}</td>
                                                <td>${loan.status === 'active' ? 'פעיל' : loan.status === 'overdue' ? 'באיחור' : 'הושלם'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}

                    ${reportData.autoPaymentLoans.length > 0 ? `
                    <!-- הלוואות עם פרעון אוטומטי -->
                    <div class="section">
                        <h2>הלוואות עם פרעון אוטומטי (${reportData.autoPaymentLoans.length})</h2>
                        <table>
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
                                ${reportData.autoPaymentLoans.map((loan: any) => `
                                    <tr>
                                        <td>${formatDate(loan.loanDate)}</td>
                                        <td>${formatCurrency(loan.amount)}</td>
                                        <td style="font-weight: bold;">${formatCurrency(loan.balance)}</td>
                                        <td>כל ${loan.autoPaymentDay} לחודש</td>
                                        <td>${formatCurrency(loan.autoPaymentAmount || 0)}</td>
                                        <td>${loan.status === 'active' ? 'פעיל' : loan.status === 'overdue' ? 'באיחור' : 'הושלם'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ` : ''}

                    <div class="footer">
                        <p>דו"ח נוצר בתאריך: ${db.getSettings().showHebrewDates ? formatCombinedDate(new Date()) : new Date().toLocaleDateString('he-IL')}</p>
                    </div>
                </div>
            </body>
            </html>
        `

        printWindow.document.write(printContent)
        printWindow.document.close()
        printWindow.focus()
    }

    return (
        <div>
            <header className="header">
                <h1>📊 דו"ח לווה</h1>
                <button className="close-btn" onClick={() => navigate('/')}>×</button>
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