-- 官方俱乐部功能SQL脚本
-- 执行时间: 2026-05-28

-- 1. 添加 is_official 字段到 clubs 表
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'clubs' AND column_name = 'is_official') THEN
    ALTER TABLE clubs ADD COLUMN is_official BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 2. 插入5个官方认证俱乐部
-- 俱乐部1: 王者荣耀
INSERT INTO clubs (name, game, description, is_official, icon, created_by)
VALUES (
  '王者荣耀',
  '王者荣耀',
  '🎮 官方认证王者荣耀俱乐部！汇聚顶级玩家，开启你的王者征程！官方赛事、独家活动，荣耀从这里开始！',
  true,
  '',
  'admin'
)
ON CONFLICT (name) DO NOTHING;

-- 俱乐部2: 英雄联盟
INSERT INTO clubs (name, game, description, is_official, icon, created_by)
VALUES (
  '英雄联盟',
  '英雄联盟',
  '⚔️ 官方认证英雄联盟俱乐部！召唤峡谷，英雄聚首！官方联赛、独家训练，冠军之路等你来战！',
  true,
  '',
  'admin'
)
ON CONFLICT (name) DO NOTHING;

-- 俱乐部3: 和平精英
INSERT INTO clubs (name, game, description, is_official, icon, created_by)
VALUES (
  '和平精英',
  '和平精英',
  '🔫 官方认证和平精英俱乐部！空投召唤，精英汇聚！官方赛事、战术训练，吃鸡从这里开始！',
  true,
  '',
  'admin'
)
ON CONFLICT (name) DO NOTHING;

-- 俱乐部4: 无畏契约
INSERT INTO clubs (name, game, description, is_official, icon, created_by)
VALUES (
  '无畏契约',
  '无畏契约',
  '💜 官方认证无畏契约俱乐部！契约召唤，勇者无畏！官方竞技、战术演练，你的舞台已经备好！',
  true,
  '',
  'admin'
)
ON CONFLICT (name) DO NOTHING;

-- 俱乐部5: 蛋仔派对
INSERT INTO clubs (name, game, description, is_official, icon, created_by)
VALUES (
  '蛋仔派对',
  '蛋仔派对',
  '🥚 官方认证蛋仔派对俱乐部！可爱蛋仔，欢乐派对！官方活动、独家地图，快乐时光等你来！',
  true,
  '',
  'admin'
)
ON CONFLICT (name) DO NOTHING;

-- 3. 验证官方俱乐部已创建
SELECT id, name, game, is_official, created_at
FROM clubs
WHERE is_official = true
ORDER BY created_at DESC;
