import { useState, useMemo } from 'react'
import { Card, Avatar } from './ui'

export default function Leaderboard({ onBack, clubsData = [], onSelectClub }) {
  const [activeTab, setActiveTab] = useState('popularity')

  const tabs = [
    { key: 'popularity', label: '人气榜单', icon: '🔥' },
    { key: 'rating', label: '评分榜单', icon: '⭐' },
    { key: 'newbie', label: '新秀榜单', icon: '🌟' },
  ]

  const sortedClubs = useMemo(() => {
    if (!clubsData || clubsData.length === 0) return []
    
    let sorted = [...clubsData]
    
    switch (activeTab) {
      case 'popularity':
        sorted = sorted.sort((a, b) => b.memberCount - a.memberCount)
        break
      case 'rating':
        sorted = sorted.sort((a, b) => b.rating - a.rating)
        break
      case 'newbie':
        sorted = sorted
          .filter(club => club.foundedYear && parseInt(club.foundedYear) >= 2023)
          .sort((a, b) => parseInt(b.foundedYear) - parseInt(a.foundedYear))
        break
      default:
        break
    }
    
    return sorted
  }, [clubsData, activeTab])

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black'
      case 2:
        return 'bg-gradient-to-br from-gray-300 to-gray-500 text-black'
      case 3:
        return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
      default:
        return 'bg-white/10 text-gray-400'
    }
  }

  const getStatDisplay = (club, type) => {
    switch (type) {
      case 'popularity':
        return `${club.memberCount} 成员`
      case 'rating':
        return `${club.rating} 分`
      case 'newbie':
        return `${club.foundedYear}年成立`
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-b from-dark-300 to-dark-200">
      <div className="sticky top-0 z-50 bg-dark-300/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            返回
          </button>
          
          <h1 className="text-2xl font-bold text-white mb-4">排行榜</h1>
          
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'bg-primary-700 text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {sortedClubs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 21V10M12 21V3M16 21V14" />
            </svg>
            <p>暂无榜单数据</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4">
              <span className="text-sm text-gray-400">更新时间: {new Date().toLocaleDateString('zh-CN')}</span>
              <span className="text-sm text-gray-400">共 {sortedClubs.length} 个俱乐部</span>
            </div>

            {sortedClubs.slice(0, 3).map((club, index) => (
              <Card
                key={club.id}
                onClick={() => onSelectClub && onSelectClub(club.id)}
                className="relative overflow-hidden cursor-pointer group"
              >
                <div className={`absolute top-0 left-0 w-16 h-16 ${getRankStyle(index + 1)} rounded-br-full flex items-center justify-center text-2xl font-bold`}>
                  {index + 1}
                </div>
                
                {index < 3 && (
                  <div className="absolute top-4 right-4">
                    {index === 0 && '🏆'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                  </div>
                )}

                <div className="pl-20">
                  <div className="flex items-center gap-4 mb-3">
                    <img
                      src={club.icon}
                      alt={club.name}
                      className="w-16 h-16 rounded-lg object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white group-hover:text-primary-700 transition-colors">
                        {club.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                        <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs">
                          {club.game}
                        </span>
                        <span>成员: {club.memberCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-primary-700">
                        {getStatDisplay(club, activeTab)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {activeTab === 'popularity' && '人气值'}
                        {activeTab === 'rating' && '综合评分'}
                        {activeTab === 'newbie' && '成立时间'}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-green-400">
                        {club.playmateCount}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">陪玩师</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-yellow-400">
                        {club.rating}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">评分</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {sortedClubs.slice(3).map((club, index) => (
              <Card
                key={club.id}
                onClick={() => onSelectClub && onSelectClub(club.id)}
                className="cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getRankStyle(index + 4)}`}>
                    {index + 4}
                  </div>
                  
                  <img
                    src={club.icon}
                    alt={club.name}
                    className="w-12 h-12 rounded-lg object-cover group-hover:scale-105 transition-transform"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white group-hover:text-primary-700 transition-colors truncate">
                      {club.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <span className="px-2 py-0.5 bg-white/10 rounded-full">
                        {club.game}
                      </span>
                      <span>{getStatDisplay(club, activeTab)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-primary-700">
                      {getStatDisplay(club, activeTab)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {club.memberCount} 成员
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
