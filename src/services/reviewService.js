import { supabase } from '../supabase';

export const reviewService = {
  // 获取俱乐部的所有评价
  async getClubReviews(clubId, page = 1, limit = 20) {
    try {
      const from = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('reviews')
        .select('*', { count: 'exact' })
        .eq('club_id', clubId)
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      console.error('获取评价失败:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0
      };
    }
  },

  // 获取用户的评价
  async getUserReview(clubId, userId) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('club_id', clubId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return {
        success: true,
        data: data || null
      };
    } catch (error) {
      console.error('获取用户评价失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 提交评价
  async submitReview(clubId, userId, rating, comment = '') {
    try {
      // 检查是否已评价
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('club_id', clubId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // 更新评价
        const { data, error } = await supabase
          .from('reviews')
          .update({
            rating,
            comment,
            updated_at: new Date().toISOString()
          })
          .eq('club_id', clubId)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;

        return {
          success: true,
          data,
          message: '评价已更新'
        };
      } else {
        // 新增评价
        const { data, error } = await supabase
          .from('reviews')
          .insert({
            club_id: clubId,
            user_id: userId,
            rating,
            comment
          })
          .select()
          .single();

        if (error) throw error;

        return {
          success: true,
          data,
          message: '评价提交成功'
        };
      }
    } catch (error) {
      console.error('提交评价失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 删除评价
  async deleteReview(reviewId) {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      return {
        success: true,
        message: '评价已删除'
      };
    } catch (error) {
      console.error('删除评价失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 获取评分统计
  async getRatingStats(clubId) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('club_id', clubId);

      if (error) throw error;

      const ratings = data?.map(r => r.rating) || [];
      const total = ratings.length;

      if (total === 0) {
        return {
          success: true,
          data: {
            average: 0,
            total: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          }
        };
      }

      const average = ratings.reduce((a, b) => a + b, 0) / total;
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      ratings.forEach(rating => {
        const star = Math.round(rating);
        if (star >= 1 && star <= 5) {
          distribution[star]++;
        }
      });

      return {
        success: true,
        data: {
          average: Math.round(average * 10) / 10,
          total,
          distribution
        }
      };
    } catch (error) {
      console.error('获取评分统计失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default reviewService;
