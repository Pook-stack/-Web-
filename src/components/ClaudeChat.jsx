import { useState, useEffect, useRef } from 'react';
import { claudeService } from '../services/claudeService';

export default function ClaudeChat({ onBack }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef(null);
  const [systemPrompt, setSystemPrompt] = useState('你是一个有帮助的AI助手。请用简洁、友好的语言回答问题。');
  const [model, setModel] = useState('claude-3-haiku-20240307');
  const [showSettings, setShowSettings] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending || isStreaming) return;

    const userMessage = {
      role: 'user',
      content: inputValue.trim()
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputValue('');
    setIsSending(true);
    setError(null);

    try {
      const assistantMessage = {
        role: 'assistant',
        content: ''
      };
      setMessages([...nextMessages, assistantMessage]);
      setIsStreaming(true);

      await claudeService.sendMessageStream(
        nextMessages,
        {
          model,
          systemPrompt,
          onChunk: (chunk) => {
            setMessages(prev => prev.map((msg, idx) => 
              idx === prev.length - 1 
                ? { ...msg, content: msg.content + chunk }
                : msg
            ));
          }
        }
      );
    } catch (err) {
      console.error('发送消息失败:', err);
      setError(err.message || '发送消息失败，请重试');
    } finally {
      setIsSending(false);
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    if (confirm('确定要清空聊天记录吗？')) {
      setMessages([]);
    }
  };

  const emojis = ['😀', '😎', '😍', '🤔', '😂', '😭', '👍', '👎', '❤️', '🔥', '🎉', '🌟', '💯', '🙏', '🤝', '👋'];

  const handleEmojiClick = (emoji) => {
    setInputValue(prev => prev + emoji);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const isConfigured = claudeService.isConfigured();

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center p-4">
        <div className="bg-white/5 rounded-xl p-8 border border-white/10 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Claude API 未配置</h2>
          <p className="text-gray-400 mb-4">
            请在项目根目录创建 .env 文件，并添加：
          </p>
          <div className="bg-black/30 rounded-lg p-3 text-left mb-4">
            <code className="text-green-400 text-sm">VITE_ANTHROPIC_API_KEY=你的_api_key</code>
          </div>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-lg hover:shadow-primary-700/30 transition-all"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-300 via-dark-200 to-dark-100 flex flex-col">
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
              <span className="text-white font-bold">🤖</span>
            </div>
            <div>
              <h1 className="text-white font-bold">Claude AI</h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-gray-400">{model}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="设置"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="清空聊天"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {showSettings && (
          <div className="border-t border-white/10 bg-dark-200/95">
            <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">模型选择</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-700/50"
                >
                  <option value="claude-3-haiku-20240307">Claude 3 Haiku (快速)</option>
                  <option value="claude-3-sonnet-20240229">Claude 3 Sonnet (平衡)</option>
                  <option value="claude-3-opus-20240229">Claude 3 Opus (强大)</option>
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (最新)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">系统提示词</label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="设置AI的性格和回答方式..."
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary-700/50 resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">与 Claude 聊天</h2>
            <p className="text-gray-400 mb-6 max-w-md">
              开始与 AI 助手对话，提出问题、获取建议或进行创意讨论。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg w-full">
              {[
                '帮我写一段代码',
                '解释一下量子计算',
                '写一个故事开头',
                '帮我翻译这段话'
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputValue(suggestion)}
                  className="p-4 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 hover:border-primary-700/50 transition-all text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700'
                    : 'bg-gradient-to-r from-orange-500 to-red-500'
                }`}>
                  <span className="text-white font-bold">
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </span>
                </div>
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 rounded-br-sm'
                    : 'bg-white/10 rounded-bl-sm'
                }`}>
                  <p className={`text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'text-white' : 'text-gray-200'}`}>
                    {msg.content}
                    {isStreaming && idx === messages.length - 1 && msg.role === 'assistant' && (
                      <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse" />
                    )}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

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
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入消息... (Shift+Enter 换行)"
                disabled={isSending || isStreaming}
                rows={1}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary-700/50 transition-all disabled:opacity-50 resize-none"
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending || isStreaming}
              className={`p-3 rounded-xl transition-all ${
                inputValue.trim() && !isSending && !isStreaming
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg hover:shadow-red-500/30'
                  : 'bg-white/5 text-gray-400 cursor-not-allowed'
              }`}
              aria-label="发送"
            >
              {isSending || isStreaming ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
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
