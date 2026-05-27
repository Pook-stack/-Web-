import { useState, useEffect, useMemo } from 'react'
import { clubsData } from '../data/clubs'
import { useClubApplications } from '../hooks'

export default function ClubDetail({ clubId, onBack }) {
  const [displayedMemberCount, setDisplayedMemberCount] = useState(8)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  
  const { isApplied, applyToClub, isLoaded } = useClubApplications()

  const clubDetails = useMemo(() => {
    if (!isLoaded) return null
    return clubsData.find(club => club.id === clubId) || clubsData[0]
  }, [clubId, isLoaded])

  const displayedMembers = useMemo(() => {
    if (!clubDetails?.members) return []
    return clubDetails.members.slice(0, displayedMemberCount)
  }, [clubDetails?.members, displayedMemberCount])

  const hasMoreMembers = useMemo(() => {
    if (!clubDetails?.members) return false
    return displayedMemberCount < clubDetails.members.length
  }, [displayedMemberCount, clubDetails?.members])

  const handleJoin = () => {
    if (!clubDetails || isApplied(clubDetails.id)) return
    
    if (confirm(`确定要申请加入「${clubDetails.name}」吗？`)) {
      alert('已发送加入申请，等待团长审核')
      applyToClub(clubDetails.id)
    }
  }

  const loadMoreMembers = () => {
    if (isLoadingMembers) return
    setIsLoadingMembers(true)
    setTimeout(() => {
      setDisplayedMemberCount(prev => prev + 4)
      setIsLoadingMembers(false)
    }, 600)
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [clubId])

  const getGameBadgeStyle = (game) => {
    const styles = {
      '王者荣耀': 'from-yellow-500 to-yellow-600',
      '光遇': 'from-sky-400 to-sky-500',
      '和平精英': 'from-green-500 to-green-600',
      '英雄联盟': 'from-purple-500 to-purple-600',
      '原神': 'from-orange-400 to-orange-500',
      'Dota2': 'from-red-500 to-red-600',
      '无畏契约': 'from-blue-500 to-blue-600',
      '崩坏：星穹铁道': 'from-cyan-400 to-cyan-500',
      'CS2': 'from-gray-400 to-gray-500',
    }
    return styles[game] || 'from-gray-500 to-gray-600'
  }

  if (!isLoaded || !clubDetails) {
    return (
      <div className="min-h-screen min-h-dvh bg-gradient-to-b from-dark-300 to-dark-200 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-700 border-t-transparent rounded-full animate-spin" />
          <span className="text-white text-lg">加载中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-b from-dark-300 to-dark-200 pb-24">
      <button 
        onClick={onBack}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-dark-300/80 backdrop-blur-xl border border-white/10 rounded-full text-white hover:bg-white/10 transition-all"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        返回
      </button>

      <div className="relative h-[56.25vw] max-h-80 overflow-hidden">
        <img
          src={clubDetails.coverImage}
          alt={clubDetails.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-300 via-dark-300/50 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-bold text-white bg-gradient-to-r ${getGameBadgeStyle(clubDetails.game)} mb-3`}>
            {clubDetails.game}
          </span>
          <h1 className="text-2xl md:text-4xl font-black text-white mb-4">
            {clubDetails.name}
          </h1>
          <div className="flex flex-wrap gap-4 text-white">
            <div className="flex items-center gap-1.5">
              <span className="text-xl">👥</span>
              <div>
                <div className="text-lg font-bold text-primary-700">{clubDetails.memberCount}</div>
                <div className="text-xs text-gray-400">成员</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl">📅</span>
              <div>
                <div className="text-lg font-bold text-primary-700">{clubDetails.foundedYear}</div>
                <div className="text-xs text-gray-400">成立</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl">⭐</span>
              <div>
                <div className="text-lg font-bold text-primary-700">{clubDetails.rating}</div>
                <div className="text-xs text-gray-400">评分</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>🏛️</span> 俱乐部简介
          </h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-400 mb-1">宗旨</div>
              <p className="text-white">{clubDetails.mission}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">活动频率</div>
                <div className="text-white font-medium">{clubDetails.activityFrequency}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">服务价格</div>
                <div className="text-white font-medium">{clubDetails.priceRange}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">成员要求</div>
                <div className="text-white font-medium">{clubDetails.memberRequirements}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">联系方式</div>
                <div className="text-white font-medium">{clubDetails.contact}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>📝</span> 详细介绍
          </h2>
          <p className="text-gray-300 leading-relaxed">{clubDetails.description}</p>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>👥</span> 成员列表
            </h2>
            <span className="text-sm text-gray-400">共 {clubDetails.members?.length || 0} 位成员</span>
          </div>
          
          <div className="grid grid-cols-4 md:grid-cols-5 gap-4">
            {displayedMembers.map((member, index) => (
              <div key={member.id} className="flex flex-col items-center gap-2" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="relative">
                  <img
                    src={member.avatar}
                    alt={member.nickname}
                    className="w-[80px] h-[80px] rounded-full object-cover border-2 border-primary-700/30"
                  />
                  {member.isOnline && (
                    <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-dark-300" />
                  )}
                </div>
                <span className="text-sm text-white font-medium truncate max-w-[80px] text-center">
                  {member.nickname.length > 8 ? member.nickname.slice(0, 8) + '...' : member.nickname}
                </span>
                <span className="text-xs px-2 py-0.5 bg-primary-700/20 text-primary-700 rounded-full">
                  {member.role}
                </span>
              </div>
            ))}
          </div>

          {hasMoreMembers && (
            <div className="text-center mt-6">
              <button
                onClick={loadMoreMembers}
                disabled={isLoadingMembers}
                className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 transition-all disabled:opacity-50"
              >
                {isLoadingMembers ? '加载中...' : '加载更多成员'}
              </button>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>🏆</span> 俱乐部成就
          </h2>
          <div className="space-y-3">
            {clubDetails.achievements?.map((achievement, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                <span className="text-2xl">{achievement.icon}</span>
                <div>
                  <div className="text-white font-medium">{achievement.title}</div>
                  <div className="text-xs text-gray-400">{achievement.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>🎯</span> 特色服务
          </h2>
          <div className="flex flex-wrap gap-2">
            {clubDetails.specialServices?.map((service, index) => (
              <span key={index} className="px-4 py-2 bg-gradient-to-r from-primary-600/20 to-primary-700/20 border border-primary-700/30 rounded-full text-primary-700 font-medium">
                {service}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-dark-300 via-dark-300/95 to-transparent backdrop-blur-xl border-t border-white/10">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="text-primary-700 font-bold">{clubDetails.memberCount} 人已加入</div>
            <div className="text-sm text-gray-400">点击加入俱乐部</div>
          </div>
          <button
            onClick={handleJoin}
            disabled={isApplied(clubDetails.id)}
            className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold transition-all duration-300 ${
              isApplied(clubDetails.id)
                ? 'bg-gray-600/40 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:shadow-lg hover:shadow-primary-600/30 hover:scale-105 active:scale-95'
            }`}
          >
            <span className="text-xl">{isApplied(clubDetails.id) ? '✓' : '✚'}</span>
            <span>{isApplied(clubDetails.id) ? '已申请' : '申请加入'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
