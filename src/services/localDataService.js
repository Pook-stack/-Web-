// Supabase 数据服务 — 多人共享数据库，无需登录
// 用设备 UUID 标识用户，通过 Supabase 实现跨设备数据互通

import { supabase } from '../supabase'
import { getUserId } from './userIdentity'

const ADMIN_USER_ID = 'admin'
const HELPER_USER_ID = 'helper'

// ── adminService ──
export const adminService = {
  async getUserById(userId) {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single()
      if (error && error.code !== 'PGRST116') throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
  async createAdminUser() {
    try {
      const { data: existing } = await supabase.from('users').select('id').eq('id', ADMIN_USER_ID).single()
      if (existing) return { data: existing, error: null }
      const { data, error } = await supabase.from('users').insert([{ id: ADMIN_USER_ID, username: '管理员', role: 'admin', status: 'active' }]).select().single()
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
  async createHelperUser() {
    try {
      const { data: existing } = await supabase.from('users').select('id').eq('id', HELPER_USER_ID).single()
      if (existing) return { data: existing, error: null }
      const { data, error } = await supabase.from('users').insert([{ id: HELPER_USER_ID, username: '小助手', role: 'helper', status: 'active' }]).select().single()
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
  async banUser(userId) {
    try {
      const { data, error } = await supabase.from('users').update({ status: 'banned', banned_at: new Date().toISOString() }).eq('id', userId).select().single()
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
  async unbanUser(userId) {
    try {
      const { data, error } = await supabase.from('users').update({ status: 'active', banned_at: null }).eq('id', userId).select().single()
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
  async getAllUsers() {
    try {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error }
    }
  },
  async getBannedUsers() {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('status', 'banned').order('banned_at', { ascending: false })
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error }
    }
  },
}

// ── clubService ──
export const clubService = {
  async getAllClubs() {
    try {
      const { data, error } = await supabase.from('clubs').select('*').eq('status', 'approved').order('created_at', { ascending: false })
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error }
    }
  },
  async getClubById(id) {
    try {
      const { data, error } = await supabase.from('clubs').select('*').eq('id', id).single()
      if (error && error.code !== 'PGRST116') throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
  async createClub(clubData) {
    try {
      const creatorId = clubData.created_by || getUserId()
      const { data, error } = await supabase.from('clubs').insert([{
        name: clubData.name,
        game: clubData.game,
        description: clubData.description || '',
        contact: clubData.contact || '',
        price_range: clubData.price_range || '',
        special_services: clubData.special_services || [],
        icon_url: clubData.icon_url || '',
        cover_image_url: clubData.cover_image_url || '',
        created_by: creatorId,
        status: clubData.status || 'pending',
        member_count: clubData.member_count || 0,
        rating: clubData.rating || 0,
        review_count: 0,
        is_official: clubData.is_official || false,
        founded_year: clubData.founded_year || '',
        activity_frequency: clubData.activity_frequency || '',
        member_requirement: clubData.member_requirement || '',
        detailed_description: clubData.detailed_description || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]).select().single()
      if (error) throw error

      // auto-add creator as member
      await memberService.addMember(data.id, creatorId)
      await memberService.addMember(data.id, HELPER_USER_ID)

      // add creator as admin
      await supabase.from('club_admins').insert([{
        club_id: data.id, user_id: creatorId, role: 'creator',
        appointed_by: 'system', appointed_at: new Date().toISOString()
      }])

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
  async getPendingClubs() {
    try {
      const { data, error } = await supabase.from('clubs').select('*').eq('status', 'pending').order('created_at', { ascending: false })
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error }
    }
  },
  async approveClub(id) {
    try {
      const { data, error } = await supabase.from('clubs').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', id).select().single()
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
  async rejectClub(id) {
    try {
      const { error } = await supabase.from('clubs').delete().eq('id', id)
      if (error) throw error
      return { success: true, error: null }
    } catch (error) {
      return { success: false, error }
    }
  },
  async deleteClub(id) {
    try {
      await supabase.from('member_audit_log').delete().eq('club_id', id)
      await supabase.from('applications').delete().eq('club_id', id)
      await supabase.from('club_members').delete().eq('club_id', id)
      await supabase.from('club_admins').delete().eq('club_id', id)
      const { error } = await supabase.from('clubs').delete().eq('id', id)
      if (error) throw error
      return { success: true, deletedClubId: id, error: null }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
  async searchClubs(query) {
    try {
      const { data, error } = await supabase.from('clubs').select('*').eq('status', 'approved').or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error }
    }
  },
  async incrementMemberCount(id) {
    try {
      const { data: club } = await supabase.from('clubs').select('member_count').eq('id', id).single()
      const { data, error } = await supabase.from('clubs').update({ member_count: ((club?.member_count || 0) + 1) }).eq('id', id).select().single()
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
  async decrementMemberCount(id) {
    try {
      const { data: club } = await supabase.from('clubs').select('member_count').eq('id', id).single()
      const { data, error } = await supabase.from('clubs').update({ member_count: Math.max(0, (club?.member_count || 0) - 1) }).eq('id', id).select().single()
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
}

// ── applicationService ──
export const applicationService = {
  async applyToClub(clubId, userId) {
    try {
      const uid = userId || getUserId()
      const { data: existing } = await supabase.from('applications').select('id').eq('club_id', clubId).eq('user_id', uid).single()
      if (existing) return { data: existing, error: { message: '已经申请过该俱乐部' }, alreadyApplied: true }

      const { data, error } = await supabase.from('applications').insert([{ club_id: clubId, user_id: uid, status: 'pending', applied_at: new Date().toISOString() }]).select().single()
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
  async getUserApplications(userId) {
    try {
      const uid = userId || getUserId()
      const { data, error } = await supabase.from('applications').select('*, clubs(*)').eq('user_id', uid).order('applied_at', { ascending: false })
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error }
    }
  },
  async processApplication(applicationId, status) {
    try {
      const { data: app, error: fetchErr } = await supabase.from('applications').select('*, clubs(*)').eq('id', applicationId).single()
      if (fetchErr) throw fetchErr
      if (!app) throw new Error('申请记录不存在')

      const { data, error } = await supabase.from('applications').update({ status, processed_at: new Date().toISOString() }).eq('id', applicationId).select().single()
      if (error) throw error

      if (status === 'approved') {
        await supabase.from('club_members').upsert({ club_id: app.club_id, user_id: app.user_id, role: 'member', joined_at: new Date().toISOString() }).select()
        await clubService.incrementMemberCount(app.club_id)
      }
      return { data, error: null }
    } catch (error) {
      return { data: null, error: { message: error.message } }
    }
  },
  async checkAppliedStatus(clubId, userId) {
    try {
      const uid = userId || getUserId()
      const { data, error } = await supabase.from('applications').select('id').eq('club_id', clubId).eq('user_id', uid).single()
      if (error && error.code !== 'PGRST116') throw error
      return { isApplied: !!data, error: null }
    } catch (error) {
      return { isApplied: false, error }
    }
  },
  async getPendingApplications() {
    try {
      const { data, error } = await supabase.from('applications').select('*, clubs(*)').eq('status', 'pending').order('applied_at', { ascending: false })
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error }
    }
  },
  async getApplicationsByClub(clubId) {
    try {
      const { data, error } = await supabase.from('applications').select('*, clubs(*)').eq('club_id', clubId).order('applied_at', { ascending: false })
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error }
    }
  },
}

// ── memberService ──
export const memberService = {
  async addMember(clubId, userId) {
    try {
      const { data: existing } = await supabase.from('club_members').select('id').eq('club_id', clubId).eq('user_id', userId).single()
      if (existing) return { data: existing, error: { message: '用户已在俱乐部中' }, alreadyMember: true }

      const { data, error } = await supabase.from('club_members').insert([{ club_id: clubId, user_id: userId, role: 'member', joined_at: new Date().toISOString() }]).select().single()
      if (error) throw error
      await clubService.incrementMemberCount(clubId)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
  async removeMember(clubId, userId, actorId) {
    try {
      const { error } = await supabase.from('club_members').delete().eq('club_id', clubId).eq('user_id', userId)
      if (error) throw error
      await clubService.decrementMemberCount(clubId)
      return { success: true, error: null }
    } catch (error) {
      return { success: false, error }
    }
  },
  async getClubMembers(clubId) {
    try {
      const { data, error } = await supabase.from('club_members').select('*').eq('club_id', clubId).order('joined_at', { ascending: false })
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error }
    }
  },
  async getMemberClubsByUserId(userId) {
    try {
      const { data, error } = await supabase.from('club_members').select('club_id').eq('user_id', userId)
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error }
    }
  },
  async isClubMember(clubId, userId) {
    try {
      const { data, error } = await supabase.from('club_members').select('id').eq('club_id', clubId).eq('user_id', userId).single()
      if (error) { if (error.code === 'PGRST116') return { data: false, error: null }; throw error }
      return { data: true, error: null }
    } catch (error) {
      return { data: false, error }
    }
  },
  async promoteToAdmin(clubId, userId) {
    try {
      const { data, error } = await supabase.from('club_members').update({ role: 'admin' }).eq('club_id', clubId).eq('user_id', userId).select().single()
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
  async demoteToMember(clubId, userId) {
    try {
      const { data, error } = await supabase.from('club_members').update({ role: 'member' }).eq('club_id', clubId).eq('user_id', userId).select().single()
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
}

// ── chatService ──
export const chatService = {
  async createPublicRoom(clubId) {
    try {
      const { data: existing } = await supabase.from('chat_rooms').select('*').eq('club_id', clubId).eq('type', 'public').single()
      if (existing) return { data: existing, error: null }
      const { data, error } = await supabase.from('chat_rooms').insert([{ club_id: clubId, type: 'public', name: '公共频道', participant_ids: [], created_at: new Date().toISOString() }]).select().single()
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
  async createPrivateRoom(clubId, userId1, userId2) {
    try {
      const sorted = [userId1, userId2].sort()
      const { data: existing } = await supabase.from('chat_rooms').select('*').eq('club_id', clubId).eq('type', 'private').contains('participant_ids', sorted).single()
      if (existing) return { data: existing, error: null }
      const { data, error } = await supabase.from('chat_rooms').insert([{ club_id: clubId, type: 'private', name: '私聊', participant_ids: sorted, created_at: new Date().toISOString() }]).select().single()
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
  async getMessages(roomId) {
    try {
      const { data, error } = await supabase.from('chat_messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true })
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error }
    }
  },
  async sendMessage(roomId, userId, content) {
    try {
      const { data, error } = await supabase.from('chat_messages').insert([{ room_id: roomId, sender_id: userId, content, created_at: new Date().toISOString() }]).select().single()
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
  async getClubMessages(clubId) {
    try {
      const { data, error } = await supabase.from('club_messages').select('*').eq('club_id', clubId).order('created_at', { ascending: true })
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error }
    }
  },
  async markMessagesAsRead() {
    return { success: true }
  },
  subscribeToRoom() {
    return { unsubscribe() {} }
  },
}

// ── ratingService ──
export const ratingService = {
  async submitRating(clubId, userId, rating, comment = '') {
    try {
      const { data: existing } = await supabase.from('club_ratings').select('id').eq('club_id', clubId).eq('user_id', userId).single()
      let data, error
      if (existing) {
        ({ data, error } = await supabase.from('club_ratings').update({ rating, comment, updated_at: new Date().toISOString() }).eq('id', existing.id).select().single())
      } else {
        ({ data, error } = await supabase.from('club_ratings').insert([{ club_id: clubId, user_id: userId, rating, comment, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]).select().single())
      }
      if (error) throw error
      await this.updateClubRating(clubId)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
  async updateClubRating(clubId) {
    try {
      const { data } = await supabase.from('club_ratings').select('rating').eq('club_id', clubId)
      if (data && data.length > 0) {
        const avg = data.reduce((s, r) => s + r.rating, 0) / data.length
        await supabase.from('clubs').update({ rating: parseFloat(avg.toFixed(1)), review_count: data.length }).eq('id', clubId)
      }
      return { success: true }
    } catch (error) {
      return { success: false, error }
    }
  },
  async getClubRatings(clubId) {
    try {
      const { data, error } = await supabase.from('club_ratings').select('*').eq('club_id', clubId).order('created_at', { ascending: false })
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error }
    }
  },
  async getUserRating(clubId, userId) {
    try {
      const { data, error } = await supabase.from('club_ratings').select('*').eq('club_id', clubId).eq('user_id', userId).single()
      if (error && error.code === 'PGRST116') return { data: null, error: null }
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
}

// ── notificationService ──
export const notificationService = {
  async getNotifications(userId) {
    try {
      const uid = userId || getUserId()
      const { data, error } = await supabase.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false })
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error }
    }
  },
  async getUnreadCount(userId) {
    try {
      const uid = userId || getUserId()
      const { count, error } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('is_read', false)
      if (error) throw error
      return { count: count || 0, error: null }
    } catch (error) {
      return { count: 0, error }
    }
  },
  async markAsRead(notificationId) {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
      return { success: true }
    } catch { return { success: false } }
  },
  async markAllAsRead(userId) {
    try {
      const uid = userId || getUserId()
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', uid).eq('is_read', false)
      return { success: true }
    } catch { return { success: false } }
  },
  async createNotification(userId, type, content, metadata = {}) {
    try {
      const { data, error } = await supabase.from('notifications').insert([{ user_id: userId, type, content, is_read: false, metadata, created_at: new Date().toISOString() }]).select().single()
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
  async deleteNotification(notificationId) {
    try {
      await supabase.from('notifications').delete().eq('id', notificationId)
      return { success: true }
    } catch { return { success: false } }
  },
  async createApplicationApprovedNotification(userId, clubName) {
    return this.createNotification(userId, 'application_approved', `恭喜！您加入「${clubName}」的申请已通过审核！`, { club_name: clubName })
  },
  async createApplicationRejectedNotification(userId, clubName) {
    return this.createNotification(userId, 'application_rejected', `您加入「${clubName}」的申请未通过审核`, { club_name: clubName })
  },
  async createClubJoinedNotification(userId, clubName) {
    return this.createNotification(userId, 'club_joined', `欢迎加入「${clubName}」！`, { club_name: clubName })
  },
}

// ── reviewService ──
export const reviewService = {
  async getClubReviews(clubId) { return ratingService.getClubRatings(clubId) },
  async submitReview(clubId, userId, rating, comment = '') { return ratingService.submitRating(clubId, userId, rating, comment) },
  async deleteReview() { return { success: true } },
  async getRatingStats(clubId) {
    const { data } = await ratingService.getClubRatings(clubId)
    const ratings = data || []
    const avg = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0
    return { data: { averageRating: parseFloat(avg.toFixed(1)), totalReviews: ratings.length }, error: null }
  },
}

// ── imageService ──
export const imageService = {
  async uploadImage(file, folder = 'uploads') {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`
      const filePath = `${folder}/${fileName}`
      const { data, error } = await supabase.storage.from('images').upload(filePath, file, { upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath)
      return { data: { url: urlData?.publicUrl || '', path: filePath }, error: null }
    } catch (error) {
      // fallback to base64
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve({ data: { url: reader.result, path: `${folder}/${file.name}` }, error: null })
        reader.onerror = () => resolve({ data: null, error: { message: '图片上传失败' } })
        reader.readAsDataURL(file)
      })
    }
  },
  async deleteImage() { return { success: true } },
}

// ── adminManagementService ──
export const adminManagementService = {
  async getClubAdmins(clubId) {
    try {
      const { data, error } = await supabase.from('club_admins').select('*').eq('club_id', clubId).order('role', { ascending: false })
      if (error) throw error
      return { success: true, data: data || [] }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
  async isClubAdmin(clubId, userId) {
    try {
      const { data: adminData } = await supabase.from('club_admins').select('id').eq('club_id', clubId).eq('user_id', userId).single()
      const { data: clubData } = await supabase.from('clubs').select('created_by').eq('id', clubId).single()
      const isAdmin = !!adminData || clubData?.created_by === userId
      return { success: true, isAdmin }
    } catch { return { success: true, isAdmin: false } }
  },
  async isClubCreator(clubId, userId) {
    try {
      const { data } = await supabase.from('clubs').select('created_by').eq('id', clubId).single()
      return { success: true, isCreator: !!(data && data.created_by === userId) }
    } catch { return { success: true, isCreator: false } }
  },
  async appointAdmin(clubId, userId, appointedBy) {
    try {
      const { data: existing } = await supabase.from('club_admins').select('id').eq('club_id', clubId).eq('user_id', userId).single()
      if (!existing) {
        await supabase.from('club_admins').insert([{ club_id: clubId, user_id: userId, role: 'admin', appointed_by: appointedBy, appointed_at: new Date().toISOString() }])
      }
      return { success: true }
    } catch (error) { return { success: false, error: error.message } }
  },
  async revokeAdmin(clubId, userId) {
    try {
      await supabase.from('club_admins').delete().eq('club_id', clubId).eq('user_id', userId).eq('role', 'admin')
      return { success: true }
    } catch (error) { return { success: false, error: error.message } }
  },
  async setClubCreator(clubId, userId) {
    try {
      await supabase.from('clubs').update({ created_by: userId }).eq('id', clubId)
      return { success: true }
    } catch (error) { return { success: false, error: error.message } }
  },
  async updateClub(clubId, updates) {
    try {
      const { data, error } = await supabase.from('clubs').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', clubId).select().single()
      if (error) throw error
      return { success: true, data }
    } catch (error) { return { success: false, error: error.message } }
  },
  async deleteClub(clubId) { return clubService.deleteClub(clubId) },
  async getRealMemberCount(clubId) {
    try {
      const { count, error } = await supabase.from('club_members').select('*', { count: 'exact', head: true }).eq('club_id', clubId)
      if (error) throw error
      return { success: true, count: count || 0 }
    } catch { return { success: true, count: 0 } }
  },
  async getMemberAuditLog(clubId) {
    try {
      const { data, error } = await supabase.from('member_audit_log').select('*').eq('club_id', clubId).order('created_at', { ascending: false })
      if (error) throw error
      return { success: true, data: data || [] }
    } catch { return { success: true, data: [] } }
  },
}

// ── connection and init ──
export const testConnection = async () => {
  try {
    const { error } = await supabase.from('clubs').select('count', { count: 'exact', head: true }).limit(1)
    if (error) return { success: false, error }
    return { success: true, data: {} }
  } catch (error) {
    return { success: false, error }
  }
}

export const initAdminSystem = async () => {
  try {
    await adminService.createAdminUser()
    await adminService.createHelperUser()
    return { success: true }
  } catch (error) {
    return { success: false, error }
  }
}

export const initializeLocalData = async () => {
  // Seed official clubs if none exist
  try {
    const { count } = await supabase.from('clubs').select('*', { count: 'exact', head: true }).eq('is_official', true)
    if (count === 0) {
      const games = [
        { name: '王者荣耀', desc: '官方认证王者荣耀俱乐部！在这里你可以找到志同道合的伙伴一起开黑，享受游戏的乐趣！' },
        { name: '和平精英', desc: '官方认证和平精英俱乐部！一起吃鸡，欢乐派对！' },
        { name: '英雄联盟', desc: '官方认证英雄联盟俱乐部！组队开黑，征战峡谷！' },
        { name: '无畏契约', desc: '官方认证无畏契约俱乐部！战术配合，决胜战场！' },
        { name: '蛋仔派对', desc: '官方认证蛋仔派对俱乐部！可爱蛋仔，欢乐派对！' },
      ]
      for (const game of games) {
        await supabase.from('clubs').insert([{
          name: `${game.name}官方俱乐部`,
          game: game.name,
          description: game.desc,
          contact: '官方客服：12345678',
          price_range: '免费',
          special_services: ['专业陪玩', '组队开黑', '技术指导', '赛事组织'],
          icon_url: `https://picsum.photos/seed/${game.name}/800/400`,
          cover_image_url: `https://picsum.photos/seed/${game.name}/800/400`,
          created_by: 'admin',
          status: 'approved',
          member_count: 1,
          rating: 5,
          review_count: 0,
          is_official: true,
          founded_year: '2026',
          activity_frequency: '每天',
          member_requirement: '热爱游戏即可',
          detailed_description: `欢迎加入${game.name}官方俱乐部！`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]).select().single().then(async ({ data: club }) => {
          if (club) {
            await supabase.from('club_admins').insert([{ club_id: club.id, user_id: 'admin', role: 'creator', appointed_by: 'system', appointed_at: new Date().toISOString() }])
            await memberService.addMember(club.id, HELPER_USER_ID)
          }
        })
      }
    }
  } catch { /* ignore seed errors */ }
}
