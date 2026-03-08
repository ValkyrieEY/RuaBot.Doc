# Architecture Overview

[中文](architecture-overview_CN.md)

This page provides the source-backed architectural map of XQNEXT.

## What XQNEXT is

XQNEXT is a FastAPI-based Python application that combines four major areas:

- OneBot protocol integration
- an internal event-driven core
- a separate-process plugin runtime
- an optional AI subsystem
- a React/Vite Web UI served by the backend

Main sources:
- `/src/main.py`
- `/src/core/app.py`
- `/src/ui/api.py`

## Startup path

The backend startup path is:

1. `/src/main.py` reloads config and sets up logging
2. it creates the FastAPI app through `/src/ui/api.py`
3. FastAPI lifespan enters `Application.startup()` from `/src/core/app.py`
4. startup initializes core services and optional AI services

## Major subsystems

### 1. Core application lifecycle

`/src/core/app.py` owns framework startup and shutdown responsibilities.

It initializes:

- event bus
- storage
- database
- OneBot adapter
- plugin runtime connector
- optional AI managers and cleanup jobs

### 2. Event bus

`/src/core/event_bus.py` provides async event dispatch, subscription management, queueing, history, and stats.

The event bus is the common backbone for internal event flow.

### 3. OneBot integration

The OneBot adapter is created during startup and receives config from `config.toml`.

Incoming protocol events become event-bus events and, for some message paths, event-context objects for plugin-aware handling.

### 4. Plugin runtime

Plugins are orchestrated in the main process but executed in a separate Python process:

- main-process side: `/src/plugins/runtime/connector.py`
- runtime side: `/src/plugins/runtime/main.py`

Communication uses stdio and JSON messages.

### 5. API and Web UI hosting

`/src/ui/api.py` is the central API file.

It provides:

- auth endpoints
- plugin management endpoints
- OneBot status/config endpoints
- system status/config/log endpoints
- message/chat endpoints
- AI endpoints
- NapCat endpoints
- static file and SPA fallback serving for the built Web UI

### 6. Security

Auth, permission checks, audit logging, and device keys live under:

- `/src/security/auth.py`
- `/src/security/permissions.py`
- `/src/security/audit.py`
- `/src/security/device_keys.py`

### 7. Database and persistence

The framework database is managed by:

- `/src/core/database.py`

Additional key-value style storage is handled by:

- `/src/core/storage.py`

By default, the main database is SQLite at `/data/framework.db`.

## Frontend architecture in one sentence

The frontend is a Vite app in `/webui`, built into `/src/ui/static`, and then served by the backend.

## Important caveat

Some old docs and names in the repo may still suggest other historical architectures. Prefer the source files above when in doubt.

The source tends to be less nostalgic.

## Related docs

- [Backend Structure](backend-structure.md)
- [Frontend Structure](frontend-structure.md)
- [Event Flow](event-flow.md)
