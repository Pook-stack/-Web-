-- ============================================
-- 权限系统修复脚本
-- 解决俱乐部创建者无法管理自己俱乐部的问题
-- ============================================

-- 1. 在clubs表中添加created_by字段
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clubs' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE clubs ADD COLUMN created_by TEXT;
        COMMENT ON COLUMN clubs.created_by IS '俱乐部创建者的用户ID';
    END IF;
END $$;

-- 2. 为现有官方俱乐部添加创建者信息
UPDATE clubs SET created_by = 'admin' WHERE is_official = true;

-- 3. 为官方俱乐部创建管理员记录
INSERT INTO club_admins (club_id, user_id, role, appointed_by, appointed_at)
SELECT id, created_by, 'creator', 'system', NOW()
FROM clubs
WHERE is_official = true
ON CONFLICT (club_id, user_id) DO NOTHING;

-- 4. 验证修复结果
SELECT 
    c.id,
    c.name,
    c.created_by,
    ca.user_id as admin_user,
    ca.role
FROM clubs c
LEFT JOIN club_admins ca ON c.id = ca.club_id
WHERE is_official = true
ORDER BY c.id;

-- ============================================
-- 使用说明：
-- 1. 在Supabase SQL Editor中执行此脚本
-- 2. 执行后，刷新页面检查权限
-- 3. 如还有问题，继续执行下面的诊断查询
-- ============================================
