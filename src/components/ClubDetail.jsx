import { useState, useEffect, useMemo } from 'react';
import { Card, Button, Avatar, Skeleton, ImageUploader } from './ui';
import { adminManagementService } from '../services/adminManagementService';
import { memberService } from '../services/supabase';

const CURRENT_USER_ID = 'test_user_001';

export default function ClubDetail({ clubId, onBack, onQuickJoin, isApplied, onClubDeleted }) {
  const [displayedMemberCount, setDisplayedMemberCount] = useState(8);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [clubDetails, setClubDetails] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [members, setMembers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedMemberForAdmin, setSelectedMemberForAdmin] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [realMemberCount, setRealMemberCount] = useState(0);

  useEffect(() => {
    const loadClubDetails = async () => {
      setIsLoaded(false);

      try {
        const { clubService } = await import('../services/supabase');
        const result = await clubService.getClubById(clubId);

        if (result.data) {
          setClubDetails({
            id: result.data.id,
            name: result.data.name,
            game: result.data.game,
            description: result.data.description || '暂无描述',
            icon: result.data.icon_url || '',
            coverImage: result.data.cover_image_url || result.data.icon_url || '',
            memberCount: result.data.member_count || 0,
            rating: result.data.rating || 0,
            priceRange: result.data.price_range || '未设置',
            specialServices: result.data.special_services || [],
            mission: result.data.detailed_description || result.data.description || '暂无宗旨',
            contact: result.data.contact || '暂无联系方式',
            activityFrequency: result.data.activity_frequency || '未设置',
            memberRequirements: result.data.member_requirement || '未设置',
            foundedYear: result.data.founded_year || '未设置',
            isOfficial: result.data.is_official || false,
          });
          setNewName(result.data.name);
        }

        // 获取真实成员数量
        const countResult = await adminManagementService.getRealMemberCount(clubId);
        if (countResult.success) {
          setRealMemberCount(countResult.count);
        }

        // 获取成员列表
        const membersResult = await memberService.getClubMembers(clubId);
        if (membersResult.data) {
          setMembers(membersResult.data.map(m => ({
            id: m.id,
            userId: m.user_id,
            nickname: m.users?.username || m.user_id,
            avatar: '',
            role: m.role,
            isOnline: true,
          })));
        }

        // 获取管理员列表
        const adminsResult = await adminManagementService.getClubAdmins(clubId);
        if (adminsResult.success) {
          setAdmins(adminsResult.data);
        }

        // 检查权限
        const adminResult = await adminManagementService.isClubAdmin(clubId, CURRENT_USER_ID);
        const creatorResult = await adminManagementService.isClubCreator(clubId, CURRENT_USER_ID);
        setIsAdmin(adminResult.success && adminResult.isAdmin);
        setIsCreator(creatorResult.success && creatorResult.isCreator);

        // 获取审计日志
        const logResult = await adminManagementService.getMemberAuditLog(clubId);
        if (logResult.success) {
          setAuditLog(logResult.data);
        }
      } catch (error) {
        console.error('加载俱乐部详情失败:', error);
      }

      setIsLoaded(true);
    };

    loadClubDetails();
  }, [clubId]);

  const displayedMembers = useMemo(() => {
    return members.slice(0, displayedMemberCount);
  }, [members, displayedMemberCount]);

  const hasMoreMembers = useMemo(() => {
    return displayedMemberCount < members.length;
  }, [displayedMemberCount, members.length]);

  const handleJoin = () => {
    if (!clubDetails || isApplied(clubDetails.id)) return;
    onQuickJoin(clubDetails.id);
  };

  const loadMoreMembers = () => {
    if (isLoadingMembers) return;
    setIsLoadingMembers(true);
    setTimeout(() => {
      setDisplayedMemberCount(prev => prev + 4);
      setIsLoadingMembers(false);
    }, 600);
  };

  const handleSaveName = async () => {
    if (!newName.trim() || newName === clubDetails.name) {
      setEditingName(false);
      return;
    }

    const result = await adminManagementService.updateClub(clubId, { name: newName });
    if (result.success) {
      setClubDetails(prev => ({ ...prev, name: newName }));
      setEditingName(false);
      alert('俱乐部名称已更新！');
    } else {
      alert('更新失败：' + result.error);
    }
  };

  const handleAppointAdmin = async () => {
    if (!selectedMemberForAdmin) return;

    const result = await adminManagementService.appointAdmin(clubId, selectedMemberForAdmin.userId, CURRENT_USER_ID);
    if (result.success) {
      setAdmins(prev => [...prev, { user_id: selectedMemberForAdmin.userId, role: 'admin' }]);
      setShowAdminModal(false);
      setSelectedMemberForAdmin(null);
      alert('管理员任命成功！');
    } else {
      alert('任命失败：' + result.error);
    }
  };

  const handleRevokeAdmin = async (userId) => {
    if (!confirm('确定要撤销该管理员的权限吗？')) return;

    const result = await adminManagementService.revokeAdmin(clubId, userId);
    if (result.success) {
      setAdmins(prev => prev.filter(a => a.user_id !== userId));
      alert('管理员权限已撤销！');
    } else {
      alert('撤销失败：' + result.error);
    }
  };

  const handleDeleteClub = async () => {
    if (!confirm('⚠️ 警告：此操作将永久删除俱乐部及其所有数据，包括成员记录和评价。确定继续吗？')) return;

    const result = await adminManagementService.deleteClub(clubId);
    if (result.success) {
      alert('俱乐部已删除');
      if (onClubDeleted) {
        onClubDeleted(result.deletedClubId);
      }
      onBack();
    } else {
      alert('删除失败：' + result.error);
    }
  };

  const handleCoverUpload = async (url) => {
    const result = await adminManagementService.updateClub(clubId, { cover_image_url: url });
    if (result.success) {
      setClubDetails(prev => ({ ...prev, coverImage: url }));
      alert('封面图片已更新！');
    } else {
      alert('更新失败：' + result.error);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [clubId]);

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
      '蛋仔派对': 'from-yellow-400 to-yellow-500',
      '我的世界': 'from-green-400 to-green-500',
      '第五人格': 'from-purple-400 to-purple-500',
      '金铲铲之战': 'from-yellow-500 to-yellow-600',
      '永劫无间': 'from-red-400 to-red-500',
    };
    return styles[game] || 'from-gray-500 to-gray-600';
  };

  const getActionText = (action) => {
    const texts = {
      join: '加入俱乐部',
      leave: '离开俱乐部',
      kick: '被踢出俱乐部',
      promote: '晋升为管理员',
      demote: '降为普通成员',
    };
    return texts[action] || action;
  };

  if (!isLoaded || !clubDetails) {
    return (
      <div className="min-h-screen min-h-dvh bg-gradient-to-b from-dark-300 to-dark-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Card className="mb-4">
            <div className="h-24 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded-lg animate-pulse mb-4" />
            <div className="h-6 w-3/4 rounded bg-gradient-to-r from-white/10 via-white/15 to-white/10 animate-pulse mb-2" />
            <div className="h-4 w-1/2 rounded bg-gradient-to-r from-white/10 via-white/15 to-white/10 animate-pulse" />
          </Card>
          <Card className="mb-4">
            <div className="h-6 w-1/3 rounded bg-gradient-to-r from-white/10 via-white/15 to-white/10 animate-pulse mb-4" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-gradient-to-r from-white/10 via-white/15 to-white/10 animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-gradient-to-r from-white/10 via-white/15 to-white/10 animate-pulse" />
              <div className="h-4 w-4/5 rounded bg-gradient-to-r from-white/10 via-white/15 to-white/10 animate-pulse" />
            </div>
          </Card>
          <Card>
            <div className="h-6 w-1/3 rounded bg-gradient-to-r from-white/10 via-white/15 to-white/10 animate-pulse mb-4" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-white/10 via-white/20 to-white/10 animate-pulse" />
                  <div className="h-4 w-full rounded bg-gradient-to-r from-white/10 via-white/15 to-white/10 animate-pulse" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
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

      {/* 管理按钮 */}
      {(isAdmin || isCreator) && (
        <button
          onClick={() => setActiveTab('admin')}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-primary-700/80 backdrop-blur-xl border border-primary-700/30 rounded-full text-white hover:bg-primary-700 transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          管理
        </button>
      )}

      <div className="relative h-[56.25vw] max-h-80 overflow-hidden">
        <img
          src={clubDetails.coverImage || 'https://via.placeholder.com/1200x675'}
          alt={clubDetails.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-300 via-dark-300/50 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-bold text-white bg-gradient-to-r ${getGameBadgeStyle(clubDetails.game)}`}>
              {clubDetails.game}
            </span>
            {clubDetails.isOfficial && (
              <span className="inline-block px-3 py-1.5 rounded-full text-sm font-bold text-black bg-gradient-to-r from-yellow-400 to-amber-500 border border-yellow-300">
                ⭐ 官方
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className="px-3 py-1.5 bg-white/10 border border-primary-700 rounded-lg text-white text-xl font-bold outline-none"
                  autoFocus
                />
                <button onClick={handleSaveName} className="text-green-400 hover:text-green-300">✓</button>
                <button onClick={() => { setEditingName(false); setNewName(clubDetails.name); }} className="text-red-400 hover:text-red-300">✗</button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl md:text-4xl font-black text-white">
                  {clubDetails.name}
                </h1>
                {isAdmin && (
                  <button onClick={() => setEditingName(true)} className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4 text-white mt-4">
            <div className="flex items-center gap-1.5">
              <span className="text-xl">👥</span>
              <div>
                <div className="text-lg font-bold text-primary-700">{realMemberCount}</div>
                <div className="text-xs text-gray-400">成员</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl">📅</span>
              <div>
                <div className="text-lg font-bold text-primary-700">
                  {clubDetails.created_at ? 
                    new Date(clubDetails.created_at).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    }) : 
                    '2026-05-28'
                  }
                </div>
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

      {/* 标签页 */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex gap-2 p-1 bg-dark-200/50 rounded-xl mt-4">
          {[
            { key: 'overview', label: '🏛️ 概览' },
            { key: 'members', label: '👥 成员' },
            { key: 'admin', label: '⚙️ 管理' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-primary-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {activeTab === 'overview' && (
          <>
            <Card>
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
            </Card>

            <Card>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>📝</span> 详细介绍
              </h2>
              <p className="text-gray-300 leading-relaxed">{clubDetails.description}</p>
            </Card>

            <Card>
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
            </Card>
          </>
        )}

        {activeTab === 'members' && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>👥</span> 成员列表
              </h2>
              <span className="text-sm text-gray-400">共 {realMemberCount} 位成员</span>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-5 gap-4">
              {displayedMembers.map((member, index) => {
                const isMemberAdmin = admins.some(a => a.user_id === member.userId);
                const isMemberCreator = admins.some(a => a.user_id === member.userId && a.role === 'creator');
                
                return (
                  <div key={member.userId} className="flex flex-col items-center gap-2 relative" style={{ animationDelay: `${index * 0.05}s` }}>
                    <Avatar
                      name={member.nickname}
                      image={member.avatar}
                      size="lg"
                      className={`border-2 ${member.isOnline ? 'border-green-500' : 'border-primary-700/30'}`}
                    />
                    {member.isOnline && (
                      <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-300" />
                    )}
                    <span className="text-sm text-white font-medium truncate max-w-[80px] text-center">
                      {member.nickname.length > 8 ? member.nickname.slice(0, 8) + '...' : member.nickname}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isMemberCreator 
                        ? 'bg-amber-500/20 text-amber-400' 
                        : isMemberAdmin 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-primary-700/20 text-primary-700'
                    }`}>
                      {isMemberCreator ? '创建者' : isMemberAdmin ? '管理员' : member.role}
                    </span>
                  </div>
                );
              })}
            </div>

            {hasMoreMembers && (
              <div className="text-center mt-6">
                <Button
                  variant="secondary"
                  onClick={loadMoreMembers}
                  disabled={isLoadingMembers}
                  size="sm"
                >
                  {isLoadingMembers ? '加载中...' : '加载更多成员'}
                </Button>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'admin' && (
          <>
            {(isAdmin || isCreator) ? (
              <>
                <Card>
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span>🖼️</span> 封面图片管理
                  </h2>
                  <ImageUploader
                    value={clubDetails.coverImage}
                    onChange={handleCoverUpload}
                    folder="covers"
                    label="上传封面图片"
                  />
                </Card>

                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>👑</span> 管理员管理
                    </h2>
                    <Button
                      size="sm"
                      onClick={() => setShowAdminModal(true)}
                      disabled={!isCreator}
                      className={!isCreator ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      任命管理员
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {admins.map((admin) => {
                      const member = members.find(m => m.userId === admin.user_id);
                      return (
                        <div key={admin.user_id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                          <div className="flex items-center gap-3">
                            <Avatar name={member?.nickname || admin.user_id} size="md" />
                            <div>
                              <div className="text-white font-medium">{member?.nickname || admin.user_id}</div>
                              <div className={`text-xs ${admin.role === 'creator' ? 'text-amber-400' : 'text-purple-400'}`}>
                                {admin.role === 'creator' ? '创建者' : '管理员'}
                              </div>
                            </div>
                          </div>
                          {isCreator && admin.role !== 'creator' && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRevokeAdmin(admin.user_id)}
                            >
                              撤销权限
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card>
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span>📊</span> 成员变更日志
                  </h2>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {auditLog.length > 0 ? (
                      auditLog.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg text-sm">
                          <div>
                            <span className="text-primary-700 font-medium">{log.user_id}</span>
                            <span className="text-gray-400 mx-2">·</span>
                            <span className="text-white">{getActionText(log.action)}</span>
                          </div>
                          <span className="text-gray-500 text-xs">
                            {new Date(log.created_at).toLocaleString('zh-CN')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-400">暂无变更记录</div>
                    )}
                  </div>
                </Card>

                {isCreator && (
                  <Card className="border-red-500/30 bg-red-500/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-bold mb-1">⚠️ 危险操作</h3>
                        <p className="text-sm text-gray-400">此操作将永久删除俱乐部及所有相关数据</p>
                      </div>
                      <Button
                        variant="danger"
                        onClick={handleDeleteClub}
                      >
                        删除俱乐部
                      </Button>
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z" />
                  </svg>
                  <h3 className="text-white font-bold mb-2">权限不足</h3>
                  <p className="text-gray-400">只有俱乐部管理员或创建者可以访问管理功能</p>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-dark-300 via-dark-300/95 to-transparent backdrop-blur-xl border-t border-white/10">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="text-primary-700 font-bold">{realMemberCount} 人已加入</div>
            <div className="text-sm text-gray-400">点击加入俱乐部</div>
          </div>
          <Button
            onClick={handleJoin}
            disabled={isApplied(clubDetails.id)}
            size="lg"
            className={isApplied(clubDetails.id) ? 'bg-gray-600/40 text-gray-400 cursor-not-allowed hover:shadow-none' : ''}
          >
            <span className="flex items-center gap-2">
              <span className="text-xl">{isApplied(clubDetails.id) ? '✓' : '✚'}</span>
              <span>{isApplied(clubDetails.id) ? '已申请' : '申请加入'}</span>
            </span>
          </Button>
        </div>
      </div>

      {/* 任命管理员弹窗 */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-200 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">任命管理员</h3>
            <p className="text-gray-400 mb-4">选择一位成员任命为管理员：</p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {members.filter(m => !admins.some(a => a.user_id === m.userId)).map((member) => (
                <button
                  key={member.userId}
                  onClick={() => setSelectedMemberForAdmin(member)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    selectedMemberForAdmin?.userId === member.userId
                      ? 'bg-primary-700/20 border border-primary-700'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Avatar name={member.nickname} size="md" />
                  <span className="text-white">{member.nickname}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => { setShowAdminModal(false); setSelectedMemberForAdmin(null); }}
              >
                取消
              </Button>
              <Button
                onClick={handleAppointAdmin}
                disabled={!selectedMemberForAdmin}
              >
                确认任命
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
