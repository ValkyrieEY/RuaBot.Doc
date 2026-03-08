# 实时消息与日志

[English](realtime-and-logs.md)

本页介绍 XQNEXT 中与实时更新和日志观测相关的接口与机制。

## WebSocket 实时通道

后端暴露了：

- `/ws/messages`

`/src/ui/api.py` 中定义的 `WebSocketManager` 会：

- 接受客户端连接
- 在首个连接建立时订阅事件总线
- 监听以下事件：
  - `onebot.message`
  - `onebot.notice`
  - `onebot.request`
- 将整理后的事件广播给所有已连接客户端

所以实时消息视图是建立在事件总线之上的，不是另起了一套偷偷轮询的世界线。

## 事件总线在实时链路中的角色

`/src/core/event_bus.py` 中的事件总线提供了：

- 异步队列分发
- 事件历史记录
- 队列统计
- 收发计数

因此，实时界面异常可能出现在这些任一环节：

- OneBot 适配器
- 插件拦截与事件上下文处理
- 事件总线分发
- WebSocket 广播

排查时把整条链路一起看，通常比只盯一个点更有效。

## 系统日志接口

常用日志接口：

- `GET /api/system/logs`

它定义在 `/src/ui/api.py` 中，为 Web UI 提供后端日志查看能力。

## 日志配置

日志配置来自 `config.toml`，并在 `/src/main.py` 中初始化，主要字段包括：

- `log_level`
- `log_file`
- `log_max_bytes`
- `log_backup_count`

当前默认值来自：
- `/config.toml`

另外，启动代码还可能为了和 `debug` 模式保持一致，而主动调整日志级别行为。

## 线程池统计

常用接口：

- `GET /api/system/threadpool-stats`

这有助于观察插件线程池和 AI 线程池等运行时执行环境的状态。

## NapCat 日志

如果你启用了 NapCat 集成，还可以查看：

- `GET /api/napcat/logs`
- `GET /api/napcat/status`
- `GET /api/napcat/progress/{job_id}`

## 消息日志与聊天历史接口

如果你更想看的是“用户和机器人到底说了什么”，而不是裸日志，那么这些接口通常更有帮助：

- `GET /api/messages/log`
- `GET /api/chat/history/{chat_type}/{chat_id}`
- `GET /api/chat/contacts`

## 常见排查顺序

当实时行为看起来不对时，建议按这个顺序检查：

1. 检查 `/health`
2. 检查 `/api/system/status`
3. 检查 `/api/onebot/status`
4. 查看 `/api/system/logs`
5. 查看消息历史相关接口
6. 确认客户端是否连接了 `/ws/messages`
7. 考虑是否有插件在事件到达普通订阅者之前就已经修改或阻断了它

## 继续阅读

- [日常操作](operations_CN.md)
- [事件流](../contributor-guide/event-flow_CN.md)
- [故障排查](troubleshooting_CN.md)
