# 日常操作

[English](operations.md)

本页介绍如何日常运行和管理一个已启动的 XQNEXT 实例。

## 运维时最常看的入口

最常用的操作界面包括：

- Web UI：`/`
- FastAPI 文档：`/docs`
- 系统接口：`/api/system/*`
- 插件接口：`/api/plugins*`
- OneBot 接口：`/api/onebot/*`
- 聊天与消息接口：`/api/chat/*`、`/api/messages/*`

这些接口都定义在：
- `/src/ui/api.py`

## 日常启动与停止

### 启动

```bash
python -m src.main
```

Windows 下也可以：

```bash
python run.py
```

### 停止

正常结束 uvicorn 进程即可。`/src/core/app.py` 中的 `Application.shutdown()` 会负责：

- 发布 `app.shutdown` 事件
- 停止 OneBot 适配器
- 释放插件运行时
- 停止图片清理任务
- 取消后台任务
- 停止事件总线
- 关闭存储层

## 查看系统状态

可以使用：

- `GET /api/system/status`
- `GET /health`

`/tests/integration/test_api.py` 覆盖了基础健康检查和系统状态行为。

其中 `/api/system/status` 更适合运维，因为它比 `/health` 提供了更多子系统状态信息。

## 查看和调整当前配置

使用：

- `GET /api/system/config`
- `POST /api/system/config`

但请记住，不是所有配置修改都适合在运行中完全相信已经生效。遇到缓存配置对象或已初始化服务时，重启仍然是更稳妥的做法。

## 处理 OneBot 连接问题

常用接口：

- `GET /api/onebot/status`
- `GET /api/onebot/config`
- `POST /api/onebot/config`
- `POST /api/onebot/reconnect`
- `GET /api/onebot/login-info`

如果消息不进不出，这几类接口通常值得优先检查。

## 查看消息、联系人与聊天记录

常用接口包括：

- `GET /api/messages/log`
- `GET /api/chat/contacts`
- `POST /api/chat/send`
- `GET /api/chat/history/{chat_type}/{chat_id}`
- `GET /api/chat/groups/{group_id}/members`
- `GET /api/chat/image-proxy`

这些接口支撑了消息浏览、发送以及聊天页面相关能力。

## 查看日志与运行时信息

常用接口：

- `GET /api/system/logs`
- `GET /api/system/threadpool-stats`
- 如果使用 NapCat，还可以看 `GET /api/napcat/logs`

另外，事件总线在 `/src/core/event_bus.py` 中维护了内存统计信息。

## 运维人员需要知道的认证基础

关键接口：

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

默认管理员账号来自 `[web_ui]` 配置，并由 `/src/security/auth.py` 在内存中创建。

这意味着修改管理员密码更像是在改变“下次启动时默认生成什么”，而不是修改某张持久化用户表。

## 设备密钥登录

系统还提供了设备密钥登录流程：

- `POST /api/device-keys`
- `GET /api/device-keys`
- `POST /api/device-keys/{key_id}/enable`
- `POST /api/device-keys/{key_id}/disable`
- `DELETE /api/device-keys/{key_id}`
- `POST /api/auth/device-login`

相关源码：
- `/src/ui/api.py`
- `/src/security/device_keys.py`

## 运维时常见的几个坑

### 插件可能在普通订阅者之前改掉行为

如果消息处理看起来不对，不要只查事件总线订阅者。

`/src/core/app.py` 会先让消息和通知经过插件上下文处理链，再继续进入普通事件订阅流程。

### 插件启用状态来自数据库

`/plugins` 目录里有插件，并不等于插件已经启用。真正的启用状态和配置覆盖值来自框架数据库。

### 改了前端源码，不等于生产页面已经更新

`/webui` 里的改动只有在执行 `npm run build` 并更新 `/src/ui/static` 之后，才会反映到后端实际提供的 Web UI 中。

## 继续阅读

- [插件管理](plugin-management_CN.md)
- [实时消息与日志](realtime-and-logs_CN.md)
- [故障排查](troubleshooting_CN.md)
