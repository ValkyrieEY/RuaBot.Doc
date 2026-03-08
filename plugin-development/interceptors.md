# Interceptors

[中文](interceptors_CN.md)

This page explains the interceptor system used by XQNEXT.

## What interceptors are for

Interceptors allow plugins to inspect, modify, or block actions and events before normal downstream handling completes.

This matters for message behavior, because not everything is a simple publish-and-forget event.

## Core implementation

Main implementation lives in:

- `/src/plugins/interceptor.py`

Important integration points also exist in:

- `/src/plugins/runtime/connector.py`
- `/src/core/app.py`
- `/tests/test_interceptor_optimization.py`

## Execution modes

The interceptor system supports:

- `serial`
- `parallel`
- `hybrid`

These are configured via `[plugins.interceptor]` in `config.toml` and then applied during application startup.

## Optimizations and safeguards

The current interceptor system includes:

- priority ordering
- adaptive timeouts
- circuit breaker behavior
- per-plugin failure tracking
- event interception and message interception paths

The connector also configures defaults such as:

- circuit breaker threshold: 3 consecutive failures
- circuit breaker open duration: 30 seconds
- base timeout: 3 seconds
- max timeout: 10 seconds

These values may be further influenced by config loaded by the app.

## Runtime bridge behavior

For runtime-based plugin interception, the connector uses `ProxyMessageInterceptor` to forward interception requests to the plugin runtime over JSON messaging.

If interception times out or fails, the fallback is generally to allow processing to continue.

That may sound permissive. It is. It is also usually better than turning one bad plugin into a framework-wide hostage situation.

## Event-context interaction

In `/src/core/app.py`, incoming messages and notices can be wrapped into an `EventContext`, sent through plugin processing, and then either modified, blocked, or passed through before normal event publication.

So interceptor-related behavior and event-context behavior are closely related in practice.

## What the tests cover

`/tests/test_interceptor_optimization.py` covers important expected behavior including:

- different execution modes
- priority ordering
- circuit breaker behavior
- timeout-related handling
- performance-oriented execution behavior

If you want to understand expected semantics quickly, the tests are worth reading.

## When to look here during debugging

Inspect interceptors when:

- messages are unexpectedly modified
- messages are blocked without obvious errors
- performance varies dramatically between plugins
- failures appear to stop affecting one plugin after repeated errors

The last case may simply be the circuit breaker doing exactly what it was written to do.

## Related docs

- [Runtime Architecture](runtime-architecture.md)
- [Event Flow](../contributor-guide/event-flow.md)
- [Troubleshooting](../user-guide/troubleshooting.md)
