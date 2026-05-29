import { supabase } from '../supabase';

export const adminManagementService = {
  // 获取俱乐部管理员列表
  async getClubAdmins(clubId) {
    try {
      const { data, error } = await supabase
        .from('club_admins')
        .select('*')
        .eq('club_id', clubId)
        .order('role', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('获取管理员失败:', error);
      return { success: false, error: error.message };
    }
  },

  // 检查用户是否是俱乐部管理员（双重验证）
  async isClubAdmin(clubId, userId) {
    try {
      // 首先检查 club_admins 表
      const { data: adminData, error: adminError } = await supabase
        .from('club_admins')
        .select('id')
        .eq('club_id', clubId)
        .eq('user_id', userId)
        .single();

      if (adminError && adminError.code !== 'PGRST116') throw adminError;

      // 如果在 club_admins 表中找到，直接返回true
      if (adminData) {
        return { success: true, isAdmin: true };
      }

      // 其次检查 clubs 表的 created_by 字段（兜底验证）
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('created_by')
        .eq('id', clubId)
        .single();

      if (clubError && clubError.code !== 'PGRST116') throw clubError;

      // 如果用户是创建者，也认定为管理员
      const isAdmin = !!adminData || clubData?.created_by === userId;
      return { success: true, isAdmin };
    } catch (error) {
      console.error('检查管理员权限失败:', error);
      return { success: false, error: error.message };
    }
  },

  // 检查用户是否是俱乐部创建者（双重验证）
  async isClubCreator(clubId, userId) {
    try {
      // 首先检查 club_admins 表
      const { data: adminData, error: adminError } = await supabase
        .from('club_admins')
        .select('id')
        .eq('club_id', clubId)
        .eq('user_id', userId)
        .eq('role', 'creator')
        .single();

      if (adminError && adminError.code !== 'PGRST116') throw adminError;

      // 如果在 club_admins 表中找到，直接返回true
      if (adminData) {
        return { success: true, isCreator: true };
      }

      // 其次检查 clubs 表的 created_by 字段（兜底验证）
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('created_by')
        .eq('id', clubId)
        .single();

      if (clubError && clubError.code !== 'PGRST116') throw clubError;

      const isCreator = !!adminData || clubData?.created_by === userId;
      return { success: true, isCreator };
    } catch (error) {
      console.error('检查创建者权限失败:', error);
      return { success: false, error: error.message };
    }
  },

  // 任命管理员
  async appointAdmin(clubId, userId, appointedBy) {
    try {
      const { data, error } = await supabase
        .from('club_admins')
        .insert([{
          club_id: clubId,
          user_id: userId,
          role: 'admin',
          appointed_by: appointedBy,
          appointed_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('任命管理员失败:', error);
      return { success: false, error: error.message };
    }
  },

  // 撤销管理员
  async revokeAdmin(clubId, userId) {
    try {
      const { data, error } = await supabase
        .from('club_admins')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', userId)
        .eq('role', 'admin')
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('撤销管理员失败:', error);
      return { success: false, error: error.message };
    }
  },

  // 创建俱乐部时设置创建者
  async setClubCreator(clubId, userId) {
    try {
      const { data, error } = await supabase
        .from('club_admins')
        .insert([{
          club_id: clubId,
          user_id: userId,
          role: 'creator',
          appointed_by: userId,
          appointed_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('设置创建者失败:', error);
      return { success: false, error: error.message };
    }
  },

  // 更新俱乐部信息
  async updateClub(clubId, updateData) {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .update(updateData)
        .eq('id', clubId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('更新俱乐部失败:', error);
      return { success: false, error: error.message };
    }
  },

  // 删除俱乐部（仅创建者可用）
  async deleteClub(clubId) {
    try {
      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', clubId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('删除俱乐部失败:', error);
      return { success: false, error: error.message };
    }
  },

  // 获取成员审计日志
  async getMemberAuditLog(clubId) {
    try {
      const { data, error } = await supabase
        .from('member_audit_log')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('获取审计日志失败:', error);
      return { success: false, error: error.message };
    }
  },

  // 记录成员变更
  async logMemberChange(clubId, userId, action, actorId, details = {}) {
    try {
      const { data, error } = await supabase
        .from('member_audit_log')
        .insert([{
          club_id: clubId,
          user_id: userId,
          action,
          actor_id: actorId,
          details: JSON.stringify(details),
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('记录成员变更失败:', error);
      return { success: false, error: error.message };
    }
  },

  // 获取真实成员数量
  async getRealMemberCount(clubId) {
    try {
      const { data, error, count } = await supabase
        .from('club_members')
        .select('id', { count: 'exact' })
        .eq('club_id', clubId);

      if (error) throw error;
      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('获取成员数量失败:', error);
      return { success: false, error: error.message };
    }
  }
};

export default adminManagementService;
