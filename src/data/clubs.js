export const gameTags = [
  { key: '全部', name: '全部', icon: '🎮' },
  { key: '王者荣耀', name: '王者荣耀', icon: '⚔️' },
  { key: '光遇', name: '光遇', icon: '☁️' },
  { key: '和平精英', name: '和平精英', icon: '🔫' },
  { key: '英雄联盟', name: '英雄联盟', icon: '🛡️' },
  { key: '原神', name: '原神', icon: '✨' },
  { key: 'Dota2', name: 'Dota2', icon: '⚡' },
  { key: '无畏契约', name: '无畏契约', icon: '💜' },
  { key: '崩坏：星穹铁道', name: '崩坏：星穹铁道', icon: '🚂' },
  { key: 'CS2', name: 'CS2', icon: '🎯' },
  // 新增游戏分类（2026-05-28）
  { key: '蛋仔派对', name: '蛋仔派对', icon: '🥚' },
  { key: '我的世界', name: '我的世界', icon: '🏠' },
  { key: '第五人格', name: '第五人格', icon: '🎭' },
  { key: '金铲铲之战', name: '金铲铲之战', icon: '🔶' },
  { key: '永劫无间', name: '永劫无间', icon: '⚔️' },
]

export const getGameTagByKey = (key) => {
  return gameTags.find(tag => tag.key === key) || gameTags[0]
}

export default gameTags
