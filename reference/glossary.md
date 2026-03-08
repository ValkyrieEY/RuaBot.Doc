# Glossary

[中文](glossary_CN.md)

## Application

The main runtime object managed in `/src/core/app.py` that owns startup and shutdown orchestration.

## Event Bus

The internal async publish/subscribe system implemented in `/src/core/event_bus.py`.

## EventContext

A structured object used for plugin-aware processing of messages and notices before normal downstream event publication continues.

## OneBot Adapter

The protocol integration layer initialized during startup to communicate with the OneBot-compatible bot endpoint.

## Plugin Runtime Connector

The main-process bridge in `/src/plugins/runtime/connector.py` that manages the separate plugin runtime process.

## Plugin Runtime

The separate Python process in `/src/plugins/runtime/main.py` that actually loads and executes plugins.

## plugin.json

The manifest file for a plugin. It provides metadata, entry path, config schema, default config, and sometimes dependency declarations or priority.

## Interceptor

A plugin-driven mechanism for inspecting, modifying, or blocking actions/events before normal handling completes.

## Web UI

The React/Vite frontend located in `/webui`, built into `/src/ui/static`, and served by the backend.

## Framework Database

The main structured persistence store, usually SQLite at `/data/framework.db`.

## Binary Storage

Database-backed storage for plugin or framework-owned binary blobs managed through `/src/core/database.py`.

## MCP

Model Context Protocol integration support, managed through AI-related database models and API endpoints.

## NapCat

An externally managed related component with deployment and control support exposed by `/src/ui/api.py`.

## Device Key

A reusable device credential managed by `/src/security/device_keys.py` and exchanged for login sessions through API endpoints.

## SPA Fallback

The backend behavior in `/src/ui/api.py` that returns `index.html` for unknown non-API routes so client-side routing can work.
