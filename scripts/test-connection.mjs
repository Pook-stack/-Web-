import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rcfvwdbkogsrggrshw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjZnZ3ZGJrb2dzcmdnc3Rod3ciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxNzQ0MjQ5OSwiZXhwIjoyMDMyMDE4NDk5fQ.dyJ3cU8W3QZ9I2cH8G6R5Y7U9I0O1P2Q3R4T5Y6U7I8O9P0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('🚀 测试数据库连接...');
  console.log(`URL: ${SUPABASE_URL}`);
  
  try {
    const { data, error } = await supabase.from('clubs').select('*').limit(1);
    
    if (error) {
      console.error('❌ 连接失败:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('✅ 连接成功!');
    console.log('数据:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ 连接异常:', error.message);
    return { success: false, error: error.message };
  }
}

testConnection();