import { useState } from 'react'
import Button from './Button'

const ConfirmDialog = ({ isOpen, onClose, title, message, onConfirm }) => {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleConfirm = async () => {
    setIsAnimating(true)
    setTimeout(() => {
      onConfirm()
      setIsAnimating(false)
      onClose()
    }, 150)
  }

  const handleCancel = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-dark-200 border border-white/10 rounded-2xl p-6 shadow-2xl animate-slide-up">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-700/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 15s1.5-2 4-2 4 2 4 2" />
              <circle cx="9" cy="9" r="1" fill="currentColor" />
              <circle cx="15" cy="9" r="1" fill="currentColor" />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-400 mb-6">{message}</p>
          
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              onClick={handleCancel}
              className="flex-1"
            >
              取消
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={isAnimating}
              className="flex-1"
            >
              {isAnimating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  处理中...
                </div>
              ) : (
                '确定'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
