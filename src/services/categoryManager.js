// 游戏分类管理工具
// 用于备份、恢复和管理游戏分类配置

import { gameTags } from '../data/clubs';

// 备份当前分类配置
export const backupGameCategories = () => {
  const backup = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    categories: [...gameTags],
    total: gameTags.length
  };

  // 保存到 localStorage
  const backups = JSON.parse(localStorage.getItem('gameCategoryBackups') || '[]');
  backups.unshift(backup);
  
  // 只保留最近10个备份
  if (backups.length > 10) {
    backups.pop();
  }
  
  localStorage.setItem('gameCategoryBackups', JSON.stringify(backups));
  
  return backup;
};

// 获取所有备份
export const getBackups = () => {
  return JSON.parse(localStorage.getItem('gameCategoryBackups') || '[]');
};

// 恢复指定备份
export const restoreBackup = (backupData) => {
  if (!backupData || !Array.isArray(backupData.categories)) {
    throw new Error('无效的备份数据');
  }

  // 创建新的备份（当前状态）
  backupGameCategories();

  return backupData.categories;
};

// 导出备份为文件
export const exportBackupToFile = () => {
  const backup = backupGameCategories();
  const dataStr = JSON.stringify(backup, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `game-categories-backup-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

// 从文件导入备份
export const importBackupFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        
        if (!backup.categories || !Array.isArray(backup.categories)) {
          throw new Error('无效的备份文件格式');
        }

        // 验证数据
        const isValid = backup.categories.every(cat => 
          cat.key && cat.name && cat.icon
        );

        if (!isValid) {
          throw new Error('备份数据格式不正确');
        }

        resolve(backup);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsText(file);
  });
};

// 添加新分类
export const addCategory = (category) => {
  if (!category.key || !category.name || !category.icon) {
    throw new Error('分类信息不完整');
  }

  if (gameTags.some(tag => tag.key === category.key)) {
    throw new Error('该分类已存在');
  }

  // 备份当前配置
  backupGameCategories();

  // 添加新分类
  const newTags = [...gameTags, category];
  
  return newTags;
};

// 删除分类
export const deleteCategory = (key) => {
  if (key === '全部') {
    throw new Error('不能删除"全部"分类');
  }

  const categoryIndex = gameTags.findIndex(tag => tag.key === key);
  
  if (categoryIndex === -1) {
    throw new Error('分类不存在');
  }

  // 备份当前配置
  backupGameCategories();

  // 删除分类
  const newTags = gameTags.filter(tag => tag.key !== key);
  
  return newTags;
};

// 获取分类统计
export const getCategoryStats = () => {
  return {
    total: gameTags.length,
    categories: gameTags.map(cat => ({
      ...cat,
      isNew: cat.addedDate ? new Date(cat.addedDate) > new Date('2026-05-28') : false
    }))
  };
};

export default {
  backupGameCategories,
  getBackups,
  restoreBackup,
  exportBackupToFile,
  importBackupFromFile,
  addCategory,
  deleteCategory,
  getCategoryStats
};
