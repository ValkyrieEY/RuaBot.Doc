# Plugin Manifest and Layout

[中文](plugin-manifest-and-layout_CN.md)

This page documents the practical structure expected for plugins.

## Required location

Plugins are expected under:

- `/plugins/<plugin_name>/`

The plugin directory should contain:

- `plugin.json`
- the plugin entry module, commonly `main.py`
- optionally `requirements.txt`

## plugin.json is the center of gravity

The runtime and UI both rely on `plugin.json`.

Current code uses it for:

- plugin metadata
- entry module path
- default configuration
- config schema for UI generation
- dependency declarations
- optional priority

Relevant runtime logic:
- `/src/plugins/runtime/main.py`
- `/src/plugins/runtime/connector.py`

## Common fields seen in current plugins

Examples from current repository manifests include fields such as:

- `name`
- `version`
- `author`
- `description`
- `entry`
- `category`
- `tags`
- `dependencies`
- `default_config`
- `config_schema`

For example, `/plugins/github_issues_capture/plugin.json` includes:

```json
{
  "name": "github_issues_capture",
  "version": "1.0.0",
  "author": "XQNEXT",
  "entry": "main.py",
  "dependencies": [
    {"name": "requests", "version": ">=2.31.0", "required": true},
    {"name": "pillow", "version": ">=10.3.0", "required": true}
  ]
}
```

And `/plugins/like_plugin/plugin.json` includes config-oriented fields:

```json
{
  "default_config": {
    "bot_name": "机器人",
    "reminder": ""
  },
  "config_schema": {
    "bot_name": {
      "type": "string",
      "default": "机器人",
      "description": "机器人名称"
    }
  }
}
```

## Layout recommendations

A sensible plugin layout is:

```text
plugins/
  my_plugin/
    plugin.json
    main.py
    requirements.txt
    assets/
    data/
```

Only `plugin.json` and the entry code are fundamentally expected by the loader.

## Config UI implications

The Web UI does not depend on custom plugin frontend code for ordinary plugin configuration.

Instead, backend plugin endpoints read `config_schema` from `plugin.json` and expose schema-driven config handling.

So if configuration is user-editable, keep these aligned:

- `default_config`
- `config_schema`
- what your plugin code actually expects

That alignment saves everyone time, especially your future self.

## Priority notes

Plugin priority may be declared in `plugin.json`, but database settings can override it.

When enabled plugins are initialized, connector logic prefers database priority unless it is still at the default value.

## Read next

- [plugin.json Reference](../reference/plugin-json-reference.md)
- [Runtime Architecture](runtime-architecture.md)
