# 故障排查

[English](troubleshooting.md)

本页聚焦于基于当前源码的排查路径，而不是靠想象力碰碰运气。

## 应用启动了，但 Web UI 不见了

请检查：

- `/src/ui/static/index.html`
- `/src/ui/static/assets/`
- `/config.toml` 中 `web_ui.enabled = true`

如果缺少构建产物，请在 `/webui` 下执行：

```bash
npm install
npm run build
```

相关代码路径：
- `/src/ui/api.py`

## 默认管理员账号无法登录

检查 `/config.toml` 的 `[web_ui]` 配置。

默认管理员用户是在启动时由 `/src/security/auth.py` 根据配置在内存中创建的。

如果你改了配置但没有重启，运行中的进程很可能还在使用旧凭据。

## OneBot 断开或消息收不到

优先检查：

- `/api/onebot/status`
- `/api/onebot/config`
- `config.toml` 中 `[onebot]`
- `/api/system/logs` 提供的日志

相关启动与消息路由代码：
- `/src/core/app.py`
- `/src/ui/api.py`

## 插件目录存在，但插件没有加载

请同时检查三个层面：

1. `/plugins` 下是否真的有插件目录
2. `plugin.json` 是否存在且格式有效
3. 框架数据库中的插件设置是否启用

请记住：连接器初始化插件时，是按数据库中的启用状态来选插件，不是简单地遍历目录就全加载。

相关代码：
- `/src/plugins/runtime/connector.py`
- `/src/core/database.py`

## 插件加载了，但行为很奇怪

请同时检查运行时桥接的两边：

- 主进程连接器：`/src/plugins/runtime/connector.py`
- 插件运行时进程：`/src/plugins/runtime/main.py`

因为插件是通过 stdio JSON 消息在独立进程中运行的，所以问题来源可能是：

- 插件自身代码
- manifest 或配置问题
- 请求/响应处理
- 运行时启动异常
- 拦截器超时或断路器行为

## 消息处理延迟很高，或者被莫名阻断

优先检查拦截器机制。

相关文件：
- `/src/plugins/interceptor.py`
- `/tests/test_interceptor_optimization.py`
- `/src/plugins/runtime/connector.py`
- `/src/core/app.py`

值得特别注意的事实：

- 执行模式有 `serial`、`parallel`、`hybrid`
- 断路器默认参数同时受配置文件和连接器逻辑影响
- `emit_event_with_context()` 会根据事件类型使用不同超时
- 超时通常会让流程继续，而不是直接把应用卡死

## 配置改了，看起来没生效

检查是否涉及 `/src/core/config.py` 中缓存过的配置对象。

不确定时，建议这样做：

1. 修改 `config.toml`
2. 重启应用
3. 再测试

办法朴素，但和代码现实很一致。

## AI 接口返回 unavailable 或 503

AI 子系统是可选能力。

请检查：

- `GET /api/ai/availability`
- 日志输出
- AI 相关模块是否真的已安装且可导入

`/src/ui/api.py` 中明确通过可用性检查来保护 AI 相关接口。

## 事件总线行为看起来不对

建议直接阅读：

- `/src/core/event_bus.py`
- `/tests/unit/test_event_bus.py`

测试文件其实是非常好的快速说明书，涵盖了订阅、发布、错误隔离和事件历史等预期行为。

## 继续阅读

- [日常操作](operations_CN.md)
- [插件管理](plugin-management_CN.md)
- [事件流](../contributor-guide/event-flow_CN.md)
