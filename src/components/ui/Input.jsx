import { forwardRef } from 'react'

const Input = forwardRef(({ className = '', ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-700/50 focus:ring-1 focus:ring-primary-700/30 transition-all ${className}`}
      {...props}
    />
  )
})

Input.displayName = 'Input'

export default Input