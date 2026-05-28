import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://rynhyvuzlpzuzwnqmmjl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5bmh5dnV6bHB6dXp3bnFtbWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTExNDIsImV4cCI6MjA5NTUyNzE0Mn0.1iglVvvhNEizicrnL5cv8XCirSd9sX1a-7yyOZnHBMU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOG_FILE = path.join(process.cwd(), 'scripts/data-cleanup-log.txt');

let cleanupLog = [];

function log(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  console.log(logEntry);
  cleanupLog.push(logEntry);
}

async function verifyDataIntegrity() {
  log('🚀 开始数据完整性校验...');
  
  try {
    // 1. 获取当前数据统计
    log('\n📊 当前数据统计：');
    
    const { data: clubs, error: clubsError } = await supabase.from('clubs').select('*');
    if (clubsError) throw clubsError;
    log(`  clubs 表: ${clubs?.length || 0} 条记录`);
    
    const { data: users } = await supabase.from('users').select('*');
    log(`  users 表: ${users?.length || 0} 条记录`);
    
    const { data: members } = await supabase.from('club_members').select('*');
    log(`  club_members 表: ${members?.length || 0} 条记录`);
    
    const { data: applications } = await supabase.from('applications').select('*');
    log(`  applications 表: ${applications?.length || 0} 条记录`);
    
    // 2. 数据完整性校验
    log('\n✅ 数据完整性校验：');
    
    // 检查成员记录是否都有对应的俱乐部
    const { data: orphanMembers, error: orphanMembersError } = await supabase
      .from('club_members')
      .select('*')
      .not('club_id', 'in', '(SELECT id FROM clubs)');
    
    if (orphanMembersError) {
      log(`    ⚠️ club_members 表: 校验出错 - ${orphanMembersError.message}`);
    } else if (!orphanMembers || orphanMembers.length === 0) {
      log('    ✅ club_members 表: 无孤儿记录');
    } else {
      log(`    ❌ club_members 表: 发现 ${orphanMembers.length} 条孤儿记录`);
    }
    
    // 检查申请记录是否都有对应的俱乐部
    const { data: orphanApps, error: orphanAppsError } = await supabase
      .from('applications')
      .select('*')
      .not('club_id', 'in', '(SELECT id FROM clubs)');
    
    if (orphanAppsError) {
      log(`    ⚠️ applications 表: 校验出错 - ${orphanAppsError.message}`);
    } else if (!orphanApps || orphanAppsError.length === 0) {
      log('    ✅ applications 表: 无孤儿记录');
    } else {
      log(`    ❌ applications 表: 发现 ${orphanApps.length} 条孤儿记录`);
    }
    
    // 3. 显示剩余数据详情
    log('\n📋 剩余数据详情：');
    
    if (clubs && clubs.length > 0) {
      log('  clubs:');
      clubs.forEach((club, index) => {
        log(`    ${index + 1}. ${club.name} (${club.game}) - ${club.status}`);
      });
    } else {
      log('  clubs: 无数据');
    }
    
    if (users && users.length > 0) {
      log('  users:');
      users.forEach((user, index) => {
        log(`    ${index + 1}. ${user.username} (${user.role}) - ${user.status}`);
      });
    } else {
      log('  users: 无数据');
    }
    
    // 4. 保存日志
    log('\n📝 保存校验日志...');
    const logContent = cleanupLog.join('\n');
    fs.writeFileSync(LOG_FILE, logContent);
    log(`    日志已保存到: ${LOG_FILE}`);
    
    log('\n🎉 数据完整性校验完成！');
    
    return {
      success: true,
      data: {
        clubs: clubs?.length || 0,
        users: users?.length || 0,
        club_members: members?.length || 0,
        applications: applications?.length || 0
      }
    };
    
  } catch (error) {
    log(`❌ 校验过程出错: ${error.message}`);
    fs.writeFileSync(LOG_FILE, cleanupLog.join('\n'));
    throw error;
  }
}

// 执行校验
verifyDataIntegrity().then(result => {
  console.log('\n=== 校验结果 ===');
  console.log('当前数据:', result.data);
}).catch(error => {
  console.error('校验失败:', error);
  process.exit(1);
});