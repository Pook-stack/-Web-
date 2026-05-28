import { createClient } from '@supabase/supabase-js';

async function diagnoseConnection() {
  console.log('========================================');
  console.log('🎯 Supabase 连接诊断工具');
  console.log('========================================\n');
  
  // 测试多个可能的URL
  const testUrls = [
    'https://rcfvwdbkogsrggrshw.supabase.co',
    'https://ruamzahurunequan.supabase.co',
  ];
  
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjZnZ3ZGJrb2dzcmdnc3Rod3ciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxNzQ0MjQ5OSwiZXhwIjoyMDMyMDE4NDk5fQ.dyJ3cU8W3QZ9I2cH8G6R5Y7U9I0O1P2Q3R4T5Y6U7I8O9P0';
  
  for (const url of testUrls) {
    console.log(`\n📍 测试 URL: ${url}`);
    console.log('------------------------');
    
    try {
      const supabase = createClient(url, anonKey);
      
      console.log('🔄 正在创建客户端...');
      
      const { data, error } = await supabase.from('clubs').select('*').limit(1);
      
      if (error) {
        console.log(`❌ 查询失败: ${error.message}`);
        
        if (error.message.includes('fetch failed')) {
          console.log('   → 原因: 网络连接失败或域名无法解析');
        } else if (error.message.includes('404')) {
          console.log('   → 原因: 表不存在或API路径错误');
        } else if (error.message.includes('401')) {
          console.log('   → 原因: 认证失败，API密钥可能无效');
        }
      } else {
        console.log(`✅ 查询成功! 返回 ${data.length} 条记录`);
        console.log('   → 数据库连接正常');
      }
      
    } catch (err) {
      console.log(`❌ 连接异常: ${err.message}`);
      
      if (err.message.includes('getaddrinfo ENOTFOUND')) {
        console.log('   → 原因: DNS解析失败，域名不存在');
      } else if (err.message.includes('ETIMEDOUT')) {
        console.log('   → 原因: 连接超时，网络问题');
      }
    }
  }
  
  console.log('\n========================================');
  console.log('📊 诊断完成');
  console.log('========================================');
  console.log('\n💡 建议:');
  console.log('1. 如果显示DNS解析失败，请等待5-10分钟让DNS生效');
  console.log('2. 如果显示认证失败，请检查API密钥是否正确');
  console.log('3. 如果显示表不存在，请在Supabase中创建数据库表');
}

diagnoseConnection();