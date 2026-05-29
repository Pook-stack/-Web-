import { useState, useEffect } from 'react';
import { Button } from './ui';

export default function ChatInterface({ clubId, clubName, onBack }) {
  const [message, setMessage] = useState('');
  const [isJoining, setIsJoining] = useState(true);
  const [joinedSuccessfully, setJoinedSuccessfully] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsJoining(false);
      setJoinedSuccessfully(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleSendMessage = () => {
    if (message.trim()) {
      alert(`消息已发送到俱乐部 "${clubName}"：${message}`);
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
                <span className="text-sm text-gray-400">在线</span>
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
            <p className="text-gray-400 text-sm">即将进入 {clubName} 的聊天界面</p>
          </div>
        )}

        {joinedSuccessfully && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-primary-600/20 to-primary-700/20 border border-primary-700/30 rounded-xl p-4 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">🎉 加入成功！</h2>
              <p className="text-gray-300">您已成功加入 {clubName}，可以开始聊天了</p>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-white font-bold mb-4">💬 聊天区域</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">🤖</span>
                  </div>
                  <div className="bg-white/10 rounded-xl rounded-tl-none p-3 max-w-[80%]">
                    <p className="text-gray-300 text-sm">欢迎加入 {clubName}！如有任何问题，请随时询问。</p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl rounded-tr-none p-3 max-w-[80%]">
                    <p className="text-white text-sm">您好！我刚刚加入俱乐部。</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">👤</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">🤖</span>
                  </div>
                  <div className="bg-white/10 rounded-xl rounded-tl-none p-3 max-w-[80%]">
                    <p className="text-gray-300 text-sm">很高兴您加入我们！请查看俱乐部公告了解最新活动。</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-white font-bold mb-4">📋 俱乐部公告</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-primary-700">•</span>
                  <span className="text-gray-300">俱乐部每周五晚上8点举办游戏活动</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary-700">•</span>
                  <span className="text-gray-300">请遵守俱乐部规则，文明交流</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary-700">•</span>
                  <span className="text-gray-300">有问题可以@管理员</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {joinedSuccessfully && (
        <div className="sticky bottom-0 bg-dark-300/95 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入消息..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-primary-700/50 transition-all"
                />
              </div>
              <Button onClick={handleSendMessage} disabled={!message.trim()}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
