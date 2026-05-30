import { forwardRef } from 'react'

const Textarea = forwardRef(({ className = '', rows = 4, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-700/50 focus:ring-1 focus:ring-primary-700/30 transition-all resize-none ${className}`}
      {...props}
    />
  )
})

Textarea.displayName = 'Textarea'

export default Textarea