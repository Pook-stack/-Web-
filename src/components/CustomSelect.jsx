import { useState, useRef, useEffect, useCallback } from 'react'

const CustomSelect = ({ options, value, onChange, placeholder = '请选择', className = '', disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const dropdownRef = useRef(null)
  const selectRef = useRef(null)

  const selectedOption = options.find(opt => opt.value === value)

  const handleKeyDown = useCallback((e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setIsOpen(true)
        setHighlightedIndex(0)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < options.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : -1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0) {
          onChange(options[highlightedIndex].value)
          setIsOpen(false)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
      default:
        break
    }
  }, [isOpen, highlightedIndex, options, onChange])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && dropdownRef.current) {
      const item = dropdownRef.current.querySelector(`[data-index="${highlightedIndex}"]`)
      if (item) {
        item.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [isOpen, highlightedIndex])

  return (
    <div 
      ref={dropdownRef}
      className={`relative w-full ${className}`}
    >
      <button
        ref={selectRef}
        type="button"
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        disabled={disabled}
        className={`
          w-full px-4 py-2.5 bg-dark-200 border border-white/10 rounded-xl 
          text-white text-left flex items-center justify-between
          focus:outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-700/20
          transition-all duration-200 ease-out
          hover:border-white/20 hover:bg-dark-300/50
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:bg-dark-200
          ${isOpen ? 'border-primary-700 ring-2 ring-primary-700/20' : ''}
        `}
      >
        <span className={selectedOption ? 'text-white' : 'text-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg 
          className={`
            w-5 h-5 text-gray-400 transition-transform duration-200 ease-out
            ${isOpen ? 'rotate-180' : ''}
          `} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <TransitionContainer isOpen={isOpen}>
        <div className={`
          absolute top-full left-0 right-0 mt-1
          bg-dark-200 border border-white/10 rounded-xl
          shadow-lg shadow-black/30 backdrop-blur-sm
          z-50 overflow-hidden
          animate-slide-down
        `}>
          <div className="max-h-60 overflow-y-auto scrollbar-hide">
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                data-index={index}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                  setHighlightedIndex(-1)
                }}
                className={`
                  w-full px-4 py-2.5 text-left transition-all duration-150 ease-out
                  flex items-center gap-2
                  ${highlightedIndex === index 
                    ? 'bg-primary-700/20 text-primary-400' 
                    : 'text-white hover:bg-white/5 hover:text-gray-200'
                  }
                  ${selectedOption?.value === option.value ? 'font-medium' : ''}
                `}
              >
                <span>{option.label}</span>
                {selectedOption?.value === option.value && (
                  <svg className="w-4 h-4 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </TransitionContainer>
    </div>
  )
}

const TransitionContainer = ({ isOpen, children }) => {
  if (!isOpen) return null
  
  return (
    <div className="absolute left-0 right-0">
      {children}
    </div>
  )
}

export default CustomSelect