import { useState, useEffect } from 'react'
import { Card, Button, Avatar, StatusTag } from './ui'

export default function AdminDashboard({ onBack, clubsData = [], onApproveClub, onRejectClub, onSelectClub }) {
  const [activeTab, setActiveTab] = useState('pending')
  const [pendingClubs, setPendingClubs] = useState([])
  const [approvedClubs, setApprovedClubs] = useState([])
  const [rejectedClubs, setRejectedClubs] = useState([])

  useEffect(() => {
    const pending = clubsData.filter(club => club.status === 'pending')
    const approved = clubsData.filter(club => club.status === 'approved')
    const rejected = clubsData.filter(club => club.status === 'rejected')
    
    setPendingClubs(pending)
    setApprovedClubs(approved)
    setRejectedClubs(rejected)
  }, [clubsData])

  const tabs = [
    { key: 'pending', label: '待审核', count: pendingClubs.length, color: 'yellow' },
    { key: 'approved', label: '已通过', count: approvedClubs.length, color: 'green' },
    { key: 'rejected', label: '已拒绝', count: rejectedClubs.length, color: 'gray' },
  ]

  const getCurrentClubs = () => {
    switch (activeTab) {
      case 'pending':
        return pendingClubs
      case 'approved':
        return approvedClubs
      case 'rejected':
        return rejectedClubs
      default:
        return []
    }
  }

  const handleApprove = (club) => {
    if (onApproveClub) {
      onApproveClub(club.id)
    }
    alert(`已通过「${club.name}」的申请`)
  }

  const handleReject = (club) => {
    if (onRejectClub) {
      onRejectClub(club.id)
    }
    alert(`已拒绝「${club.name}」的申请`)
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
          
          <h1 className="text-2xl font-bold text-white mb-4">管理后台</h1>
          
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeTab === tab.key
                    ? tab.key === 'pending'
                      ? 'bg-yellow-500 text-black'
                      : tab.key === 'approved'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-500 text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.key ? 'bg-white/20' : 'bg-white/10'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            共 {getCurrentClubs().length} 个俱乐部
          </div>
          <div className="text-sm text-gray-400">
            更新时间: {new Date().toLocaleString('zh-CN')}
          </div>
        </div>

        {getCurrentClubs().length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="2" />
              <path d="M9 12h6" />
              <path d="M9 16h6" />
            </svg>
            <p>
              {activeTab === 'pending' && '暂无待审核的俱乐部'}
              {activeTab === 'approved' && '暂无已通过的俱乐部'}
              {activeTab === 'rejected' && '暂无已拒绝的俱乐部'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getCurrentClubs().map((club) => (
              <Card key={club.id} className="relative">
                {activeTab === 'pending' && (
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => handleApprove(club)}
                      className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 transition-colors"
                      title="通过"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleReject(club)}
                      className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors"
                      title="拒绝"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                <div 
                  className="cursor-pointer"
                  onClick={() => onSelectClub && onSelectClub(club.id)}
                >
                  <div className="relative h-32 overflow-hidden rounded-lg mb-4">
                    <img
                      src={club.coverImage || club.icon}
                      alt={club.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-300 via-transparent to-transparent" />
                    <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold ${
                      club.game === '王者荣耀' ? 'bg-yellow-500/90 text-black' :
                      club.game === '光遇' ? 'bg-sky-400/90 text-black' :
                      club.game === '和平精英' ? 'bg-green-500/90 text-white' :
                      club.game === '英雄联盟' ? 'bg-purple-500/90 text-white' :
                      club.game === '原神' ? 'bg-orange-400/90 text-black' :
                      'bg-gray-500/90 text-white'
                    }`}>
                      {club.game}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 pr-16">
                    {club.name}
                  </h3>

                  <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                    {club.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span>成立: {club.foundedYear}年</span>
                    <span>成员: {club.memberCount}</span>
                    <span>评分: {club.rating}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {club.specialServices?.slice(0, 3).map((service, index) => (
                      <span key={index} className="px-2 py-1 bg-white/5 text-xs text-gray-300 rounded-full">
                        {service}
                      </span>
                    ))}
                    {(club.specialServices?.length || 0) > 3 && (
                      <span className="px-2 py-1 bg-white/5 text-xs text-gray-400 rounded-full">
                        +{club.specialServices.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>联系方式:</span>
                    <span className="text-primary-700">{club.contact}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-dark-300 via-dark-300/95 to-transparent backdrop-blur-xl border-t border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex gap-6">
            <div>
              <div className="text-2xl font-bold text-yellow-400">{pendingClubs.length}</div>
              <div className="text-xs text-gray-400">待审核</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{approvedClubs.length}</div>
              <div className="text-xs text-gray-400">已通过</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-400">{rejectedClubs.length}</div>
              <div className="text-xs text-gray-400">已拒绝</div>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            总计: {clubsData.length} 个俱乐部
          </div>
        </div>
      </div>
    </div>
  )
}
