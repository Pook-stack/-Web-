import { supabase } from '../supabase'
import { clubsData } from '../data/clubs'

export const clubService = {
  async getAllClubs() {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  async getClubById(id) {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', id)
      .single()
    
    return { data, error }
  },

  async createClub(clubData) {
    const { data, error } = await supabase
      .from('clubs')
      .insert([{
        name: clubData.name,
        game: clubData.game,
        description: clubData.description,
        detailed_description: clubData.detailedDescription,
        contact: clubData.contact,
        member_requirement: clubData.memberRequirement,
        price_range: clubData.priceRange,
        special_services: clubData.specialServices,
        icon_url: clubData.icon,
        cover_image_url: clubData.coverImage,
        founded_year: clubData.foundedYear,
        member_count: 0,
        playmate_count: 0,
        rating: 0,
        review_count: 0,
        mission: clubData.description,
        activity_frequency: '每日活动',
        status: clubData.status || 'pending',
      }])
      .select()
    
    return { data, error }
  },

  async updateClub(id, clubData) {
    const { data, error } = await supabase
      .from('clubs')
      .update(clubData)
      .eq('id', id)
      .select()
    
    return { data, error }
  },

  async deleteClub(id) {
    const { data, error } = await supabase
      .from('clubs')
      .delete()
      .eq('id', id)
    
    return { data, error }
  },

  async searchClubs(query) {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('status', 'approved')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,game.ilike.%${query}%`)
    
    return { data, error }
  },

  async getClubsByGame(game) {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('status', 'approved')
      .eq('game', game)
    
    return { data, error }
  },

  async getPendingClubs() {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('status', 'pending')
    
    return { data, error }
  },

  async approveClub(id) {
    const { data, error } = await supabase
      .from('clubs')
      .update({ status: 'approved' })
      .eq('id', id)
      .select()
    
    return { data, error }
  },

  async rejectClub(id) {
    const { data, error } = await supabase
      .from('clubs')
      .update({ status: 'rejected' })
      .eq('id', id)
      .select()
    
    return { data, error }
  },
}

export const applicationService = {
  async applyToClub(clubId) {
    const userId = 1
    const { data, error } = await supabase
      .from('applications')
      .insert([{ club_id: clubId, user_id: userId }])
      .select()
    
    return { data, error }
  },

  async getUserApplications() {
    const userId = 1
    const { data, error } = await supabase
      .from('applications')
      .select('*, clubs(*)')
      .eq('user_id', userId)
      .order('applied_at', { ascending: false })
    
    return { data, error }
  },

  async processApplication(applicationId, status) {
    const { data, error } = await supabase
      .from('applications')
      .update({ status, processed_at: new Date().toISOString() })
      .eq('id', applicationId)
      .select()
    
    return { data, error }
  },
}

export const memberService = {
  async getClubMembers(clubId) {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('club_id', clubId)
    
    return { data, error }
  },

  async addMember(clubId, memberData) {
    const { data, error } = await supabase
      .from('members')
      .insert([{ club_id: clubId, ...memberData }])
      .select()
    
    return { data, error }
  },
}

export const reviewService = {
  async getClubReviews(clubId) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, users(nickname, avatar_url)')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  async createReview(clubId, rating, comment) {
    const userId = 1
    const { data, error } = await supabase
      .from('reviews')
      .insert([{ club_id: clubId, user_id: userId, rating, comment }])
      .select()
    
    return { data, error }
  },
}

export const initializeDatabase = async () => {
  try {
    console.log('开始初始化数据库...')
    
    for (const club of clubsData) {
      const { data, error } = await supabase
        .from('clubs')
        .select('id')
        .eq('name', club.name)
        .single()
      
      if (!data) {
        await supabase.from('clubs').insert([{
          name: club.name,
          game: club.game,
          description: club.description,
          detailed_description: club.detailedDescription || '',
          contact: club.contact || '',
          member_requirement: club.memberRequirement || '',
          price_range: club.priceRange || '',
          special_services: club.specialServices || [],
          icon_url: club.icon,
          cover_image_url: club.coverImage || club.icon,
          founded_year: club.foundedYear,
          member_count: club.memberCount,
          playmate_count: club.playmateCount,
          rating: club.rating,
          review_count: club.reviewCount,
          mission: club.mission,
          activity_frequency: club.activityFrequency,
          status: club.status || 'approved',
        }])
        console.log(`✅ 导入俱乐部: ${club.name}`)
      } else {
        console.log(`⏭️ 跳过已存在的俱乐部: ${club.name}`)
      }
    }
    
    console.log('🎉 数据库初始化完成！')
    return { success: true }
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    return { success: false, error }
  }
}

export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('clubs').select('count').limit(1)
    
    if (error) {
      console.error('❌ 连接失败:', error)
      return { success: false, error }
    }
    
    console.log('✅ Supabase连接成功！')
    return { success: true, data }
  } catch (error) {
    console.error('❌ 连接异常:', error)
    return { success: false, error }
  }
}
