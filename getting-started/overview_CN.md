# 入门概览

[English](overview.md)

本页先帮你建立对 XQNEXT 的正确认知，避免一上来就被目录结构和历史文案带偏。

## XQNEXT 是什么

XQNEXT 是一个 FastAPI 应用，主要由五部分组成：

1. **OneBot 适配层**，负责协议连接
2. **事件总线**，负责异步内部通信
3. **插件运行时**，运行在独立 Python 进程中
4. **可选 AI 子系统**，负责模型、记忆、预设、MCP 等能力
5. **React + Vite Web UI**，生产环境由后端提供静态资源

相关源码：
- `src/main.py`
- `src/core/app.py`
- `src/protocol/onebot.py`
- `src/plugins/runtime/connector.py`
- `src/plugins/runtime/main.py`
- `src/ui/api.py`
- `webui/package.json`
- `webui/vite.config.ts`

## 应用启动时真实发生了什么

实际启动链路如下：

1. 执行 `python -m src.main` 或 `python run.py`
2. `src/main.py` 重新加载配置、同步部分日志设置、初始化日志并创建 FastAPI app
3. `src/ui/api.py` 中的 FastAPI lifespan 调用 `Application.startup()`
4. `src/core/app.py` 初始化事件总线、存储、数据库、OneBot 适配器、AI 服务、图片缓存、插件运行时和后台任务

所以排查启动问题时，不要只盯着一个入口文件看，系统并不会因为你认真凝视它就自动把全流程说清楚。

## 你最先需要认识的目录

- `config.toml` — 主配置文件
- `src/main.py` — 进程启动与 uvicorn 启动
- `src/core/` — 配置、应用生命周期、事件总线、存储、数据库
- `src/protocol/` — OneBot 适配器
- `src/plugins/` — 插件编排与拦截逻辑
- `src/plugins/runtime/` — 独立插件运行时进程
- `src/security/` — 鉴权、权限、审计、设备密钥
- `src/ui/` — FastAPI API 层与前端静态资源托管
- `webui/` — 前端源码
- `plugins/` — 已安装插件
- `tests/` — 单元测试、集成测试、拦截器测试

## 前端现状澄清

当前前端栈是 **React 18 + TypeScript + Vite**

证据：
- `webui/package.json` 使用 `vite`
- `webui/vite.config.ts` 将构建产物输出到 `../src/ui/static`

## 插件系统现状澄清

插件**不是**直接运行在主进程里的。

主进程通过以下文件启动一个独立插件运行时：
- `src/plugins/runtime/connector.py`
- `src/plugins/runtime/main.py`

二者通过 stdio 上的 JSON 消息通信。

这会影响调试方式、日志位置、生命周期理解、依赖安装行为，以及为什么“插件出错”不一定等于“整个框架崩了”。

## 消息流现状澄清

入站消息流程并不是“收到 OneBot 事件，然后直接广播给订阅者”这么简单。

对消息事件而言，`src/core/app.py` 会先构建 `EventContext`，送入插件运行时，让插件有机会修改或阻断，再继续进入普通事件总线。

出站消息发送同样可能经过拦截器链。

如果某个行为看起来过于玄学，通常不是系统会读心，而是你还没把前后的处理链一起看完。

## AI 子系统状态

AI 子系统是可选能力。

`src/core/ai_detector.py` 会检查必要模块是否存在。若可用，启动时会初始化 AI 消息处理器和维护任务；若不可用，框架其余部分仍可正常启动。

## 接下来建议阅读

- [安装指南](installation_CN.md)
- [配置说明](configuration_CN.md)
- [首次启动](first-run_CN.md)
- [Web UI 说明](webui_CN.md)
