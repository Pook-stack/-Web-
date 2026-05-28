# Supabase集成指南

> **创建时间**: 2026-05-28  
> **项目状态**: 待配置  
> **适用版本**: Supabase JS SDK 2.x

---

## 📋 前置准备

### 1. 获取Supabase凭证

登录你的Supabase项目，在 **Settings > API** 页面获取以下信息：

| 配置项 | 获取位置 | 示例 |
|--------|---------|------|
| **Project URL** | Settings > API > URL | `https://abc123.supabase.co` |
| **Anon Key** | Settings > API > Project API Keys > anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| **Service Role Key** | Settings > API > Project API Keys > service_role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

---

## 🔧 配置步骤

### 步骤1: 配置环境变量

编辑 `.env` 文件，填入你的Supabase凭证：

```bash
# .env 文件内容
VITE_SUPABASE_URL=你的Project URL
VITE_SUPABASE_ANON_KEY=你的Anon Key
```

### 步骤2: 创建Supabase客户端

`src/supabase.js` 已创建，内容如下：

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 步骤3: 初始化数据库表

1. 登录Supabase控制台
2. 进入 **SQL Editor**
3. 创建新查询
4. 复制并执行 `supabase_schema.sql` 中的SQL语句

---

## 🚀 数据迁移

### 将Mock数据导入Supabase

创建数据导入脚本：

```javascript
// src/scripts/migrateData.js
import { supabase } from '../supabase'
import { clubsData } from '../data/clubs'

export async function migrateClubs() {
  try {
    for (const club of clubsData) {
      const { data, error } = await supabase
        .from('clubs')
        .upsert({
          id: club.id,
          name: club.name,
          game: club.game,
          description: club.description,
          detailed_description: club.detailed_description,
          contact: club.contact,
          member_requirement: club.member_requirement,
          price_range: club.price_range,
          special_services: club.specialServices,
          icon_url: club.icon,
          cover_image_url: club.coverImage,
          founded_year: club.foundedYear,
          member_count: club.memberCount,
          playmate_count: club.playmateCount,
          rating: club.rating,
          review_count: club.reviewCount,
          mission: club.mission,
          activity_frequency: club.activityFrequency,
          status: club.status || 'approved',
        })

      if (error) {
        console.error(`导入 ${club.name} 失败:`, error)
      } else {
        console.log(`成功导入 ${club.name}`)
      }
    }
    console.log('数据迁移完成！')
  } catch (error) {
    console.error('数据迁移失败:', error)
  }
}
```

---

## 🔗 GitHub与Supabase关联

### 步骤1: 配置GitHub集成

1. 登录Supabase控制台
2. 进入 **Settings > Integrations > GitHub**
3. 点击 **Connect GitHub**
4. 授权Supabase访问你的GitHub仓库

### 步骤2: 配置Vercel环境变量

在Vercel项目设置中添加环境变量：

| 变量名 | 值 |
|--------|-----|
| `VITE_SUPABASE_URL` | 你的Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | 你的Anon Key |

### 步骤3: 配置GitHub Actions (可选)

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 🧪 验证步骤

### 验证连接

创建测试脚本 `src/scripts/testConnection.js`:

```javascript
import { supabase } from '../supabase'

export async function testConnection() {
  try {
    const { data, error } = await supabase.from('clubs').select('count').limit(1)
    
    if (error) {
      console.error('连接失败:', error)
      return false
    }
    
    console.log('✅ 连接成功！')
    return true
  } catch (error) {
    console.error('连接异常:', error)
    return false
  }
}
```

### 测试API功能

```javascript
// 在App.jsx中添加测试
import { useEffect } from 'react'
import { supabase } from './supabase'

function App() {
  useEffect(() => {
    const testSupabase = async () => {
      const { data, error } = await supabase.from('clubs').select('*').limit(5)
      
      if (error) {
        console.error('Supabase查询失败:', error)
      } else {
        console.log('✅ Supabase查询成功！')
        console.log('俱乐部数据:', data)
      }
    }
    
    testSupabase()
  }, [])
  
  // ... 其余代码
}
```

### 浏览器验证

1. 启动开发服务器: `npm run dev`
2. 打开浏览器控制台 (F12)
3. 查看是否有连接成功的日志

---

## ⚙️ 核心API封装

### 创建数据服务层

```javascript
// src/services/clubService.js
import { supabase } from '../supabase'

export const clubService = {
  // 获取所有俱乐部
  async getAllClubs() {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  // 根据ID获取俱乐部
  async getClubById(id) {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', id)
      .single()
    
    return { data, error }
  },

  // 创建俱乐部
  async createClub(clubData) {
    const { data, error } = await supabase
      .from('clubs')
      .insert([clubData])
      .select()
    
    return { data, error }
  },

  // 更新俱乐部
  async updateClub(id, clubData) {
    const { data, error } = await supabase
      .from('clubs')
      .update(clubData)
      .eq('id', id)
      .select()
    
    return { data, error }
  },

  // 删除俱乐部
  async deleteClub(id) {
    const { data, error } = await supabase
      .from('clubs')
      .delete()
      .eq('id', id)
    
    return { data, error }
  },

  // 搜索俱乐部
  async searchClubs(query) {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('status', 'approved')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,game.ilike.%${query}%`)
    
    return { data, error }
  },

  // 根据游戏类型筛选
  async getClubsByGame(game) {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('status', 'approved')
      .eq('game', game)
    
    return { data, error }
  },
}

export const applicationService = {
  // 申请加入俱乐部
  async applyToClub(clubId, userId) {
    const { data, error } = await supabase
      .from('applications')
      .insert([{ club_id: clubId, user_id: userId }])
      .select()
    
    return { data, error }
  },

  // 获取用户申请记录
  async getUserApplications(userId) {
    const { data, error } = await supabase
      .from('applications')
      .select('*, clubs(*)')
      .eq('user_id', userId)
      .order('applied_at', { ascending: false })
    
    return { data, error }
  },

  // 审批申请
  async processApplication(applicationId, status) {
    const { data, error } = await supabase
      .from('applications')
      .update({ status, processed_at: new Date().toISOString() })
      .eq('id', applicationId)
      .select()
    
    return { data, error }
  },
}
```

---

## 🔒 安全配置

### Row Level Security (RLS)

为各表启用RLS并配置策略：

```sql
-- 启用RLS
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 俱乐部表策略
CREATE POLICY "Public can view approved clubs" ON clubs
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can create clubs" ON clubs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners can update clubs" ON clubs
  FOR UPDATE USING (true);

-- 申请记录表策略
CREATE POLICY "Users can view their applications" ON applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can apply to clubs" ON applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 匿名用户访问

在Supabase控制台：
1. 进入 **Authentication > Policies**
2. 为 `clubs` 表创建策略允许匿名用户读取已通过审核的俱乐部
3. 为 `applications` 表创建策略允许匿名用户创建申请

---

## 📝 部署检查清单

- [ ] 配置 `.env` 文件
- [ ] 创建 `supabase.js` 客户端
- [ ] 执行数据库初始化脚本
- [ ] 测试本地连接
- [ ] 配置Vercel环境变量
- [ ] 启用Row Level Security
- [ ] 配置访问策略
- [ ] 部署到Vercel
- [ ] 验证线上环境

---

## 🐛 常见问题

### Q1: 连接失败 - "Network Error"
**原因**: 网络无法访问Supabase服务器
**解决方案**:
- 检查网络连接
- 确认Supabase URL正确
- 检查防火墙设置

### Q2: 权限错误 - "RLS: row-level security violation"
**原因**: RLS策略阻止了访问
**解决方案**:
- 检查并配置正确的RLS策略
- 确保用户已登录或配置匿名访问

### Q3: 环境变量未生效
**原因**: Vite需要重启才能读取新的环境变量
**解决方案**:
- 重启开发服务器: `npm run dev`
- 在Vercel中重新部署

---

## 📞 技术支持

如需帮助完成配置：

1. 提供你的Supabase **Project URL** 和 **Anon Key**
2. 确认GitHub仓库已正确配置
3. 我可以帮你完成数据库初始化和API集成

---

**完成以上步骤后，你的网站将成功连接到Supabase数据库！** 🎉
