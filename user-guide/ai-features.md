# AI Features

[中文](ai-features_CN.md)

This guide explains the current AI-related capabilities exposed by the framework.

## First: AI is optional

The AI subsystem is not required for the framework to run.

Startup code in `/src/core/app.py` checks AI availability through `/src/core/ai_detector.py`. If AI modules are unavailable, AI-specific initialization is skipped.

The API layer also exposes availability checks.

## AI-related API areas

`/src/ui/api.py` currently exposes a large AI surface including:

- `GET /api/ai/availability`
- `GET /api/ai/health`
- `GET|PUT /api/ai/config`
- group AI config management under `/api/ai/groups*`
- tool availability and enabled-state endpoints under `/api/ai/tools*`
- model CRUD under `/api/ai/models*`
- preset CRUD under `/api/ai/presets*`
- memory views and cleanup under `/api/ai/memories*`
- MCP server management under `/api/ai/mcp/servers*`
- learning and analytics endpoints under `/api/ai/learning/*`
- maintenance endpoints for dream and expression checks
- knowledge graph endpoints under `/api/ai/knowledge/*`
- HeartFlow endpoints
- tool permission and approval endpoints

## Models

Model management endpoints include:

- `GET /api/ai/models`
- `GET /api/ai/models/{model_uuid}`
- `POST /api/ai/models`
- `PUT /api/ai/models/{model_uuid}`
- `DELETE /api/ai/models/{model_uuid}`
- `GET /api/ai/models/providers/list`

Database-backed model storage is handled in `/src/core/database.py` through `LLMModel` operations.

## Presets

Preset endpoints:

- `GET /api/ai/presets`
- `GET /api/ai/presets/{preset_uuid}`
- `POST /api/ai/presets`
- `PUT /api/ai/presets/{preset_uuid}`
- `DELETE /api/ai/presets/{preset_uuid}`

Presets are stored in the framework database and can be linked to AI configuration entries.

## Memories

Memory endpoints include:

- `GET /api/ai/memories`
- `GET /api/ai/memories/{memory_uuid}`
- `DELETE /api/ai/memories/{memory_uuid}`
- `POST /api/ai/memories/clear`

## MCP support

The API surface includes MCP server management:

- `GET /api/ai/mcp/servers`
- `GET /api/ai/mcp/servers/{server_uuid}`
- `POST /api/ai/mcp/servers`
- `PUT /api/ai/mcp/servers/{server_uuid}`
- `DELETE /api/ai/mcp/servers/{server_uuid}`
- `POST /api/ai/mcp/servers/{server_uuid}/connect`
- `POST /api/ai/mcp/servers/{server_uuid}/disconnect`
- `GET /api/ai/mcp/servers/{server_uuid}/tools`
- `GET /api/ai/mcp/tools`

The framework database stores MCP server records via `MCPServer` support in `/src/core/database.py`.

## Learning-related data

The API exposes learning and observational data such as:

- expressions
- jargons
- chat history
- message records
- persons
- groups
- stats
- stickers
- learning config

Representative endpoints:

- `GET /api/ai/learning/expressions`
- `GET /api/ai/learning/jargons`
- `GET /api/ai/learning/chat-history`
- `GET /api/ai/learning/stats`
- `GET|PUT /api/ai/learning/config`

## Maintenance jobs

The API exposes maintenance-style AI features, including:

- dream config, stats, and manual trigger endpoints
- expression check config, stats, and manual trigger endpoints
- expression reflect endpoints

There is an important source-backed caveat here: in `/src/ui/api.py`, the expression reflect routes already note that the old reflector has been removed and stats/manual triggers now use the auto checker implementation instead.

So if you see both names in the UI or API, that is historical layering, not evidence of two fully independent systems.

## Knowledge graph

Knowledge graph endpoints include:

- `GET /api/ai/knowledge/stats`
- `GET /api/ai/knowledge/triples`
- `GET /api/ai/knowledge/entities`
- `GET /api/ai/knowledge/entity/{entity_name}`
- `POST /api/ai/knowledge/query`

The database initialization logic in `/src/core/database.py` attempts to create knowledge graph tables if the knowledge module is importable.

## Tool permissions and approvals

AI-related admin and tool approval endpoints include:

- `GET|POST|DELETE /api/ai/tool-permissions*`
- `GET|POST|DELETE /api/ai/admin-users*`
- `GET /api/ai/approval-logs`
- `POST /api/ai/approval-logs/{log_id}/approve`

These features use additional database models from the tool permission subsystem.

## Related docs

- [API Surface Overview](../reference/api-surface-overview.md)
- [Database and Persistence](../contributor-guide/database-and-persistence.md)
- [Troubleshooting](troubleshooting.md)
