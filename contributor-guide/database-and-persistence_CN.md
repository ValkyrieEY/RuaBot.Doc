# 数据库与持久化

[English](database-and-persistence.md)

本页说明框架中的持久化机制是如何工作的。

## 主框架数据库

主要数据库实现位于：

- `/src/core/database.py`

默认数据库路径是 SQLite：

- `/data/framework.db`

`DatabaseManager` 默认通过 `sqlite+aiosqlite` 使用 SQLAlchemy 的异步支持。

## 框架数据库里保存什么

根据当前代码，框架数据库至少保存：

- 插件设置
- 二进制存储
- AI 配置记录
- LLM 模型
- AI 预设
- AI 记忆
- MCP 服务器记录
- 工具权限相关数据
- 在 AI 知识模块可用时创建的知识图谱表

## 插件设置

`DatabaseManager` 中的插件设置支持：

- 按 author/name 查询
- 列出全部插件或仅启用插件
- 创建、更新、删除
- 按优先级排序

这也是为什么插件启用状态和优先级是数据库驱动的，而不是单纯看文件目录。

## 二进制存储

`database.py` 中的二进制存储支持：

- `get_binary()`
- `set_binary()`
- `delete_binary()`
- `list_binary_keys()`

插件存储 API 就依赖这套能力，它提供了框架级二进制持久化。

代码还会在存储值超过 10 MB 时给出警告，这对那些突然想把数据库当文件柜的插件来说，多少算一点提醒。

## AI 持久化

同一个数据库层还通过以下模型保存 AI 相关记录：

- `AIConfig`
- `LLMModel`
- `AIPreset`
- `AIMemory`
- `MCPServer`

代码中为这些实体提供了列出、创建、更新、删除以及批量更新等辅助方法。

## 迁移机制

`DatabaseManager.initialize()` 会执行一套轻量级迁移逻辑。

当前源码里的一个例子是：

- 如果 `ai_presets` 缺少 `repetition_penalty` 列，则自动补上

这是一套轻量方案，不是完整的迁移框架。

## 另一套存储抽象

除了主框架数据库，项目里还有一套更通用的存储抽象，位于：

- `/src/core/storage.py`

其中定义了：

- `Storage` 抽象基类
- `MemoryStorage`
- `SQLiteStorage`
- 全局存储初始化辅助函数

## 存储后端

`storage.py` 支持：

- 带可选 TTL 的内存存储
- 带 TTL 清理的 SQLite 键值存储

全局存储实例默认是 `MemoryStorage`，除非显式初始化为其他后端。

在 `Application.startup()` 中，存储会基于配置的数据库路径初始化，从而在数据目录下使用 SQLite 文件。

## 为什么同时有 database.py 和 storage.py

因为它们解决的是不同层次的问题：

- `database.py` 负责结构化框架记录
- `storage.py` 负责更简单、通用的键值型存储抽象

如果你在改结构化应用数据，优先看 `database.py`。
如果你在改更像缓存或 kv 存储的行为，也要一起看 `storage.py`。

## 继续阅读

- [后端结构](backend-structure_CN.md)
- [配置参考](../reference/configuration-reference_CN.md)
- [AI 功能](../user-guide/ai-features_CN.md)
