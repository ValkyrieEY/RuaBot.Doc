# Event Flow

[中文](event-flow_CN.md)

This page describes the runtime event flow that matters when debugging behavior.

## Core path

At a high level:

1. OneBot delivers an event
2. the application converts it into internal framework structures
3. plugin-aware processing may run
4. the event bus publishes the event to subscribers
5. WebSocket clients and other consumers may receive the result

Main sources:
- `/src/core/app.py`
- `/src/core/event_bus.py`
- `/src/plugins/runtime/connector.py`
- `/src/ui/api.py`

## Incoming OneBot events

During startup, `/src/core/app.py` wires OneBot event handling.

For incoming events, the application publishes internal event-bus events such as:

- `onebot.message`
- `onebot.notice`
- `onebot.request`
- `onebot.meta_event`

## Message and notice special handling

Messages and notices are not always passed straight through.

For relevant cases, the app constructs an `EventContext`, then sends it through plugin-aware processing using the plugin runtime connector.

This allows plugins to:

- inspect the event
- modify the context
- block default behavior

Only after that does normal event publication continue.

## Event bus behavior

`/src/core/event_bus.py` provides:

- event objects with name, payload, source, timestamps, IDs
- async publish/subscribe
- queued dispatch
- history tracking
- subscriber stats and queue stats

The unit tests in `/tests/unit/test_event_bus.py` are a helpful behavioral specification.

## Plugin runtime forwarding

The connector subscribes to the main OneBot event topics and forwards them to the plugin runtime process.

This means plugins can react to incoming events even when they are not directly registered as ordinary in-process subscribers.

## WebSocket fan-out

`/src/ui/api.py` subscribes the `WebSocketManager` to event-bus traffic when the first WebSocket client connects.

Relevant client-facing flow:

- event bus receives OneBot event
- `WebSocketManager` formats payload
- message is broadcast to `/ws/messages` clients

## Why event flow bugs can be confusing

Because several distinct layers are involved:

- protocol input
- app-level context handling
- interceptor logic
- event bus publication
- plugin runtime forwarding
- WebSocket/UI presentation

A bug at any one step can look like a bug somewhere else. Distributed confusion is still confusion.

## Related docs

- [Architecture Overview](architecture-overview.md)
- [Interceptors](../plugin-development/interceptors.md)
- [Realtime and Logs](../user-guide/realtime-and-logs.md)
