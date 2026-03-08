# Backend Structure

[中文](backend-structure_CN.md)

This page maps the backend modules most contributors will touch.

## Entry and bootstrap

Primary backend entrypoint:

- `/src/main.py`

Windows helper wrapper:

- `/run.py`

`src/main.py` is responsible for:

- reloading config
- setting logging level behavior
- building the FastAPI app
- starting uvicorn

## Core application lifecycle

Main lifecycle owner:

- `/src/core/app.py`

Key responsibilities include:

- startup and shutdown orchestration
- initializing event bus, storage, database, OneBot, plugin runtime, AI managers
- routing incoming OneBot events
- bridging plugin context handling and event bus publishing

## Configuration

Configuration loading and flattening:

- `/src/core/config.py`

Important features:

- TOML loading
- environment override support
- key remapping for compatibility
- cached config access via `get_config()`

## Web API layer

Main API module:

- `/src/ui/api.py`

It is intentionally large and currently acts as the central location for most management endpoints.

This file includes:

- authentication endpoints
- plugin management
- system config/status
- OneBot control
- message and chat APIs
- AI APIs
- NapCat APIs
- static asset serving
- SPA fallback routing
- WebSocket handling

## Security modules

Main security-related files:

- `/src/security/auth.py`
- `/src/security/permissions.py`
- `/src/security/audit.py`
- `/src/security/device_keys.py`

Notable source-backed facts:

- auth sessions are in memory
- the default admin user is created from config at startup
- JWT tokens are used for API auth
- role/permission checks are handled in the permission manager

## Persistence layer

Main persistence files:

- `/src/core/database.py`
- `/src/core/storage.py`

They serve different purposes:

- `database.py` stores framework records such as plugin settings, AI models, presets, memories, MCP servers, and binary data
- `storage.py` provides a more abstract key-value storage layer with memory and SQLite backends

## Plugin backend integration

Important files:

- `/src/plugins/runtime/connector.py`
- `/src/plugins/runtime/main.py`
- `/src/plugins/interceptor.py`

These files are critical whenever a change touches plugin behavior, message processing, or runtime communication.

## Testing structure

Representative backend tests:

- `/tests/unit/test_event_bus.py`
- `/tests/integration/test_api.py`
- `/tests/test_interceptor_optimization.py`

## Related docs

- [Architecture Overview](architecture-overview.md)
- [Security and Auth](security-and-auth.md)
- [Database and Persistence](database-and-persistence.md)
