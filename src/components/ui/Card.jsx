import clsx from 'clsx'

const Card = ({ 
  children, 
  onClick, 
  className = '',
  hover = true,
  ...props 
}) => {
  const baseStyles = 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 transition-all duration-300'
  
  const hoverStyles = hover 
    ? 'hover:bg-white/8 hover:border-white/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-700/10 cursor-pointer' 
    : ''

  return (
    <div
      onClick={onClick}
      className={clsx(baseStyles, hoverStyles, className)}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
