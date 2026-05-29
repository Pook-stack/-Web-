-- ============================================
-- 🔍 快速权限诊断和一键修复脚本
-- ============================================

-- ========== 第一部分：诊断当前状态 ==========
-- 执行这个部分查看当前问题

-- 1. 检查clubs表结构
SELECT 
    '检查clubs表结构' as 检查项,
    column_name as 列名,
    data_type as 数据类型
FROM information_schema.columns
WHERE table_name = 'clubs'
ORDER BY ordinal_position;

-- 2. 查看所有俱乐部及其创建者信息
SELECT 
    c.id,
    c.name,
    c.game,
    c.created_by,
    c.status,
    c.created_at
FROM clubs c
ORDER BY c.created_at DESC;

-- 3. 查看club_admins表中的管理员记录
SELECT 
    ca.club_id,
    c.name as 俱乐部名,
    ca.user_id,
    ca.role,
    ca.appointed_by,
    ca.appointed_at
FROM club_admins ca
LEFT JOIN clubs c ON ca.club_id = c.id
ORDER BY ca.club_id, ca.role;

-- 4. 查找没有创建者记录的俱乐部
SELECT 
    c.id,
    c.name,
    '缺少created_by字段或club_admins记录' as 问题
FROM clubs c
LEFT JOIN club_admins ca ON c.id = ca.club_id AND ca.role = 'creator'
WHERE c.created_by IS NULL OR ca.id IS NULL;

-- ========== 第二部分：一键修复 ==========
-- 执行这个部分自动修复问题

-- 修复1：为所有俱乐部设置默认创建者（如果还没有）
UPDATE clubs 
SET created_by = COALESCE(created_by, 'test_user_001')
WHERE created_by IS NULL;

-- 修复2：为官方俱乐部添加creator记录
INSERT INTO club_admins (club_id, user_id, role, appointed_by, appointed_at)
SELECT id, created_by, 'creator', 'system', NOW()
FROM clubs
WHERE is_official = true
ON CONFLICT (club_id, user_id) DO NOTHING;

-- 修复3：为所有有created_by但缺少管理员记录的俱乐部添加创建者权限
INSERT INTO club_admins (club_id, user_id, role, appointed_by, appointed_at)
SELECT 
    c.id,
    c.created_by,
    'creator',
    'system',
    NOW()
FROM clubs c
WHERE c.created_by IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM club_admins 
    WHERE club_id = c.id 
    AND user_id = c.created_by
    AND role = 'creator'
);

-- ========== 第三部分：验证修复结果 ==========
-- 执行这个部分确认修复成功

SELECT '修复后的俱乐部权限状态' as 报告;

SELECT 
    c.id,
    c.name,
    c.created_by,
    CASE 
        WHEN c.created_by IS NOT NULL THEN '✅'
        ELSE '❌'
    END as 有创建者记录,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM club_admins 
            WHERE club_id = c.id 
            AND user_id = c.created_by 
            AND role = 'creator'
        ) THEN '✅'
        ELSE '❌'
    END as 有管理员记录,
    CASE 
        WHEN c.created_by IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM club_admins 
            WHERE club_id = c.id 
            AND user_id = c.created_by 
            AND role = 'creator'
        ) THEN '✅ 正常'
        ELSE '❌ 需要修复'
    END as 权限状态
FROM clubs c
ORDER BY c.id;

-- ============================================
-- 使用说明：
-- 1. 先执行第一部分查看问题
-- 2. 再执行第二部分进行修复
-- 3. 最后执行第三部分验证结果
-- 4. 执行完成后，刷新网页检查权限
-- ============================================
