import { useState, useEffect } from 'react'
import { Card, Avatar, StatusTag } from './ui'

const mockNotifications = [
  {
    id: 1,
    type: 'application_result',
    title: '申请已通过',
    content: '恭喜！您的加入申请已通过「荣耀之巅俱乐部」的审核',
    clubName: '荣耀之巅俱乐部',
    time: '2分钟前',
    read: false,
    avatar: null,
  },
  {
    id: 2,
    type: 'system',
    title: '系统公告',
    content: '「提瓦特冒险团」发布了新的活动：原神4.0版本更新特别企划',
    clubName: '提瓦特冒险团',
    time: '1小时前',
    read: false,
    avatar: null,
  },
  {
    id: 3,
    type: 'application_result',
    title: '申请被拒绝',
    content: '很遗憾，「精英特种兵战队」的申请未通过审核',
    clubName: '精英特种兵战队',
    time: '3小时前',
    read: true,
    avatar: null,
  },
  {
    id: 4,
    type: 'application_result',
    title: '申请已通过',
    content: '恭喜！您的加入申请已通过「星空旅者联盟」的审核',
    clubName: '星空旅者联盟',
    time: '昨天',
    read: true,
    avatar: null,
  },
  {
    id: 5,
    type: 'system',
    title: '新俱乐部入驻',
    content: '新俱乐部「无畏契约特工队」已入驻平台，欢迎加入！',
    time: '2天前',
    read: true,
    avatar: null,
  },
]

export default function Notifications({ onBack, onSelectClub, clubsData = [] }) {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [filter, setFilter] = useState('all')
  const [showRead, setShowRead] = useState(true)

  const unreadCount = notifications.filter(n => !n.read).length

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true
    if (filter === 'unread') return !notification.read
    if (filter === 'application') return notification.type === 'application_result'
    if (filter === 'system') return notification.type === 'system'
    return true
  }).filter(notification => showRead || !notification.read)

  const handleMarkAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    )
  }

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }
    
    if (notification.clubName && clubsData.length > 0) {
      const club = clubsData.find(c => c.name === notification.clubName)
      if (club && onSelectClub) {
        onSelectClub(club.id)
      }
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'application_result':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        )
      case 'system':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        )
    }
  }

  const getIconColor = (notification) => {
    if (notification.type === 'application_result') {
      return notification.title.includes('通过') ? 'text-green-500' : 'text-red-500'
    }
    return 'text-blue-500'
  }

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
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-primary-700 hover:text-primary-600 transition-colors"
              >
                全部标为已读
              </button>
            )}
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

          <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide">
            {[
              { key: 'all', label: '全部' },
              { key: 'unread', label: '未读' },
              { key: 'application', label: '申请结果' },
              { key: 'system', label: '系统公告' },
            ].map(filterOption => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  filter === filterOption.key
                    ? 'bg-primary-700 text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p>暂无通知</p>
            <p className="text-sm mt-1">看看其他内容吧</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`cursor-pointer transition-all ${
                !notification.read ? 'border-l-4 border-l-primary-700' : ''
              }`}
            >
              <div className="flex gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  notification.type === 'application_result'
                    ? notification.title.includes('通过')
                      ? 'bg-green-500/20'
                      : 'bg-red-500/20'
                    : 'bg-blue-500/20'
                }`}>
                  <span className={getIconColor(notification)}>
                    {getNotificationIcon(notification.type)}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className={`font-bold ${
                      !notification.read ? 'text-white' : 'text-gray-300'
                    }`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {notification.time}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-2">
                    {notification.content}
                  </p>
                  
                  {notification.clubName && (
                    <div className="flex items-center gap-2">
                      <Avatar 
                        name={notification.clubName} 
                        size="sm"
                        className="w-6 h-6 text-xs"
                      />
                      <span className="text-xs text-primary-700">
                        {notification.clubName}
                      </span>
                    </div>
                  )}
                  
                  {!notification.read && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-primary-700 rounded-full animate-pulse" />
                      <span className="text-xs text-primary-700">新消息</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
