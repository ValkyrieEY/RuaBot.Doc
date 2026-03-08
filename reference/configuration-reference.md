# Configuration Reference

[中文](configuration-reference_CN.md)

This page is a concise reference for the main configuration areas currently present in `/config.toml`.

## app

```toml
[app]
name = "XQNEXT Framework"
version = "0.0.6"
environment = "development"
debug = true
```

Purpose:

- application identity metadata
- debug-mode behavior, including logging adjustments during startup

Relevant code:
- `/src/main.py`
- `/src/core/config.py`

## server

```toml
[server]
host = "0.0.0.0"
port = 8000
```

Purpose:

- uvicorn listen host and port

Relevant code:
- `/src/main.py`

## onebot

Important fields include:

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

Purpose:

- configure OneBot transport mode and credentials

Relevant code:
- `/src/core/app.py`

## database

```toml
[database]
url = "sqlite+aiosqlite:///./data/framework.db"
```

Purpose:

- configure framework database location/driver

Relevant code:
- `/src/core/app.py`
- `/src/core/database.py`

## security

Important fields:

- `secret_key`
- `access_token_expire_minutes`

Purpose:

- JWT signing and expiration

Relevant code:
- `/src/security/auth.py`

## logging

Important fields:

- `level`
- `file`
- `max_bytes`
- `backup_count`

Purpose:

- application log level and rotating log file settings

Relevant code:
- `/src/main.py`
- `/src/core/config.py`

## plugins

Important fields:

- `dir`
- `auto_load`
- `thread_pool_enabled`
- `auto_reload`

Purpose:

- plugin directory and high-level plugin runtime behavior

Relevant code:
- `/src/core/config.py`
- `/src/core/app.py`

## plugins.interceptor

Important fields:

- `execution_mode`
- `circuit_breaker_threshold`
- `circuit_breaker_duration`
- `base_timeout`
- `max_timeout`

Purpose:

- interceptor execution behavior and safeguards

Relevant code:
- `/src/core/app.py`
- `/src/plugins/interceptor.py`

Supported execution modes:

- `serial`
- `parallel`
- `hybrid`

## web_ui

Important fields:

- `enabled`
- `username`
- `password`

Purpose:

- enable/disable backend-served Web UI
- define startup-generated default admin credentials

Relevant code:
- `/src/ui/api.py`
- `/src/security/auth.py`

## tencent_cloud

Important fields:

- `secret_id`
- `secret_key`

Purpose:

- Tencent Cloud TTS-related credentials and integration support

## ai

Important fields include thread-pool configuration for AI workloads.

Purpose:

- tune optional AI subsystem execution

Relevant code:
- `/src/core/app.py`

## napcat

Important fields currently present in the checked-in config include:

- `install_path`
- `installer_base`
- `installer_bases`
- `test`

Purpose:

- support NapCat-related installation or management settings exposed by the backend

Relevant code:
- `/src/ui/api.py`

## Important behavior note

Config loading is flattened and cached by `/src/core/config.py`.

So changing the TOML file does not guarantee that every already-running subsystem immediately re-reads it.

## Related docs

- [Configuration](../getting-started/configuration.md)
- [Glossary](glossary.md)
- [API Surface Overview](api-surface-overview.md)
