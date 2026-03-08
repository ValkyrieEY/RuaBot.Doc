# Troubleshooting

[中文](troubleshooting_CN.md)

This guide focuses on source-backed troubleshooting paths.

## App starts but Web UI is missing

Check:

- `/src/ui/static/index.html`
- `/src/ui/static/assets/`
- `web_ui.enabled = true` in `/config.toml`

If build output is missing, rebuild from `/webui`:

```bash
npm install
npm run build
```

Relevant code path:
- `/src/ui/api.py`

## Login fails with default admin credentials

Check `[web_ui]` in `/config.toml`.

The default admin user is created in memory at startup by `/src/security/auth.py`, using the configured username and password.

If you changed config but did not restart, the running process may still be using the old credentials.

## OneBot is disconnected or messages are missing

Check:

- `/api/onebot/status`
- `/api/onebot/config`
- `[onebot]` in `config.toml`
- logs via `/api/system/logs`

Relevant startup and routing code:
- `/src/core/app.py`
- `/src/ui/api.py`

## Plugin exists on disk but does not load

Check all three layers:

1. plugin directory under `/plugins`
2. `plugin.json` exists and is valid
3. plugin setting is enabled in the framework database

Remember that the connector initializes enabled plugins from database settings, not from the directory list alone.

Relevant code:
- `/src/plugins/runtime/connector.py`
- `/src/core/database.py`

## Plugin loads but behaves strangely

Inspect both sides of the runtime bridge:

- main-process connector: `/src/plugins/runtime/connector.py`
- runtime process: `/src/plugins/runtime/main.py`

Because plugins run out of process over stdio JSON messages, bugs can be caused by:

- plugin code itself
- manifest/config issues
- request/response handling
- runtime startup issues
- interceptor timeouts or circuit breaker behavior

## Message handling is delayed or blocked

Look at interceptors.

Relevant files:
- `/src/plugins/interceptor.py`
- `/tests/test_interceptor_optimization.py`
- `/src/plugins/runtime/connector.py`
- `/src/core/app.py`

Important source-backed facts:

- execution modes are `serial`, `parallel`, and `hybrid`
- circuit breaker defaults are configured in both config and connector logic
- timeout behavior varies by event type in `emit_event_with_context()`
- timeouts usually allow processing to continue rather than hard-stop the app

## Config updates do not seem to apply

Check whether the behavior depends on cached config from `/src/core/config.py`.

When in doubt:

1. update `config.toml`
2. restart the app
3. re-test

It is not glamorous, but it is faithful to how the code works.

## AI APIs return unavailable or 503

The AI subsystem is optional.

Check:

- `GET /api/ai/availability`
- logs
- whether AI modules are actually installed and importable

`/src/ui/api.py` explicitly gates AI endpoints behind availability checks.

## Event bus behavior seems odd

Read:

- `/src/core/event_bus.py`
- `/tests/unit/test_event_bus.py`

The tests are a very good quick reference for expected subscription, publish, error isolation, and history behavior.

## Related docs

- [Operations](operations.md)
- [Plugin Management](plugin-management.md)
- [Event Flow](../contributor-guide/event-flow.md)
