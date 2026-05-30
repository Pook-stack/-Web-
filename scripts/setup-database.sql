-- ============================================
-- 陪玩俱乐部 - Supabase 数据库初始化脚本
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active',
  banned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 俱乐部表
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  game TEXT,
  description TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  price_range TEXT DEFAULT '',
  special_services JSONB DEFAULT '[]',
  icon_url TEXT DEFAULT '',
  cover_image_url TEXT DEFAULT '',
  created_by TEXT,
  status TEXT DEFAULT 'pending',
  member_count INTEGER DEFAULT 0,
  rating FLOAT DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_official BOOLEAN DEFAULT false,
  founded_year TEXT DEFAULT '',
  activity_frequency TEXT DEFAULT '',
  member_requirement TEXT DEFAULT '',
  detailed_description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 俱乐部成员表
CREATE TABLE IF NOT EXISTS club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 俱乐部管理员表
CREATE TABLE IF NOT EXISTS club_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  appointed_by TEXT,
  appointed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 申请表
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- 6. 评分表
CREATE TABLE IF NOT EXISTS club_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 聊天室表
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'public',
  name TEXT DEFAULT '',
  participant_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. 聊天消息表
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. 俱乐部消息表（公共聊天）
CREATE TABLE IF NOT EXISTS club_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. 操作日志表
CREATE TABLE IF NOT EXISTS member_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id TEXT,
  action TEXT,
  actor_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS 策略：允许所有人读写（无需登录）
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_audit_log ENABLE ROW LEVEL SECURITY;

-- 为所有表创建公开访问策略
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY['users','clubs','club_members','club_admins','applications','club_ratings','notifications','chat_rooms','chat_messages','club_messages','member_audit_log'])
  LOOP
    EXECUTE format('CREATE POLICY "Public access" ON %I FOR ALL USING (true) WITH CHECK (true)', tbl);
  END LOOP;
END $$;

-- ============================================
-- 创建 storage bucket（用于图片上传）
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public access to images"
ON storage.objects FOR ALL
USING (true)
WITH CHECK (true);
