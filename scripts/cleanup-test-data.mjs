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

async function cleanupTestData() {
  log('🚀 开始数据清理任务...');
  
  try {
    // 1. 获取清理前的数据统计
    log('\n📊 清理前数据统计：');
    
    const { data: clubsBefore, error: clubsError } = await supabase.from('clubs').select('*');
    if (clubsError) throw clubsError;
    log(`  clubs 表: ${clubsBefore.length} 条记录`);
    
    const { data: usersBefore } = await supabase.from('users').select('*');
    log(`  users 表: ${usersBefore.length} 条记录`);
    
    const { data: membersBefore } = await supabase.from('club_members').select('*');
    log(`  club_members 表: ${membersBefore.length} 条记录`);
    
    const { data: applicationsBefore } = await supabase.from('applications').select('*');
    log(`  applications 表: ${applicationsBefore.length} 条记录`);
    
    // 2. 清理测试数据
    log('\n🗑️ 开始清理测试数据...');
    
    // 定义测试数据标识
    const testUserIds = ['admin', 'helper'];
    const testClubKeywords = ['测试', '示例', 'demo', 'test', '王者荣耀', '原神', '英雄联盟', '和平精英', 'CSGO'];
    
    // 清理测试俱乐部（包含关键词的俱乐部）
    let deletedClubs = 0;
    for (const keyword of testClubKeywords) {
      const { count } = await supabase
        .from('clubs')
        .delete()
        .ilike('name', `%${keyword}%`);
      if (count > 0) {
        deletedClubs += count;
        log(`    删除包含 "${keyword}" 的俱乐部: ${count} 条`);
      }
    }
    
    // 清理测试用户
    const { count: deletedUsers } = await supabase
      .from('users')
      .delete()
      .in('id', testUserIds);
    log(`    删除测试用户: ${deletedUsers} 条`);
    
    // 清理空的成员记录（可能是孤儿数据）
    const { count: deletedMembers } = await supabase
      .from('club_members')
      .delete()
      .not('club_id', 'in', '(SELECT id FROM clubs)');
    log(`    删除孤儿成员记录: ${deletedMembers} 条`);
    
    // 清理空的申请记录
    const { count: deletedApplications } = await supabase
      .from('applications')
      .delete()
      .not('club_id', 'in', '(SELECT id FROM clubs)');
    log(`    删除孤儿申请记录: ${deletedApplications} 条`);
    
    // 3. 清理后的统计
    log('\n📊 清理后数据统计：');
    
    const { data: clubsAfter } = await supabase.from('clubs').select('*');
    log(`  clubs 表: ${clubsAfter.length} 条记录`);
    
    const { data: usersAfter } = await supabase.from('users').select('*');
    log(`  users 表: ${usersAfter.length} 条记录`);
    
    const { data: membersAfter } = await supabase.from('club_members').select('*');
    log(`  club_members 表: ${membersAfter.length} 条记录`);
    
    const { data: applicationsAfter } = await supabase.from('applications').select('*');
    log(`  applications 表: ${applicationsAfter.length} 条记录`);
    
    // 4. 数据完整性校验
    log('\n✅ 数据完整性校验：');
    
    // 检查成员记录是否都有对应的俱乐部
    const orphanMembers = await supabase
      .from('club_members')
      .select('*')
      .not('club_id', 'in', '(SELECT id FROM clubs)');
    if (orphanMembers.data.length === 0) {
      log('    ✅ club_members 表: 无孤儿记录');
    } else {
      log(`    ❌ club_members 表: 发现 ${orphanMembers.data.length} 条孤儿记录`);
    }
    
    // 检查申请记录是否都有对应的俱乐部
    const orphanApps = await supabase
      .from('applications')
      .select('*')
      .not('club_id', 'in', '(SELECT id FROM clubs)');
    if (orphanApps.data.length === 0) {
      log('    ✅ applications 表: 无孤儿记录');
    } else {
      log(`    ❌ applications 表: 发现 ${orphanApps.data.length} 条孤儿记录`);
    }
    
    // 5. 记录清理摘要
    log('\n📋 清理摘要：');
    log(`  共清理俱乐部: ${deletedClubs} 条`);
    log(`  共清理用户: ${deletedUsers} 条`);
    log(`  共清理成员记录: ${deletedMembers} 条`);
    log(`  共清理申请记录: ${deletedApplications} 条`);
    log(`  总计清理: ${deletedClubs + deletedUsers + deletedMembers + deletedApplications} 条记录`);
    
    // 6. 保存日志文件
    log('\n📝 保存清理日志...');
    const logContent = cleanupLog.join('\n');
    fs.writeFileSync(LOG_FILE, logContent);
    log(`    日志已保存到: ${LOG_FILE}`);
    
    log('\n🎉 数据清理任务完成！');
    
    return {
      success: true,
      deleted: {
        clubs: deletedClubs,
        users: deletedUsers,
        club_members: deletedMembers,
        applications: deletedApplications
      },
      remaining: {
        clubs: clubsAfter.length,
        users: usersAfter.length,
        club_members: membersAfter.length,
        applications: applicationsAfter.length
      }
    };
    
  } catch (error) {
    log(`❌ 清理过程出错: ${error.message}`);
    fs.writeFileSync(LOG_FILE, cleanupLog.join('\n'));
    throw error;
  }
}

// 执行清理
cleanupTestData().then(result => {
  console.log('\n=== 清理结果 ===');
  console.log('删除记录:', result.deleted);
  console.log('剩余记录:', result.remaining);
}).catch(error => {
  console.error('清理失败:', error);
  process.exit(1);
});