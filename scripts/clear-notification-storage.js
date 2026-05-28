// 清理通知相关的本地存储数据
console.log('=== 清理通知模拟数据 ===');

// 清除通知相关的本地存储键
const notificationKeys = [
  'club_notifications_read',
  'club_notifications_dismissed',
  'notifications',
  'readNotifications'
];

notificationKeys.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    console.log(`已清除: ${key}`);
  } else {
    console.log(`跳过(不存在): ${key}`);
  }
});

console.log('=== 清理完成 ===');
console.log('请刷新页面验证通知系统状态。');