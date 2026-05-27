import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { clubsData, gameTags } from '../data/clubs'
import { useClubApplications, useDebounce } from '../hooks'

export default function ClubHome({ onBack, onSelectClub }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [selectedTag, setSelectedTag] = useState('全部')
  const [displayedCount, setDisplayedCount] = useState(12)
  const [isLoading, setIsLoading] = useState(false)
  const [showScrollLeft, setShowScrollLeft] = useState(false)
  const [showScrollRight, setShowScrollRight] = useState(true)
  
  const scrollTriggerRef = useRef(null)
  const categoryTabsRef = useRef(null)
  
  const debouncedSearch = useDebounce(searchQuery, 300)
  const { isApplied, applyToClub, isLoaded } = useClubApplications()

  const filteredClubs = useMemo(() => {
    if (!isLoaded) return []
    
    let result = clubsData
    
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase()
      result = result.filter(club => 
        club.name.toLowerCase().includes(query) ||
        club.game.toLowerCase().includes(query) ||
        club.description.toLowerCase().includes(query) ||
        club.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    if (selectedTag !== '全部') {
      result = result.filter(club => club.game === selectedTag)
    }
    
    return result
  }, [isLoaded, debouncedSearch, selectedTag])

  const displayedClubs = useMemo(() => {
    return filteredClubs.slice(0, displayedCount)
  }, [filteredClubs, displayedCount])

  const hasMoreClubs = useMemo(() => {
    return displayedCount < filteredClubs.length
  }, [displayedCount, filteredClubs.length])

  const searchSuggestions = useMemo(() => {
    if (!searchQuery || !isLoaded) return []
    
    const query = searchQuery.toLowerCase()
    const suggestions = new Set()
    
    clubsData.forEach(club => {
      if (club.name.toLowerCase().includes(query)) {
        suggestions.add(club.name)
      }
      if (club.game.toLowerCase().includes(query)) {
        suggestions.add(club.game)
      }
      club.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query)) {
          suggestions.add(tag)
        }
      })
    })
    
    return Array.from(suggestions).slice(0, 5)
  }, [searchQuery, isLoaded])

  const loadMore = useCallback(() => {
    if (isLoading) return
    setIsLoading(true)
    setTimeout(() => {
      setDisplayedCount(prev => prev + 8)
      setIsLoading(false)
    }, 600)
  }, [isLoading])

  const scrollTabs = useCallback((direction) => {
    if (!categoryTabsRef.current) return
    const scrollAmount = 200
    categoryTabsRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }, [])

  const handleSelectTag = useCallback((tagKey) => {
    setSelectedTag(tagKey)
    setDisplayedCount(12)
  }, [])

  const handleQuickJoin = useCallback((club) => {
    if (isApplied(club.id)) return
    
    if (confirm(`确定要申请加入「${club.name}」吗？`)) {
      alert('已发送加入申请，等待团长审核')
      applyToClub(club.id)
    }
  }, [isApplied, applyToClub])

  const handleNavigateToClub = useCallback((club) => {
    onSelectClub(club.id)
  }, [onSelectClub])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isLoading && hasMoreClubs) {
            loadMore()
          }
        })
      },
      { rootMargin: '100px' }
    )

    if (scrollTriggerRef.current) {
      observer.observe(scrollTriggerRef.current)
    }

    return () => observer.disconnect()
  }, [isLoading, hasMoreClubs, loadMore])

  useEffect(() => {
    const updateScrollIndicators = () => {
      if (!categoryTabsRef.current) return
      const { scrollLeft, scrollWidth, clientWidth } = categoryTabsRef.current
      setShowScrollLeft(scrollLeft > 0)
      setShowScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }

    const tabs = categoryTabsRef.current
    if (tabs) {
      tabs.addEventListener('scroll', updateScrollIndicators)
      updateScrollIndicators()
    }

    return () => {
      if (tabs) {
        tabs.removeEventListener('scroll', updateScrollIndicators)
      }
    }
  }, [])

  if (!isLoaded) {
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
    <div className="min-h-screen min-h-dvh bg-gradient-to-b from-dark-300 to-dark-200">
      <div className="sticky top-0 z-50 bg-dark-300/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            返回
          </button>

          <div className="relative">
            <div className={`relative flex items-center transition-all duration-300 ${isSearchFocused ? 'ring-2 ring-primary-700/50' : ''}`}>
              <svg className="absolute left-4 w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder="搜索俱乐部名称、游戏类型..."
                className="w-full pl-12 pr-10 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-400 focus:outline-none focus:bg-white/8 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {isSearchFocused && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-dark-200/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-xl z-50">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchQuery(suggestion)}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
                  >
                    <svg className="w-4 h-4 text-primary-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <span className="text-gray-200">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative mt-6">
            {showScrollLeft && (
              <button
                onClick={() => scrollTabs('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-dark-200/90 backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:border-white/30 transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            <div 
              ref={categoryTabsRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide px-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {gameTags.map((tag) => (
                <button
                  key={tag.key}
                  onClick={() => handleSelectTag(tag.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap font-medium transition-all duration-300 ${
                    selectedTag === tag.key
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/30'
                      : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5'
                  }`}
                >
                  <span>{tag.icon}</span>
                  <span>{tag.name}</span>
                </button>
              ))}
            </div>

            {showScrollRight && (
              <button
                onClick={() => scrollTabs('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-dark-200/90 backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:border-white/30 transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            俱乐部列表
            <span className="text-primary-700 ml-2">({filteredClubs.length}个)</span>
          </h2>
        </div>

        {displayedClubs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <p>暂无符合条件的俱乐部</p>
            <p className="text-sm mt-1">请尝试其他搜索条件</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedClubs.map((club, index) => (
              <div
                key={club.id}
                onClick={() => handleNavigateToClub(club)}
                className="group relative bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-primary-700/30 hover:shadow-xl hover:shadow-primary-700/10"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={club.icon}
                    alt={club.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-300 via-transparent to-transparent" />
                  <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold ${
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

                <div className="p-4">
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary-700 transition-colors">
                    {club.name}
                  </h3>

                  <div className="flex items-center gap-1 text-gray-400 text-sm mb-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>成员: {club.memberCount}人</span>
                  </div>

                  <p className="text-gray-400 text-sm line-clamp-3 mb-3">
                    {club.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {club.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-white/5 text-xs text-gray-300 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs text-gray-400">活跃中</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQuickJoin(club)
                      }}
                      disabled={isApplied(club.id)}
                      className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 ${
                        isApplied(club.id)
                          ? 'bg-gray-600/40 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:shadow-lg hover:shadow-primary-600/30 hover:scale-105'
                      }`}
                    >
                      {isApplied(club.id) ? '已申请' : '申请加入'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMoreClubs && (
          <div ref={scrollTriggerRef} className="flex items-center justify-center py-8">
            {isLoading ? (
              <div className="flex items-center gap-2 text-primary-700">
                <div className="w-5 h-5 border-2 border-primary-700 border-t-transparent rounded-full animate-spin" />
                <span>加载中...</span>
              </div>
            ) : (
              <button
                onClick={loadMore}
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 hover:border-white/20 transition-all"
              >
                加载更多俱乐部
              </button>
            )}
          </div>
        )}

        {!hasMoreClubs && displayedClubs.length > 0 && (
          <div className="text-center py-4 text-gray-400 text-sm">
            已加载全部俱乐部
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
