# Runtime Architecture

[中文](runtime-architecture_CN.md)

This page explains how plugin runtime execution works in the current code.

## High-level design

XQNEXT splits plugin execution across two processes:

1. the main application process
2. a separate plugin runtime process

The bridge is implemented by:

- `/src/plugins/runtime/connector.py`
- `/src/plugins/runtime/main.py`

Communication happens over stdio using JSON messages.

## What the connector does

`PluginRuntimeConnector` in `/src/plugins/runtime/connector.py` is responsible for:

- starting the runtime subprocess
- tracking process state
- reading runtime output
- sending JSON messages to the runtime
- forwarding event bus events to plugins
- initializing enabled plugins from the database
- installing plugin dependencies during installation
- coordinating event-context requests and interceptor requests

## Runtime process startup

The connector starts the runtime using the Python executable and `main.py`.

It also includes Windows + Python 3.13 compatibility handling and even a `subprocess.Popen` fallback if `asyncio.create_subprocess_exec` is unavailable.

That is not glamorous, but it is extremely practical.

## Plugin initialization flow

At startup, the connector:

1. loads enabled plugin settings from the framework database
2. determines priority using database values, `plugin.json`, and defaults
3. sends an `init_plugins` message to the runtime
4. subscribes to OneBot-related event bus events

Source:
- `PluginRuntimeConnector.initialize()`
- `PluginRuntimeConnector._initialize_plugins()`

## What the runtime does

The runtime process in `/src/plugins/runtime/main.py` is responsible for:

- loading plugin manifests
- importing plugin entry modules
- creating plugin instances through `create_plugin(api, config)`
- calling lifecycle hooks such as `on_load()` and `on_unload()`
- handling incoming events
- supporting plugin API requests and interception-related logic

## Event forwarding

The connector subscribes to these event bus topics and forwards them to the runtime:

- `onebot.message`
- `onebot.notice`
- `onebot.request`
- `onebot.meta_event`

That forwarding happens in `_subscribe_to_events()`.

## Event context processing

For richer plugin-driven message handling, the main app can call:

- `emit_event_with_context()`

This sends a structured `EventContext` to the runtime and waits for a response.

Important behavior from `/src/plugins/runtime/connector.py`:

- `message.before_send` timeout: 2 seconds
- `message.received` timeout: 10 seconds
- other context events: 30 seconds
- timeout usually returns the original context so app flow continues

This is a pragmatic choice: better to keep the bot alive than to freeze the whole request path waiting for plugin enlightenment.

## Interceptor bridge

The connector also exposes a `ProxyMessageInterceptor` that forwards interception requests to runtime plugins and waits for a short response.

On timeout or error, interception generally falls back to allowing the message/event.

## Runtime health behavior

The connector maintains:

- heartbeat loop
- pending request tracking
- cleanup task for expired requests and futures

These mechanisms reduce the chance of stale requests piling up forever.

## Read next

- [Plugin API](plugin-api.md)
- [Interceptors](interceptors.md)
- [Event Flow](../contributor-guide/event-flow.md)
