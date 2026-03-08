# 架构总览

[English](architecture-overview.md)

本页给出基于当前源码的 XQNEXT 架构地图。

## XQNEXT 到底是什么

XQNEXT 是一个基于 FastAPI 的 Python 应用，组合了几个主要部分：

- OneBot 协议集成
- 内部事件驱动核心
- 独立进程插件运行时
- 可选的 AI 子系统
- 由后端提供的 React/Vite Web UI

主要源码：
- `/src/main.py`
- `/src/core/app.py`
- `/src/ui/api.py`

## 启动路径

后端启动流程如下：

1. `/src/main.py` 重新加载配置并初始化日志
2. 它通过 `/src/ui/api.py` 创建 FastAPI 应用
3. FastAPI lifespan 进入 `/src/core/app.py` 中的 `Application.startup()`
4. 启动阶段初始化核心服务和可选 AI 服务

## 主要子系统

### 1. 应用生命周期核心

`/src/core/app.py` 负责框架启动与关闭。

它会初始化：

- 事件总线
- 存储层
- 数据库
- OneBot 适配器
- 插件运行时连接器
- 可选 AI 管理器与清理任务

### 2. 事件总线

`/src/core/event_bus.py` 提供异步事件分发、订阅管理、队列、事件历史和统计能力。

它是内部事件流的公共骨架。

### 3. OneBot 集成

OneBot 适配器在启动时根据 `config.toml` 创建。

进入系统的协议事件会被转换为事件总线事件；对某些消息路径，还会进一步转换为供插件处理的事件上下文对象。

### 4. 插件运行时

插件由主进程协调，但实际执行在独立 Python 进程中：

- 主进程侧：`/src/plugins/runtime/connector.py`
- 运行时侧：`/src/plugins/runtime/main.py`

两者通过 stdio 和 JSON 消息通信。

### 5. API 与 Web UI 托管

`/src/ui/api.py` 是核心 API 文件。

它提供：

- 认证接口
- 插件管理接口
- OneBot 状态与配置接口
- 系统状态、配置与日志接口
- 消息与聊天接口
- AI 接口
- NapCat 接口
- 构建后 Web UI 的静态文件服务与 SPA 回退路由

### 6. 安全子系统

认证、权限、审计日志和设备密钥位于：

- `/src/security/auth.py`
- `/src/security/permissions.py`
- `/src/security/audit.py`
- `/src/security/device_keys.py`

### 7. 数据库与持久化

框架数据库由以下文件管理：

- `/src/core/database.py`

额外的键值型存储由以下文件管理：

- `/src/core/storage.py`

默认主数据库是 SQLite，路径为：
- `/data/framework.db`

## 用一句话概括前端结构

前端是 `/webui` 下的 Vite 应用，构建到 `/src/ui/static`，再由后端提供给浏览器。

## 一个重要提醒

仓库里有些旧文档和旧命名可能还会暗示别的历史架构。遇到冲突时，请优先相信上面这些源码文件。

源码通常比回忆录更可靠。

## 继续阅读

- [后端结构](backend-structure_CN.md)
- [前端结构](frontend-structure_CN.md)
- [事件流](event-flow_CN.md)
