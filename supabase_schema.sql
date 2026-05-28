-- 陪玩俱乐部数据库表结构

-- 俱乐部表
CREATE TABLE IF NOT EXISTS clubs (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  game VARCHAR(50) NOT NULL,
  description TEXT,
  detailed_description TEXT,
  contact VARCHAR(100),
  member_requirement VARCHAR(200),
  price_range VARCHAR(50),
  special_services TEXT[],
  icon_url VARCHAR(500),
  cover_image_url VARCHAR(500),
  founded_year VARCHAR(4),
  member_count INT DEFAULT 0,
  playmate_count INT DEFAULT 0,
  rating DECIMAL(3,1) DEFAULT 0,
  review_count INT DEFAULT 0,
  mission TEXT,
  activity_frequency VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nickname VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500),
  join_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 会员关系表
CREATE TABLE IF NOT EXISTS club_members (
  id BIGSERIAL PRIMARY KEY,
  club_id BIGINT REFERENCES clubs(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  status VARCHAR(20) DEFAULT 'approved',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

-- 申请记录表
CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  club_id BIGINT REFERENCES clubs(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(club_id, user_id)
);

-- 评价表
CREATE TABLE IF NOT EXISTS reviews (
  id BIGSERIAL PRIMARY KEY,
  club_id BIGINT REFERENCES clubs(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

-- 成员表（俱乐部成员展示）
CREATE TABLE IF NOT EXISTS members (
  id BIGSERIAL PRIMARY KEY,
  club_id BIGINT REFERENCES clubs(id) ON DELETE CASCADE,
  nickname VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500),
  role VARCHAR(50),
  is_online BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引优化
CREATE INDEX idx_clubs_game ON clubs(game);
CREATE INDEX idx_clubs_status ON clubs(status);
CREATE INDEX idx_club_members_club_id ON club_members(club_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_reviews_club_id ON reviews(club_id);

-- 触发器：更新俱乐部成员数量
CREATE OR REPLACE FUNCTION update_club_member_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE clubs 
  SET member_count = (SELECT COUNT(*) FROM club_members WHERE club_id = NEW.club_id AND status = 'approved')
  WHERE id = NEW.club_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_member_count
AFTER INSERT OR UPDATE OR DELETE ON club_members
FOR EACH ROW EXECUTE FUNCTION update_club_member_count();

-- 触发器：更新俱乐部评分
CREATE OR REPLACE FUNCTION update_club_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE clubs 
  SET rating = (SELECT AVG(rating) FROM reviews WHERE club_id = NEW.club_id),
      review_count = (SELECT COUNT(*) FROM reviews WHERE club_id = NEW.club_id)
  WHERE id = NEW.club_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_club_rating();
