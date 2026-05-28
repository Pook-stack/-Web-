const Skeleton = ({ className = '' }) => {
  return (
    <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 animate-shimmer ${className}`}>
      <div className="relative h-40 rounded-xl bg-white/5 mb-4 overflow-hidden">
        <div className="absolute inset-0 animate-shimmer" />
      </div>
      
      <div className="space-y-3">
        <div className="h-6 w-3/4 bg-white/5 rounded-lg" />
        <div className="h-4 w-1/2 bg-white/5 rounded-lg" />
        <div className="h-4 w-full bg-white/5 rounded-lg" />
        <div className="flex gap-2">
          <div className="h-8 w-16 bg-white/5 rounded-lg" />
          <div className="h-8 w-16 bg-white/5 rounded-lg" />
        </div>
        <div className="h-10 w-full bg-white/5 rounded-xl" />
      </div>
    </div>
  )
}

export default Skeleton
