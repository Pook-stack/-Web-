import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rynhyvuzlpzuzwnqmmjl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5bmh5dnV6bHB6dXp3bnFtbWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTExNDIsImV4cCI6MjA5NTUyNzE0Mn0.1iglVvvhNEizicrnL5cv8XCirSd9sX1a-7yyOZnHBMU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('🚀 测试数据库连接...');
  console.log(`URL: ${SUPABASE_URL}`);
  
  try {
    // 测试连接
    const { data, error } = await supabase.from('clubs').select('*').limit(1);
    
    if (error) {
      console.log('\n❌ 连接失败!');
      console.log('错误信息:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('\n✅ 数据库连接成功!');
    console.log('当前 clubs 表记录数:', data.length);
    return { success: true, data };
  } catch (error) {
    console.log('\n❌ 连接异常!');
    console.log('错误信息:', error.message);
    return { success: false, error: error.message };
  }
}

testConnection();