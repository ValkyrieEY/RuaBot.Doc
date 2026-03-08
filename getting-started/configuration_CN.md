# 配置说明

[English](configuration.md)

本页说明当前代码中的配置机制

## 主配置文件

主配置文件是：

- `/config.toml`

它由 `/src/core/config.py` 负责读取和整理。

## 配置实际是怎么加载的

`/src/core/config.py` 使用基于 Pydantic Settings 的 `Config` 类。

实际流程大致是：

1. 用 `tomllib` 读取 `config.toml`
2. 将嵌套 TOML 结构展平成环境变量风格键名
3. 对部分字段做兼容映射
4. 环境变量可覆盖 TOML 值
5. `get_config()` 通过 `@lru_cache()` 缓存结果

最后这一点很重要：运行中的进程未必会自动感知你刚改过的配置，很多地方仍然依赖显式 reload 或重启。

## 一些重要映射

`/src/core/config.py` 中的 `_flatten_toml()` 会做兼容映射，例如：

- `[logging].level` -> `LOG_LEVEL`
- `[logging].max_bytes` -> `LOG_MAX_BYTES`
- `[logging].backup_count` -> `LOG_BACKUP_COUNT`
- `[app].debug` -> `DEBUG`
- `[server].host` -> `HOST`
- `[server].port` -> `PORT`

所以看代码时，不要默认 TOML 键名和运行时字段名永远一模一样。

## 当前 config.toml 中的主要分区

当前仓库里的配置分区包括：

- `[app]`
- `[server]`
- `[onebot]`
- `[database]`
- `[security]`
- `[logging]`
- `[plugins]`
- `[plugins.interceptor]`
- `[web_ui]`
- `[tencent_cloud]`
- `[ai]`
- `[napcat]`

源码参考：
- `/config.toml`

## 最常需要先改的配置项

### 服务监听

来自 `[server]`：

- `host`
- `port`

这些值由 `/src/main.py` 用于启动 uvicorn。

### OneBot 连接

来自 `[onebot]`：

- `version`
- `connection_type`
- `http_url`
- `ws_url`
- `ws_reverse_host`
- `ws_reverse_port`
- `ws_reverse_path`
- `access_token`
- `secret`

这些值在 `/src/core/app.py` 中被收集并传给 `OneBotAdapter`。

### 数据库

来自 `[database]`：

- `url`

当前默认值是 SQLite：

```toml
[database]
url = "sqlite+aiosqlite:///./data/framework.db"
```

框架会基于这个路径初始化数据库与部分存储目录。

### 安全

来自 `[security]`：

- `secret_key`
- `access_token_expire_minutes`

这些配置用于 `/src/security/auth.py` 中 JWT 的签发与校验。

### 日志

来自 `[logging]`：

- `level`
- `file`
- `max_bytes`
- `backup_count`

另外，`/src/main.py` 启动时还会尝试同步 `debug` 和 `log_level`。实际行为大致是：

- `debug = true` 时，日志级别会被推向 `DEBUG`
- `debug = false` 且日志级别为 `DEBUG` 时，会被拉回 `INFO`

也就是说，启动代码会替你“帮忙统一思想”。

### 插件

来自 `[plugins]`：

- `dir`
- `auto_load`
- `thread_pool_enabled`
- `auto_reload`

但插件是否真正启用、优先级是多少、配置覆盖值是什么，还要看数据库中的插件设置，而不只是看这个 TOML。

### 拦截器配置

来自 `[plugins.interceptor]`：

- `execution_mode`
- `circuit_breaker_threshold`
- `circuit_breaker_duration`
- `base_timeout`
- `max_timeout`

这些值由 `/src/core/app.py` 直接从 TOML 读取，并传给 `/src/plugins/interceptor.py` 中的拦截器注册表。

支持的执行模式：

- `serial`
- `parallel`
- `hybrid`

当前仓库 `config.toml` 中配置的是 `hybrid`。

### Web UI

来自 `[web_ui]`：

- `enabled`
- `username`
- `password`

它们会影响：

- 后端是否提供 Web UI 页面
- 默认内存认证管理器中的管理员账号密码

相关源码：
- `/src/ui/api.py`
- `/src/security/auth.py`

### AI 与可选服务

其他常见分区还有：

- `[ai]`：AI 线程池等设置
- `[tencent_cloud]`：TTS 凭据
- `[napcat]`：NapCat 安装器与运行路径设置

AI 子系统是可选的，应用会先检测 AI 模块可用性，再决定是否启用对应启动流程和 API。

## 修改配置的建议方式

推荐流程：

1. 编辑 `/config.toml`
2. 重启应用
3. 通过 `/api/system/config`、`/api/system/status` 或 Web UI 检查生效情况

虽然系统里有一些运行时配置接口，但并不是所有子系统都能做到真正无重启热更新。稳妥起见，重启通常更省心。

## 接下来建议阅读

- [首次启动](first-run_CN.md)
- [配置参考](../reference/configuration-reference_CN.md)
- [安全与鉴权](../contributor-guide/security-and-auth_CN.md)
