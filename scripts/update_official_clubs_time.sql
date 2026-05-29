-- ============================================
-- 设置官方俱乐部成立时间
-- 网站开发时间: 2026-05-28
-- ============================================

-- 更新官方俱乐部的创建时间
UPDATE clubs 
SET created_at = '2026-05-28 08:00:00+00:00'
WHERE is_official = true;

-- 验证更新结果
SELECT 
    id, 
    name, 
    is_official, 
    created_at,
    CASE 
        WHEN is_official = true THEN '✅ 官方俱乐部'
        ELSE '普通俱乐部'
    END as 类型
FROM clubs 
WHERE is_official = true
ORDER BY id;
