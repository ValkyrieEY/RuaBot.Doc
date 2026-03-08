# FAQ

[中文](faq_CN.md)

## Is this a Next.js project?

No.

The active frontend is React + TypeScript + Vite, as shown by:

- `/webui/package.json`
- `/webui/vite.config.ts`

Some older text may still say Next.js. The code won that argument.

## Where is the main entrypoint?

The main backend entrypoint is:

- `/src/main.py`

There is also a Windows wrapper:

- `/run.py`

## Why are my config changes not taking effect immediately?

Because config is cached by `get_config()` in `/src/core/config.py`, and not every subsystem is fully dynamic.

Restarting after changing `config.toml` is the safest approach.

## Why does the Web UI show a fallback page instead of the app?

Usually because `/src/ui/static/index.html` or `/src/ui/static/assets/` is missing.

Build the frontend from `/webui`:

```bash
npm install
npm run build
```

## Why does a plugin folder exist but the plugin is not active?

Because plugin state is not determined by the directory alone.

Enabled plugins are loaded from database-backed plugin settings in `/src/core/database.py`, then initialized through `/src/plugins/runtime/connector.py`.

## Do plugins run in the main process?

No.

The framework starts a separate Python runtime process for plugins:

- `/src/plugins/runtime/connector.py`
- `/src/plugins/runtime/main.py`

Communication happens over stdio using JSON messages.

## Why does message behavior seem more complicated than simple pub/sub?

Because it is.

For inbound messages, `/src/core/app.py` creates an `EventContext`, sends it through plugin processing, allows modification or blocking, and only then publishes the event to normal subscribers.

## Is AI required?

No.

The AI subsystem is optional. The app checks for AI availability and skips AI initialization when modules are unavailable.

## Where is data stored?

The default framework database is:

- `/data/framework.db`

That database stores plugin settings, binary storage, AI configuration, and related framework data.

## Which tests should I run first?

Useful starting points:

```bash
python -m pytest
python -m pytest tests/unit/test_event_bus.py
python -m pytest tests/integration/test_api.py
python -m pytest tests/test_interceptor_optimization.py
```

## Where should I read next?

- [Operations](../user-guide/operations.md)
- [Architecture Overview](../contributor-guide/architecture-overview.md)
- [Plugin Development Index](../plugin-development/README.md)
