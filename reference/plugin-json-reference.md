# plugin.json Reference

[中文](plugin-json-reference_CN.md)

This page describes the fields commonly used in plugin manifests in the current repository.

## Location

A plugin manifest is expected at:

- `/plugins/<plugin_name>/plugin.json`

Examples:

- `/plugins/like_plugin/plugin.json`
- `/plugins/github_issues_capture/plugin.json`

## Common fields

### name

Plugin name.

Example:

```json
"name": "like_plugin"
```

### version

Plugin version string.

Example:

```json
"version": "1.0.0"
```

### author

Plugin author identifier.

Example:

```json
"author": "XQNEXT"
```

### description

Human-readable description.

### entry

Entry Python file for the runtime to import.

Example:

```json
"entry": "main.py"
```

If omitted, plugin code may still rely on project conventions, but explicitly declaring it is clearer and already used by current plugins.

### category

Optional plugin category.

Seen in:

- `/plugins/like_plugin/plugin.json`

### tags

Optional tag list.

Example:

```json
"tags": ["like", "qq", "profile"]
```

### dependencies

Optional dependency declarations used during installation.

Supported current patterns include:

- string entries like `"package>=1.0"`
- object entries like:

```json
{
  "name": "requests",
  "version": ">=2.31.0",
  "required": true
}
```

The installer logic reads these in `/src/plugins/runtime/connector.py`.

### default_config

Default configuration object for the plugin.

Example from `plugins/like_plugin/plugin.json`:

```json
"default_config": {
  "bot_name": "机器人",
  "reminder": ""
}
```

### config_schema

Schema used by the backend/UI to expose editable config fields.

Example pattern from `plugins/like_plugin/plugin.json`:

```json
"config_schema": {
  "bot_name": {
    "type": "string",
    "default": "机器人",
    "description": "机器人名称"
  }
}
```

### priority

Optional plugin priority.

Important caveat:

- database settings may override this
- connector initialization merges runtime priority sources

## Practical rules

If your plugin exposes config to users:

- keep `default_config` aligned with `config_schema`
- keep both aligned with what the code actually expects

If your plugin needs packages:

- declare them in `dependencies`
- or provide `requirements.txt`

If your plugin is meant to be straightforward to load:

- declare `entry` explicitly

## Related docs

- [Plugin Manifest and Layout](../plugin-development/plugin-manifest-and-layout.md)
- [Plugin Management](../user-guide/plugin-management.md)
