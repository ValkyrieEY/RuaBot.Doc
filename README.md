# XQNEXT Documentation

[中文](README_CN.md)

Welcome to the documentation for XQNEXT.

Everything here is written against the source in `src/`, `webui/`, `plugins/`, and `tests/`.

## Who should read what

### If you want to get the project running
Start here:
- [Getting Started Overview](getting-started/overview.md)
- [Installation](getting-started/installation.md)
- [Configuration](getting-started/configuration.md)
- [First Run](getting-started/first-run.md)
- [Web UI](getting-started/webui.md)
- [FAQ](getting-started/faq.md)

### If you want to use or operate XQNEXT
Read:
- [Operations](user-guide/operations.md)
- [Plugin Management](user-guide/plugin-management.md)
- [AI Features](user-guide/ai-features.md)
- [Realtime and Logs](user-guide/realtime-and-logs.md)
- [Troubleshooting](user-guide/troubleshooting.md)

### If you want to write plugins
Read:
- [Plugin Development Index](plugin-development/README.md)
- [Plugin Quickstart](plugin-development/quickstart.md)
- [Plugin Manifest and Layout](plugin-development/plugin-manifest-and-layout.md)
- [Plugin Runtime Architecture](plugin-development/runtime-architecture.md)
- [Plugin API](plugin-development/plugin-api.md)
- [Interceptors](plugin-development/interceptors.md)

### If you want to contribute to the framework itself
Read:
- [Architecture Overview](contributor-guide/architecture-overview.md)
- [Backend Structure](contributor-guide/backend-structure.md)
- [Frontend Structure](contributor-guide/frontend-structure.md)
- [Event Flow](contributor-guide/event-flow.md)
- [Security and Auth](contributor-guide/security-and-auth.md)
- [Database and Persistence](contributor-guide/database-and-persistence.md)
- [Testing](contributor-guide/testing.md)

### If you want a reference view
Read:
- [Configuration Reference](reference/configuration-reference.md)
- [API Surface Overview](reference/api-surface-overview.md)
- [plugin.json Reference](reference/plugin-json-reference.md)
- [Glossary](reference/glossary.md)

## What XQNEXT actually is

XQNEXT is a FastAPI application that combines:
- a OneBot adapter,
- an async event bus,
- a separate-process plugin runtime,
- an optional AI subsystem,
- and a React + Vite Web UI.

If older notes elsewhere describe it as something simpler, the source code has already won that argument.

## Source-backed highlights

- Startup begins in `src/main.py` and continues through FastAPI lifespan into `src/core/app.py`.
- Configuration is loaded from `config.toml`, flattened into environment-style keys by `src/core/config.py`, and cached through `get_config()`.
- The Web UI source lives in `webui/`, and production assets are built into `src/ui/static`.
- Plugins run in a separate Python process managed by `src/plugins/runtime/connector.py` and `src/plugins/runtime/main.py`.
- Message handling is interception-aware: plugins can modify or block inbound and outbound behavior.

## Suggested reading order

1. `getting-started/overview.md`
2. `getting-started/installation.md`
3. `getting-started/configuration.md`
4. `getting-started/first-run.md`
5. Then choose `user-guide/`, `plugin-development/`, or `contributor-guide/` depending on what you are trying to do.

