import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rynhyvuzlpzuzwnqmmjl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5bmh5dnV6bHB6dXp3bnFtbWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTExNDIsImV4cCI6MjA5NTUyNzE0Mn0.1iglVvvhNEizicrnL5cv8XCirSd9sX1a-7yyOZnHBMU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function insertData() {
  console.log('🚀 插入示例数据...\n');
  
  try {
    // 创建管理员和小助手用户
    console.log('👤 创建用户...');
    const { error: userError } = await supabase
      .from('users')
      .insert([
        { id: 'admin', username: '管理员', role: 'admin', status: 'active' },
        { id: 'helper', username: '小助手', role: 'helper', status: 'active' }
      ]);
    
    if (userError && !userError.message.includes('duplicate key')) {
      console.log('❌ 用户创建失败:', userError.message);
    } else {
      console.log('✅ 用户创建成功（或已存在）');
    }
    
    // 创建示例俱乐部
    console.log('\n🏠 创建俱乐部...');
    const { error: clubsError } = await supabase
      .from('clubs')
      .insert([
        {
          name: '王者荣耀高端俱乐部',
          game: '王者荣耀',
          description: '专注于王者荣耀高分段玩家的专业俱乐部',
          contact: 'contact@example.com',
          price_range: '50-100元',
          special_services: ['排位陪练', '教学指导'],
          status: 'approved',
          member_count: 120,
          rating: 4.8,
          icon_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=game%20club%20logo%20honor%20of%20kings&image_size=square'
        },
        {
          name: '原神探索者联盟',
          game: '原神',
          description: '一起探索提瓦特大陆的冒险家们',
          contact: 'contact@example.com',
          price_range: '免费',
          special_services: ['社交陪伴', '跑图打卡'],
          status: 'approved',
          member_count: 85,
          rating: 4.6,
          icon_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=game%20club%20logo%20genshin%20impact&image_size=square'
        },
        {
          name: '英雄联盟精英社',
          game: '英雄联盟',
          description: 'LOL高端玩家聚集地',
          contact: 'contact@example.com',
          price_range: '30-80元',
          special_services: ['上分教学', '战术指导'],
          status: 'approved',
          member_count: 200,
          rating: 4.9,
          icon_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=game%20club%20logo%20league%20of%20legends&image_size=square'
        },
        {
          name: '和平精英战神团',
          game: '和平精英',
          description: '吃鸡大神带你飞',
          contact: 'contact@example.com',
          price_range: '40-90元',
          special_services: ['四排组队', '技术教学'],
          status: 'approved',
          member_count: 150,
          rating: 4.7,
          icon_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=game%20club%20logo%20pubg%20mobile&image_size=square'
        },
        {
          name: 'CSGO竞技联盟',
          game: 'CSGO',
          description: 'FPS爱好者的天堂',
          contact: 'contact@example.com',
          price_range: '60-120元',
          special_services: ['枪法教学', '战术配合'],
          status: 'approved',
          member_count: 95,
          rating: 4.8,
          icon_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=game%20club%20logo%20csgo&image_size=square'
        }
      ]);
    
    if (clubsError && !clubsError.message.includes('duplicate key')) {
      console.log('❌ 俱乐部创建失败:', clubsError.message);
    } else {
      console.log('✅ 俱乐部创建成功（或已存在）');
    }
    
    // 验证数据
    console.log('\n📊 验证数据...');
    const { data: clubs } = await supabase.from('clubs').select('*');
    console.log(`俱乐部数量: ${clubs.length}`);
    clubs.forEach(c => console.log(`  - ${c.name} (${c.game})`));
    
    const { data: users } = await supabase.from('users').select('*');
    console.log(`\n用户数量: ${users.length}`);
    users.forEach(u => console.log(`  - ${u.username} (${u.role})`));
    
    console.log('\n🎉 数据插入完成！');
    
  } catch (error) {
    console.error('❌ 插入失败:', error.message);
  }
}

insertData();