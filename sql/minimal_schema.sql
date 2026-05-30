-- =====================================================
-- 简化版数据库结构（用于测试）
-- =====================================================

-- 创建基础表
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.clubs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    game_type TEXT,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_by TEXT,
    member_count INTEGER DEFAULT 0,
    rating NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.club_members (
    id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.club_admins (
    id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.club_applications (
    id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    base_nickname TEXT;
BEGIN
    base_nickname := COALESCE(
        SPLIT_PART(NEW.email, '@', 1),
        'user_' || SUBSTR(NEW.id::TEXT, 1, 8)
    );
    
    INSERT INTO public.profiles (user_id, nickname, avatar_url, created_at, updated_at)
    VALUES (NEW.id, base_nickname, NULL, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET nickname = base_nickname, updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 添加触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- RLS 策略 - profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid()::TEXT = user_id::TEXT);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid()::TEXT = user_id::TEXT)
    WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
CREATE POLICY "Enable insert for authenticated users" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

-- RLS 策略 - clubs
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved clubs" ON public.clubs;
CREATE POLICY "Anyone can view approved clubs" ON public.clubs
    FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Authenticated users can create clubs" ON public.clubs;
CREATE POLICY "Authenticated users can create clubs" ON public.clubs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Owners can update clubs" ON public.clubs;
CREATE POLICY "Owners can update clubs" ON public.clubs
    FOR UPDATE USING (auth.uid()::TEXT = COALESCE(created_by, '')::TEXT);

-- RLS 策略 - club_members
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view own membership" ON public.club_members;
CREATE POLICY "Members can view own membership" ON public.club_members
    FOR SELECT USING (auth.uid()::TEXT = user_id::TEXT);

DROP POLICY IF EXISTS "Users can add themselves as members" ON public.club_members;
CREATE POLICY "Users can add themselves as members" ON public.club_members
    FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

-- 权限授予
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

GRANT SELECT, UPDATE, INSERT ON public.profiles TO authenticated;
GRANT SELECT ON public.clubs TO authenticated, anon;
GRANT INSERT, UPDATE ON public.clubs TO authenticated;
GRANT SELECT, INSERT ON public.club_members TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.club_admins TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.club_applications TO authenticated;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon;

SELECT 'Minimal schema setup completed successfully!' as status;
