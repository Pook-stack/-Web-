import { useState } from 'react'
import WelcomePage from './components/WelcomePage'
import ClubHome from './components/ClubHome'
import ClubDetail from './components/ClubDetail'

function App() {
  const [currentPage, setCurrentPage] = useState('welcome')
  const [selectedClubId, setSelectedClubId] = useState(1)

  const handleEnter = () => {
    setCurrentPage('home')
  }

  const handleBack = () => {
    if (currentPage === 'detail') {
      setCurrentPage('home')
    } else {
      setCurrentPage('welcome')
    }
  }

  const handleSelectClub = (clubId) => {
    setSelectedClubId(clubId)
    setCurrentPage('detail')
  }

  return (
    <div className="min-h-screen min-h-dvh bg-dark-300">
      {currentPage === 'welcome' && (
        <WelcomePage onEnter={handleEnter} />
      )}
      {currentPage === 'home' && (
        <ClubHome onBack={handleBack} onSelectClub={handleSelectClub} />
      )}
      {currentPage === 'detail' && (
        <ClubDetail clubId={selectedClubId} onBack={handleBack} />
      )}
    </div>
  )
}

export default App
