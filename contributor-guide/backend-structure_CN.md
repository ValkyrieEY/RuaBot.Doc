# 后端结构

[English](backend-structure.md)

本页梳理大多数贡献者会接触到的后端模块结构。

## 入口与启动引导

主要后端入口：

- `/src/main.py`

Windows 辅助包装器：

- `/run.py`

`src/main.py` 负责：

- 重载配置
- 处理日志级别逻辑
- 创建 FastAPI 应用
- 启动 uvicorn

## 应用生命周期核心

主生命周期控制文件：

- `/src/core/app.py`

核心职责包括：

- 启动与关闭编排
- 初始化事件总线、存储、数据库、OneBot、插件运行时、AI 管理器
- 路由入站 OneBot 事件
- 在插件上下文处理与事件总线发布之间做桥接

## 配置模块

配置加载与展平逻辑位于：

- `/src/core/config.py`

主要特点：

- 读取 TOML
- 支持环境变量覆盖
- 为兼容性进行字段映射
- `get_config()` 提供缓存访问

## Web API 层

核心 API 文件：

- `/src/ui/api.py`

它目前有意承担了绝大多数管理接口，因此文件体积很大。

该文件包含：

- 认证接口
- 插件管理接口
- 系统配置与状态接口
- OneBot 控制接口
- 消息与聊天接口
- AI 接口
- NapCat 接口
- 静态资源服务
- SPA 回退路由
- WebSocket 处理

## 安全模块

主要安全相关文件：

- `/src/security/auth.py`
- `/src/security/permissions.py`
- `/src/security/audit.py`
- `/src/security/device_keys.py`

几个值得注意的事实：

- 认证会话保存在内存中
- 默认管理员用户由配置在启动时创建
- API 鉴权使用 JWT
- 角色与权限校验由权限管理器负责

## 持久化层

主要持久化文件：

- `/src/core/database.py`
- `/src/core/storage.py`

它们的职责不同：

- `database.py` 负责插件设置、AI 模型、预设、记忆、MCP 服务、二进制数据等框架记录
- `storage.py` 提供更抽象的键值存储层，并支持内存与 SQLite 后端

## 插件相关后端集成

重要文件：

- `/src/plugins/runtime/connector.py`
- `/src/plugins/runtime/main.py`
- `/src/plugins/interceptor.py`

只要改动涉及插件行为、消息处理或运行时通信，这些文件通常都应该一起看。

## 测试结构

代表性后端测试：

- `/tests/unit/test_event_bus.py`
- `/tests/integration/test_api.py`
- `/tests/test_interceptor_optimization.py`

## 继续阅读

- [架构总览](architecture-overview_CN.md)
- [安全与鉴权](security-and-auth_CN.md)
- [数据库与持久化](database-and-persistence_CN.md)
