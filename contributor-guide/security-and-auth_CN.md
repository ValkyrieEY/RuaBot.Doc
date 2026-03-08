# 安全与鉴权

[English](security-and-auth.md)

本页总结当前代码中的认证、授权和审计模型。

## 认证模型

主要认证实现位于：

- `/src/security/auth.py`

几个关键事实：

- API 认证使用 JWT bearer token
- 会话状态保存在内存中
- 默认管理员用户在启动时根据配置创建
- 密码哈希依赖 passlib + bcrypt
- 代码里专门处理了 Python 3.13 与 bcrypt/passlib 的兼容问题

## 默认管理员账号

`AuthManager` 会用 `config.toml` 中配置的 Web UI 密码初始化默认 `admin` 用户。

这意味着：

- 默认账号不是从数据库用户表中加载的
- 修改配置并重启后，启动生成的默认账号凭据就会变化
- 已经存在的运行中会话会保留在内存里，直到退出登录或进程重启

## Token 的签发与校验

`/src/security/auth.py` 中的重要函数包括：

- `create_access_token()`
- `verify_token()`
- `verify_password()`
- `get_password_hash()`

JWT 过期时间使用配置中的 `access_token_expire_minutes`。

## API 认证流程

在 `/src/ui/api.py` 中：

- `HTTPBearer` 负责提取凭据
- `get_current_user()` 负责校验 token 和内存会话
- 权限依赖负责执行能力检查

常见认证接口：

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/device-login`

## 授权模型

权限模型实现位于：

- `/src/security/permissions.py`

其中定义了：

- `Permission` 枚举
- `Role` 对象
- `PermissionManager`

当前默认角色包括：

- `admin`
- `plugin_manager`
- `user`
- `readonly`

其中 `admin` 基本通过 `admin:all` 拥有完整权限。

## 审计日志

审计支持位于：

- `/src/security/audit.py`

API 层会把拒绝访问和一些安全相关操作写入审计日志。

## 设备密钥

设备密钥支持位于：

- `/src/security/device_keys.py`

`/src/ui/api.py` 中对应接口允许：

- 创建设备密钥
- 列出设备密钥
- 启用或禁用设备密钥
- 删除设备密钥
- 用设备 token 换取登录会话

## 需要注意的现实限制

- 当前代码中的用户和会话并不是一个完整持久化用户管理系统。
- 这套认证模型对于管理员控制的 Web UI 很实用，但它并没有试图扮演企业级身份平台。
- 权限检查是存在的，但很多运维假设仍然默认有可信管理员在场。

## 继续阅读

- [API 总览](../reference/api-surface-overview_CN.md)
- [日常操作](../user-guide/operations_CN.md)
- [测试](testing_CN.md)
