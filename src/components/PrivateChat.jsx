import { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/localDataService'
import { getUserId } from '../services/userIdentity'

const CURRENT_USER_ID = getUserId()

export default function PrivateChat({ roomId, recipient, onBack, clubName }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [messageStatus, setMessageStatus] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadMessages();

    const subscription = chatService.subscribeToRoom(roomId, (payload) => {
      setMessages(prev => [...prev, {
        ...payload.new,
        is_own: payload.new.sender_id === CURRENT_USER_ID
      }]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      chatService.markMessagesAsRead(roomId, CURRENT_USER_ID);
    }
  }, [roomId, messages.length]);

  const loadMessages = async () => {
    try {
      const { data } = await chatService.getMessages(roomId);
      const formattedMessages = data.map(msg => ({
        ...msg,
        is_own: msg.sender_id === CURRENT_USER_ID
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('加载消息失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    const tempId = Date.now().toString();
    const newMessage = {
      id: tempId,
      chat_room_id: roomId,
      sender_id: CURRENT_USER_ID,
      content: inputValue.trim(),
      created_at: new Date().toISOString(),
      is_own: true,
      status: 'sending'
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageStatus(prev => ({ ...prev, [tempId]: 'sending' }));
    setInputValue('');

    try {
      const { data, error: sendError } = await chatService.sendMessage(roomId, CURRENT_USER_ID, inputValue.trim());

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
      handleSend();
    }
  };

  const emojis = ['😀', '😎', '😍', '🤔', '😂', '😭', '👍', '👎', '❤️', '🔥', '🎉', '🌟', '💯', '🙏', '🤝', '👋'];

  const handleEmojiClick = (emoji) => {
    setInputValue(prev => prev + emoji);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-700 border-t-transparent rounded-full animate-spin" />
      </div>
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
              <span className="text-white font-bold">{recipient?.username?.charAt(0) || recipient?.name?.charAt(0) || '?'}</span>
            </div>
            <div>
              <h1 className="text-white font-bold">{recipient?.username || recipient?.name}</h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-gray-400">在线</span>
              </div>
            </div>
          </div>

          <div className="w-16" />
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 overflow-y-auto">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-gray-700 to-gray-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-400">开始与 {recipient?.username || recipient?.name} 的私人聊天</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.is_own ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.is_own
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700'
                    : 'bg-gradient-to-r from-gray-500 to-gray-600'
                }`}>
                  <span className="text-white font-bold">
                    {msg.is_own ? '👤' : (msg.sender?.username?.charAt(0) || '👤')}
                  </span>
                </div>
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
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="sticky bottom-0 bg-dark-300/95 backdrop-blur-xl border-t border-white/10">
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
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`与 ${recipient?.username || recipient?.name} 聊天...`}
                disabled={isSending}
                rows={1}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary-700/50 transition-all disabled:opacity-50 resize-none"
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending}
              className={`p-3 rounded-xl transition-all ${
                inputValue.trim() && !isSending
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
    </div>
  );
}