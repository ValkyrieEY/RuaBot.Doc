# 术语表

[English](glossary.md)

## Application

`/src/core/app.py` 中管理启动与关闭流程的主运行时对象。

## Event Bus

实现于 `/src/core/event_bus.py` 的内部异步发布/订阅系统。

## EventContext

一种结构化对象，用于让消息和通知在继续进入普通下游事件发布前，先经过插件感知处理流程。

## OneBot Adapter

在启动时初始化的协议集成层，用于与兼容 OneBot 的机器人端点通信。

## Plugin Runtime Connector

位于 `/src/plugins/runtime/connector.py` 的主进程桥接器，用于管理独立插件运行时进程。

## Plugin Runtime

位于 `/src/plugins/runtime/main.py` 的独立 Python 进程，真正负责加载和执行插件。

## plugin.json

插件清单文件，提供元数据、入口路径、配置 schema、默认配置，有时也包含依赖声明或优先级。

## Interceptor

一种由插件驱动的机制，用于在正常处理完成前检查、修改或阻断动作和事件。

## Web UI

位于 `/webui` 的 React/Vite 前端，构建到 `/src/ui/static`，并由后端提供。

## Framework Database

主结构化持久化存储，默认通常是位于 `/data/framework.db` 的 SQLite 数据库。

## Binary Storage

通过 `/src/core/database.py` 管理的数据库二进制存储，用于插件或框架拥有的二进制数据。

## MCP

Model Context Protocol 集成支持，主要通过 AI 相关数据库模型和 API 接口进行管理。

## NapCat

一个外部相关组件，`/src/ui/api.py` 为其提供了部署与控制支持。

## Device Key

由 `/src/security/device_keys.py` 管理的可复用设备凭据，可通过 API 接口换取登录会话。

## SPA Fallback

`/src/ui/api.py` 中的后端行为：对未知的非 API 路由返回 `index.html`，以支持前端路由正常工作。
