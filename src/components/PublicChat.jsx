import { useState, useEffect, useRef } from 'react';
import { chatService, memberService, adminManagementService } from '../services/localDataService'
import { getUserId } from '../services/userIdentity'

const CURRENT_USER_ID = getUserId()

export default function PublicChat({ clubId, clubName, onBack }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isJoining, setIsJoining] = useState(true);
  const [joinedSuccessfully, setJoinedSuccessfully] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [messageStatus, setMessageStatus] = useState({});
  const [roomId, setRoomId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsJoining(false);
      setJoinedSuccessfully(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (joinedSuccessfully && clubId) {
      initChatRoom();
    }
  }, [joinedSuccessfully, clubId]);

  useEffect(() => {
    if (roomId && joinedSuccessfully) {
      loadMessages();
      loadMemberCount();
    }
  }, [roomId, joinedSuccessfully]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (roomId && messages.length > 0) {
      chatService.markMessagesAsRead(roomId, CURRENT_USER_ID);
    }
  }, [roomId, messages.length]);

  const initChatRoom = async () => {
    try {
      const { data, error } = await chatService.createPublicRoom(clubId);
      if (data) {
        setRoomId(data.id);
      }
    } catch (error) {
      console.error('初始化聊天室失败:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const { data } = await chatService.getMessages(roomId);
      const formattedMessages = data.map(msg => ({
        ...msg,
        is_own: msg.sender_id === CURRENT_USER_ID
      }));
      setMessages(formattedMessages);

      const subscription = chatService.subscribeToRoom(roomId, (payload) => {
        setMessages(prev => [...prev, {
          ...payload.new,
          is_own: payload.new.sender_id === CURRENT_USER_ID
        }]);
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('加载消息失败:', error);
    }
  };

  const loadMemberCount = async () => {
    try {
      const result = await adminManagementService.getRealMemberCount(clubId);
      if (result.success) {
        setMemberCount(result.count);
      } else {
        const membersResult = await memberService.getClubMembers(clubId);
        if (membersResult.data) {
          setMemberCount(membersResult.data.length);
        }
      }
    } catch (error) {
      console.error('加载成员数量失败:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isSending || !roomId) return;

    setIsSending(true);
    setError(null);

    const tempId = Date.now().toString();
    const newMessage = {
      id: tempId,
      chat_room_id: roomId,
      sender_id: CURRENT_USER_ID,
      content: message.trim(),
      created_at: new Date().toISOString(),
      is_own: true,
      status: 'sending'
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageStatus(prev => ({ ...prev, [tempId]: 'sending' }));
    setMessage('');

    try {
      const { data, error: sendError } = await chatService.sendMessage(roomId, CURRENT_USER_ID, message.trim());

      if (data) {
        setMessages(prev => prev.map(msg =>
          msg.id === tempId ? { ...msg, id: data.id, status: 'sent' } : msg
        ));
        setMessageStatus(prev => ({ ...prev, [tempId]: 'sent' }));
      } else if (sendError) {
        setError(sendError.message || '发送失败，请重试');
        setMessageStatus(prev => ({ ...prev, [tempId]: 'failed' }));
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      setError('发送失败，请重试');
      setMessageStatus(prev => ({ ...prev, [tempId]: 'failed' }));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const emojis = ['😀', '😎', '😍', '🤔', '😂', '😭', '👍', '👎', '❤️', '🔥', '🎉', '🌟', '💯', '🙏', '🤝', '👋'];

  const handleEmojiClick = (emoji) => {
    setMessage(prev => prev + emoji);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-b from-dark-300 via-dark-200 to-dark-100 flex flex-col">
      <div className="sticky top-0 z-50 bg-dark-300/95 backdrop-blur-xl border-b border-white/10 safe-area-top">
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
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-gray-400">{memberCount} 人在线</span>
              </div>
            </div>
          </div>

          <div className="w-16" />
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 overflow-y-auto">
        {isJoining && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative w-20 h-20 mb-6">
              <div className="w-full h-full border-4 border-primary-700 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 w-full h-full border-4 border-primary-700/30 border-t-transparent rounded-full animate-spin" style={{ animationDelay: '0.2s' }} />
            </div>
            <p className="text-white text-lg mb-2">正在加入俱乐部...</p>
            <p className="text-gray-400 text-sm">即将进入 {clubName} 的公共大厅</p>
          </div>
        )}

        {joinedSuccessfully && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-primary-600/20 to-primary-700/20 border border-primary-700/30 rounded-xl p-4 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">🎉 加入成功！</h2>
              <p className="text-gray-300">您已成功加入 {clubName} 公共大厅，可以开始聊天了</p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">🤖</span>
                </div>
                <div className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-xl rounded-tl-none p-3 max-w-[80%]">
                  <p className="text-gray-200 text-sm">欢迎加入 {clubName} 公共大厅！如有任何问题，请随时询问。</p>
                </div>
              </div>

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 mb-4 ${msg.is_own ? 'flex-row-reverse' : ''}`}
                >
                  {!msg.is_own && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">
                        {msg.sender?.username?.charAt(0) || '👤'}
                      </span>
                    </div>
                  )}
                  <div className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.is_own
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 rounded-br-sm'
                      : 'bg-white/10 rounded-bl-sm'
                  }`}>
                    {!msg.is_own && msg.sender && (
                      <p className="text-xs text-gray-400 mb-1">{msg.sender.username}</p>
                    )}
                    <p className={`text-sm ${msg.is_own ? 'text-white' : 'text-gray-200'}`}>
                      {msg.content}
                    </p>
                    <div className={`flex items-center gap-1 mt-1 ${msg.is_own ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-xs text-gray-500">
                        {formatTime(msg.created_at)}
                      </span>
                      {msg.is_own && (
                        <span className="text-xs text-gray-400">
                          {messageStatus[msg.id] === 'sending' && '⏳'}
                          {messageStatus[msg.id] === 'sent' && '✓'}
                          {messageStatus[msg.id] === 'failed' && '✗'}
                          {!messageStatus[msg.id] && msg.status === 'read' && '✓✓'}
                        </span>
                      )}
                    </div>
                  </div>
                  {msg.is_own && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">👤</span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {joinedSuccessfully && (
        <div className="sticky bottom-0 bg-dark-300/95 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
          <div className="max-w-4xl mx-auto px-4 py-3">
            {showEmoji && (
              <div className="bg-dark-200 rounded-xl p-3 mb-3 flex flex-wrap gap-2">
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiClick(emoji)}
                    className="text-2xl hover:bg-white/10 rounded-lg p-1 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <div className="mb-2 p-2 bg-red-500/20 text-red-400 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex items-end gap-3">
              <button
                onClick={() => setShowEmoji(!showEmoji)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="表情"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 15s1.5-2 4-2 4 2 4 2M9 9h.01M15 9h.01" />
                </svg>
              </button>

              <div className="flex-1 relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="在公共大厅发送消息..."
                  disabled={isSending}
                  rows={1}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary-700/50 transition-all disabled:opacity-50 resize-none"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
              </div>

              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || isSending}
                className={`p-3 rounded-xl transition-all ${
                  message.trim() && !isSending
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:shadow-lg hover:shadow-primary-700/30'
                    : 'bg-white/5 text-gray-400 cursor-not-allowed'
                }`}
                aria-label="发送"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}