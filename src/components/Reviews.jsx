import { useState, useEffect } from 'react';
import { reviewService } from '../services/localDataService';
import { Button } from './ui';

const StarRating = ({ rating, onChange, readonly = false, size = 'md' }) => {
  const [hover, setHover] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`${sizeClasses[size]} ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <svg
            viewBox="0 0 24 24"
            fill={star <= (hover || rating) ? '#fbbf24' : 'none'}
            stroke={star <= (hover || rating) ? '#fbbf24' : '#6b7280'}
            strokeWidth="2"
            className="w-full h-full"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

const ReviewForm = ({ clubId, userId, existingReview, onSuccess }) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('请选择评分');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await reviewService.submitReview(clubId, userId, rating, comment);
      
      if (result.success) {
        onSuccess?.(result.data);
        setComment('');
      } else {
        setError(result.error || '提交失败');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {existingReview ? '修改评分' : '选择评分'}
        </label>
        <StarRating rating={rating} onChange={setRating} size="lg" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          评价内容（可选）
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows="4"
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="分享您的体验和感受..."
          maxLength="500"
        />
        <p className="text-xs text-gray-500 mt-1 text-right">
          {comment.length}/500
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <Button
        type="submit"
        disabled={submitting || rating === 0}
        className="w-full"
      >
        {submitting ? '提交中...' : existingReview ? '更新评价' : '提交评价'}
      </Button>
    </form>
  );
};

const RatingStats = ({ stats }) => {
  if (!stats || stats.total === 0) {
    return (
      <div className="text-center text-gray-400 py-4">
        暂无评分
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-1">
            {stats.average.toFixed(1)}
          </div>
          <StarRating rating={stats.average} readonly size="sm" />
          <div className="text-sm text-gray-400 mt-1">
            {stats.total} 条评价
          </div>
        </div>

        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.distribution[star] || 0;
            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

            return (
              <div key={star} className="flex items-center gap-2">
                <span className="text-sm text-gray-400 w-6">{star}星</span>
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-8">
                  {Math.round(percentage)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ReviewItem = ({ review }) => {
  return (
    <div className="bg-white/5 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
            {review.user_id.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-white font-medium">
              用户 {review.user_id.substring(0, 8)}
            </div>
            <div className="text-sm text-gray-400">
              {new Date(review.created_at).toLocaleDateString('zh-CN')}
            </div>
          </div>
        </div>
        <StarRating rating={review.rating} readonly size="sm" />
      </div>

      {review.comment && (
        <p className="text-gray-300 text-sm leading-relaxed">
          {review.comment}
        </p>
      )}
    </div>
  );
};

const ReviewList = ({ reviews, loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-white/5 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p>暂无评价，来成为第一个评价的人吧！</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewItem key={review.id} review={review} />
      ))}
    </div>
  );
};

const Reviews = ({ clubId, userId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [userReview, setUserReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, [clubId, userId]);

  const loadData = async () => {
    setLoading(true);
    
    try {
      const [reviewsResult, statsResult, userReviewResult] = await Promise.all([
        reviewService.getClubReviews(clubId),
        reviewService.getRatingStats(clubId),
        reviewService.getUserReview(clubId, userId)
      ]);

      if (reviewsResult.success) {
        setReviews(reviewsResult.data);
      }

      if (statsResult.success) {
        setStats(statsResult.data);
      }

      if (userReviewResult.success) {
        setUserReview(userReviewResult.data);
      }
    } catch (error) {
      console.error('加载评价失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSuccess = (review) => {
    setUserReview(review);
    setShowForm(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* 评分统计 */}
      <div className="bg-white/5 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">评分统计</h3>
        <RatingStats stats={stats} />
      </div>

      {/* 提交评价 */}
      <div className="bg-white/5 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            {userReview ? '修改评价' : '我要评价'}
          </h3>
          {userReview && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              修改评价
            </button>
          )}
        </div>

        {(!userReview || showForm) ? (
          <ReviewForm
            clubId={clubId}
            userId={userId}
            existingReview={userReview}
            onSuccess={handleReviewSuccess}
          />
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400 mb-2">您已评价过该俱乐部</p>
            <StarRating rating={userReview.rating} readonly />
          </div>
        )}
      </div>

      {/* 评价列表 */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          评价列表 ({stats?.total || 0})
        </h3>
        <ReviewList reviews={reviews} loading={loading} />
      </div>
    </div>
  );
};

export { Reviews, StarRating, RatingStats, ReviewForm, ReviewList };
export default Reviews;
