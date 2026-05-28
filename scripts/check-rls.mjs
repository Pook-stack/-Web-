import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rynhyvuzlpzuzwnqmmjl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5bmh5dnV6bHB6dXp3bnFtbWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTExNDIsImV4cCI6MjA5NTUyNzE0Mn0.1iglVvvhNEizicrnL5cv8XCirSd9sX1a-7yyOZnHBMU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkRLS() {
  console.log('🚀 检查行级安全策略...\n');
  
  try {
    // 尝试查询现有数据
    console.log('📊 尝试查询数据...');
    const { data: clubs, error: clubsError } = await supabase.from('clubs').select('*');
    
    if (clubsError) {
      console.log('❌ 查询失败:', clubsError.message);
      
      if (clubsError.message.includes('row-level security')) {
        console.log('\n⚠️ 行级安全策略已启用');
        console.log('需要在 Supabase 中禁用或配置行级安全');
        console.log('\n📋 解决方案:');
        console.log('1. 登录 Supabase 控制台');
        console.log('2. 进入 Table Editor');
        console.log('3. 选择 clubs 表');
        console.log('4. 点击 "Edit RLS Policy"');
        console.log('5. 禁用 RLS 或创建允许匿名用户访问的策略');
      }
      return;
    }
    
    console.log('✅ 查询成功!');
    console.log('俱乐部数量:', clubs.length);
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkRLS();