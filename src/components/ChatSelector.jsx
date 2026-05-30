import { useState, useEffect } from 'react';
import { chatService, memberService } from '../services/localDataService'
import { getUserId } from '../services/userIdentity'
import PrivateChat from './PrivateChat'
import PublicChat from './PublicChat'

const CURRENT_USER_ID = getUserId()

export default function ChatSelector({ clubId, clubName, onBack }) {
  const [chatMode, setChatMode] = useState('select');
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [privateRoomId, setPrivateRoomId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, [clubId]);

  const loadMembers = async () => {
    try {
      const { data } = await memberService.getClubMembers(clubId);
      const filteredMembers = data.filter(m => m.user_id !== CURRENT_USER_ID);
      setMembers(filteredMembers);
    } catch (error) {
      console.error('加载成员失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartPrivateChat = async (member) => {
    try {
      setSelectedMember(member);
      const { data } = await chatService.createPrivateRoom(clubId, CURRENT_USER_ID, member.user_id);
      if (data) {
        setPrivateRoomId(data.id);
        setChatMode('private');
      }
    } catch (error) {
      console.error('创建私人聊天室失败:', error);
    }
  };

  const handleStartPublicChat = () => {
    setChatMode('public');
  };

  const handleBack = () => {
    if (chatMode === 'select') {
      onBack();
    } else {
      setChatMode('select');
      setSelectedMember(null);
      setPrivateRoomId(null);
    }
  };

  if (chatMode === 'private' && privateRoomId && selectedMember) {
    return (
      <PrivateChat
        roomId={privateRoomId}
        recipient={selectedMember}
        onBack={handleBack}
        clubName={clubName}
      />
    );
  }

  if (chatMode === 'public') {
    return (
      <PublicChat
        clubId={clubId}
        clubName={clubName}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-300 via-dark-200 to-dark-100 flex flex-col">
      <div className="sticky top-0 z-50 bg-dark-300/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            aria-label="返回"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>返回</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">{clubName?.charAt(0) || '?'}</span>
            </div>
            <div>
              <h1 className="text-white font-bold">{clubName}</h1>
              <p className="text-sm text-gray-400">选择聊天方式</p>
            </div>
          </div>

          <div className="w-16" />
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-primary-600/20 to-primary-700/20 border border-primary-700/30 rounded-xl p-6 cursor-pointer hover:border-primary-700/50 transition-all" onClick={handleStartPublicChat}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">公共大厅</h2>
                <p className="text-gray-300">与所有俱乐部成员一起聊天</p>
              </div>
              <div className="ml-auto">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              成员列表
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary-700 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : members.length === 0 ? (
              <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-gray-700 to-gray-600 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-gray-400">暂无其他成员</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-primary-700/50 hover:bg-white/10 transition-all flex items-center gap-4"
                    onClick={() => handleStartPrivateChat(member)}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">
                        {member.user_id?.charAt(0) || '👤'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">
                        {member.user_id === 'helper' ? '小助手' : member.user_id}
                      </h4>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm text-gray-400">在线</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}