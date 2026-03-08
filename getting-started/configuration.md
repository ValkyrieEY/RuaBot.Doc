# Configuration

[中文](configuration_CN.md)

This guide explains how configuration works in the current codebase.

## Primary configuration file

The main configuration file is:

- `/config.toml`

This file is read by `/src/core/config.py`.

## How config loading actually works

`/src/core/config.py` uses a `Config` class based on Pydantic Settings.

The important behavior is:

1. `config.toml` is loaded with `tomllib`
2. Nested TOML keys are flattened into environment-style variables
3. Some keys are remapped for compatibility
4. Environment variables can override values
5. `get_config()` caches the result with `@lru_cache()`

That last point matters. If you change configuration while the process is already running, code paths using cached config objects may still need an explicit reload.

## Important remappings

`_flatten_toml()` in `/src/core/config.py` performs compatibility remapping, including:

- `[logging].level` -> `LOG_LEVEL`
- `[logging].max_bytes` -> `LOG_MAX_BYTES`
- `[logging].backup_count` -> `LOG_BACKUP_COUNT`
- `[app].debug` -> `DEBUG`
- `[server].host` -> `HOST`
- `[server].port` -> `PORT`

So when reading code, do not assume the TOML key name is always the exact runtime field name.

## Current top-level sections in config.toml

The current repository config includes:

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

Source reference:
- `/config.toml`

## Key settings you will most likely change first

### Server

From `[server]`:

- `host`
- `port`

These control where uvicorn listens. They are used in `/src/main.py`.

### OneBot connectivity

From `[onebot]`:

- `version`
- `connection_type`
- `http_url`
- `ws_url`
- `ws_reverse_host`
- `ws_reverse_port`
- `ws_reverse_path`
- `access_token`
- `secret`

These are passed into `OneBotAdapter` during `Application.startup()` in `/src/core/app.py`.

### Database

From `[database]`:

- `url`

The default is SQLite:

```toml
[database]
url = "sqlite+aiosqlite:///./data/framework.db"
```

Framework code uses that file to derive the data directory and initialize persistence.

### Security

From `[security]`:

- `secret_key`
- `access_token_expire_minutes`

These settings are used for JWT token creation and verification in `/src/security/auth.py`.

### Logging

From `[logging]`:

- `level`
- `file`
- `max_bytes`
- `backup_count`

`/src/main.py` also contains startup logic that tries to keep `debug` and `log_level` aligned. In practice:

- if `debug = true`, log level is forced toward `DEBUG`
- if `debug = false` and log level is `DEBUG`, it is pushed back toward `INFO`

So yes, the startup code has opinions.

### Plugins

From `[plugins]`:

- `dir`
- `auto_load`
- `thread_pool_enabled`
- `auto_reload`

Plugin loading and plugin runtime behavior also depend on database-backed plugin settings, not just this file.

### Interceptor behavior

From `[plugins.interceptor]`:

- `execution_mode`
- `circuit_breaker_threshold`
- `circuit_breaker_duration`
- `base_timeout`
- `max_timeout`

These values are read directly from TOML by `/src/core/app.py` and used to configure the interceptor registry in `/src/plugins/interceptor.py`.

Supported execution modes:

- `serial`
- `parallel`
- `hybrid`

`hybrid` is the current configured default in the checked-in `config.toml`.

### Web UI

From `[web_ui]`:

- `enabled`
- `username`
- `password`

These settings control whether the backend serves the Web UI and what default admin credentials the in-memory auth manager uses.

Source references:
- `/src/ui/api.py`
- `/src/security/auth.py`

### AI and optional services

Additional sections:

- `[ai]` for AI thread pool settings
- `[tencent_cloud]` for TTS credentials
- `[napcat]` for NapCat installer/runtime paths and settings

The AI subsystem is optional; the app checks availability before enabling AI-specific startup flows and APIs.

## Changing config safely

Recommended workflow:

1. Edit `/config.toml`
2. Restart the application
3. Verify behavior through `/api/system/config`, `/api/system/status`, or the Web UI

There are runtime config APIs, but not every subsystem is purely dynamic. Restarting is still the safest way to make sure every component agrees on reality.

## Next reading

- [First Run](first-run.md)
- [Configuration Reference](../reference/configuration-reference.md)
- [Security and Auth](../contributor-guide/security-and-auth.md)
