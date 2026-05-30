import { useState, useEffect, useCallback } from 'react'
import { Card, EmptyState } from './ui'
import { notificationService } from '../services/localDataService'

export default function Notifications({ onBack }) {
  const [notifications, setNotifications] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const PAGE_SIZE = 20

  const fetchNotifications = useCallback(async (pageNum = 0, shouldAppend = false) => {
    try {
      setIsLoading(true)
      const isReadFilter = activeTab === 'unread' ? false : null
      const { data, error } = await notificationService.getNotificationsByStatus(isReadFilter, pageNum, PAGE_SIZE)
      
      if (error) {
        console.error('获取通知失败:', error)
        return
      }

      if (shouldAppend) {
        setNotifications(prev => [...prev, ...(data || [])])
      } else {
        setNotifications(data || [])
      }
      
      setHasMore((data || []).length === PAGE_SIZE)
    } catch (error) {
      console.error('获取通知异常:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [activeTab])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { count, error } = await notificationService.getUnreadCount()
      if (!error) {
        setUnreadCount(count)
      }
    } catch (error) {
      console.error('获取未读数量失败:', error)
    }
  }, [])

  useEffect(() => {
    setPage(0)
    fetchNotifications(0, false)
    fetchUnreadCount()
  }, [activeTab])

  useEffect(() => {
    const channel = notificationService.subscribeToNotifications((type, payload) => {
      if (type === 'INSERT') {
        setNotifications(prev => [payload, ...prev])
        if (!payload.is_read) {
          setUnreadCount(prev => prev + 1)
        }
      } else if (type === 'UPDATE') {
        setNotifications(prev => prev.map(n => n.id === payload.id ? payload : n))
        if (payload.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const handleMarkAsRead = async (notificationId) => {
    try {
      const { error } = await notificationService.markAsRead(notificationId)
      if (!error) {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        ))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const { error } = await notificationService.markAllAsRead()
      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('全部标为已读失败:', error)
    }
  }

  const handleLoadMore = () => {
    if (!hasMore || isLoading) return
    setPage(prev => prev + 1)
    fetchNotifications(page + 1, true)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setPage(0)
    fetchNotifications(0, false)
    fetchUnreadCount()
  }

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id)
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return '未知时间'
    
    const now = new Date()
    const date = new Date(timestamp)
    const diff = now - date
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    
    return date.toLocaleDateString('zh-CN')
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'application_approved':
        return (
          <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        )
      case 'application_rejected':
        return (
          <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        )
      case 'club_joined':
        return (
          <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        )
      case 'system_notice':
        return (
          <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        )
    }
  }

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case 'application_approved': return '申请通过'
      case 'application_rejected': return '申请拒绝'
      case 'club_joined': return '加入俱乐部'
      case 'system_notice': return '系统公告'
      default: return '通知'
    }
  }

  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-b from-dark-300 to-dark-200">
      <div className="sticky top-0 z-50 bg-dark-300/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              返回
            </button>
            
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-primary-700 hover:text-primary-600 transition-colors"
                >
                  全部标为已读
                </button>
              )}
              <button
                onClick={handleRefresh}
                className={`text-sm text-gray-400 hover:text-white transition-colors ${isRefreshing ? 'opacity-50' : ''}`}
              >
                {isRefreshing ? '刷新中...' : '刷新'}
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              消息通知
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
          </div>

          <div className="flex gap-2 mt-4">
            {[
              { key: 'all', label: '全部', count: notifications.length },
              { key: 'unread', label: '未读', count: unreadCount },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-full transition-all ${
                  activeTab === tab.key
                    ? 'bg-primary-700 text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {tab.label}
                <span className="ml-2 text-xs opacity-70">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {isLoading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-primary-700 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400">加载中...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState 
            title="暂无通知" 
            description="您还没有任何通知消息"
            icon="notification"
            showButton={false}
          />
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`cursor-pointer transition-all ${
                  !notification.is_read ? 'border-l-4 border-l-primary-700 bg-white/5' : ''
                }`}
              >
                <div className="flex gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    !notification.is_read ? 'bg-primary-700/20' : 'bg-white/5'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-bold ${
                          !notification.is_read ? 'text-white' : 'text-gray-300'
                        }`}>
                          {getNotificationTypeLabel(notification.type)}
                        </h3>
                        {!notification.is_read && (
                          <span className="px-1.5 py-0.5 bg-primary-700 text-white text-xs rounded">
                            新
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-400">
                      {notification.content}
                    </p>
                  </div>
                </div>
              </Card>
            ))}

            {hasMore && (
              <div className="flex justify-center py-6">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="px-6 py-2 bg-white/10 text-gray-300 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  {isLoading ? '加载中...' : '加载更多'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}