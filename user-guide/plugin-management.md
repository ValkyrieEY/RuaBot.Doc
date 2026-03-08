# Plugin Management

[中文](plugin-management_CN.md)

This guide explains how plugin management works for operators and power users.

## The important architectural fact

Plugins do not run directly in the main process.

The main process manages a separate plugin runtime process through:

- `/src/plugins/runtime/connector.py`
- `/src/plugins/runtime/main.py`

This affects installation, reload behavior, and debugging.

## Where plugins live

Installed plugin directories live under:

- `/plugins`

Each plugin is expected to contain a `plugin.json` manifest.

Examples in the current repository include:

- `/plugins/like_plugin/plugin.json`
- `/plugins/github_issues_capture/plugin.json`
- `/plugins/group_manager/plugin.json`

## Where plugin state is stored

Plugin state is stored in two places:

1. plugin files on disk under `/plugins`
2. plugin settings in the framework database

Database-backed state includes at least:

- enabled/disabled state
- config overrides
- priority
- installation metadata

Source reference:
- `/src/core/database.py`

## List plugins

The main API endpoint is:

- `GET /api/plugins`

This returns plugin information exposed by `/src/ui/api.py`.

There are also plugin-specific endpoints such as:

- `GET /api/plugins/{plugin_name}`
- `GET /api/plugins/{plugin_name}/config-schema`

## Enable, disable, reload, and act on plugins

Relevant endpoints include:

- `POST /api/plugins/{plugin_name}/action`
- `POST /api/plugins/reload-all`
- `DELETE /api/plugins/{plugin_name}`
- `PUT /api/plugins/{plugin_name}/config`

Typical actions include enabling, disabling, loading, unloading, and reloading.

## Install plugins

Available install-related endpoints:

- `POST /api/plugins/upload`
- `POST /api/plugins/install-from-github`
- `GET /api/plugins/install-progress/{task_id}`

Plugin installation logic in `/src/plugins/runtime/connector.py` supports:

- local directory sources
- local zip files
- URL downloads, including GitHub-style zip archives

## Dependency installation behavior

When installing a plugin, the connector can install dependencies from:

- `plugin.json` -> `dependencies`
- `requirements.txt` inside the plugin directory

This is implemented by `install_plugin_dependencies()` in `/src/plugins/runtime/connector.py`.

Important caveat: dependency installation failures are generally logged as warnings and do not always hard-fail the overall plugin installation. That is convenient right up until it becomes your problem.

## How plugin config works

Plugin config UI and API behavior depend heavily on `plugin.json`, especially:

- `default_config`
- `config_schema`

Example manifest fields from current plugins:

```json
{
  "name": "like_plugin",
  "version": "1.0.0",
  "author": "XQNEXT",
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

Source:
- `/plugins/like_plugin/plugin.json`

## Priority behavior

Plugin priority can come from:

- the database setting
- `plugin.json`
- fallback default priority `100`

`PluginRuntimeConnector._initialize_plugins()` merges these sources, preferring database values when present.

## Uninstall behavior

Uninstalling a plugin via connector logic can include:

1. unloading it from the runtime
2. deleting the plugin directory
3. deleting plugin storage data
4. deleting plugin settings from the database

That logic is implemented in `/src/plugins/runtime/connector.py`.

## Related docs

- [Plugin Development Index](../plugin-development/README.md)
- [plugin.json Reference](../reference/plugin-json-reference.md)
- [Troubleshooting](troubleshooting.md)
