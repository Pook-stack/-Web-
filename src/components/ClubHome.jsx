import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { gameTags } from '../data/clubs'
import { useDebounce } from '../hooks'
import { Card, Button, Avatar, EmptyState, Skeleton, ConfirmDialog } from './ui'
import { notificationService } from '../services/notificationService'

export default function ClubHome({ 
  onBack, 
  onSelectClub, 
  onNavigateToCreate, 
  onNavigateToMy, 
  onNavigateToNotifications, 
  onNavigateToLeaderboard, 
  onNavigateToAdmin, 
  onNavigateToDatabase,
  onQuickJoin, 
  isApplied,
  clubsData = []
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [selectedTag, setSelectedTag] = useState('全部')
  const [visibleCount, setVisibleCount] = useState(8)
  const [isLoading, setIsLoading] = useState(false)
  const [displayedClubs, setDisplayedClubs] = useState([])
  const [hasMoreClubs, setHasMoreClubs] = useState(true)
  const scrollTriggerRef = useRef(null)
  const categoryTabsRef = useRef(null)
  const [showScrollLeft, setShowScrollLeft] = useState(false)
  const [showScrollRight, setShowScrollRight] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, club: null })
  // 通知数量状态 - 此处已移除假数据，等待接入Supabase真实通知
  const [notificationCount, setNotificationCount] = useState(0)

  // 获取真实通知数量 - 此处已移除假数据，等待接入Supabase真实通知
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const result = await notificationService.getAllNotifications()
        if (result.data && result.data.length > 0) {
          const unreadCount = result.data.filter(n => !n.read && !n.dismissed).length
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

  const debouncedSearch = useDebounce(searchQuery, 300)

  const filteredClubs = useMemo(() => {
    let result = clubsData
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase()
      result = result.filter(club =>
        club.name.toLowerCase().includes(query) ||
        (club.game && club.game.toLowerCase().includes(query)) ||
        (club.description && club.description.toLowerCase().includes(query))
      )
    }
    if (selectedTag !== '全部') {
      result = result.filter(club => club.game === selectedTag)
    }
    return result
  }, [clubsData, debouncedSearch, selectedTag])

  useEffect(() => {
    setDisplayedClubs(filteredClubs.slice(0, visibleCount))
    setHasMoreClubs(visibleCount < filteredClubs.length)
  }, [filteredClubs, visibleCount])

  const loadMore = useCallback(() => {
    if (isLoading) return
    setIsLoading(true)
    setTimeout(() => {
      setVisibleCount(prev => prev + 4)
      setIsLoading(false)
    }, 600)
  }, [isLoading])

  useEffect(() => {
    if (!scrollTriggerRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreClubs && !isLoading) {
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )
    observer.observe(scrollTriggerRef.current)
    return () => observer.disconnect()
  }, [hasMoreClubs, isLoading, loadMore])

  useEffect(() => {
    const checkScroll = () => {
      if (categoryTabsRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = categoryTabsRef.current
        setShowScrollLeft(scrollLeft > 0)
        setShowScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
      }
    }
    checkScroll()
    const interval = setInterval(checkScroll, 300)
    return () => clearInterval(interval)
  }, [])

  const scrollTabs = (direction) => {
    if (categoryTabsRef.current) {
      const scrollAmount = window.innerWidth < 768 ? 150 : 250
      categoryTabsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const handleSelectTag = (tag) => {
    setSelectedTag(tag)
    setVisibleCount(8)
  }

  const handleNavigateToClub = (club) => {
    onSelectClub(club.id)
  }

  const handleQuickJoin = (club) => {
    if (!isApplied(club.id)) {
      setConfirmDialog({ isOpen: true, club })
    }
  }

  const handleConfirmJoin = () => {
    if (confirmDialog.club) {
      onQuickJoin(confirmDialog.club.id)
    }
  }

  const handleCancelJoin = () => {
    setConfirmDialog({ isOpen: false, club: null })
  }

  const searchSuggestions = useMemo(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) return []
    const query = debouncedSearch.toLowerCase()
    const suggestions = new Set()
    clubsData.forEach(club => {
      if (club.name && club.name.toLowerCase().includes(query)) suggestions.add(club.name)
      if (club.game && club.game.toLowerCase().includes(query)) suggestions.add(club.game)
    })
    return Array.from(suggestions).slice(0, 5)
  }, [debouncedSearch, clubsData])

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-b from-dark-300 via-dark-200 to-dark-100 pb-24">
      <div className="sticky top-0 z-50 bg-dark-300/90 backdrop-blur-xl border-b border-white/10 safe-area-top">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              aria-label="返回"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">返回</span>
            </button>
            
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={onNavigateToMy}
                className="p-2 sm:p-2.5 text-gray-400 hover:text-white transition-colors"
                title="个人中心"
                aria-label="个人中心"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
              <button
                onClick={onNavigateToNotifications}
                className="p-2 sm:p-2.5 text-gray-400 hover:text-white transition-colors relative"
                title="消息通知"
                aria-label="消息通知"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {/* 通知数量 - 此处已移除假数据，等待接入Supabase真实通知 */}
                {notificationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
              <button
                onClick={onNavigateToLeaderboard}
                className="p-2 sm:p-2.5 text-gray-400 hover:text-white transition-colors hidden sm:block"
                title="排行榜"
                aria-label="排行榜"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 21V10M12 21V3M16 21V14" />
                </svg>
              </button>
              <button
                onClick={onNavigateToAdmin}
                className="p-2 sm:p-2.5 text-gray-400 hover:text-white transition-colors hidden sm:block"
                title="管理后台"
                aria-label="管理后台"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
              <button
                onClick={onNavigateToDatabase}
                className="p-2 sm:p-2.5 text-gray-400 hover:text-white transition-colors hidden sm:block"
                title="数据库管理"
                aria-label="数据库管理"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
            </div>
          </div>
          
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">陪玩俱乐部</h1>
          
          <div className={`relative flex items-center transition-all duration-300 ${isSearchFocused ? 'ring-2 ring-primary-700/50' : ''}`}>
            <svg className="absolute left-3 sm:left-4 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="搜索俱乐部、游戏..."
              className="w-full pl-9 sm:pl-12 pr-8 sm:pr-10 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-400 focus:outline-none focus:bg-white/8 transition-all text-sm sm:text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 sm:right-4 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-white transition-colors"
                aria-label="清除搜索"
              >
                <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {isSearchFocused && searchSuggestions.length > 0 && (
            <div className="mt-2 bg-dark-200/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchQuery(suggestion)
                    setIsSearchFocused(false)
                  }}
                  className="w-full px-4 py-2.5 sm:py-3 text-left text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-3"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <span className="text-white text-sm sm:text-base">{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 sm:pb-4">
          <div className="relative">
            {showScrollLeft && (
              <button 
                onClick={() => scrollTabs('left')} 
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-dark-200/95 backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:border-white/30 transition-all shadow-lg"
                aria-label="向左滚动"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div 
              ref={categoryTabsRef} 
              className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide px-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {gameTags.map((tag) => (
                <button
                  key={tag.key}
                  onClick={() => handleSelectTag(tag.key)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full whitespace-nowrap font-medium transition-all duration-300 text-sm sm:text-base ${
                    selectedTag === tag.key
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/30'
                      : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-lg sm:text-xl">{tag.icon}</span>
                  <span>{tag.name}</span>
                </button>
              ))}
            </div>
            {showScrollRight && (
              <button 
                onClick={() => scrollTabs('right')} 
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-dark-200/95 backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:border-white/30 transition-all shadow-lg"
                aria-label="向右滚动"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            俱乐部列表
            <span className="text-primary-700 ml-2">({filteredClubs.length}个)</span>
          </h2>
        </div>

        {filteredClubs.length === 0 ? (
          <EmptyState 
            title="暂无符合条件的俱乐部" 
            description="换个搜索条件试试吧"
            showButton={false}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {displayedClubs.map((club, index) => (
              <Card 
                key={club.id} 
                onClick={() => handleNavigateToClub(club)} 
                className="group animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="relative aspect-video sm:aspect-[4/3] lg:aspect-[4/3] xl:aspect-video overflow-hidden rounded-xl mb-3 sm:mb-4">
                  <img 
                    src={club.icon_url || club.icon} 
                    alt={club.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-300 via-transparent to-transparent" />
                  {/* 官方徽章 */}
                  {club.is_official && (
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10">
                      <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 rounded-lg blur animate-pulse"></div>
                        <div className="relative bg-gradient-to-r from-yellow-500 via-amber-600 to-yellow-500 text-black text-xs font-black px-2.5 py-1 rounded-lg shadow-lg border border-yellow-400/50 flex items-center gap-1">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l2.39 4.84 5.34.78-3.86 3.76.91 5.31L12 14.77l-4.78 2.48.91-5.31L4.27 7.62l5.34-.78L12 2z" />
                          </svg>
                          官方
                        </div>
                      </div>
                    </div>
                  )}
                  {/* 游戏标签 */}
                  <div className={`absolute top-2 sm:top-3 ${club.is_official ? 'left-2 sm:left-3' : 'right-2 sm:right-3'} px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-bold ${
                    club.game === '王者荣耀' ? 'bg-gradient-to-r from-yellow-500/90 to-yellow-600/90 text-black' :
                    club.game === '光遇' ? 'bg-gradient-to-r from-sky-400/90 to-sky-500/90 text-black' :
                    club.game === '和平精英' ? 'bg-gradient-to-r from-green-500/90 to-green-600/90 text-white' :
                    club.game === '英雄联盟' ? 'bg-gradient-to-r from-purple-500/90 to-purple-600/90 text-white' :
                    club.game === '原神' ? 'bg-gradient-to-r from-orange-400/90 to-orange-500/90 text-black' :
                    'bg-gradient-to-r from-gray-500/90 to-gray-600/90 text-white'
                  }`}>
                    {club.game}
                  </div>
                </div>
                
                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2 group-hover:text-primary-700 transition-colors line-clamp-1">
                  {club.name}
                </h3>
                
                <div className="flex items-center gap-1 sm:gap-1.5 text-gray-400 text-xs sm:text-sm mb-1.5 sm:mb-2">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  {club.member_count > 0 && <span>{club.member_count}人</span>}
                </div>
                
                <p className="text-gray-400 text-xs sm:text-sm line-clamp-2 mb-2 sm:mb-3">
                  {club.description}
                </p>
                
                <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-3 sm:mb-4">
                  {club.special_services?.slice(0, 3).map((tag, i) => (
                    <span key={i} className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-white/5 text-xs text-gray-300 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs sm:text-sm text-gray-400">活跃中</span>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); handleQuickJoin(club); }} 
                    disabled={isApplied(club.id)}
                    className={isApplied(club.id) ? 'bg-gray-600/40 text-gray-400 cursor-not-allowed hover:shadow-none' : ''}
                  >
                    {isApplied(club.id) ? '已申请' : '申请加入'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {hasMoreClubs && (
          <div ref={scrollTriggerRef} className="flex items-center justify-center py-6 sm:py-8">
            {isLoading ? (
              <div className="flex items-center gap-2 text-primary-700">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-primary-700 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm sm:text-base">加载中...</span>
              </div>
            ) : (
              <Button variant="secondary" onClick={loadMore} size="sm">
                加载更多俱乐部
              </Button>
            )}
          </div>
        )}

        {!hasMoreClubs && displayedClubs.length > 0 && (
          <div className="text-center py-4 text-gray-400 text-sm">已加载全部俱乐部</div>
        )}
      </div>

      <div className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-40 safe-area-bottom">
        <Button onClick={onNavigateToCreate} className="shadow-xl shadow-primary-700/30 px-6 sm:px-8">
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="text-sm sm:text-base">创建俱乐部</span>
          </span>
        </Button>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCancelJoin}
        title="申请加入俱乐部"
        message={confirmDialog.club ? `确定要申请加入「${confirmDialog.club.name}」吗？` : ''}
        onConfirm={handleConfirmJoin}
      />
    </div>
  )
}