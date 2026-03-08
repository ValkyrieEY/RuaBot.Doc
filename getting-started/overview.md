# Getting Started Overview

[中文](overview_CN.md)

This page gives you the shortest accurate mental model of XQNEXT before you start installing or changing anything.

## What XQNEXT is

XQNEXT is a FastAPI application that combines five major pieces:

1. **OneBot adapter** for bot protocol connectivity
2. **Event bus** for async internal communication
3. **Plugin runtime** running in a separate Python process
4. **Optional AI subsystem** for models, memories, presets, MCP, and related workflows
5. **React + Vite Web UI** served by the backend in production

Relevant source files:
- `src/main.py`
- `src/core/app.py`
- `src/protocol/onebot.py`
- `src/plugins/runtime/connector.py`
- `src/plugins/runtime/main.py`
- `src/ui/api.py`
- `webui/package.json`
- `webui/vite.config.ts`

## What happens when the app starts

The real startup chain is:

1. `python -m src.main` or `python run.py`
2. `src/main.py` reloads config, syncs some logging settings, sets up logging, and creates the FastAPI app
3. FastAPI lifespan in `src/ui/api.py` calls `Application.startup()`
4. `src/core/app.py` initializes the event bus, storage, database, OneBot adapter, AI services, image cache, plugin runtime, and background schedulers

So if you are debugging startup, do not stare at one file and hope the rest of the system confesses on its own.

## Project layout you will care about first

- `config.toml` — main configuration file
- `src/main.py` — process bootstrap and uvicorn startup
- `src/core/` — config, app lifecycle, event bus, storage, database
- `src/protocol/` — OneBot adapter
- `src/plugins/` — plugin orchestration and interception logic
- `src/plugins/runtime/` — separate plugin runtime process
- `src/security/` — auth, permissions, audit, device keys
- `src/ui/` — FastAPI API layer and static frontend serving
- `webui/` — frontend source code
- `plugins/` — installed plugins
- `tests/` — unit, integration, and interceptor tests

## Frontend reality check

The current frontend stack is **React 18 + TypeScript + Vite**

Evidence:
- `webui/package.json` uses `vite`
- `webui/vite.config.ts` builds into `../src/ui/static`

## Plugin system reality check

Plugins do **not** run directly inside the main process.

The main process starts a separate runtime process using:
- `src/plugins/runtime/connector.py`
- `src/plugins/runtime/main.py`

Communication happens over stdio using JSON messages.

That design matters for debugging, logging, lifecycle hooks, dependency installation, and why a plugin crash is not automatically the same thing as the whole framework exploding.

## Message flow reality check

Inbound message flow is not just “OneBot event arrives and subscribers run”.

For message events, `src/core/app.py` creates an `EventContext`, sends it through the plugin runtime, allows plugins to modify or block processing, and only then publishes to the normal event bus.

Outbound message sends can also go through interceptor logic.

If behavior feels mysterious, it is usually because there is another pipeline stage involved, not because the code is haunted.

## AI subsystem status

The AI subsystem is optional.

`src/core/ai_detector.py` checks whether required AI modules are available. If available, startup initializes the AI message handler and maintenance tasks. If not, the rest of the framework still starts.

## Recommended next pages

- [Installation](installation.md)
- [Configuration](configuration.md)
- [First Run](first-run.md)
- [Web UI](webui.md)
