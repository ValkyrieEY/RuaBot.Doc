# AI 功能

[English](ai-features.md)

本页介绍当前框架中已经暴露出来的 AI 相关能力。

## 先说最重要的：AI 是可选的

AI 子系统并不是框架运行的前提。

`/src/core/app.py` 会通过 `/src/core/ai_detector.py` 检查 AI 模块可用性。如果相关模块不存在，应用会跳过 AI 初始化，而不是直接拒绝启动。

API 层也提供了可用性检查接口。

## 当前 AI 相关 API 范围

`/src/ui/api.py` 当前暴露了相当大的 AI 接口面，包括：

- `GET /api/ai/availability`
- `GET /api/ai/health`
- `GET|PUT /api/ai/config`
- `/api/ai/groups*` 下的群 AI 配置管理
- `/api/ai/tools*` 下的工具可用性与启用状态管理
- `/api/ai/models*` 下的模型 CRUD
- `/api/ai/presets*` 下的预设 CRUD
- `/api/ai/memories*` 下的记忆查看与清理
- `/api/ai/mcp/servers*` 下的 MCP 服务管理
- `/api/ai/learning/*` 下的学习与分析数据接口
- Dream 与表达方式检查相关维护接口
- `/api/ai/knowledge/*` 下的知识图谱接口
- HeartFlow 接口
- 工具权限与审批接口

## 模型管理

模型相关接口包括：

- `GET /api/ai/models`
- `GET /api/ai/models/{model_uuid}`
- `POST /api/ai/models`
- `PUT /api/ai/models/{model_uuid}`
- `DELETE /api/ai/models/{model_uuid}`
- `GET /api/ai/models/providers/list`

模型记录由 `/src/core/database.py` 中的 `LLMModel` 相关数据库操作管理。

## 预设管理

预设接口包括：

- `GET /api/ai/presets`
- `GET /api/ai/presets/{preset_uuid}`
- `POST /api/ai/presets`
- `PUT /api/ai/presets/{preset_uuid}`
- `DELETE /api/ai/presets/{preset_uuid}`

这些预设会持久化在框架数据库中，并可与 AI 配置项关联。

## 记忆管理

记忆接口包括：

- `GET /api/ai/memories`
- `GET /api/ai/memories/{memory_uuid}`
- `DELETE /api/ai/memories/{memory_uuid}`
- `POST /api/ai/memories/clear`

## MCP 支持

当前 API 包含 MCP 服务器管理能力：

- `GET /api/ai/mcp/servers`
- `GET /api/ai/mcp/servers/{server_uuid}`
- `POST /api/ai/mcp/servers`
- `PUT /api/ai/mcp/servers/{server_uuid}`
- `DELETE /api/ai/mcp/servers/{server_uuid}`
- `POST /api/ai/mcp/servers/{server_uuid}/connect`
- `POST /api/ai/mcp/servers/{server_uuid}/disconnect`
- `GET /api/ai/mcp/servers/{server_uuid}/tools`
- `GET /api/ai/mcp/tools`

对应记录会通过 `/src/core/database.py` 中的 `MCPServer` 支持进行存储。

## 学习相关数据

当前 API 暴露了不少学习与观察数据，例如：

- expressions
- jargons
- chat history
- message records
- persons
- groups
- stats
- stickers
- learning config

代表性接口包括：

- `GET /api/ai/learning/expressions`
- `GET /api/ai/learning/jargons`
- `GET /api/ai/learning/chat-history`
- `GET /api/ai/learning/stats`
- `GET|PUT /api/ai/learning/config`

## 维护任务

AI 相关维护型接口包括：

- Dream 的配置、统计与手动触发
- Expression Check 的配置、统计与手动触发
- Expression Reflect 相关接口

这里有一个非常值得记录的源码细节：在 `/src/ui/api.py` 中，expression reflect 相关接口已经说明旧的 reflector 已移除，当前统计和手动触发实际走的是 auto checker 实现。

所以如果你在界面或接口里看到两个名字并存，更像是历史兼容层，而不是两套完全独立的新系统。

## 知识图谱

知识图谱相关接口包括：

- `GET /api/ai/knowledge/stats`
- `GET /api/ai/knowledge/triples`
- `GET /api/ai/knowledge/entities`
- `GET /api/ai/knowledge/entity/{entity_name}`
- `POST /api/ai/knowledge/query`

另外，`/src/core/database.py` 在初始化时会尝试导入知识图谱模块，并在可用时创建对应表结构。

## 工具权限与审批

AI 相关管理接口还包括：

- `GET|POST|DELETE /api/ai/tool-permissions*`
- `GET|POST|DELETE /api/ai/admin-users*`
- `GET /api/ai/approval-logs`
- `POST /api/ai/approval-logs/{log_id}/approve`

这些能力依赖工具权限子系统中的额外数据库模型。

## 继续阅读

- [API 总览](../reference/api-surface-overview_CN.md)
- [数据库与持久化](../contributor-guide/database-and-persistence_CN.md)
- [故障排查](troubleshooting_CN.md)
