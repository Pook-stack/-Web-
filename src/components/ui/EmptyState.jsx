import Button from './Button'

const EmptyState = ({ 
  icon = null, 
  title = '暂无内容', 
  description = '快来成为第一个吧',
  buttonText = '去创建',
  onButtonClick = null,
  showButton = true 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 mb-6 flex items-center justify-center">
        {icon ? (
          icon
        ) : (
          <svg 
            className="w-20 h-20 text-gray-500" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5"
          >
            <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        )}
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2 text-center">
        {title}
      </h3>
      
      <p className="text-gray-400 text-center max-w-xs mb-6">
        {description}
      </p>
      
      {showButton && onButtonClick && (
        <Button onClick={onButtonClick}>
          {buttonText}
        </Button>
      )}
    </div>
  )
}

export default EmptyState
