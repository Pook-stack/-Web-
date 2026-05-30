import { useState, useEffect } from 'react'
import { useClubApplications } from './hooks'
import { clubService, applicationService, memberService, adminService, testConnection, initAdminSystem, initializeLocalData } from './services/localDataService'
import { adminManagementService } from './services/localDataService'
import { getUserId, initUserProfile, getLocalProfile, updateLocalProfile } from './services/userIdentity'
import WelcomePage from './components/WelcomePage'
import ClubHome from './components/ClubHome'
import ClubDetail from './components/ClubDetail'
import CreateClub from './components/CreateClub'
import MyProfile from './components/MyProfile'
import Notifications from './components/Notifications'
import Leaderboard from './components/Leaderboard'
import AdminDashboard from './components/AdminDashboard'
import ChatSelector from './components/ChatSelector'
import ClaudeChat from './components/ClaudeChat'

function App() {
  const [currentPage, setCurrentPage] = useState('welcome')
  const [selectedClubId, setSelectedClubId] = useState(null)
  const [selectedClubName, setSelectedClubName] = useState('')
  const [clubs, setClubs] = useState([])
  const [pendingClubs, setPendingClubs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [localProfile, setLocalProfile] = useState(null)
  const currentUserId = getUserId()

  const {
    appliedClubs,
    memberClubs,
    rejectedClubs,
    isApplied,
    isRejected,
    isMember,
    canApply,
    canReapply,
    applyToClub: applyToClubHook,
    joinClub,
    loadAppliedClubs,
    loadMemberClubs
  } = useClubApplications()

  const loadClubsWithMemberCount = async () => {
    const result = await clubService.getAllClubs()
    if (result.data) {
      const clubsWithCount = await Promise.all(
        result.data.map(async (club) => {
          const countResult = await adminManagementService.getRealMemberCount(club.id)
          return {
            ...club,
            memberCount: countResult.success ? countResult.count : 0
          }
        })
      )
      setClubs(clubsWithCount)
      return clubsWithCount
    }
    return []
  }

  useEffect(() => {
    const initApp = async () => {
      try {
        // seed official clubs if needed
        await initializeLocalData()
        const profile = initUserProfile()
        setLocalProfile(profile)

        await initAdminSystem()
        const [pendingResult, usersResult] = await Promise.all([
          clubService.getPendingClubs(),
          adminService.getAllUsers()
        ])
        await loadClubsWithMemberCount()
        await loadAppliedClubs()
        await loadMemberClubs()
        setPendingClubs(pendingResult.data || [])
        setUsers(usersResult.data || [])
      } catch (error) {
        console.error('初始化失败', error)
      } finally {
        setIsLoading(false)
      }
    }
    initApp()
  }, [loadAppliedClubs, loadMemberClubs])

  const handleEnter = () => {
    setCurrentPage('home')
  }

  const handleBack = () => {
    if (currentPage === 'detail' || currentPage === 'chat' || currentPage === 'claude-chat') {
      setCurrentPage('home')
      setSelectedClubId(null)
      setSelectedClubName('')
    } else {
      setCurrentPage('home')
    }
  }

  const handleSelectClub = (clubId) => {
    const club = clubs.find(c => c.id === clubId)
    if (club) {
      setSelectedClubId(clubId)
      setSelectedClubName(club.name)
      setCurrentPage('detail')
    }
  }

  const handleEnterChat = (clubId, clubName) => {
    if (isMember(clubId)) {
      setSelectedClubId(clubId)
      setSelectedClubName(clubName)
      setCurrentPage('chat')
    } else {
      alert('您还不是该俱乐部成员，请先申请加入并等待管理员审核通过')
    }
  }

  const handleCreateClub = async (clubData) => {
    const result = await clubService.createClub({
      ...clubData,
      status: 'pending'
    })
    if (result.error) {
      return { success: false, error: result.error }
    }
    await loadClubsWithMemberCount()
    const pendingResult = await clubService.getPendingClubs()
    setPendingClubs(pendingResult.data || [])
    return { success: true }
  }

  const handleApproveClub = async (clubId) => {
    const result = await clubService.approveClub(clubId)
    if (result.error) {
      alert('审核失败，请重试')
    } else {
      await loadClubsWithMemberCount()
      const pendingResult = await clubService.getPendingClubs()
      setPendingClubs(pendingResult.data || [])
      alert('俱乐部已通过审核！')
    }
  }

  const handleRejectClub = async (clubId) => {
    const result = await clubService.rejectClub(clubId)
    if (result.error) {
      alert('拒绝失败，请重试')
    } else {
      const pendingResult = await clubService.getPendingClubs()
      setPendingClubs(pendingResult.data || [])
      alert('已拒绝该申请')
    }
  }

  const handleDeleteClub = async (clubId) => {
    if (window.confirm('确定要删除这个俱乐部吗？')) {
      const result = await clubService.deleteClub(clubId)
      if (result.error) {
        alert('删除失败，请重试')
      } else {
        await loadClubsWithMemberCount()
        alert('俱乐部已删除')
      }
    }
  }

  const handleQuickJoin = async (clubId) => {
    if (!isApplied(clubId) && !isRejected(clubId)) {
      const result = await applicationService.applyToClub(clubId, currentUserId)
      if (result.error && !result.alreadyApplied) {
        alert('申请失败，请重试')
      } else {
        applyToClubHook(clubId)
        await loadAppliedClubs()
        await loadClubsWithMemberCount()
        if (result.alreadyApplied) {
          alert('您已经申请过该俱乐部了')
        } else {
          const club = clubs.find(c => c.id === clubId)
          alert(club ? `申请成功！等待管理员审核\n\n审核通过后您将自动进入俱乐部聊天界面` : '申请成功！等待管理员审核')
        }
      }
    }
  }

  const handleClubDeleted = async () => {
    await loadClubsWithMemberCount()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen min-h-dvh bg-gradient-to-b from-dark-300 to-dark-200 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="w-full h-full border-4 border-primary-700 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-white text-lg">正在加载...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-h-dvh bg-dark-300">
      {currentPage === 'welcome' && (
        <WelcomePage onEnter={handleEnter} />
      )}

      {currentPage === 'home' && (
        <ClubHome
          onBack={handleBack}
          onSelectClub={handleSelectClub}
          onNavigateToCreate={() => setCurrentPage('create')}
          onNavigateToMy={() => setCurrentPage('my')}
          onNavigateToNotifications={() => setCurrentPage('notifications')}
          onNavigateToLeaderboard={() => setCurrentPage('leaderboard')}
          onNavigateToAdmin={() => setCurrentPage('admin')}
          onNavigateToClaude={() => setCurrentPage('claude-chat')}
          onQuickJoin={handleQuickJoin}
          onEnterChat={handleEnterChat}
          isApplied={isApplied}
          isRejected={isRejected}
          isMember={isMember}
          canApply={canApply}
          canReapply={canReapply}
          clubsData={clubs}
        />
      )}

      {currentPage === 'detail' && selectedClubId && (
        <ClubDetail
          clubId={selectedClubId}
          onBack={handleBack}
          onQuickJoin={handleQuickJoin}
          isApplied={isApplied}
          onClubDeleted={handleClubDeleted}
          onEnterChat={handleEnterChat}
        />
      )}

      {currentPage === 'create' && (
        <CreateClub
          onBack={handleBack}
          onSubmit={handleCreateClub}
          onSuccess={() => setCurrentPage('home')}
        />
      )}

      {currentPage === 'my' && (
        <MyProfile
          onBack={handleBack}
          onSelectClub={handleSelectClub}
          onEnterChat={handleEnterChat}
          onNavigateToCreate={() => setCurrentPage('create')}
          onNavigateToNotifications={() => setCurrentPage('notifications')}
          clubsData={clubs}
          appliedClubs={appliedClubs}
        />
      )}

      {currentPage === 'notifications' && (
        <Notifications
          onBack={handleBack}
          onSelectClub={handleSelectClub}
          clubsData={clubs}
        />
      )}

      {currentPage === 'leaderboard' && (
        <Leaderboard
          onBack={handleBack}
          onSelectClub={handleSelectClub}
          clubsData={clubs}
        />
      )}

      {currentPage === 'admin' && (
        <AdminDashboard
          onBack={handleBack}
          onSelectClub={handleSelectClub}
          clubsData={pendingClubs}
          allClubs={clubs}
          users={users}
          onApproveClub={handleApproveClub}
          onRejectClub={handleRejectClub}
          onDeleteClub={handleDeleteClub}
        />
      )}

      {currentPage === 'chat' && selectedClubId && (
        <ChatSelector
          clubId={selectedClubId}
          clubName={selectedClubName}
          onBack={handleBack}
        />
      )}

      {currentPage === 'claude-chat' && (
        <ClaudeChat onBack={handleBack} />
      )}
    </div>
  )
}

export default App
