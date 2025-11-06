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