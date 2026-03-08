# Plugin Development

[中文](README_CN.md)

This section is for users who want to build their own XQNEXT plugins.

The goal here is practical onboarding: what files to create, what runtime behavior to expect, how `plugin.json` affects both loading and the Web UI, how to use the plugin API safely, and where to look when the framework appears to be silently judging your plugin.

## Recommended reading order

If this is your first plugin, read in this order:

1. [Quickstart](quickstart.md)
2. [Plugin Manifest and Layout](plugin-manifest-and-layout.md)
3. [Runtime Architecture](runtime-architecture.md)
4. [Plugin API](plugin-api.md)
5. [Interceptors](interceptors.md)

## What makes XQNEXT plugin development different

Compared with simpler bot frameworks, XQNEXT plugin development has a few important characteristics:

- plugins run in a **separate Python process**
- plugin enablement, config overrides, and priority are **database-backed**
- `plugin.json` drives both **runtime metadata** and **schema-based config UI generation**
- inbound and outbound message behavior may pass through **event-context** and **interceptor** logic before normal subscribers ever see anything

That means a plugin is not just “some Python file in a folder.” It is a participant in a larger runtime contract.

## Primary source files behind plugin behavior

When in doubt, these files are the real specification:

- `src/plugins/runtime/connector.py`
- `src/plugins/runtime/main.py`
- `src/plugins/interceptor.py`
- `src/core/app.py`
- `src/ui/api.py`

Important note: there is also a `src/plugins/runtime/plugin_api.py` file in the repository, but the active runtime path in current source constructs `PluginAPI` inside `src/plugins/runtime/main.py`. For plugin authors, `main.py` is the behavior that matters.

## Real plugin examples in this repository

Useful manifests to inspect:

- `plugins/like_plugin/plugin.json`
- `plugins/kawaii_status/plugin.json`
- `plugins/github_issues_capture/plugin.json`
- `plugins/message_relay_client/plugin.json`
- `plugins/group_manager/plugin.json`

These show actual patterns used by the current codebase:

- simple config-driven plugins
- plugins with dependency declarations
- plugins with explicit priority
- plugins with richer `config_schema`

## What this section covers

- how to create a plugin directory structure
- how to write `plugin.json`
- how config is merged and persisted
- how the runtime loads your plugin
- which plugin methods are actually used
- how to send messages and call OneBot APIs
- how storage and config helpers behave
- how interception works
- how to debug load failures, timeout behavior, and config mismatches

## What this section does not pretend

It does not pretend that every plugin framework feature is fully abstracted or perfectly documented by type definitions.

XQNEXT gives you useful primitives, but the safest path is still to align with the code paths already used by the built-in examples and runtime.

## After this section

Once you finish these plugin docs, the most useful follow-up reads are:

- [Event Flow](../contributor-guide/event-flow.md)
- [API Surface Overview](../reference/api-surface-overview.md)
- [plugin.json Reference](../reference/plugin-json-reference.md)
