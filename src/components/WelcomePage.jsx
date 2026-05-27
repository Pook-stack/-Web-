import { useState, useEffect } from 'react'

export default function WelcomePage({ onEnter }) {
  const [showContent, setShowContent] = useState(false)
  const [floatItems, setFloatItems] = useState([
    { id: 1, emoji: '🎮', x: 10, y: 20 },
    { id: 2, emoji: '🎯', x: 85, y: 30 },
    { id: 3, emoji: '✨', x: 20, y: 70 },
    { id: 4, emoji: '⚡', x: 75, y: 80 },
    { id: 5, emoji: '🎲', x: 90, y: 50 },
    { id: 6, emoji: '🏆', x: 15, y: 45 },
  ])

  useEffect(() => {
    setTimeout(() => setShowContent(true), 300)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setFloatItems(items =>
        items.map(item => ({
          ...item,
          x: Math.random() * 90 + 5,
          y: Math.random() * 80 + 10,
        }))
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-b from-dark-300 via-dark-200 to-dark-300 flex flex-col items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary-700/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-3xl" />
        
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,242,255,0.3)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {floatItems.map((item, index) => (
          <span
            key={item.id}
            className="absolute text-4xl md:text-6xl animate-float pointer-events-none"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              animationDelay: `${index * 0.5}s`,
              opacity: showContent ? 0.6 : 0,
              transition: 'opacity 1s ease'
            }}
          >
            {item.emoji}
          </span>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-4">
        <div 
          className={`mb-8 transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ animationDelay: '0.3s' }}
        >
          <div className="relative w-32 h-32 md:w-40 md:h-40 mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="45" fill="none" stroke="url(#logoGradient)" strokeWidth="3" strokeDasharray="283" strokeDashoffset="283" className="animate-draw">
                <animate attributeName="stroke-dashoffset" from="283" to="0" dur="2s" fill="freeze" />
              </circle>
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0066ff" />
                  <stop offset="100%" stopColor="#00f2ff" />
                </linearGradient>
              </defs>
              <text x="50" y="58" textAnchor="middle" fontSize="28" fill="#00f2ff" fontWeight="bold">🎮</text>
            </svg>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-600/30 to-primary-700/30 animate-pulse-glow" />
          </div>
        </div>

        <h1 
          className={`text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-primary-700 via-white to-primary-600 bg-clip-text text-transparent transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ animationDelay: '0.5s' }}
        >
          陪玩俱乐部
        </h1>

        <p 
          className={`text-lg md:text-xl text-gray-300 mb-12 max-w-md transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ animationDelay: '0.7s' }}
        >
          与志同道合的玩家一起，共享游戏乐趣
        </p>

        <button
          onClick={onEnter}
          className={`group relative px-12 py-4 text-lg font-bold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-full transition-all duration-500 transform hover:scale-105 hover:shadow-[0_0_30px_rgba(0,242,255,0.5)] active:scale-95 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ animationDelay: '0.9s' }}
        >
          <span className="relative z-10 flex items-center gap-2">
            进入首页
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
          <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
        </button>
      </div>

      <style>{`
        @keyframes draw {
          from {
            stroke-dashoffset: 283;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        .animate-draw {
          animation: draw 2s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
