-- 创建聊天室表
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('private', 'group')),
  participant_ids TEXT[] NOT NULL DEFAULT '{}',
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建消息表
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'image', 'file')),
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建消息状态表（用于追踪每个用户对消息的已读状态）
CREATE TABLE IF NOT EXISTS message_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'delivered' CHECK (status IN ('delivered', 'read')),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_chat_rooms_club_id ON chat_rooms(club_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_participants ON chat_rooms USING gin (participant_ids);
CREATE INDEX IF NOT EXISTS idx_messages_chat_room_id ON messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_message_status_message_id ON message_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_status_user_id ON message_status(user_id);

-- 启用实时订阅
ALTER TABLE chat_rooms REPLICA IDENTITY FULL;
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE message_status REPLICA IDENTITY FULL;

-- 启用 RLS（行级安全）
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_status ENABLE ROW LEVEL SECURITY;

-- 为 chat_rooms 创建 RLS 策略
CREATE POLICY users_view_chat_rooms ON chat_rooms FOR SELECT USING (auth.uid()::text = ANY (participant_ids));
CREATE POLICY users_create_chat_rooms ON chat_rooms FOR INSERT WITH CHECK (auth.uid()::text = ANY (participant_ids));
CREATE POLICY users_update_chat_rooms ON chat_rooms FOR UPDATE USING (auth.uid()::text = ANY (participant_ids)) WITH CHECK (auth.uid()::text = ANY (participant_ids));

-- 为 messages 创建 RLS 策略
CREATE POLICY users_view_messages ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = messages.chat_room_id
    AND auth.uid()::text = ANY (chat_rooms.participant_ids)
  )
);
CREATE POLICY users_send_messages ON messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = messages.chat_room_id
    AND auth.uid()::text = ANY (chat_rooms.participant_ids)
  )
  AND auth.uid()::text = sender_id::text
);

-- 为 message_status 创建 RLS 策略
CREATE POLICY users_view_message_status ON message_status FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY users_create_message_status ON message_status FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY users_update_message_status ON message_status FOR UPDATE USING (auth.uid()::text = user_id::text) WITH CHECK (auth.uid()::text = user_id::text);

-- 创建触发器自动更新updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_rooms_modtime BEFORE UPDATE ON chat_rooms FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_messages_modtime BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_message_status_modtime BEFORE UPDATE ON message_status FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 授予权限（仅给 authenticated 用户，而非 anon）
GRANT ALL ON chat_rooms TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON message_status TO authenticated;
