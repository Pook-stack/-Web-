import { supabase } from '../supabase'
import { notificationService } from './notificationService'

const ADMIN_USER_ID = 'admin'
const HELPER_USER_ID = 'helper'

export const adminService = {
  async getUserById(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching user:', error)
      return { data: null, error }
    }
  },

  async createAdminUser() {
    try {
      const { data: existing } = await this.getUserById(ADMIN_USER_ID)
      if (existing) return { data: existing, error: null }

      const { data, error } = await supabase
        .from('users')
        .insert([{
          id: ADMIN_USER_ID,
          username: '管理员',
          role: 'admin',
          status: 'active'
        }])
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating admin user:', error)
      return { data: null, error }
    }
  },

  async createHelperUser() {
    try {
      const { data: existing } = await this.getUserById(HELPER_USER_ID)
      if (existing) return { data: existing, error: null }

      const { data, error } = await supabase
        .from('users')
        .insert([{
          id: HELPER_USER_ID,
          username: '小助手',
          role: 'helper',
          status: 'active'
        }])
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating helper user:', error)
      return { data: null, error }
    }
  },

  async banUser(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ status: 'banned', banned_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error banning user:', error)
      return { data: null, error }
    }
  },

  async unbanUser(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ status: 'active', banned_at: null })
        .eq('id', userId)
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error unbanning user:', error)
      return { data: null, error }
    }
  },

  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error fetching users:', error)
      return { data: [], error }
    }
  },

  async getBannedUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('status', 'banned')
        .order('banned_at', { ascending: false })
      
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error fetching banned users:', error)
      return { data: [], error }
    }
  },
}

export const memberService = {
  async addMember(clubId, userId) {
    try {
      const { data: existing } = await supabase
        .from('club_members')
        .select('id')
        .eq('club_id', clubId)
        .eq('user_id', userId)
        .single()
      
      if (existing) {
        return { data: existing, error: { message: '用户已在俱乐部中' }, alreadyMember: true }
      }

      const { data, error } = await supabase
        .from('club_members')
        .insert([{
          club_id: clubId,
          user_id: userId,
          role: 'member',
          joined_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) throw error
      
      await clubService.incrementMemberCount(clubId)

      const { data: club } = await clubService.getClubById(clubId)
      if (club) {
        await notificationService.createClubJoinedNotification(userId, club.name)
      }

      await supabase.from('member_audit_log').insert([{
        club_id: clubId,
        user_id: userId,
        action: 'join',
        actor_id: userId,
        details: JSON.stringify({ role: 'member', joined_at: new Date().toISOString() }),
        created_at: new Date().toISOString()
      }])
      
      return { data, error: null }
    } catch (error) {
      console.error('Error adding member:', error)
      return { data: null, error }
    }
  },

  async removeMember(clubId, userId, actorId = userId) {
    try {
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', userId)
      
      if (error) throw error

      await clubService.decrementMemberCount(clubId)

      await supabase.from('member_audit_log').insert([{
        club_id: clubId,
        user_id: userId,
        action: actorId === userId ? 'leave' : 'kick',
        actor_id: actorId,
        details: JSON.stringify({ left_at: new Date().toISOString() }),
        created_at: new Date().toISOString()
      }])

      return { success: true, error: null }
    } catch (error) {
      console.error('Error removing member:', error)
      return { success: false, error }
    }
  },

  async getClubMembers(clubId) {
    try {
      const { data, error } = await supabase
        .from('club_members')
        .select('*')
        .eq('club_id', clubId)
        .order('joined_at', { ascending: false })
      
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error fetching club members:', error)
      return { data: [], error }
    }
  },

  async getMemberClubsByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('club_members')
        .select('club_id')
        .eq('user_id', userId)
      
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error fetching member clubs:', error)
      return { data: [], error }
    }
  },

  async promoteToAdmin(clubId, userId) {
    try {
      const { data, error } = await supabase
        .from('club_members')
        .update({ role: 'admin' })
        .eq('club_id', clubId)
        .eq('user_id', userId)
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error promoting member:', error)
      return { data: null, error }
    }
  },

  async demoteToMember(clubId, userId) {
    try {
      const { data, error } = await supabase
        .from('club_members')
        .update({ role: 'member' })
        .eq('club_id', clubId)
        .eq('user_id', userId)
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error demoting member:', error)
      return { data: null, error }
    }
  },
}

export const clubService = {
  async getAllClubs() {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error fetching clubs:', error)
      return { data: [], error }
    }
  },

  async getClubById(id) {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching club:', error)
      return { data: null, error }
    }
  },

  async createClub(clubData, creatorUserId = 'test_user_001') {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .insert([{
          name: clubData.name,
          game: clubData.game,
          description: clubData.description || '',
          contact: clubData.contact || '',
          price_range: clubData.priceRange || '',
          special_services: clubData.specialServices || [],
          icon_url: clubData.icon || '',
          created_by: creatorUserId,
          status: 'pending',
          member_count: 1,
          rating: 0,
          review_count: 0,
        }])
        .select()
        .single()
      
      if (error) throw error

      await supabase
        .from('club_admins')
        .insert([{
          club_id: data.id,
          user_id: creatorUserId,
          role: 'creator',
          appointed_by: 'system',
          appointed_at: new Date().toISOString()
        }])

      await adminService.createHelperUser()
      
      await memberService.addMember(data.id, HELPER_USER_ID)
      
      console.log(`✅ 俱乐部创建成功: ${data.name}, 创建者: ${creatorUserId}`)
      
      return { data, error: null }
    } catch (error) {
      console.error('Error creating club:', error)
      return { data: null, error }
    }
  },

  async getPendingClubs() {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error fetching pending clubs:', error)
      return { data: [], error }
    }
  },

  async approveClub(id) {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error approving club:', error)
      return { data: null, error }
    }
  },

  async rejectClub(id) {
    try {
      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { success: true, error: null }
    } catch (error) {
      console.error('Error rejecting club:', error)
      return { success: false, error }
    }
  },

  async deleteClub(id) {
    try {
      await supabase.from('member_audit_log').delete().eq('club_id', id)
      await supabase.from('applications').delete().eq('club_id', id)
      await supabase.from('club_members').delete().eq('club_id', id)
      await supabase.from('club_admins').delete().eq('club_id', id)
      await supabase.from('reviews').delete().eq('club_id', id)
      
      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { success: true, deletedClubId: id, error: null }
    } catch (error) {
      console.error('Error deleting club:', error)
      return { success: false, error: error.message }
    }
  },

  async searchClubs(query) {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('status', 'approved')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error searching clubs:', error)
      return { data: [], error }
    }
  },

  async incrementMemberCount(id) {
    try {
      const { data: club, error: fetchError } = await this.getClubById(id)
      if (fetchError) throw fetchError
      
      const { data, error } = await supabase
        .from('clubs')
        .update({ member_count: (club.member_count || 0) + 1 })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error incrementing member count:', error)
      return { data: null, error }
    }
  },

  async decrementMemberCount(id) {
    try {
      const { data: club, error: fetchError } = await this.getClubById(id)
      if (fetchError) throw fetchError
      
      const { data, error } = await supabase
        .from('clubs')
        .update({ member_count: Math.max(0, (club.member_count || 0) - 1) })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error decrementing member count:', error)
      return { data: null, error }
    }
  },
}

export const applicationService = {
  async applyToClub(clubId, userId = 'anonymous') {
    try {
      const { data: existing } = await supabase
        .from('applications')
        .select('id')
        .eq('club_id', clubId)
        .eq('user_id', userId)
        .single()
      
      if (existing) {
        return { data: existing, error: { message: '已经申请过该俱乐部' }, alreadyApplied: true }
      }

      const { data, error } = await supabase
        .from('applications')
        .insert([{ 
          club_id: clubId, 
          user_id: userId,
          status: 'pending'
        }])
        .select()
        .single()
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      console.error('Error applying to club:', error)
      return { data: null, error }
    }
  },

  async getUserApplications(userId = 'anonymous') {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*, clubs(*)')
        .eq('user_id', userId)
        .order('applied_at', { ascending: false })
      
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error fetching applications:', error)
      return { data: [], error }
    }
  },

  async processApplication(applicationId, status) {
    try {
      const { data: existingApp, error: fetchError } = await supabase
        .from('applications')
        .select('*, clubs(*)')
        .eq('id', applicationId)
        .single()
      
      if (fetchError) throw fetchError

      const { data, error } = await supabase
        .from('applications')
        .update({ 
          status,
          processed_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select()
        .single()
      
      if (error) throw error

      if (existingApp.clubs) {
        const clubName = existingApp.clubs.name
        const userId = existingApp.user_id
        const clubId = existingApp.club_id
        
        if (status === 'approved') {
          await notificationService.createApplicationApprovedNotification(userId, clubName)
          
          await supabase
            .from('club_members')
            .upsert({
              club_id: clubId,
              user_id: userId,
              role: 'member',
              joined_at: new Date().toISOString()
            })
            .select()
        } else if (status === 'rejected') {
          await notificationService.createApplicationRejectedNotification(userId, clubName)
        }
      }
      
      return { data, error: null }
    } catch (error) {
      console.error('Error processing application:', error)
      return { data: null, error }
    }
  },

  async checkAppliedStatus(clubId, userId = 'anonymous') {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('id')
        .eq('club_id', clubId)
        .eq('user_id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return { isApplied: !!data, error: null }
    } catch (error) {
      console.error('Error checking application status:', error)
      return { isApplied: false, error }
    }
  },

  async getPendingApplications() {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*, clubs(*)')
        .eq('status', 'pending')
        .order('applied_at', { ascending: false })
      
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error fetching pending applications:', error)
      return { data: [], error }
    }
  },

  async getApplicationsByClub(clubId) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*, clubs(*)')
        .eq('club_id', clubId)
        .order('applied_at', { ascending: false })
      
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error fetching applications by club:', error)
      return { data: [], error }
    }
  },
}

export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('clubs')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection error:', error)
      return { success: false, error }
    }
    
    console.log('✅ Supabase连接成功！')
    return { success: true, data }
  } catch (error) {
    console.error('Supabase连接失败:', error)
    return { success: false, error }
  }
}

export const initAdminSystem = async () => {
  try {
    await adminService.createAdminUser()
    await adminService.createHelperUser()
    console.log('✅ 管理员系统初始化完成')
    return { success: true }
  } catch (error) {
    console.error('Error initializing admin system:', error)
    return { success: false, error }
  }
}
