import { useState, useEffect } from 'react'
import { Card, Avatar, Button, StatusTag } from './ui'
import { notificationService } from '../services/localDataService'

const mockUserData = {
  nickname: '游戏玩家',
  email: 'player@example.com',
  avatar: null,
  joinDate: '2024-01-15',
  totalClubs: 3,
  totalApplications: 5,
}

export default function MyProfile({ onBack, onSelectClub, onEnterChat, clubsData = [], appliedClubs = [], onNavigateToCreate, onNavigateToNotifications }) {
  const [userData] = useState(mockUserData)
  const [activeTab, setActiveTab] = useState('clubs')
  const [myClubs, setMyClubs] = useState([])
  const [myApplications, setMyApplications] = useState([])
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    const appliedClubIds = appliedClubs || []
    
    const clubs = clubsData.filter(club => appliedClubIds.includes(club.id))
    setMyClubs(clubs)

    const applications = appliedClubIds.map(clubId => {
      const club = clubsData.find(c => c.id === clubId)
      return club ? {
        id: club.id,
        club: club,
        status: 'approved',
        appliedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      } : null
    }).filter(Boolean)
    
    setMyApplications(applications)
  }, [clubsData, appliedClubs])

  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const result = await notificationService.getNotifications(0, 100)
        if (result.data && result.data.length > 0) {
          const unreadCount = result.data.filter(n => !n.is_read && !n.dismissed).length
          setNotificationCount(unreadCount)
        } else {
          setNotificationCount(0)
        }
      } catch (error) {
        console.error('获取通知数量失败:', error)
        setNotificationCount(0)
      }
    }

    fetchNotificationCount()
  }, [])

  const handleEnterChat = (club) => {
    if (onEnterChat) {
      onEnterChat(club.id, club.name)
    }
  }

  const tabs = [
    { key: 'clubs', label: '我的俱乐部', count: myClubs.length },
    { key: 'applications', label: '申请记录', count: myApplications.length },
    { key: 'settings', label: '设置' },
  ]

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-b from-dark-300 to-dark-200">
      <div className="bg-gradient-to-b from-primary-700/20 to-transparent">
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-6">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            返回
          </button>

          <div className="flex items-center gap-6 mb-6">
            <Avatar 
              name={userData.nickname} 
              image={userData.avatar}
              size="xl"
            />
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {userData.nickname}
              </h1>
              <p className="text-gray-400 text-sm">
                加入于 {userData.joinDate}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card className="text-center">
              <div className="text-2xl font-bold text-primary-700 mb-1">
                {userData.totalClubs}
              </div>
              <div className="text-sm text-gray-400">加入的俱乐部</div>
            </Card>
            <Card className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {myApplications.filter(a => a.status === 'approved').length}
              </div>
              <div className="text-sm text-gray-400">已通过</div>
            </Card>
            <Card className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {myApplications.filter(a => a.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-400">待审核</div>
            </Card>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-40 bg-dark-300/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 whitespace-nowrap transition-all border-b-2 ${
                    activeTab === tab.key
                      ? 'text-white border-primary-700'
                      : 'text-gray-400 border-transparent hover:text-white'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-2 px-2 py-0.5 bg-white/10 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={onNavigateToNotifications}
                className="p-2 text-gray-400 hover:text-white transition-colors relative"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'clubs' && (
          <div className="space-y-4">
            {myClubs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <svg className="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <p className="mb-4">还没有加入任何俱乐部</p>
                <Button onClick={onBack}>
                  去逛逛
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">已加入的俱乐部</h2>
                  <Button size="sm" onClick={onNavigateToCreate}>
                    创建俱乐部
                  </Button>
                </div>
                
                {myClubs.map((club) => (
                  <Card
                    key={club.id}
                    className="cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={club.icon}
                        alt={club.name}
                        className="w-16 h-16 rounded-lg object-cover group-hover:scale-105 transition-transform"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white group-hover:text-primary-700 transition-colors truncate">
                          {club.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                          <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs">
                            {club.game}
                          </span>
                          <span>{club.memberCount} 成员</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusTag status="approved" />
                        <button
                          onClick={() => handleEnterChat(club)}
                          className="p-2 bg-primary-700/20 text-primary-700 hover:bg-primary-700/30 rounded-lg transition-colors"
                          title="进入聊天"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onSelectClub && onSelectClub(club.id)}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                          title="查看详情"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="space-y-4">
            {myApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <svg className="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="2" />
                </svg>
                <p className="mb-4">还没有申请记录</p>
                <Button onClick={onBack}>
                  去申请
                </Button>
              </div>
            ) : (
              myApplications.map((application) => (
                <Card
                  key={application.id}
                  onClick={() => onSelectClub && onSelectClub(application.club.id)}
                  className="cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={application.club.icon}
                      alt={application.club.name}
                      className="w-12 h-12 rounded-lg object-cover group-hover:scale-105 transition-transform"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-white group-hover:text-primary-700 transition-colors truncate">
                        {application.club.name}
                      </h3>
                      <div className="text-xs text-gray-400 mt-1">
                        申请时间: {new Date(application.appliedAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusTag status={application.status} />
                      <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <Card>
              <h2 className="text-lg font-bold text-white mb-4">个人信息</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <div>
                    <div className="text-sm text-gray-400">头像</div>
                    <Avatar name={userData.nickname} size="lg" className="mt-2" />
                  </div>
                  <Button variant="secondary" size="sm">
                    修改
                  </Button>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <div>
                    <div className="text-sm text-gray-400">昵称</div>
                    <div className="text-white mt-1">{userData.nickname}</div>
                  </div>
                  <Button variant="secondary" size="sm">
                    修改
                  </Button>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm text-gray-400">邮箱</div>
                    <div className="text-white mt-1">{userData.email}</div>
                  </div>
                  <Button variant="secondary" size="sm">
                    修改
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-bold text-white mb-4">应用设置</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <div>
                    <div className="text-white">消息通知</div>
                    <div className="text-sm text-gray-400">接收俱乐部消息通知</div>
                  </div>
                  <div className="relative inline-block w-12 h-6">
                    <input type="checkbox" className="peer sr-only" defaultChecked />
                    <div className="w-12 h-6 bg-gray-600 rounded-full peer peer-checked:bg-primary-700 cursor-pointer transition-colors"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-white">深色模式</div>
                    <div className="text-sm text-gray-400">使用深色主题</div>
                  </div>
                  <div className="relative inline-block w-12 h-6">
                    <input type="checkbox" className="peer sr-only" defaultChecked />
                    <div className="w-12 h-6 bg-gray-600 rounded-full peer peer-checked:bg-primary-700 cursor-pointer transition-colors"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}