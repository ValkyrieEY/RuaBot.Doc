# Quickstart

[中文](quickstart_CN.md)

This guide gets you from zero to a plausible plugin structure.

## Minimum mental model

A plugin in XQNEXT is:

- a directory under `/plugins`
- a `plugin.json` manifest
- Python code loaded by the separate runtime process
- typically a `create_plugin(api, config)` entrypoint

The runtime behavior is implemented in:

- `/src/plugins/runtime/main.py`

## Basic layout

A typical plugin directory looks like:

```text
plugins/
  my_plugin/
    plugin.json
    main.py
    requirements.txt   # optional
```

## Minimal manifest

A simple `plugin.json` might look like:

```json
{
  "name": "my_plugin",
  "version": "1.0.0",
  "author": "your_name",
  "entry": "main.py",
  "description": "Example plugin",
  "default_config": {
    "enabled_reply": true
  },
  "config_schema": {
    "enabled_reply": {
      "type": "boolean",
      "default": true,
      "description": "Whether the plugin should reply"
    }
  }
}
```

The exact manifest fields vary across current plugins, but `name`, `author`, `version`, and configuration-related fields are common.

## Basic Python entry

A minimal plugin module can follow the runtime expectation described in `/src/plugins/runtime/main.py`:

```python
class MyPlugin:
    def __init__(self, api, config):
        self.api = api
        self.config = config

    async def on_load(self):
        pass

    async def on_unload(self):
        pass


def create_plugin(api, config):
    return MyPlugin(api, config)
```

The runtime loads metadata, merges config, imports the entry module, and calls `create_plugin(api, config)`.

## Config merging behavior

Runtime loading merges:

- `default_config` from `plugin.json`
- database config overrides

This means your plugin should treat the received `config` object as the effective config, not re-read `plugin.json` itself.

## Installing dependencies

If your plugin needs third-party Python packages, you can declare them in:

- `plugin.json` -> `dependencies`
- `requirements.txt`

The connector can install them during plugin installation.

## Test with existing patterns

Before inventing your own conventions, inspect existing manifests such as:

- `/plugins/like_plugin/plugin.json`
- `/plugins/github_issues_capture/plugin.json`

They show the conventions this codebase actually uses today.

## Read next

- [Plugin Manifest and Layout](plugin-manifest-and-layout.md)
- [Plugin API](plugin-api.md)
- [Runtime Architecture](runtime-architecture.md)
