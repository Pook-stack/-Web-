-- ============================================
-- 关闭邮箱验证：自动确认所有用户
-- 请在 Supabase SQL Editor 中执行
-- ============================================

-- 1. 确认所有已存在的用户（confirmed_at 是生成列，不能手动更新）
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 2. 创建触发器：新用户注册时自动确认邮箱
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 删除旧触发器（如果存在），创建新的
DROP TRIGGER IF EXISTS auto_confirm_email_trigger ON auth.users;
CREATE TRIGGER auto_confirm_email_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_email();

-- 4. 验证
SELECT '✅ 邮箱验证已关闭！' as 状态;

SELECT
  '新触发器' as 检查项,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'auto_confirm_email_trigger'
  ) THEN '✅' ELSE '❌' END as 结果;

SELECT
  '未确认用户数' as 检查项,
  COUNT(*)::text as 结果
FROM auth.users
WHERE email_confirmed_at IS NULL;
