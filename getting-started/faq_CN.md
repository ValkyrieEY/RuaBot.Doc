# 常见问题

[English](faq.md)

## 这是 Next.js 项目吗？

不是。

当前实际前端是 React + TypeScript + Vite，证据见：

- `/webui/package.json`
- `/webui/vite.config.ts`

仓库里确实可能还残留一些 Next.js 的旧说法，但代码显然已经翻篇了。

## 主入口文件在哪里？

后端主入口是：

- `/src/main.py`

另外还有 Windows 包装入口：

- `/run.py`

## 为什么我改了配置却没有立刻生效？

因为 `/src/core/config.py` 中的 `get_config()` 会缓存配置，而且并不是所有子系统都支持完全动态刷新。

修改 `config.toml` 后，最稳妥的方式还是重启应用。

## 为什么 Web UI 显示的是提示页，而不是真正的页面？

通常是因为以下构建产物缺失：

- `/src/ui/static/index.html`
- `/src/ui/static/assets/`

请在 `/webui` 下执行：

```bash
npm install
npm run build
```

## 为什么插件目录存在，但插件没有启用？

因为插件是否启用并不只看目录。

启用状态来自数据库中的插件设置，由 `/src/core/database.py` 读取，再通过 `/src/plugins/runtime/connector.py` 初始化到运行时。

## 插件是在主进程里运行的吗？

不是。

框架会为插件启动一个独立 Python 运行时进程：

- `/src/plugins/runtime/connector.py`
- `/src/plugins/runtime/main.py`

它们通过 stdio 上的 JSON 消息通信。

## 为什么消息行为看起来比普通发布订阅复杂很多？

因为它确实更复杂。

对入站消息而言，`/src/core/app.py` 会先创建 `EventContext`，送入插件处理链，允许修改或阻断，然后才继续发布给普通订阅者。

## AI 是必需的吗？

不是。

AI 子系统是可选能力。应用会先检测 AI 模块是否可用，不可用时会跳过 AI 初始化。

## 数据存在哪里？

默认框架数据库位于：

- `/data/framework.db`

这个数据库会保存插件设置、二进制存储、AI 配置以及其他框架数据。

## 一开始应该先跑哪些测试？

建议先从这些开始：

```bash
python -m pytest
python -m pytest tests/unit/test_event_bus.py
python -m pytest tests/integration/test_api.py
python -m pytest tests/test_interceptor_optimization.py
```

## 接下来该看什么？

- [日常操作](../user-guide/operations_CN.md)
- [架构总览](../contributor-guide/architecture-overview_CN.md)
- [插件开发索引](../plugin-development/README_CN.md)
