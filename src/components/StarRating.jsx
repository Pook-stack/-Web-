import { useState } from 'react';

export default function StarRating({ rating = 0, editable = false, onRatingChange, size = 'md' }) {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const displayRating = hoverRating || (rating || 0);
  
  const handleClick = (star) => {
    if (editable && onRatingChange) {
      onRatingChange(star);
    }
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          onMouseEnter={() => editable && setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          disabled={!editable}
          className={`${sizeClasses[size]} transition-all duration-200 ${
            editable ? 'cursor-pointer hover:scale-110' : 'cursor-default'
          }`}
        >
          <svg viewBox="0 0 24 24" fill={star <= displayRating ? '#fbbf24' : '#374151'} className={sizeClasses[size]}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-300">{rating.toFixed(1)}</span>
    </div>
  );
}