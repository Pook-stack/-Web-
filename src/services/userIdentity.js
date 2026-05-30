// 设备身份模块 — 基于 localStorage 的持久化用户身份
// 无需登录，首次访问自动创建身份，浏览器记住用户数据

const DEVICE_ID_KEY = 'cc_device_id'
const PROFILE_KEY = 'cc_profile'

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export function getOrCreateDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = generateUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

export function getUserId() {
  return getOrCreateDeviceId()
}

export function getLocalProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

export function initUserProfile() {
  const existing = getLocalProfile()
  if (existing) return existing

  const profile = {
    id: getUserId(),
    nickname: '玩家',
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  return profile
}

export function updateLocalProfile(updates) {
  const current = getLocalProfile() || initUserProfile()
  const updated = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString(),
  }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(updated))
  return updated
}
