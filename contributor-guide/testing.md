# Testing

[中文](testing_CN.md)

This page summarizes the most important tests and how they relate to the architecture.

## Main test entrypoints

Useful commands from the project instructions:

```bash
python -m pytest
python -m pytest tests/unit/test_event_bus.py
python -m pytest tests/integration/test_api.py
python -m pytest tests/test_interceptor_optimization.py
python -m pytest tests/integration
```

## Key tests in the repository

### Event bus unit tests

File:
- `/tests/unit/test_event_bus.py`

This test file covers core event bus semantics such as:

- subscription and unsubscription
- publishing behavior
- async subscriber handling
- error isolation between subscribers
- event history and queue-related behavior

If you change `/src/core/event_bus.py`, read this file first.

## API integration tests

File:
- `/tests/integration/test_api.py`

This file validates representative API behavior such as:

- health endpoint behavior
- login success and failure
- protected endpoint behavior
- system status/config responses

It is especially useful when changing auth flows, system API behavior, or startup-related wiring.

## Interceptor optimization tests

File:
- `/tests/test_interceptor_optimization.py`

This file covers:

- serial/parallel/hybrid execution behavior
- circuit breaker semantics
- priority ordering
- timeout-oriented behavior
- performance-oriented expectations

If you touch interceptors, event-context timing, or plugin message routing, this file matters.

## How to use tests effectively as a contributor

A good pattern is:

1. identify the subsystem you are changing
2. run the most relevant narrow test file first
3. run broader pytest targets after that

For example:

- changing event bus internals -> run `tests/unit/test_event_bus.py`
- changing auth or API boot behavior -> run `tests/integration/test_api.py`
- changing interceptor logic -> run `tests/test_interceptor_optimization.py`

## Caveat

The current tests are valuable, but they are not exhaustive coverage of the giant API surface in `/src/ui/api.py`.

So when changing large management APIs, use both tests and careful source inspection.

## Related docs

- [Backend Structure](backend-structure.md)
- [Event Flow](event-flow.md)
- [Troubleshooting](../user-guide/troubleshooting.md)
