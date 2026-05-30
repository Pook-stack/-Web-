# 俱乐部聊天系统技术方案

## 一、系统架构设计

### 1.1 架构图

```
┌────────────────────────────────────────────────────────────────────────┐
│                         前端层 (React)                                │
├────────────────────────────────────────────────────────────────────────┤
│  ChatSelector.jsx    PrivateChat.jsx    PublicChat.jsx               │
│       │                    │                    │                     │
│       └────────────────────┼────────────────────┘                     │
│                            ▼                                        │
│              ┌───────────────────────────────┐                        │
│              │      chatService.js          │                        │
│              │  (消息发送/接收/存储/订阅)    │                        │
│              └───────────────┬───────────────┘                        │
│                              ▼                                        │
├────────────────────────────────────────────────────────────────────────┤
│                     Supabase 后端服务                                 │
├────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐        │
│  │  chat_rooms  │    │   messages   │    │ message_status   │        │
│  │  (聊天室表)  │    │   (消息表)   │    │  (消息状态表)    │        │
│  └──────┬──────┘    └──────┬──────┘    └────────┬─────────┘        │
│         │                  │                     │                   │
│         └──────────────────┼─────────────────────┘                   │
│                            ▼                                         │
│              ┌───────────────────────────────┐                        │
│              │    Supabase Realtime API      │                        │
│              │  (WebSocket 实时消息推送)     │                        │
│              └───────────────────────────────┘                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈选型

| 层级 | 技术 | 版本 | 说明 |
|-----|------|------|-----|
| 前端框架 | React | 18+ | UI 界面框架 |
| 状态管理 | React Hooks | - | 轻量级状态管理 |
| 样式框架 | Tailwind CSS | 3+ | 响应式样式 |
| 数据库 | Supabase (PostgreSQL) | - | 数据存储与实时推送 |
| 实时通信 | Supabase Realtime | - | WebSocket 实时消息 |
| 构建工具 | Vite | 6+ | 快速构建 |

---

## 二、数据模型设计

### 2.1 数据库表结构

#### chat_rooms（聊天室表）

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|-----|
| id | UUID | PRIMARY KEY | 聊天室唯一标识 |
| club_id | UUID | REFERENCES clubs(id) | 所属俱乐部ID |
| type | VARCHAR(20) | NOT NULL, CHECK IN ('private', 'group') | 聊天室类型 |
| participant_ids | TEXT[] | NOT NULL, DEFAULT '{}' | 参与者用户ID列表 |
| name | VARCHAR(100) | NULL | 聊天室名称（群组使用） |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

#### messages（消息表）

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|-----|
| id | UUID | PRIMARY KEY | 消息唯一标识 |
| chat_room_id | UUID | REFERENCES chat_rooms(id) | 所属聊天室ID |
| sender_id | UUID | REFERENCES users(id) | 发送者用户ID |
| content | TEXT | NOT NULL | 消息内容 |
| type | VARCHAR(20) | DEFAULT 'text' | 消息类型：text/image/file |
| status | VARCHAR(20) | DEFAULT 'sent' | 状态：sent/delivered/read |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### message_status（消息状态表）

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|-----|
| id | UUID | PRIMARY KEY | 记录唯一标识 |
| message_id | UUID | REFERENCES messages(id) | 关联消息ID |
| user_id | UUID | REFERENCES users(id) | 用户ID |
| status | VARCHAR(20) | DEFAULT 'delivered' | 状态：delivered/read |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### 2.2 索引设计

```sql
-- 优化查询性能
CREATE INDEX idx_chat_rooms_club_id ON chat_rooms(club_id);
CREATE INDEX idx_chat_rooms_participants ON chat_rooms USING gin (participant_ids);
CREATE INDEX idx_messages_chat_room_id ON messages(chat_room_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_message_status_message_id ON message_status(message_id);
CREATE INDEX idx_message_status_user_id ON message_status(user_id);
```

---

## 三、API 接口设计

### 3.1 聊天室接口

| 接口 | 方法 | 说明 | 参数 |
|-----|------|-----|------|
| `/api/chat/rooms` | GET | 获取用户聊天室列表 | userId |
| `/api/chat/rooms` | POST | 创建新聊天室 | clubId, type, participantIds, name |
| `/api/chat/rooms/:id` | GET | 获取聊天室详情 | roomId |
| `/api/chat/rooms/:id` | DELETE | 删除聊天室 | roomId |

### 3.2 消息接口

| 接口 | 方法 | 说明 | 参数 |
|-----|------|-----|------|
| `/api/chat/messages/:roomId` | GET | 获取历史消息 | roomId, limit, offset |
| `/api/chat/messages` | POST | 发送消息 | roomId, senderId, content, type |
| `/api/chat/messages/:id` | PUT | 更新消息状态 | messageId, userId, status |
| `/api/chat/messages/:id` | DELETE | 删除消息 | messageId |

---

## 四、核心服务实现

### 4.1 chatService 核心方法

| 方法名 | 功能 | 参数 | 返回值 |
|-------|------|------|-------|
| `getUserRooms` | 获取用户聊天室列表 | userId | { data, error } |
| `createRoom` | 创建聊天室 | clubId, type, participantIds, name | { data, error } |
| `createPrivateRoom` | 创建私人聊天室 | clubId, userId1, userId2 | { data, error, alreadyExists } |
| `createPublicRoom` | 创建公共聊天室 | clubId | { data, error, alreadyExists } |
| `sendMessage` | 发送消息 | roomId, senderId, content, type | { data, error } |
| `getMessages` | 获取消息历史 | roomId, limit, offset | { data, error } |
| `updateMessageStatus` | 更新消息状态 | messageId, userId, status | { data, error } |
| `markMessagesAsRead` | 标记消息已读 | roomId, userId | { success, error } |
| `subscribeToRoom` | 订阅实时消息 | roomId, callback | subscription |
| `searchMessages` | 搜索消息 | roomId, keyword | { data, error } |
| `getUnreadCount` | 获取未读数量 | roomId, userId | { count, error } |

---

## 五、安全措施

### 5.1 消息内容安全

```javascript
// 内容过滤 - 防止 XSS 攻击
sanitizedContent = content.trim().replace(/[<>]/g, '');
```

### 5.2 权限控制

| 场景 | 权限要求 |
|-----|---------|
| 进入私人聊天 | 必须是聊天室参与者 |
| 进入公共聊天 | 必须是俱乐部成员 |
| 发送消息 | 必须是聊天室参与者 |
| 删除消息 | 仅消息发送者或管理员 |

### 5.3 数据加密

- 使用 HTTPS 传输所有数据
- Supabase 自动加密数据库存储
- 敏感字段加密存储

---

## 六、组件说明

### 6.1 ChatSelector（聊天选择器）

**功能**：选择聊天类型（公共大厅/私人聊天）并列出成员

**核心逻辑**：
- 加载俱乐部成员列表
- 创建/获取私人聊天室
- 创建/获取公共聊天室

### 6.2 PrivateChat（私人聊天）

**功能**：一对一实时聊天

**核心特性**：
- 实时消息推送（WebSocket）
- 消息状态追踪（发送中/已发送/已读）
- 表情支持
- 消息历史加载

### 6.3 PublicChat（公共大厅）

**功能**：俱乐部全员公共聊天

**核心特性**：
- 实时消息推送
- 成员在线状态显示
- 消息状态追踪

---

## 七、部署与配置

### 7.1 数据库初始化

执行 SQL 脚本：`scripts/create-chat-tables.sql`

```bash
# 通过 Supabase SQL Editor 执行
# 或使用 CLI
supabase db push
```

### 7.2 环境变量

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 7.3 实时订阅配置

确保在 Supabase 控制台启用 Realtime 扩展：
1. 进入 Supabase Dashboard
2. 导航到 Realtime 扩展
3. 启用 chat_rooms、messages、message_status 表的实时订阅

---

## 八、性能优化

### 8.1 消息分页

```javascript
// 默认每页 50 条消息
const { data } = await chatService.getMessages(roomId, 50, 0);
```

### 8.2 懒加载

- 仅加载可视区域消息
- 滚动到顶部时加载更多历史

### 8.3 缓存策略

- 本地缓存聊天室列表
- 消息状态本地存储

---

## 九、错误处理

### 9.1 网络错误处理

```javascript
try {
  const result = await chatService.sendMessage(roomId, senderId, content);
  if (result.error) {
    handleError(result.error);
  }
} catch (error) {
  console.error('网络错误:', error);
  showNotification('网络连接失败，请稍后重试');
}
```

### 9.2 数据库错误处理

- 表不存在时的优雅降级
- 权限不足时的友好提示

---

## 十、测试指南

### 10.1 功能测试

| 测试场景 | 预期结果 |
|---------|---------|
| 创建私人聊天室 | 成功创建，双方可见 |
| 创建公共聊天室 | 成功创建，俱乐部成员可见 |
| 发送文本消息 | 实时显示给所有参与者 |
| 消息状态更新 | 已发送/已读状态正确显示 |
| 消息历史加载 | 正确加载历史消息 |
| 搜索消息 | 正确匹配关键词 |

### 10.2 性能测试

| 指标 | 目标 |
|-----|------|
| 消息延迟 | < 100ms |
| 消息历史加载 | < 500ms |
| 聊天室列表加载 | < 300ms |

---

## 十一、项目文件结构

```
src/
├── components/
│   ├── ChatSelector.jsx    # 聊天选择器
│   ├── PrivateChat.jsx     # 私人聊天组件
│   ├── PublicChat.jsx      # 公共聊天组件
│   └── ChatInterface.jsx   # 旧版聊天界面（保留兼容）
├── services/
│   ├── chatService.js      # 聊天服务
│   └── supabase.js         # 数据库服务
└── scripts/
    └── create-chat-tables.sql  # 数据库初始化脚本
```