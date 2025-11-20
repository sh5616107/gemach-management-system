import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
// CSS נטען דינמית לפי מצב ביצועים - לא מייבאים כאן!
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import LoansPage from './pages/LoansPage'
import DepositsPage from './pages/DepositsPage'
import DonationsPage from './pages/DonationsPage'

import AdminToolsPage from './pages/AdminToolsPage'
import OverdueLoansPage from './pages/OverdueLoansPage'
import SettingsPage from './pages/SettingsPage'
import HelpPage from './pages/HelpPage'
import BorrowerReportPage from './pages/BorrowerReportPage'
import StatisticsPage from './pages/StatisticsPage'
// import MasavFileGeneratorPage from './pages/MasavFileGeneratorPage'
// import MasavHistoryPage from './pages/MasavHistoryPage'
// import MasavValidatorPage from './pages/MasavValidatorPage'
import { db } from './database/database'

// קומפוננט לאיפוס גלילה בכל מעבר דף
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // בדיקה אם יש סיסמה מוגדרת ואם המשתמש מחובר
  useEffect(() => {
    const settings = db.getSettings()
    const sessionToken = sessionStorage.getItem('gemach_session')
    
    // אם אין סיסמה מוגדרת או יש טוקן סשן תקף - אפשר כניסה
    if (!settings.appPassword || sessionToken === 'authenticated') {
      setIsLoggedIn(true)
    }
    
    setIsCheckingAuth(false)
  }, [])

  const handleLogin = () => {
    sessionStorage.setItem('gemach_session', 'authenticated')
    setIsLoggedIn(true)
  }

  // טעינת CSS לפי מצב ביצועים
  useEffect(() => {
    const performanceMode = localStorage.getItem('performance_mode') || 'normal'
    
    // הסר CSS קל קיים תמיד קודם
    const existing = document.getElementById('light-mode-css')
    if (existing) {
      existing.remove()
    }
    
    if (performanceMode === 'light') {
      // במצב קל - טען את index-light.css
      const lightCss = document.createElement('link')
      lightCss.rel = 'stylesheet'
      lightCss.id = 'light-mode-css'
      
      // נסה מספר נתיבים אפשריים
      const baseUrl = window.location.href.replace(/index\.html.*$/, '')
      lightCss.href = baseUrl + 'index-light.css'
      
      // הוסף לראש המסמך
      document.head.appendChild(lightCss)
      
      console.log('✅ מצב קל: טעינת index-light.css מ-', lightCss.href)
      
      // בדוק אם הקובץ נטען בהצלחה
      lightCss.onload = () => console.log('✅ index-light.css נטען בהצלחה!')
      lightCss.onerror = () => console.error('❌ שגיאה בטעינת index-light.css')
    } else {
      console.log('✅ מצב רגיל: משתמש ב-index.css בלבד')
    }
  }, [])

  // אופטימיזציה לטעינה באלקטרון
  useEffect(() => {
    // סמן שהאפליקציה נטענה
    document.body.classList.add('loaded')
  }, [])

  // אם עדיין בודק אימות, הצג מסך טעינה
  if (isCheckingAuth) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <h2>טוען...</h2>
        </div>
      </div>
    )
  }

  // אם לא מחובר, הצג מסך התחברות
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="App">
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/loans" element={<LoansPage />} />
        <Route path="/deposits" element={<DepositsPage />} />
        <Route path="/donations" element={<DonationsPage />} />

        <Route path="/admin-tools" element={<AdminToolsPage />} />
        <Route path="/overdue-loans" element={<OverdueLoansPage />} />
        <Route path="/borrower-report" element={<BorrowerReportPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
        {/* <Route path="/masav-generator" element={<MasavFileGeneratorPage />} /> */}
        {/* <Route path="/masav-history" element={<MasavHistoryPage />} /> */}
        {/* <Route path="/masav-validator" element={<MasavValidatorPage />} /> */}
      </Routes>
    </div>
  )
}

export default App