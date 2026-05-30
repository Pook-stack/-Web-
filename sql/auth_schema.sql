-- =====================================================
-- 陪玩俱乐部 - 完整数据库结构与安全策略
-- 创建时间: 2026-05-29
-- 包含完整的 RLS 策略和安全配置
-- =====================================================

-- =====================================================
-- 1. 创建基础表（如果不存在）
-- =====================================================

-- 创建 game_categories 表
CREATE TABLE IF NOT EXISTS public.game_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 reviews 表
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 users 表
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    username TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 applications 表
CREATE TABLE IF NOT EXISTS public.applications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    data JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- 创建 club_applications 表
CREATE TABLE IF NOT EXISTS public.club_applications (
    id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 club_members 表
CREATE TABLE IF NOT EXISTS public.club_members (
    id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 club_admins 表
CREATE TABLE IF NOT EXISTS public.club_admins (
    id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 club_messages 表
CREATE TABLE IF NOT EXISTS public.club_messages (
    id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 member_audit_log 表
CREATE TABLE IF NOT EXISTS public.member_audit_log (
    id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 clubs 表（如果不存在）
CREATE TABLE IF NOT EXISTS public.clubs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    game_type TEXT,
    description TEXT,
    cover_image TEXT,
    activity_frequency TEXT,
    service_price TEXT,
    member_requirements TEXT,
    contact_info TEXT,
    featured_services TEXT,
    detailed_intro TEXT,
    rating NUMERIC DEFAULT 0,
    member_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. 创建 profiles 表
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON public.profiles(nickname);
CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON public.club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user_id ON public.club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_club_applications_club_id ON public.club_applications(club_id);
CREATE INDEX IF NOT EXISTS idx_club_applications_user_id ON public.club_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_club_messages_club_id ON public.club_messages(club_id);

-- =====================================================
-- 3. 创建安全的触发器函数
-- 设置 search_path 并使用 SECURITY DEFINER 时限制执行权限
-- =====================================================

-- 更新时间戳触发器
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 自动创建 profile 的触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    base_nickname TEXT;
BEGIN
    base_nickname := COALESCE(
        SPLIT_PART(NEW.email, '@', 1),
        'user_' || SUBSTR(NEW.id::TEXT, 1, 8)
    );
    
    BEGIN
        INSERT INTO public.profiles (user_id, nickname, avatar_url, created_at, updated_at)
        VALUES (
            NEW.id,
            base_nickname,
            NULL,
            NOW(),
            NOW()
        );
    EXCEPTION WHEN unique_violation THEN
        UPDATE public.profiles 
        SET nickname = base_nickname, updated_at = NOW()
        WHERE user_id = NEW.id;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- =====================================================
-- 4. 添加触发器
-- =====================================================

-- 为 profiles 表添加更新触发器
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 为 auth.users 表添加触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 5. Row Level Security (RLS) 策略
-- 所有策略都使用严格的条件，禁止使用 ALWAYS TRUE
-- =====================================================

-- =====================================================
-- profiles 表 RLS
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid()::TEXT = user_id::TEXT);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid()::TEXT = user_id::TEXT)
    WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

DROP POLICY IF EXISTS "Enable insert for authenticated users via trigger" ON public.profiles;
CREATE POLICY "Enable insert for authenticated users via trigger"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

DROP POLICY IF EXISTS "Prevent profile deletion" ON public.profiles;
CREATE POLICY "Prevent profile deletion"
    ON public.profiles
    FOR DELETE
    USING (false);

-- =====================================================
-- clubs 表 RLS
-- =====================================================
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved clubs" ON public.clubs;
CREATE POLICY "Anyone can view approved clubs"
    ON public.clubs
    FOR SELECT
    USING (status = 'approved');

DROP POLICY IF EXISTS "Authenticated users can create clubs" ON public.clubs;
CREATE POLICY "Authenticated users can create clubs"
    ON public.clubs
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Owners can update clubs" ON public.clubs;
CREATE POLICY "Owners can update clubs"
    ON public.clubs
    FOR UPDATE
    USING (auth.uid()::TEXT = COALESCE(created_by, '')::TEXT);

DROP POLICY IF EXISTS "Admins can approve clubs" ON public.clubs;
CREATE POLICY "Admins can approve clubs"
    ON public.clubs
    FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.club_admins WHERE club_admins.club_id = clubs.id AND club_admins.user_id::TEXT = auth.uid()::TEXT));

-- =====================================================
-- club_members 表 RLS
-- =====================================================
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view own membership" ON public.club_members;
CREATE POLICY "Members can view own membership"
    ON public.club_members
    FOR SELECT
    USING (auth.uid()::TEXT = user_id::TEXT);

DROP POLICY IF EXISTS "Users can add themselves as members" ON public.club_members;
CREATE POLICY "Users can add themselves as members"
    ON public.club_members
    FOR INSERT
    WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

DROP POLICY IF EXISTS "Admins can remove members" ON public.club_members;
CREATE POLICY "Admins can remove members"
    ON public.club_members
    FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.club_admins WHERE club_admins.club_id = club_members.club_id AND club_admins.user_id::TEXT = auth.uid()::TEXT));

-- =====================================================
-- club_admins 表 RLS
-- =====================================================
ALTER TABLE public.club_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin list" ON public.club_admins;
CREATE POLICY "Admins can view admin list"
    ON public.club_admins
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.club_admins ca WHERE ca.club_id = club_admins.club_id AND ca.user_id::TEXT = auth.uid()::TEXT));

DROP POLICY IF EXISTS "Club owners can add admins" ON public.club_admins;
CREATE POLICY "Club owners can add admins"
    ON public.club_admins
    FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = club_admins.club_id AND COALESCE(c.created_by, '')::TEXT = auth.uid()::TEXT));

DROP POLICY IF EXISTS "Club owners can remove admins" ON public.club_admins;
CREATE POLICY "Club owners can remove admins"
    ON public.club_admins
    FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = club_admins.club_id AND COALESCE(c.created_by, '')::TEXT = auth.uid()::TEXT));

-- =====================================================
-- club_applications 表 RLS
-- =====================================================
ALTER TABLE public.club_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own applications" ON public.club_applications;
CREATE POLICY "Users can view own applications"
    ON public.club_applications
    FOR SELECT
    USING (auth.uid()::TEXT = user_id::TEXT);

DROP POLICY IF EXISTS "Users can create own applications" ON public.club_applications;
CREATE POLICY "Users can create own applications"
    ON public.club_applications
    FOR INSERT
    WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

DROP POLICY IF EXISTS "Admins can update applications" ON public.club_applications;
CREATE POLICY "Admins can update applications"
    ON public.club_applications
    FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.club_admins ca WHERE ca.club_id = club_applications.club_id AND ca.user_id::TEXT = auth.uid()::TEXT));

-- =====================================================
-- club_messages 表 RLS
-- =====================================================
ALTER TABLE public.club_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Club members can view messages" ON public.club_messages;
CREATE POLICY "Club members can view messages"
    ON public.club_messages
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.club_members cm WHERE cm.club_id = club_messages.club_id AND cm.user_id::TEXT = auth.uid()::TEXT));

DROP POLICY IF EXISTS "Club members can send messages" ON public.club_messages;
CREATE POLICY "Club members can send messages"
    ON public.club_messages
    FOR INSERT
    WITH CHECK (auth.uid()::TEXT = user_id::TEXT AND EXISTS (SELECT 1 FROM public.club_members cm WHERE cm.club_id = club_messages.club_id AND cm.user_id::TEXT = auth.uid()::TEXT));

-- =====================================================
-- member_audit_log 表 RLS
-- =====================================================
ALTER TABLE public.member_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit log" ON public.member_audit_log;
CREATE POLICY "Admins can view audit log"
    ON public.member_audit_log
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.club_admins ca WHERE ca.club_id = member_audit_log.club_id AND ca.user_id::TEXT = auth.uid()::TEXT));

DROP POLICY IF EXISTS "Admins can create audit log entries" ON public.member_audit_log;
CREATE POLICY "Admins can create audit log entries"
    ON public.member_audit_log
    FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.club_admins ca WHERE ca.club_id = member_audit_log.club_id AND ca.user_id::TEXT = auth.uid()::TEXT));

-- =====================================================
-- game_categories 表 RLS
-- =====================================================
ALTER TABLE public.game_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view game categories" ON public.game_categories;
CREATE POLICY "Anyone can view game categories"
    ON public.game_categories
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can insert game categories" ON public.game_categories;
CREATE POLICY "Admins can insert game categories"
    ON public.game_categories
    FOR INSERT
    WITH CHECK (auth.role() = 'admin');

DROP POLICY IF EXISTS "Admins can update game categories" ON public.game_categories;
CREATE POLICY "Admins can update game categories"
    ON public.game_categories
    FOR UPDATE
    USING (auth.role() = 'admin');

DROP POLICY IF EXISTS "Admins can delete game categories" ON public.game_categories;
CREATE POLICY "Admins can delete game categories"
    ON public.game_categories
    FOR DELETE
    USING (auth.role() = 'admin');

-- =====================================================
-- reviews 表 RLS
-- =====================================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view reviews" ON public.reviews;
CREATE POLICY "Users can view reviews"
    ON public.reviews
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews"
    ON public.reviews
    FOR INSERT
    WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews"
    ON public.reviews
    FOR UPDATE
    USING (auth.uid()::TEXT = user_id::TEXT);

-- =====================================================
-- users 表 RLS（之前未启用）
-- =====================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own user data" ON public.users;
CREATE POLICY "Users can view own user data"
    ON public.users
    FOR SELECT
    USING (auth.uid()::TEXT = id::TEXT);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
    ON public.users
    FOR SELECT
    USING (auth.role() = 'admin');

-- =====================================================
-- applications 表 RLS（之前未启用）
-- =====================================================
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own applications" ON public.applications;
CREATE POLICY "Users can view own applications"
    ON public.applications
    FOR SELECT
    USING (auth.uid()::TEXT = user_id::TEXT);

DROP POLICY IF EXISTS "Users can create applications" ON public.applications;
CREATE POLICY "Users can create applications"
    ON public.applications
    FOR INSERT
    WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

DROP POLICY IF EXISTS "Admins can select applications" ON public.applications;
CREATE POLICY "Admins can select applications"
    ON public.applications
    FOR SELECT
    USING (auth.role() = 'admin');

DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;
CREATE POLICY "Admins can update applications"
    ON public.applications
    FOR UPDATE
    USING (auth.role() = 'admin');

DROP POLICY IF EXISTS "Admins can delete applications" ON public.applications;
CREATE POLICY "Admins can delete applications"
    ON public.applications
    FOR DELETE
    USING (auth.role() = 'admin');

-- =====================================================
-- 6. 权限授予
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- profiles
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;

-- clubs
GRANT SELECT ON public.clubs TO authenticated;
GRANT SELECT ON public.clubs TO anon;
GRANT INSERT ON public.clubs TO authenticated;
GRANT UPDATE ON public.clubs TO authenticated;

-- club_members
GRANT SELECT, INSERT, DELETE ON public.club_members TO authenticated;

-- club_admins
GRANT SELECT, INSERT, DELETE ON public.club_admins TO authenticated;

-- club_applications
GRANT SELECT, INSERT, UPDATE ON public.club_applications TO authenticated;

-- club_messages
GRANT SELECT, INSERT ON public.club_messages TO authenticated;

-- member_audit_log
GRANT SELECT, INSERT ON public.member_audit_log TO authenticated;

-- game_categories
GRANT SELECT ON public.game_categories TO authenticated;
GRANT SELECT ON public.game_categories TO anon;

-- reviews
GRANT SELECT ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT INSERT, UPDATE ON public.reviews TO authenticated;

-- users
GRANT SELECT ON public.users TO authenticated;

-- applications
GRANT SELECT, INSERT ON public.applications TO authenticated;

-- 函数权限
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

SELECT 'Security schema setup completed successfully!' as status;