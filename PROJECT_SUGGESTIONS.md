# 项目建议记录

以下建议已由 AI 记录，并将用于后续项目推进：

1. 检查并补全 `VITE_ANTHROPIC_API_KEY` 环境变量配置。
2. 读取并分析关键前端页面组件，继续扩展网站功能。
3. 统一数据库架构与 Supabase schema，明确表结构与触发器逻辑。
4. 优化当前 Git 修改状态，并准备部署流程。
5. 确认并完善用户认证、聊天、通知和管理后台的集成逻辑。

---

## 当前工作进度

- [x] 读取前端关键页面组件
- [x] 验证环境配置
- [x] 审查数据库 schema（已生成 DATABASE_REVIEW.md）
- [x] 验证前端构建（Vite build 成功）

## 近期修复与优化

- 修复 `src/components/ClaudeChat.jsx` 中的消息状态同步问题
- 将 `src/services/claudeService.js` 替换为浏览器可用的 HTTP 请求方式，解决 `@anthropic-ai/sdk` 导致构建失败的问题
