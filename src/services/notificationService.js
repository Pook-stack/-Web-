import { supabase } from '../supabase';

export const notificationService = {
  // 获取当前用户的通知列表
  async getNotifications(page = 0, pageSize = 20) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // 获取未读通知数量
  async getUnreadCount() {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('is_read', false);
      
      return { count: count || 0, error };
    } catch (error) {
      return { count: 0, error };
    }
  },

  // 获取特定状态的通知
  async getNotificationsByStatus(isRead = null, page = 0, pageSize = 20) {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (isRead !== null) {
        query = query.eq('is_read', isRead);
      }

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // 标记单条通知为已读
  async markAsRead(notificationId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // 标记所有通知为已读
  async markAllAsRead() {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);
      
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // 创建通知
  async createNotification(notificationData) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notificationData]);
      
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // 创建申请批准通知
  async createApplicationApprovedNotification(userId, clubName) {
    const content = `您加入「${clubName}」的申请已通过！欢迎加入俱乐部。`;
    return await this.createNotification({
      user_id: userId,
      type: 'application_approved',
      content,
      metadata: { club_name: clubName }
    });
  },

  // 创建申请拒绝通知
  async createApplicationRejectedNotification(userId, clubName) {
    const content = `很遗憾，您加入「${clubName}」的申请未通过审核。`;
    return await this.createNotification({
      user_id: userId,
      type: 'application_rejected',
      content,
      metadata: { club_name: clubName }
    });
  },

  // 创建加入俱乐部通知
  async createClubJoinedNotification(userId, clubName) {
    const content = `恭喜！您已成功加入「${clubName}」俱乐部。`;
    return await this.createNotification({
      user_id: userId,
      type: 'club_joined',
      content,
      metadata: { club_name: clubName }
    });
  },

  // 创建系统通知
  async createSystemNotification(userId, content) {
    return await this.createNotification({
      user_id: userId,
      type: 'system_notice',
      content
    });
  },

  // 删除通知
  async deleteNotification(notificationId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // 订阅通知实时更新
  subscribeToNotifications(callback) {
    return supabase
      .channel('public:notifications')
      .on('INSERT', (payload) => {
        callback('INSERT', payload.new);
      })
      .on('UPDATE', (payload) => {
        callback('UPDATE', payload.new);
      })
      .subscribe();
  }
};