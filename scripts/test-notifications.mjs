import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rynhyvuzlpzuzwnqmmjl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5bmh5dnV6bHB6dXp3bnFtbWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTExNDIsImV4cCI6MjA5NTUyNzE0Mn0.1iglVvvhNEizicrnL5cv8XCirSd9sX1a-7yyOZnHBMU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testNotifications() {
  console.log('=== 测试通知功能 ===\n');
  
  try {
    console.log('1. 测试获取通知...');
    const { data: notifications, error: getError } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (getError) {
      console.error('❌ 获取通知失败:', getError.message);
    } else {
      console.log(`✅ 获取成功！共 ${notifications.length} 条通知`);
    }
    
    console.log('\n2. 测试获取未读数量...');
    const { count, error: countError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('is_read', false);
    
    if (countError) {
      console.error('❌ 获取未读数量失败:', countError.message);
    } else {
      console.log(`✅ 获取成功！未读数量: ${count}`);
    }
    
    console.log('\n=== 测试完成 ===');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

testNotifications();