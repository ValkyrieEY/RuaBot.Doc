# 插件 API

[English](plugin-api.md)

本页总结 `/src/plugins/runtime/plugin_api.py` 当前实现的插件侧 API。

## 构造方式

插件通常会在创建时收到一个 `PluginAPI` 实例和已经合并好的有效配置：

```python
def create_plugin(api, config):
    return MyPlugin(api, config)
```

`PluginAPI` 负责暴露 OneBot 操作、配置访问、二进制存储、事件发送、日志辅助以及拦截器注册能力。

## 通用 OneBot 调用

最底层的便捷方法是：

```python
await api.call_api(action, params)
```

典型用途包括：

- `get_group_list`
- `send_like`
- `get_group_member_list`

这个方法会通过连接器或应用对象暴露出来的 OneBot 适配器去发起调用。

## 消息相关方法

当前重要的发消息方法包括：

- `send_message(message_type, target_id, message, auto_escape=False)`
- `send_private_msg(user_id, message, auto_escape=False)`
- `send_group_msg(group_id, message, auto_escape=False)`
- `send_forward_msg(message_type, target_id, nodes)`
- `send_group_forward_msg(group_id, nodes)`
- `send_private_forward_msg(user_id, nodes)`

消息管理相关辅助方法包括：

- `delete_msg(message_id)`
- `get_msg(message_id)`

## 配置方法

插件配置保存在框架数据库中的插件设置里。

可用方法：

- `get_config(key=None)`
- `set_config(key, value)`

这些方法会先解析插件 author/name，再通过 `/src/core/database.py` 进行读写。

## 存储方法

插件可以使用由框架数据库支持的二进制存储接口：

- `get_storage(key)`
- `set_storage(key, value)`
- `delete_storage(key)`
- `list_storage_keys()`

底层以 `owner_type = plugin` 的方式写入数据库二进制存储表。

## 事件发送

插件可以向框架发出事件：

- `emit_event(event_name, data)`

实际事件名会被拼成：

```text
plugin.<plugin_name>.<event_name>
```

## 日志辅助

插件可以通过以下方法写入框架日志：

- `log(level, message, **kwargs)`

这样日志中会保留插件名上下文，后续排查通常更轻松一些。

## 常用 OneBot 快捷方法

当前 API 还提供了很多常见快捷方法，包括：

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

如果快捷方法里没有你想要的接口，通常就退回 `call_api()`。

## 拦截器注册

插件 API 还提供：

- `register_message_interceptor(interceptor)`
- `unregister_message_interceptor()`

这允许插件把自己的拦截器挂到连接器维护的拦截器注册表中。

另见：
- [拦截器](interceptors_CN.md)

## 使用时的几个注意点

- 很多方法返回的是 `{"success": True, "data": ...}` 这种包装结构，而不是原始 OneBot 返回值。
- 配置和存储都走数据库，不是直接读写插件目录里的本地文件。
- OneBot 适配器必须能从连接器或 app 路径拿到，否则相关 API 会失败。

## 继续阅读

- [快速开始](quickstart_CN.md)
- [运行时架构](runtime-architecture_CN.md)
- [拦截器](interceptors_CN.md)
