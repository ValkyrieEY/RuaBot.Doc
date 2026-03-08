# 插件开发

[English](README.md)

本节面向想为 XQNEXT 编写自己插件的用户。

目标很直接：让你能真正上手，而不是看完一堆概念后仍然不知道该创建什么文件、该写哪些方法、为什么 Web UI 里配置能自动出来、以及插件出问题时该先怀疑谁。

## 建议阅读顺序

如果这是你的第一个插件，建议按这个顺序读：

1. [快速开始](quickstart_CN.md)
2. [插件清单与目录结构](plugin-manifest-and-layout_CN.md)
3. [运行时架构](runtime-architecture_CN.md)
4. [插件 API](plugin-api_CN.md)
5. [拦截器](interceptors_CN.md)

## XQNEXT 插件开发的几个关键特点

和一些更简单的机器人框架相比，XQNEXT 的插件机制有这些重要区别：

- 插件运行在**独立 Python 进程**中
- 插件启用状态、配置覆盖值、优先级都由**数据库**驱动
- `plugin.json` 同时负责**运行时元数据**和**基于 schema 的配置 UI**
- 入站和出站消息在进入普通订阅者之前，可能先经过 **event context** 和 **interceptor** 处理链

也就是说，插件不是“随便丢个 Python 文件进去”就完事，它要遵守一整套运行时约定。

## 插件行为背后的核心源码

如果文档和直觉发生冲突，请优先相信这些文件：

- `src/plugins/runtime/connector.py`
- `src/plugins/runtime/main.py`
- `src/plugins/interceptor.py`
- `src/core/app.py`
- `src/ui/api.py`

一个重要提醒：仓库里虽然还有 `src/plugins/runtime/plugin_api.py`，但当前激活的运行时路径里，真正被构造并使用的 `PluginAPI` 在 `src/plugins/runtime/main.py` 中。对插件作者来说，`main.py` 才是当前行为规范。

## 仓库里的真实插件示例

建议优先参考这些 manifest：

- `plugins/like_plugin/plugin.json`
- `plugins/kawaii_status/plugin.json`
- `plugins/github_issues_capture/plugin.json`
- `plugins/message_relay_client/plugin.json`
- `plugins/group_manager/plugin.json`

它们展示了当前代码库真正使用的几类模式：

- 简单配置驱动型插件
- 带依赖声明的插件
- 显式声明优先级的插件
- `config_schema` 较完整的插件

## 本节会具体讲什么

- 如何创建插件目录结构
- 如何编写 `plugin.json`
- 配置如何合并和持久化
- 运行时如何加载插件
- 插件实例上哪些方法真的会被调用
- 如何发消息、如何调用 OneBot API
- 配置和存储辅助方法怎么工作
- 拦截器如何注册和生效
- 加载失败、超时、配置不匹配时应如何排查

## 本节不会假装什么

本节不会假装插件系统已经被一层完美抽象完全包起来。

XQNEXT 提供了很好用的基础能力，但最稳妥的开发方式，仍然是尽量贴近当前运行时源码和现有插件示例。

## 接下来还值得读什么

读完本节后，最有帮助的延伸阅读通常是：

- [事件流](../contributor-guide/event-flow_CN.md)
- [API 总览](../reference/api-surface-overview_CN.md)
- [`plugin.json` 参考](../reference/plugin-json-reference_CN.md)
