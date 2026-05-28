import { useState, useEffect } from 'react'
import { useClubApplications } from './hooks'
import { clubService, applicationService, adminService, memberService, testConnection, initAdminSystem } from './services/supabase'
import WelcomePage from './components/WelcomePage'
import ClubHome from './components/ClubHome'
import ClubDetail from './components/ClubDetail'
import CreateClub from './components/CreateClub'
import MyProfile from './components/MyProfile'
import Notifications from './components/Notifications'
import Leaderboard from './components/Leaderboard'
import AdminDashboard from './components/AdminDashboard'
import DatabaseManager from './components/DatabaseManager'

function App() {
  const [currentPage, setCurrentPage] = useState('welcome')
  const [selectedClubId, setSelectedClubId] = useState(null)
  const [clubs, setClubs] = useState([])
  const [pendingClubs, setPendingClubs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [dbConnected, setDbConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const [users, setUsers] = useState([])
  const { appliedClubs, isApplied, applyToClub: applyToClubHook } = useClubApplications()

  useEffect(() => {
    const initApp = async () => {
      console.log('正在连接Supabase数据库...')
      
      try {
        const connectionResult = await testConnection()
        
        if (connectionResult.success) {
          console.log('✅ 数据库连接成功')
          setDbConnected(true)
          
          await initAdminSystem()
          
          const [clubsResult, pendingResult, usersResult] = await Promise.all([
            clubService.getAllClubs(),
            clubService.getPendingClubs(),
            adminService.getAllUsers()
          ])
          
          setClubs(clubsResult.data || [])
          setPendingClubs(pendingResult.data || [])
          setUsers(usersResult.data || [])
          setConnectionError(null)
        } else {
          console.error('❌ 数据库连接失败:', connectionResult.error)
          setDbConnected(false)
          setConnectionError(connectionResult.error?.message || '数据库连接失败')
        }
      } catch (error) {
        console.error('❌ 初始化失败:', error)
        setDbConnected(false)
        setConnectionError(error.message || '未知错误')
      } finally {
        setIsLoading(false)
      }
    }

    initApp()
  }, [])

  const handleRetryConnection = async () => {
    setIsLoading(true)
    setConnectionError(null)
    
    try {
      const connectionResult = await testConnection()
      
      if (connectionResult.success) {
        console.log('✅ 数据库连接成功')
        setDbConnected(true)
        
        await initAdminSystem()
        
        const [clubsResult, pendingResult, usersResult] = await Promise.all([
          clubService.getAllClubs(),
          clubService.getPendingClubs(),
          adminService.getAllUsers()
        ])
        
        setClubs(clubsResult.data || [])
        setPendingClubs(pendingResult.data || [])
        setUsers(usersResult.data || [])
        setConnectionError(null)
      } else {
        console.error('❌ 数据库连接失败:', connectionResult.error)
        setDbConnected(false)
        setConnectionError(connectionResult.error?.message || '数据库连接失败')
      }
    } catch (error) {
      console.error('❌ 连接重试失败:', error)
      setDbConnected(false)
      setConnectionError(error.message || '未知错误')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnter = () => {
    setCurrentPage('home')
  }

  const handleBack = () => {
    switch (currentPage) {
      case 'detail':
      case 'create':
      case 'my':
      case 'notifications':
      case 'leaderboard':
      case 'admin':
      case 'database':
        setCurrentPage('home')
        break
      default:
        setCurrentPage('welcome')
    }
  }

  const handleSelectClub = (clubId) => {
    setSelectedClubId(clubId)
    setCurrentPage('detail')
  }

  const handleCreateClub = async (clubData) => {
    try {
      if (!dbConnected) {
        throw new Error('数据库未连接，请先修复连接问题')
      }

      const result = await clubService.createClub({
        name: clubData.name,
        game: clubData.game,
        description: clubData.description,
        contact: clubData.contact,
        price_range: clubData.priceRange,
        special_services: clubData.specialServices,
        icon: clubData.icon,
      })
      
      if (result.error) {
        console.error('创建俱乐部失败:', result.error)
        throw new Error(result.error.message || '创建失败，请重试')
      }

      const pendingResult = await clubService.getPendingClubs()
      setPendingClubs(pendingResult.data || [])
      
      return { success: true }
    } catch (error) {
      console.error('创建俱乐部失败:', error)
      return { error: { message: error.message } }
    }
  }

  const handleApproveClub = async (clubId) => {
    if (dbConnected) {
      const result = await clubService.approveClub(clubId)
      
      if (result.error) {
        console.error('审核失败:', result.error)
        alert('审核失败，请重试')
      } else {
        const [clubsResult, pendingResult] = await Promise.all([
          clubService.getAllClubs(),
          clubService.getPendingClubs()
        ])
        
        setClubs(clubsResult.data || [])
        setPendingClubs(pendingResult.data || [])
        alert('俱乐部已通过审核！')
      }
    }
  }

  const handleRejectClub = async (clubId) => {
    if (dbConnected) {
      const result = await clubService.rejectClub(clubId)
      
      if (result.error) {
        console.error('拒绝失败:', result.error)
        alert('拒绝失败，请重试')
      } else {
        const pendingResult = await clubService.getPendingClubs()
        setPendingClubs(pendingResult.data || [])
        alert('已拒绝该申请')
      }
    }
  }

  const handleDeleteClub = async (clubId) => {
    if (dbConnected) {
      if (window.confirm('确定要删除这个俱乐部吗？')) {
        const result = await clubService.deleteClub(clubId)
        
        if (result.error) {
          console.error('删除失败:', result.error)
          alert('删除失败，请重试')
        } else {
          const clubsResult = await clubService.getAllClubs()
          setClubs(clubsResult.data || [])
          alert('俱乐部已删除')
        }
      }
    }
  }

  const handleQuickJoin = async (clubId) => {
    if (!isApplied(clubId)) {
      if (window.confirm('确定要申请加入该俱乐部吗？')) {
        if (dbConnected) {
          const result = await applicationService.applyToClub(clubId)
          
          if (result.error && !result.alreadyApplied) {
            console.error('申请失败:', result.error)
            alert('申请失败，请重试')
          } else {
            applyToClubHook(clubId)
            
            const clubsResult = await clubService.getAllClubs()
            setClubs(clubsResult.data || [])
            
            alert(result.alreadyApplied ? '您已经申请过该俱乐部了' : '申请成功！等待管理员审核')
          }
        }
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen min-h-dvh bg-gradient-to-b from-dark-300 to-dark-200 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="w-full h-full border-4 border-primary-700 border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 w-full h-full border-4 border-primary-700/30 border-t-transparent rounded-full animate-spin" style={{ animationDelay: '0.2s' }} />
          </div>
          <p className="text-white text-lg">正在连接数据库...</p>
          <p className="text-gray-400 text-sm mt-2">请稍候...</p>
        </div>
      </div>
    )
  }

  if (!dbConnected) {
    return (
      <div className="min-h-screen min-h-dvh bg-gradient-to-b from-dark-300 to-dark-200 p-4">
        <div className="max-w-md w-full mx-auto mt-12">
          <div className="bg-white/5 rounded-2xl p-6">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h2 className="text-xl font-bold text-white text-center mb-2">数据库连接失败</h2>
            <p className="text-gray-400 text-center mb-6">
              {connectionError || '无法连接到数据库，请检查配置'}
            </p>
            
            <button
              onClick={handleRetryConnection}
              className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-700/30 transition-all mb-6"
            >
              🔄 重新连接数据库
            </button>
            
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-white font-semibold mb-3">📋 解决步骤</h3>
              <ol className="text-gray-400 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary-400 font-bold">1.</span>
                  <span>访问 <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">supabase.com/dashboard</a></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400 font-bold">2.</span>
                  <span>创建新的项目或选择现有项目</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400 font-bold">3.</span>
                  <span>进入 Settings → API，复制 Project URL 和 Anon Key</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400 font-bold">4.</span>
                  <span>更新 <code className="bg-white/10 px-1 rounded">.env</code> 文件中的配置</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400 font-bold">5.</span>
                  <span>点击上方按钮重新连接</span>
                </li>
              </ol>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <p className="text-yellow-400 text-sm">
                ⚠️ 提示：如果刚刚创建了项目，请等待5-10分钟让DNS生效
              </p>
            </div>
            
            <div className="mt-4 p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-gray-500">
                当前数据库地址: {import.meta.env.VITE_SUPABASE_URL}
              </p>
            </div>
          </div>
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
          onNavigateToDatabase={() => setCurrentPage('database')}
          onQuickJoin={handleQuickJoin}
          isApplied={isApplied}
          clubsData={clubs}
        />
      )}
      {currentPage === 'detail' && selectedClubId && (
        <ClubDetail 
          clubId={selectedClubId} 
          onBack={handleBack}
          onQuickJoin={handleQuickJoin}
          isApplied={isApplied}
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
          clubsData={clubs}
          appliedClubs={appliedClubs}
          onNavigateToCreate={() => setCurrentPage('create')}
          onNavigateToNotifications={() => setCurrentPage('notifications')}
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
      {currentPage === 'database' && (
        <DatabaseManager onBack={handleBack} />
      )}
    </div>
  )
}

export default App