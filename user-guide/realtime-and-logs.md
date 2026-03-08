# Realtime and Logs

[中文](realtime-and-logs_CN.md)

This guide explains the realtime and logging-related surfaces in XQNEXT.

## WebSocket realtime channel

The backend exposes:

- `/ws/messages`

`/src/ui/api.py` defines a `WebSocketManager` that:

- accepts client connections
- subscribes to the event bus on first connection
- listens for:
  - `onebot.message`
  - `onebot.notice`
  - `onebot.request`
- broadcasts formatted events to connected clients

So the realtime message view is event-bus-driven, not a separate message polling universe.

## Event bus role in realtime behavior

The event bus implementation in `/src/core/event_bus.py` provides:

- async queued dispatch
- event history
- queue statistics
- sent/received counters

This means realtime UI issues may originate in:

- the OneBot adapter
- plugin interception and event-context handling
- event bus dispatch
- WebSocket broadcasting

A healthy respect for the full chain is usually rewarded.

## System logs endpoint

Useful log endpoint:

- `GET /api/system/logs`

This is defined in `/src/ui/api.py` and provides backend log access for the UI.

## Logging configuration

Logging is configured from `config.toml` and initialized in `/src/main.py` using:

- `log_level`
- `log_file`
- `log_max_bytes`
- `log_backup_count`

Current checked-in defaults are sourced from:
- `/config.toml`

Notably, startup code may rewrite or override logging level behavior to keep it aligned with `debug` mode.

## Thread pool stats

Operational endpoint:

- `GET /api/system/threadpool-stats`

This helps inspect runtime worker-pool behavior for plugin and AI-related execution environments.

## NapCat logs

If you use NapCat integration, additional visibility is available through:

- `GET /api/napcat/logs`
- `GET /api/napcat/status`
- `GET /api/napcat/progress/{job_id}`

## Message log and history endpoints

For chat-oriented inspection, the API also exposes:

- `GET /api/messages/log`
- `GET /api/chat/history/{chat_type}/{chat_id}`
- `GET /api/chat/contacts`

These are often more useful than raw logs when you need to understand what users and the bot actually exchanged.

## Common debugging flow

When realtime behavior looks wrong, a good order is:

1. check `/health`
2. check `/api/system/status`
3. check `/api/onebot/status`
4. inspect `/api/system/logs`
5. inspect message history endpoints
6. confirm the WebSocket client is connected to `/ws/messages`
7. consider whether plugins may be modifying or blocking the event before it reaches subscribers

## Related docs

- [Operations](operations.md)
- [Event Flow](../contributor-guide/event-flow.md)
- [Troubleshooting](troubleshooting.md)
