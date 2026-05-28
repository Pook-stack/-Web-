import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://rynhyvuzlpzuzwnqmmjl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5bmh5dnV6bHB6dXp3bnFtbWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTExNDIsImV4cCI6MjA5NTUyNzE0Mn0.1iglVvvhNEizicrnL5cv8XCirSd9sX1a-7yyOZnHBMU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupNotificationsTable() {
  console.log('🚀 设置通知表...');
  
  try {
    // 读取SQL文件
    const sqlContent = fs.readFileSync('scripts/create-notifications-table.sql', 'utf-8');
    
    // 执行SQL
    const { error } = await supabase.rpc('execute_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ 创建表失败:', error.message);
      return;
    }
    
    console.log('✅ 通知表创建成功！');
    
    // 验证表是否创建成功
    const { data, error: queryError } = await supabase.from('notifications').select('*');
    
    if (queryError) {
      console.error('❌ 查询失败:', queryError.message);
      return;
    }
    
    console.log(`📊 当前通知数量: ${data.length}`);
    
  } catch (error) {
    console.error('❌ 设置失败:', error.message);
  }
}

setupNotificationsTable();