# Plugin API

[中文](plugin-api_CN.md)

This page summarizes the plugin-facing API currently implemented in `/src/plugins/runtime/plugin_api.py`.

## Construction

Plugins typically receive a `PluginAPI` instance plus effective config when created:

```python
def create_plugin(api, config):
    return MyPlugin(api, config)
```

The `PluginAPI` object exposes OneBot operations, config access, binary storage, event emission, logging helpers, and interceptor registration.

## Universal OneBot call

The lowest-level convenience method is:

```python
await api.call_api(action, params)
```

Example use cases:

- `get_group_list`
- `send_like`
- `get_group_member_list`

This method uses the OneBot adapter exposed through the connector or app.

## Messaging methods

Important message-sending methods include:

- `send_message(message_type, target_id, message, auto_escape=False)`
- `send_private_msg(user_id, message, auto_escape=False)`
- `send_group_msg(group_id, message, auto_escape=False)`
- `send_forward_msg(message_type, target_id, nodes)`
- `send_group_forward_msg(group_id, nodes)`
- `send_private_forward_msg(user_id, nodes)`

Message management helpers include:

- `delete_msg(message_id)`
- `get_msg(message_id)`

## Config methods

Config is stored in plugin settings in the framework database.

Available helpers:

- `get_config(key=None)`
- `set_config(key, value)`

These methods resolve the plugin by author/name and then operate through `/src/core/database.py`.

## Storage methods

Plugins get binary storage helpers backed by the framework database:

- `get_storage(key)`
- `set_storage(key, value)`
- `delete_storage(key)`
- `list_storage_keys()`

This uses database binary storage under owner type `plugin`.

## Event emission

Plugins can emit framework-visible events:

- `emit_event(event_name, data)`

This prefixes the event as:

```text
plugin.<plugin_name>.<event_name>
```

## Logging helper

Plugins can write framework logs through:

- `log(level, message, **kwargs)`

This keeps plugin log entries tagged with the plugin name.

## Convenience OneBot methods

The current API also provides many common shortcuts, including:

- `get_group_list()`
- `get_group_info(group_id, no_cache=False)`
- `get_group_member_list(group_id)`
- `get_group_member_info(group_id, user_id, no_cache=False)`
- `get_friend_list()`
- `get_stranger_info(user_id, no_cache=False)`
- `send_like(user_id, times=1)`
- `set_group_kick(group_id, user_id, reject_add_request=False)`
- `set_group_ban(group_id, user_id, duration=1800)`
- `set_group_whole_ban(group_id, enable=True)`
- `set_group_admin(group_id, user_id, enable=True)`
- `set_group_card(group_id, user_id, card="")`
- `set_group_name(group_id, group_name)`
- `set_group_leave(group_id, is_dismiss=False)`
- `get_login_info()`
- `get_status()`
- `get_version_info()`
- `upload_group_file(...)`
- `get_group_file_url(...)`
- `get_image(file)`
- `get_record(file, out_format)`
- `can_send_image()`
- `can_send_record()`
- `ocr_image(image)`
- `mark_msg_as_read(message_id)`
- `forward_friend_single_msg(user_id, message_id)`
- `forward_group_single_msg(group_id, message_id)`

For anything not covered by helpers, `call_api()` remains the fallback.

## Interceptor registration

The plugin API also exposes:

- `register_message_interceptor(interceptor)`
- `unregister_message_interceptor()`

This allows plugins to hook into interceptor logic managed by the connector registry.

See also:
- [Interceptors](interceptors.md)

## Caveats

- Many methods return wrapper dicts like `{"success": True, "data": ...}` rather than raw OneBot responses.
- Config and storage are database-backed, not local plugin-file-backed.
- The OneBot adapter must be available through the connector/app path or API calls will fail.

## Related docs

- [Quickstart](quickstart.md)
- [Runtime Architecture](runtime-architecture.md)
- [Interceptors](interceptors.md)
