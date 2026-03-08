# API Surface Overview

[中文](api-surface-overview_CN.md)

This page summarizes the current backend API surface implemented in `/src/ui/api.py`.

## General notes

- The API file is large and central.
- Authentication uses bearer tokens for protected routes.
- There is also a WebSocket endpoint at `/ws/messages`.
- A minimal health endpoint exists at `/health`.

## Authentication and device keys

Representative endpoints:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/device-login`
- `POST /api/device-keys`
- `GET /api/device-keys`
- `POST /api/device-keys/{key_id}/enable`
- `POST /api/device-keys/{key_id}/disable`
- `DELETE /api/device-keys/{key_id}`

## Plugins

Representative endpoints:

- `GET /api/plugins`
- `GET /api/plugins/{plugin_name}`
- `DELETE /api/plugins/{plugin_name}`
- `POST /api/plugins/{plugin_name}/action`
- `POST /api/plugins/reload-all`
- `PUT /api/plugins/{plugin_name}/config`
- `POST /api/plugins/upload`
- `POST /api/plugins/config-files`
- `DELETE /api/plugins/config-files/{file_key}`
- `GET /api/plugins/install-progress/{task_id}`
- `POST /api/plugins/install-from-github`
- `GET /api/plugins/{plugin_name}/config-schema`

## OneBot

Representative endpoints:

- `GET /api/onebot/status`
- `GET /api/onebot/config`
- `POST /api/onebot/config`
- `POST /api/onebot/reconnect`
- `GET /api/onebot/login-info`

## Chat and messages

Representative endpoints:

- `GET /api/messages/log`
- `GET /api/chat/contacts`
- `POST /api/chat/send`
- `GET /api/chat/image-proxy`
- `GET /api/chat/history/{chat_type}/{chat_id}`
- `GET /api/chat/groups/{group_id}/members`

## System

Representative endpoints:

- `GET /api/system/status`
- `GET /api/system/config`
- `POST /api/system/config`
- `GET /api/system/threadpool-stats`
- `POST /api/system/reset-admin-password`
- `GET /api/system/logs`
- `POST /api/system/open-dialog`
- `POST /api/system/list-directory`

There are also splash-screen related endpoints:

- `GET /api/splash/check`
- `POST /api/splash/mark-shown`

## AI

The AI API surface is extensive. Major areas include:

- availability and health
- global and group AI config
- tools
- models
- presets
- memories
- MCP servers and tools
- learning data
- maintenance jobs
- knowledge graph
- tool permissions and admin users
- approval logs

Representative examples:

- `GET /api/ai/availability`
- `GET /api/ai/health`
- `GET|PUT /api/ai/config`
- `GET|POST|PUT|DELETE /api/ai/models*`
- `GET|POST|PUT|DELETE /api/ai/presets*`
- `GET|DELETE /api/ai/memories*`
- `GET|POST|PUT|DELETE /api/ai/mcp/servers*`
- `GET /api/ai/knowledge/stats`
- `GET /api/ai/learning/stats`

## NapCat

Representative endpoints:

- `GET /api/napcat/docker/containers`
- `GET /api/napcat/system/info`
- `GET /api/napcat/config`
- `POST /api/napcat/config`
- `POST /api/napcat/deploy`
- `GET /api/napcat/progress/{job_id}`
- `POST /api/napcat/cancel`
- `GET /api/napcat/status`
- `POST /api/napcat/start`
- `POST /api/napcat/stop`
- `GET /api/napcat/logs`
- `GET /api/napcat/webui`
- `POST /api/napcat/path`
- `POST /api/napcat/sudo-password`

## Static and WebSocket routes

Notable non-API routes:

- `GET /health`
- `WebSocket /ws/messages`
- SPA/static asset serving at `/` and other non-API paths

## Caveat

This page is an overview, not a guarantee that every endpoint is equally mature or equally tested.

For changes, always inspect the actual implementation in `/src/ui/api.py`.

## Related docs

- [Operations](../user-guide/operations.md)
- [AI Features](../user-guide/ai-features.md)
- [Security and Auth](../contributor-guide/security-and-auth.md)
