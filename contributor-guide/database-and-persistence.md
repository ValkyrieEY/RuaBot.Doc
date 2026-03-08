# Database and Persistence

[中文](database-and-persistence_CN.md)

This page explains how persistence works in the framework.

## Main framework database

Primary database implementation:

- `/src/core/database.py`

Default database path is SQLite at:

- `/data/framework.db`

`DatabaseManager` uses SQLAlchemy async support with `sqlite+aiosqlite` by default.

## What the framework database stores

Based on the current code, the framework database stores at least:

- plugin settings
- binary storage
- AI configuration records
- LLM models
- AI presets
- AI memories
- MCP server records
- tool permission-related data
- optional knowledge graph tables when AI knowledge modules are available

## Plugin settings

Plugin settings in `DatabaseManager` support:

- lookup by author/name
- listing all plugins or only enabled ones
- create/update/delete operations
- ordering by priority

This is why plugin enablement and priority are database-backed rather than just file-based.

## Binary storage

Binary storage support in `database.py` provides:

- `get_binary()`
- `set_binary()`
- `delete_binary()`
- `list_binary_keys()`

This is used by plugin storage APIs and supports framework-scoped binary persistence.

The code warns when stored values exceed 10 MB, which is useful if you enjoy discovering that a plugin decided your database should also be a file cabinet.

## AI persistence

The same database layer also stores AI-related records through models such as:

- `AIConfig`
- `LLMModel`
- `AIPreset`
- `AIMemory`
- `MCPServer`

There are helper methods for listing, creating, updating, deleting, and batch-updating several of these entities.

## Migrations

`DatabaseManager.initialize()` runs a lightweight migration routine.

Current source-backed example:

- adding `repetition_penalty` to `ai_presets` if missing

This is intentionally lightweight, not a full migration framework.

## Separate storage abstraction

In addition to the main framework database, the project also has a more general storage abstraction in:

- `/src/core/storage.py`

It defines:

- `Storage` abstract base class
- `MemoryStorage`
- `SQLiteStorage`
- global storage initialization helpers

## Storage backends

`storage.py` supports:

- in-memory storage with optional TTL
- SQLite-backed key-value storage with TTL cleanup

The global storage instance defaults to `MemoryStorage` unless initialized differently.

In `Application.startup()`, storage is initialized based on the configured database path so it uses a SQLite file in the data directory.

## Why both database.py and storage.py exist

They serve different layers of persistence:

- `database.py` is the structured framework record store
- `storage.py` is a simpler general-purpose key-value store abstraction

If you are changing structured app data, inspect `database.py` first.
If you are changing generic cache-like or kv-style behavior, inspect `storage.py` too.

## Related docs

- [Backend Structure](backend-structure.md)
- [Configuration Reference](../reference/configuration-reference.md)
- [AI Features](../user-guide/ai-features.md)
