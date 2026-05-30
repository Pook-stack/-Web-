-- 修复 profiles 表的行级安全策略
-- 允许用户创建、读取、更新自己的 profile

-- 首先确保 RLS 已启用
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的冲突策略和触发器
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
DROP TRIGGER IF EXISTS create_profile_on_user_signup ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 创建自动创建 profile 的函数
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nickname, avatar_url, created_at, updated_at)
  VALUES (NEW.id, NEW.email::TEXT, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：当新用户注册时自动创建 profile
CREATE TRIGGER create_profile_on_user_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 创建 SELECT 策略：用户只能查看自己的 profile
CREATE POLICY "Users can view their own profile" 
ON profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 创建 INSERT 策略：允许已认证用户创建自己的 profile
-- 使用 auth.jwt() ->> 'sub' 获取 JWT 中的用户 ID
CREATE POLICY "Users can create their own profile" 
ON profiles 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'sub' = user_id::text);

-- 创建 UPDATE 策略：用户只能更新自己的 profile
CREATE POLICY "Users can update their own profile" 
ON profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 创建 DELETE 策略：用户只能删除自己的 profile
CREATE POLICY "Users can delete their own profile" 
ON profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- 确保 roles 有正确的权限
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

-- 授予触发器函数执行权限
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;