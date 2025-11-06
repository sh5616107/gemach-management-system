import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import HomePage from './pages/HomePage'
import LoansPage from './pages/LoansPage'
import DepositsPage from './pages/DepositsPage'
import DonationsPage from './pages/DonationsPage'

import AdminToolsPage from './pages/AdminToolsPage'
import SettingsPage from './pages/SettingsPage'
import HelpPage from './pages/HelpPage'
import BorrowerReportPage from './pages/BorrowerReportPage'
import StatisticsPage from './pages/StatisticsPage'

// קומפוננט לאיפוס גלילה בכל מעבר דף
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function App() {
  // אופטימיזציה לטעינה באלקטרון
  useEffect(() => {
    // סמן שהאפליקציה נטענה
    document.body.classList.add('loaded')
    
    // אופטימיזציה לאלקטרון
    if ((window as any).electronAPI) {
      (window as any).electronAPI.onDOMReady(() => {
        // הכל מוכן
        console.log('App loaded successfully')
      })
    }
    
    // טעינת תמונות עם מניעת הבהוב
    const images = document.querySelectorAll('img')
    images.forEach(img => {
      if (img.complete) {
        img.classList.add('loaded')
      } else {
        img.addEventListener('load', () => img.classList.add('loaded'))
        img.addEventListener('error', () => img.classList.add('loaded'))
      }
    })
  }, [])

  return (
    <div className="App">
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/loans" element={<LoansPage />} />
        <Route path="/deposits" element={<DepositsPage />} />
        <Route path="/donations" element={<DonationsPage />} />

        <Route path="/admin-tools" element={<AdminToolsPage />} />
        <Route path="/borrower-report" element={<BorrowerReportPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Routes>
    </div>
  )
}

export default App