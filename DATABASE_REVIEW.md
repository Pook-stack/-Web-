# Database Review Summary

## 现有数据库 schema

### 1. `supabase_schema.sql`
- 定义了 `clubs`, `users`, `club_members`, `applications`, `reviews`, `members` 表
- 包含触发器：
  - `update_club_member_count`
  - `update_club_rating`
- 设计使用 `BIGSERIAL`、`TIMESTAMP WITH TIME ZONE`
- 适配了 `clubs` 的多字段属性，如 `special_services`, `activity_frequency` 等

### 2. `sql/auth_schema.sql`
- 定义了大量 Supabase auth 相关表，包含 `profiles`, `game_categories`, `club_messages`, `club_admins` 等
- 包含 RLS 策略和触发器：
  - `public.handle_new_user`
  - `public.update_updated_at_column`
  - `on_auth_user_created` 触发器
- 使用 `auth.users` 与 `public.profiles` 的关联
- 适用于 Supabase 的安全规则与授权控制

### 3. `sql/minimal_schema.sql`
- 简化测试版本
- 定义了简化的 `profiles`, `clubs`, `club_members`, `club_admins`, `club_applications` 表
- 包含 RLS 策略，适合快速验证 auth 与 club 基础功能

## 代码与 schema 的一致性

### 目前存在的主要不一致点
- `src/services/database.js` 使用 `members` 表、硬编码 `userId = 1`，且缺少实际项目中应有的 auth 用户关联
- `src/components/SqlEditor.jsx` 依赖一个名为 `execute_sql` 的 Supabase RPC，但 schema 文件中未直接定义该函数
- `src/services/supabase.js` 主要路径依赖 `applications`, `club_members`, `member_audit_log`, `club_admins` 等表，需以主 schema 为准

## 建议

1. 统一主 schema：
   - 以 `sql/auth_schema.sql` 或 `supabase_schema.sql` 为基础，合并字段差异
   - 确认 `profiles`, `users`, `clubs`, `applications`, `club_members`, `reviews`, `notifications`, `club_admins` 等表结构一致

2. 删除或重构 `src/services/database.js`：
   - 该文件当前未被项目引用
   - 如果要保留用于测试，应改为使用真实 auth 用户 ID，并与当前 schema 对齐

3. 补充 `execute_sql` RPC 定义：
   - `SqlEditor.jsx` 需要在 Supabase 中注册对应函数才能正常执行任意 SQL

4. 规范数据关联：
   - `applications` 和 `club_applications` 表结构需明确区分并避免重名冲突
   - `club_members`、`club_admins`、`member_audit_log` 需保证外键一致性

5. 梳理 RLS 与授权：
   - 核实 `auth.users` 与 `public.profiles` 之间的 user_id 类型匹配
   - 检查 `supabase.auth` 与客户端调用权限是否匹配表策略
