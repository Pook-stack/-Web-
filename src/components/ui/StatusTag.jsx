import clsx from 'clsx'

const StatusTag = ({ status = 'pending', className = '' }) => {
  const statusConfig = {
    pending: {
      label: '待审核',
      className: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 font-semibold',
    },
    approved: {
      label: '已通过',
      className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold',
    },
    rejected: {
      label: '已拒绝',
      className: 'bg-white/10 text-gray-400 line-through',
    },
  }

  const config = statusConfig[status] || statusConfig.pending

  return (
    <span 
      className={clsx(
        'px-3 py-1 rounded-full text-xs whitespace-nowrap',
        config.className,
        className,
        status === 'approved' && 'relative pl-5'
      )}
    >
      {status === 'approved' && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
      )}
      {config.label}
    </span>
  )
}

export default StatusTag
