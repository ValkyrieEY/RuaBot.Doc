# API 总览

[English](api-surface-overview.md)

本页总结 `/src/ui/api.py` 当前实现的后端 API 面。

## 总体说明

- 这个 API 文件很大，而且是核心枢纽。
- 受保护接口通常使用 bearer token 认证。
- 系统还提供了 `/ws/messages` WebSocket 通道。
- 同时有一个最小健康检查接口 `/health`。

## 认证与设备密钥

代表性接口：

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/device-login`
- `POST /api/device-keys`
- `GET /api/device-keys`
- `POST /api/device-keys/{key_id}/enable`
- `POST /api/device-keys/{key_id}/disable`
- `DELETE /api/device-keys/{key_id}`

## 插件

代表性接口：

- `GET /api/plugins`
- `GET /api/plugins/{plugin_name}`
- `DELETE /api/plugins/{plugin_name}`
- `POST /api/plugins/{plugin_name}/action`
- `POST /api/plugins/reload-all`
- `PUT /api/plugins/{plugin_name}/config`
- `POST /api/plugins/upload`
- `POST /api/plugins/config-files`
- `DELETE /api/plugins/config-files/{file_key}`
- `GET /api/plugins/install-progress/{task_id}`
- `POST /api/plugins/install-from-github`
- `GET /api/plugins/{plugin_name}/config-schema`

## OneBot

代表性接口：

- `GET /api/onebot/status`
- `GET /api/onebot/config`
- `POST /api/onebot/config`
- `POST /api/onebot/reconnect`
- `GET /api/onebot/login-info`

## 聊天与消息

代表性接口：

- `GET /api/messages/log`
- `GET /api/chat/contacts`
- `POST /api/chat/send`
- `GET /api/chat/image-proxy`
- `GET /api/chat/history/{chat_type}/{chat_id}`
- `GET /api/chat/groups/{group_id}/members`

## 系统

代表性接口：

- `GET /api/system/status`
- `GET /api/system/config`
- `POST /api/system/config`
- `GET /api/system/threadpool-stats`
- `POST /api/system/reset-admin-password`
- `GET /api/system/logs`
- `POST /api/system/open-dialog`
- `POST /api/system/list-directory`

另外还有启动页相关接口：

- `GET /api/splash/check`
- `POST /api/splash/mark-shown`

## AI

AI 接口面很大，主要包括：

- 可用性与健康检查
- 全局与群级 AI 配置
- 工具
- 模型
- 预设
- 记忆
- MCP 服务器与工具
- 学习数据
- 维护任务
- 知识图谱
- 工具权限与管理员用户
- 审批日志

代表性示例：

- `GET /api/ai/availability`
- `GET /api/ai/health`
- `GET|PUT /api/ai/config`
- `GET|POST|PUT|DELETE /api/ai/models*`
- `GET|POST|PUT|DELETE /api/ai/presets*`
- `GET|DELETE /api/ai/memories*`
- `GET|POST|PUT|DELETE /api/ai/mcp/servers*`
- `GET /api/ai/knowledge/stats`
- `GET /api/ai/learning/stats`

## NapCat

代表性接口：

- `GET /api/napcat/docker/containers`
- `GET /api/napcat/system/info`
- `GET /api/napcat/config`
- `POST /api/napcat/config`
- `POST /api/napcat/deploy`
- `GET /api/napcat/progress/{job_id}`
- `POST /api/napcat/cancel`
- `GET /api/napcat/status`
- `POST /api/napcat/start`
- `POST /api/napcat/stop`
- `GET /api/napcat/logs`
- `GET /api/napcat/webui`
- `POST /api/napcat/path`
- `POST /api/napcat/sudo-password`

## 静态路由与 WebSocket

值得注意的非 API 路由：

- `GET /health`
- `WebSocket /ws/messages`
- `/` 以及其他非 API 路径上的静态资源与 SPA 路由回退

## 一个提醒

本页只是总览，不代表每个接口在成熟度和测试覆盖上都完全一致。

如果你要修改相关行为，请始终回到 `/src/ui/api.py` 看真实实现。

## 继续阅读

- [日常操作](../user-guide/operations_CN.md)
- [AI 功能](../user-guide/ai-features_CN.md)
- [安全与鉴权](../contributor-guide/security-and-auth_CN.md)
