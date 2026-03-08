# 配置参考

[English](configuration-reference.md)

本页对 `/config.toml` 中当前存在的主要配置区块做简要参考说明。

## app

```toml
[app]
name = "XQNEXT Framework"
version = "0.0.6"
environment = "development"
debug = true
```

用途：

- 应用身份元数据
- debug 模式行为，包括启动时的日志级别联动调整

相关代码：
- `/src/main.py`
- `/src/core/config.py`

## server

```toml
[server]
host = "0.0.0.0"
port = 8000
```

用途：

- 配置 uvicorn 监听地址和端口

相关代码：
- `/src/main.py`

## onebot

重要字段包括：

- `version`
- `connection_type`
- `http_url`
- `ws_url`
- `ws_reverse_host`
- `ws_reverse_port`
- `ws_reverse_path`
- `access_token`
- `secret`
- `http_timeout`
- `ws_api_timeout`

用途：

- 配置 OneBot 传输方式与凭据

相关代码：
- `/src/core/app.py`

## database

```toml
[database]
url = "sqlite+aiosqlite:///./data/framework.db"
```

用途：

- 配置框架数据库位置和驱动

相关代码：
- `/src/core/app.py`
- `/src/core/database.py`

## security

重要字段：

- `secret_key`
- `access_token_expire_minutes`

用途：

- JWT 签名与过期控制

相关代码：
- `/src/security/auth.py`

## logging

重要字段：

- `level`
- `file`
- `max_bytes`
- `backup_count`

用途：

- 应用日志级别与滚动日志文件设置

相关代码：
- `/src/main.py`
- `/src/core/config.py`

## plugins

重要字段：

- `dir`
- `auto_load`
- `thread_pool_enabled`
- `auto_reload`

用途：

- 插件目录与插件系统的高层运行行为

相关代码：
- `/src/core/config.py`
- `/src/core/app.py`

## plugins.interceptor

重要字段：

- `execution_mode`
- `circuit_breaker_threshold`
- `circuit_breaker_duration`
- `base_timeout`
- `max_timeout`

用途：

- 配置拦截器执行行为与保护机制

相关代码：
- `/src/core/app.py`
- `/src/plugins/interceptor.py`

支持的执行模式：

- `serial`
- `parallel`
- `hybrid`

## web_ui

重要字段：

- `enabled`
- `username`
- `password`

用途：

- 开启或关闭后端提供的 Web UI
- 定义启动时生成的默认管理员账号

相关代码：
- `/src/ui/api.py`
- `/src/security/auth.py`

## tencent_cloud

重要字段：

- `secret_id`
- `secret_key`

用途：

- 腾讯云 TTS 相关凭据与集成支持

## ai

重要字段包括 AI 工作线程池配置。

用途：

- 调整可选 AI 子系统执行环境

相关代码：
- `/src/core/app.py`

## napcat

当前已提交的配置中能看到的重要字段包括：

- `install_path`
- `installer_base`
- `installer_bases`
- `test`

用途：

- 支持后端暴露的 NapCat 安装或管理相关设置

相关代码：
- `/src/ui/api.py`

## 一个重要行为说明

配置会被 `/src/core/config.py` 展平并缓存。

因此，修改 TOML 文件并不意味着所有已运行子系统都会立刻重新读取它。

## 继续阅读

- [配置说明](../getting-started/configuration_CN.md)
- [术语表](glossary_CN.md)
- [API 总览](api-surface-overview_CN.md)
