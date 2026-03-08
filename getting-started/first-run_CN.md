# 首次启动

[English](first-run.md)

本页带你完成一次尽量贴近真实代码行为的 XQNEXT 首次启动。

## 启动前确认

请先确保你已经：

- 安装后端依赖
- 检查过 `/config.toml`
- 如果需要构建 Web UI，也已经安装前端依赖

如果这些还没做，请先看：

- [安装指南](installation_CN.md)
- [配置说明](configuration_CN.md)

## 启动应用

推荐命令：

```bash
python -m src.main
```

Windows 包装入口：

```bash
python run.py
```

启动逻辑从 `/src/main.py` 开始：重新加载配置、初始化日志、创建 FastAPI app，并启动 uvicorn。

## 启动时真实会发生什么

一次正常启动通常会经历：

1. 从 `config.toml` 重新加载配置
2. 初始化日志
3. 通过 `/src/ui/api.py` 创建 FastAPI 应用
4. FastAPI lifespan 调用 `/src/core/app.py` 中的 `Application.startup()`
5. 初始化以下组件：
   - 事件总线
   - 存储层
   - 框架数据库
   - OneBot 适配器
   - 插件运行时
   - 可选的 AI 处理器与维护任务

如果 AI 模块不可用，应用仍然应该继续启动，只是 AI 相关功能不会开启。

## 正常情况下你会看到什么

`/src/main.py` 会输出启动横幅，并显示类似这些地址：

- Web UI: `http://host:port/`
- API 文档: `http://host:port/docs`

具体地址由配置文件中的 host 和 port 决定。

## 健康检查

最简单的检查方式是请求：

```text
GET /health
```

根据 `/tests/integration/test_api.py`，期望响应为：

```json
{"status": "healthy"}
```

## 登录 Web UI

默认登录信息来自 `config.toml` 的 `[web_ui]`，并由 `/src/security/auth.py` 中的认证管理器使用。

当前仓库默认值为：

- 用户名：`admin`
- 密码：`admin123`

同样，`/tests/integration/test_api.py` 也验证了这组默认凭据。

## 建议立刻检查的接口

登录成功后，可以优先检查：

- `/api/auth/me`
- `/api/system/status`
- `/api/system/config`
- `/api/plugins`
- `/api/onebot/status`

这些接口定义在 `/src/ui/api.py` 中。

## 如果 Web UI 打不开

依次检查：

1. 配置中 `web_ui.enabled` 是否为 `true`
2. `/src/ui/static/index.html` 是否存在
3. `/src/ui/static/assets/` 是否存在

如果缺少构建产物，请在 `/webui` 下执行：

```bash
npm install
npm run build
```

## 如果 OneBot 没连上

重点检查 `/config.toml` 中 `[onebot]` 配置，尤其是：

- `connection_type`
- `http_url`
- `ws_url`
- `access_token`
- 如果你用反向 WebSocket，还要检查 reverse 相关配置

这些值会在 `Application.startup()` 中传给 OneBot 适配器。

## 如果插件没有出现

请记住：插件状态是数据库驱动的。

即使 `/plugins` 目录里有插件文件夹，也不代表它一定会被加载。启用状态、优先级和配置来自框架数据库，由 `/src/core/database.py` 读取，再由 `/src/plugins/runtime/connector.py` 发送到插件运行时。

## 接下来建议阅读

- [Web UI 说明](webui_CN.md)
- [日常操作](../user-guide/operations_CN.md)
- [故障排查](../user-guide/troubleshooting_CN.md)
