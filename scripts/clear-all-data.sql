-- 清除所有注册信息

-- 1. 先删除外键关联数据（按依赖关系顺序删除）
DELETE FROM notifications;
DELETE FROM applications;
DELETE FROM club_members;
DELETE FROM clubs;
DELETE FROM users;

-- 2. 重置序列（如果需要重新开始编号）
ALTER SEQUENCE notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE applications_id_seq RESTART WITH 1;
ALTER SEQUENCE club_members_id_seq RESTART WITH 1;
ALTER SEQUENCE clubs_id_seq RESTART WITH 1;

-- 3. 验证删除结果
SELECT 'notifications' as table_name, COUNT(*) as row_count FROM notifications
UNION ALL
SELECT 'applications', COUNT(*) FROM applications
UNION ALL
SELECT 'club_members', COUNT(*) FROM club_members
UNION ALL
SELECT 'clubs', COUNT(*) FROM clubs
UNION ALL
SELECT 'users', COUNT(*) FROM users;