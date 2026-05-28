import { useState, useMemo, useCallback } from 'react'
import { gameTags } from '../data/clubs'
import { Button, Card, Avatar } from './ui'

const specialServicesList = [
  '排位陪练', '教学指导', '开黑车队', '赛事训练',
  '社交陪伴', '跑图打卡', '副本代打', '角色养成'
]

const initialFormData = {
  name: '',
  game: '',
  description: '',
  detailedDescription: '',
  contact: '',
  memberRequirement: '',
  priceRange: '',
  specialServices: [],
  coverImage: '',
}

export default function CreateClub({ onBack, onSubmit, onSuccess, isAdmin = false, initialData = null }) {
  const [formData, setFormData] = useState(initialData || initialFormData)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [submitError, setSubmitError] = useState('')

  const selectedGame = useMemo(() => {
    return gameTags.find(tag => tag.key === formData.game)
  }, [formData.game])

  const validateForm = useCallback(() => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = '请输入俱乐部名称'
    } else if (formData.name.length < 3) {
      newErrors.name = '俱乐部名称至少3个字符'
    }
    
    if (!formData.game) {
      newErrors.game = '请选择游戏类型'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = '请输入俱乐部简介'
    } else if (formData.description.length < 20) {
      newErrors.description = '简介至少20个字符'
    }
    
    if (!formData.contact.trim()) {
      newErrors.contact = '请输入联系方式'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }, [errors])

  const handleServiceToggle = useCallback((service) => {
    setFormData(prev => {
      const services = [...prev.specialServices]
      const index = services.indexOf(service)
      if (index > -1) {
        services.splice(index, 1)
      } else {
        services.push(service)
      }
      return { ...prev, specialServices: services }
    })
    if (errors.specialServices) {
      setErrors(prev => ({ ...prev, specialServices: null }))
    }
  }, [errors.specialServices])

  const showNotification = useCallback((message) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    setSubmitError('')
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const clubData = {
        ...formData,
        id: Date.now(),
        foundedYear: new Date().getFullYear().toString(),
        memberCount: 0,
        playmateCount: 0,
        rating: 0,
        reviewCount: 0,
        mission: formData.description,
        activityFrequency: '每日活动',
        status: isAdmin ? 'approved' : 'pending',
        icon: formData.coverImage || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=game%20club%20logo%20${encodeURIComponent(formData.game || 'gaming')}&image_size=square`,
        coverImage: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=epic%20gaming%20club%20cover%20${encodeURIComponent(formData.name || 'club')}&image_size=landscape_16_9`,
        createdAt: new Date().toISOString(),
      }
      
      if (onSubmit) {
        const result = await onSubmit(clubData)
        
        if (result && result.error) {
          throw new Error(result.error.message || '创建失败')
        }
      }
      
      showNotification(isAdmin ? '俱乐部创建成功！' : '俱乐部创建成功！请等待管理员审核。')
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        }
      }, 1000)
      
      setFormData(initialFormData)
    } catch (error) {
      console.error('创建俱乐部失败:', error)
      const errorMessage = error.message || '创建失败，请重试'
      if (errorMessage.includes('数据库') || errorMessage.includes('连接')) {
        setSubmitError(errorMessage)
      }
      showNotification(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [validateForm, formData, isAdmin, onSubmit, onSuccess, showNotification])

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-b from-dark-300 to-dark-200 pb-24">
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-primary-700 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 w-12 h-12 border-4 border-primary-700/30 border-t-transparent rounded-full animate-spin" style={{ animationDelay: '0.2s' }} />
            </div>
            <span className="text-white font-medium">提交中...</span>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[99] animate-fade-in">
          <div className="bg-green-500/90 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 13l4 4L19 7" />
            </svg>
            {toastMessage}
          </div>
        </div>
      )}

      <div className="sticky top-0 z-50 bg-dark-300/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            返回
          </button>
          
          <h1 className="text-2xl font-bold text-white">
            {initialData ? '编辑俱乐部' : '创建俱乐部'}
          </h1>
          {!isAdmin && (
            <p className="text-sm text-gray-400 mt-1">
              创建后将进入审核队列，审核通过后自动上架
            </p>
          )}
        </div>
      </div>

      {submitError && (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
            <span className="text-red-400">{submitError}</span>
            <button 
              onClick={() => setSubmitError('')}
              className="ml-auto text-gray-400 hover:text-white"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-white mb-4">基本信息</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">俱乐部名称 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="请输入俱乐部名称"
                className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary-700 transition-colors ${errors.name ? 'border-red-500' : 'border-white/10'}`}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">游戏类型 *</label>
              <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-8 gap-2">
                {gameTags.map((tag) => (
                  <button
                    key={tag.key}
                    type="button"
                    onClick={() => handleInputChange('game', tag.key)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.game === tag.key
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-base">{tag.icon}</span>
                  </button>
                ))}
              </div>
              {errors.game && <p className="text-red-500 text-sm mt-1">{errors.game}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">俱乐部简介 *</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="请描述你的俱乐部（至少20个字符）"
                rows={3}
                className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary-700 transition-colors resize-none ${errors.description ? 'border-red-500' : 'border-white/10'}`}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">联系方式 *</label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => handleInputChange('contact', e.target.value)}
                placeholder="QQ群号、微信群二维码链接等"
                className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary-700 transition-colors ${errors.contact ? 'border-red-500' : 'border-white/10'}`}
              />
              {errors.contact && <p className="text-red-500 text-sm mt-1">{errors.contact}</p>}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-white mb-4">服务设置</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">价格区间</label>
              <select
                value={formData.priceRange}
                onChange={(e) => handleInputChange('priceRange', e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-700 transition-colors"
              >
                <option value="">请选择价格区间</option>
                <option value="免费">免费</option>
                <option value="50元以下">50元以下</option>
                <option value="50-100元">50-100元</option>
                <option value="100-200元">100-200元</option>
                <option value="200元以上">200元以上</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">特色服务</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {specialServicesList.map((service) => (
                  <button
                    key={service}
                    type="button"
                    onClick={() => handleServiceToggle(service)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.specialServices.includes(service)
                        ? 'bg-primary-700 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {service}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">预览效果</h2>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-sm text-primary-700 hover:text-primary-500 transition-colors"
            >
              {showPreview ? '隐藏预览' : '显示预览'}
            </button>
          </div>
          
          {showPreview && (
            <div className="mt-4 p-4 bg-white/5 rounded-xl">
              <div className="flex gap-4">
                <Avatar size="md" name={formData.name} className="w-16 h-16" />
                <div className="flex-1">
                  <h3 className="text-white font-bold">{formData.name || '俱乐部名称'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-primary-700 text-sm">
                      {selectedGame?.icon} {selectedGame?.name || '游戏类型'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                    {formData.description || '俱乐部简介'}
                  </p>
                </div>
              </div>
              
              {formData.specialServices.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {formData.specialServices.map((service) => (
                    <span key={service} className="px-2 py-1 bg-primary-700/20 text-primary-700 text-xs rounded-full">
                      {service}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-white/10 transition-colors"
          >
            取消
          </button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                提交中...
              </span>
            ) : (
              '创建俱乐部'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}