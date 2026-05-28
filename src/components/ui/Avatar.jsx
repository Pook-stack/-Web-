import clsx from 'clsx'

const Avatar = ({ 
  name = '', 
  image = null, 
  size = 'md',
  className = '',
  ...props 
}) => {
  const initials = name ? name.charAt(0).toUpperCase() : '?'
  
  const sizeStyles = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  }

  const gradientColors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-pink-500 to-rose-500',
    'from-teal-500 to-green-500',
    'from-cyan-500 to-blue-500',
  ]

  const colorIndex = name ? name.charCodeAt(0) % gradientColors.length : 0

  return (
    <div
      className={clsx(
        sizeStyles[size],
        'rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br',
        gradientColors[colorIndex],
        className
      )}
      {...props}
    >
      {image ? (
        <img 
          src={image} 
          alt={name}
          className={clsx(sizeStyles[size], 'rounded-full object-cover')}
        />
      ) : (
        initials
      )}
    </div>
  )
}

export default Avatar
