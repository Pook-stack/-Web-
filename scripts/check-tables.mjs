import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rynhyvuzlpzuzwnqmmjl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5bmh5dnV6bHB6dXp3bnFtbWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTExNDIsImV4cCI6MjA5NTUyNzE0Mn0.1iglVvvhNEizicrnL5cv8XCirSd9sX1a-7yyOZnHBMU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🚀 测试数据库连接...\n');

// 测试1: 获取所有现有的表
async function testTables() {
  console.log('📊 测试1: 获取表列表\n');
  
  const tablesToCheck = ['clubs', 'users', 'club_members', 'applications', 'notifications'];
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`❌ 表 "${table}" 不存在`);
        } else {
          console.log(`❌ 表 "${table}" 查询失败:`, error.message);
        }
      } else {
        console.log(`✅ 表 "${table}" 存在，找到 ${data.length} 条记录`);
      }
    } catch (err) {
      console.log(`❌ 表 "${table}" 查询异常:`, err.message);
    }
  }
  console.log('');
}

// 测试2: 检查notifications表是否存在
async function checkNotificationsTable() {
  console.log('📢 测试2: 检查notifications表\n');
  
  try {
    const { data, error } = await supabase.from('notifications').select('*').limit(1);
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ notifications表不存在！需要创建\n');
        console.log('💡 请在Supabase SQL Editor中执行以下SQL:\n');
        console.log(`
-- 创建 notifications 表
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('application_approved', 'application_rejected', 'club_joined', 'system_notice', 'club_created')),
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- 为 user_id 创建索引
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- 启用 RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 创建允许匿名用户访问的策略
CREATE POLICY "Allow public read" ON notifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON notifications FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON notifications FOR DELETE USING (true);
`);
      } else {
        console.log('❌ 查询失败:', error.message);
      }
    } else {
      console.log(`✅ notifications表存在，找到 ${data.length} 条记录\n`);
    }
  } catch (err) {
    console.log('❌ 查询异常:', err.message);
  }
}

async function main() {
  try {
    await testTables();
    await checkNotificationsTable();
    console.log('✅ 测试完成！');
  } catch (err) {
    console.error('❌ 测试失败:', err);
  }
}

main();
