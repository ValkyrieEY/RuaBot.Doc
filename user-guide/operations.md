# Operations

[中文](operations_CN.md)

This guide covers routine operation of a running XQNEXT instance.

## Core operator views

The most useful operational surfaces are:

- Web UI at `/`
- FastAPI docs at `/docs`
- system endpoints under `/api/system/*`
- plugin endpoints under `/api/plugins*`
- OneBot endpoints under `/api/onebot/*`
- chat and message endpoints under `/api/chat/*` and `/api/messages/*`

Definitions live in:
- `/src/ui/api.py`

## Daily startup and shutdown

### Start

```bash
python -m src.main
```

or on Windows:

```bash
python run.py
```

### Stop

Stop the uvicorn process normally. `Application.shutdown()` in `/src/core/app.py` handles:

- publishing `app.shutdown`
- stopping the OneBot adapter
- disposing the plugin runtime
- stopping image cleanup tasks
- canceling background tasks
- stopping the event bus
- closing storage

## Check overall system status

Use:

- `GET /api/system/status`
- `GET /health`

The integration test `/tests/integration/test_api.py` verifies the basic health and system status behavior.

`/api/system/status` is the better operational snapshot because it reports application and subsystem state, not just a minimal alive signal.

## Inspect current config

Use:

- `GET /api/system/config`
- `POST /api/system/config`

Remember that some changes are easier to trust after a restart, especially where cached config objects or already-initialized services are involved.

## Work with OneBot connectivity

Useful endpoints:

- `GET /api/onebot/status`
- `GET /api/onebot/config`
- `POST /api/onebot/config`
- `POST /api/onebot/reconnect`
- `GET /api/onebot/login-info`

If messages are not flowing, these are among the first places to check.

## Work with messages and contacts

Useful endpoints include:

- `GET /api/messages/log`
- `GET /api/chat/contacts`
- `POST /api/chat/send`
- `GET /api/chat/history/{chat_type}/{chat_id}`
- `GET /api/chat/groups/{group_id}/members`
- `GET /api/chat/image-proxy`

These support message browsing, sending, and chat-oriented UI operations.

## Logs and runtime visibility

Useful endpoints:

- `GET /api/system/logs`
- `GET /api/system/threadpool-stats`
- `GET /api/napcat/logs` if you use NapCat integration

The event bus also keeps in-memory statistics through `/src/core/event_bus.py`.

## Authentication basics for operators

Important endpoints:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

The default admin account is created in memory from `[web_ui]` config by `/src/security/auth.py`.

This means changing the configured password affects future startup behavior, not some persistent users table in the framework database.

## Device key login

There is also a device-key based flow:

- `POST /api/device-keys`
- `GET /api/device-keys`
- `POST /api/device-keys/{key_id}/enable`
- `POST /api/device-keys/{key_id}/disable`
- `DELETE /api/device-keys/{key_id}`
- `POST /api/auth/device-login`

Relevant sources:
- `/src/ui/api.py`
- `/src/security/device_keys.py`

## Operational caveats

### Plugins can change behavior before normal subscribers run

If something in message handling looks wrong, do not only inspect event bus subscribers.

`/src/core/app.py` routes message and notice events through plugin-aware context processing before the event reaches ordinary subscribers.

### Enabled plugins come from the database

A plugin folder in `/plugins` is not enough. Enabled state and config are stored in the framework database.

### Web UI source changes are not production changes

Changes in `/webui` only affect the served app after `npm run build` updates `/src/ui/static`.

## Related docs

- [Plugin Management](plugin-management.md)
- [Realtime and Logs](realtime-and-logs.md)
- [Troubleshooting](troubleshooting.md)
