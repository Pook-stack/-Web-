import clsx from 'clsx'

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  className = '',
  ...props 
}) => {
  const baseStyles = 'font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-700/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'

  const variantStyles = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:shadow-lg hover:shadow-primary-600/30 hover:-translate-y-0.5 active:translate-y-0',
    secondary: 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:border-white/20',
    ghost: 'text-gray-400 hover:text-white hover:bg-white/5',
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          处理中...
        </span>
      ) : (
        children
      )}
    </button>
  )
}

export default Button
