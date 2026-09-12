---
title: Host API
description: 框架提供给插件的 BotHostApi 函数指针表全部接口签名、说明与所属 ABI 版本，以及官方 SDK 封装层一览。
---

# Host API

`BotHostApi` 是框架在 `bot_plugin_init` 时传给插件的**能力表**（一张函数指针表）。插件通过它发消息、存取数据、调用平台能力、打日志——除此之外没有别的通道（没有数据库句柄、没有文件路径）。

这页是逐个接口的速查表：签名与 `include/bot_plugin.h` **逐字一致**，最后一列是它从哪个 ABI 版本开始可用。

## 版本字段与通用约定

| 字段 | 签名 | 说明 | ABI |
| --- | --- | --- | --- |
| `abi_major` | `uint32_t abi_major` | 框架的 ABI major | 1.0 |
| `abi_minor` | `uint32_t abi_minor` | 框架的 ABI minor | 1.0 |

约定：

- 函数返回 `int32_t`，`0`（`BOT_OK`）为成功，负数为错误码（见文末）；
- 返回的字符串/缓冲**只在本次调用到下次宿主调用之间有效**（线程局部缓冲），要留用必须立刻复制；
- 个别接口（`kv_keys` / `http_get` / `http_request` / `capability_invoke`）返回的是**框架分配**的缓冲，用完必须交给 `free` 释放。

## 发消息

| 函数 | 签名 | 说明 | ABI |
| --- | --- | --- | --- |
| `send_reply` | `int32_t (*send_reply)(const BotMessageEvent* evt, const char* seg_json, size_t len)` | 被动回复：绑定触发事件的原消息，自动判定群/私聊目标；QQ 官方平台 5 分钟内免主动频控 | 1.0 |
| `send_proactive` | `int32_t (*send_proactive)(uint32_t bot_id, const char* target, uint8_t chat_type, const char* seg_json, size_t len)` | 主动推送：自己指定机器人、目标与 `chat_type`（`0` 私聊 / `1` 群 / `2` 频道） | 1.0 |
| `recall` | `int32_t (*recall)(uint32_t bot_id, const char* message_id)` | 撤回消息；受平台可撤回时限约束 | 1.0 |

## KV 存储（三重隔离：插件 + 租户 + 机器人）

| 函数 | 签名 | 说明 | ABI |
| --- | --- | --- | --- |
| `kv_get` | `int32_t (*kv_get)(const char* key, const char** out, size_t* out_len)` | 读键值；key 不存在时返回 `BOT_OK` 且 `*out = nullptr` | 1.0 |
| `kv_set` | `int32_t (*kv_set)(const char* key, const char* value, size_t len)` | 写键值（任意字节/字符串） | 1.0 |
| `kv_delete` | `int32_t (*kv_delete)(const char* key)` | 删除键 | 1.0 |
| `kv_keys` | `int32_t (*kv_keys)(const char* prefix, char** out, size_t* out_len)` | 按键前缀列出键名，返回 JSON 数组；结果由**框架分配**，用 `free` 释放 | 1.0 |

## 二进制存储

| 函数 | 签名 | 说明 | ABI |
| --- | --- | --- | --- |
| `blob_get` | `int32_t (*blob_get)(const char* key, const uint8_t** out, size_t* len)` | 读二进制值；不存在时 `*out = nullptr` | 1.0 |
| `blob_set` | `int32_t (*blob_set)(const char* key, const uint8_t* data, size_t len)` | 写二进制值 | 1.0 |
| `blob_delete` | `int32_t (*blob_delete)(const char* key)` | 删除键 | 1.0 |

## 设置 / 日志 / 指令

| 函数 | 签名 | 说明 | ABI |
| --- | --- | --- | --- |
| `setting_get` | `int32_t (*setting_get)(const char* key, const char** out, size_t* len)` | 读**当前插件 + 当前机器人**的设置值（字符串形式） | 1.0 |
| `setting_set` | `int32_t (*setting_set)(const char* key, const char* value, size_t len)` | 写设置值；`value` 为 `NULL` 时删除该键；键名只允许字母、数字、`_`、`-` | 1.3 |
| `log` | `void (*log)(uint8_t level, const char* msg, size_t len)` | 写一条日志（级别见文末） | 1.0 |
| `register_command` | `int32_t (*register_command)(const char* name, const char* help, int (*handler)(const BotCommandCtx*))` | 注册一个指令；命中时回调 `handler` | 1.0 |

## 能力发现与调用

| 函数 | 签名 | 说明 | ABI |
| --- | --- | --- | --- |
| `has_capability` | `int32_t (*has_capability)(uint32_t bot_id, const char* code)` | 查询某机器人是否支持该能力码：`1` 支持 / `0` 不支持 | 1.0 |
| `capability_invoke` | `int32_t (*capability_invoke)(uint32_t bot_id, const char* code, const char* args_json, size_t args_len, char** out, size_t* out_len)` | 通用能力调用，JSON 进 JSON 出；不支持返回 `BOT_ENOTSUP`；结果由**框架分配**，用 `free` 释放 | 1.0 |

## HTTP

| 函数 | 签名 | 说明 | ABI |
| --- | --- | --- | --- |
| `http_get` | `int32_t (*http_get)(const char* url, int verify_ssl, char** out, size_t* out_len)` | GET 请求，返回响应体（UTF-8）；`*out` 由**框架分配**，用毕调 `free` | 早于 1.3 |
| `http_request` | `int32_t (*http_request)(const char* method, const char* url, const char* body, int verify_ssl, int timeout_sec, char** out, size_t* out_len, int* out_status, const char** out_content_type)` | 任意 method（GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS）；`verify_ssl=0` 跳过证书校验，`timeout_sec<=0` 用默认；成功（含非 2xx，响应体照回）返回 `BOT_OK`，传输失败返回 `BOT_EINTERNAL` | 1.5 |
| `free` | `void (*free)(void* p)` | 释放 `http_get` / `http_request` / `capability_invoke` / `kv_keys` 返回的缓冲 | 早于 1.3 |

## 面板事件推送

| 函数 | 签名 | 说明 | ABI |
| --- | --- | --- | --- |
| `panel_push` | `int32_t (*panel_push)(const char* json, size_t len)` | 把一段 JSON 事件推给「当前插件 + 当前机器人」已打开面板的订阅者；面板经 `panel/api/__events?after=<seq>` 轮询收取 | 1.4 |

## 结构体速查

| 结构体 | 关键字段 | 用途 |
| --- | --- | --- |
| `BotMessageEvent` | `bot_id` / `content` / `sender_id` / `chat_group_id` / `message_id` / `is_at_self` / `type` / `raw_json` | 事件（见 [处理事件](/plugin-dev/events)） |
| `BotOutgoing` | `bot_id` / `target` / `chat_type` / `segments_json` | 出站消息（出站拦截器可改写） |
| `BotSendResult` | `ok` / `message_id` / `error` | 发送回执 |
| `BotCommandCtx` | `name` / `args_json` / `evt` | 指令回调上下文；用 `ctx->evt` 可回复 |
| `BotWebRequest` | `method` / `sub_path` / `query` / `body` / `bot_id` / `bot_uuid` | 面板请求（见 [插件 Web 面板](/plugin-dev/webui)） |
| `BotWebResponse` | `status` / `content_type` / `body` / `body_len` | 面板响应 |

## 官方 SDK 封装层

`plugin_sdk.hpp` 把这些函数指针包成了好用的 C++ 对象，日常写插件用它就够了：

| 封装 | 签名/用法 | 说明 |
| --- | --- | --- |
| `bot::init_sdk` | `void init_sdk(const BotHostApi* api)` | 由注册宏展开的 `bot_plugin_init` 自动调用，缓存能力表 |
| `bot::host()` | `const BotHostApi* host()` | 取能力表指针；未初始化时为 `nullptr` |
| `bot::Message` | `explicit Message(const BotMessageEvent* e)` | 事件视图：`text()` / `sender_id()` / `sender_name()` / `group_id()` / `is_group()` / `at_me()` / `message_id()` / `bot_id()` / `type()` / `raw()` / `reply(text)` |
| `bot::Logger` | `Logger::info() << ...` | 流式日志；级别有 `trace` / `debug` / `info` / `warn` / `error`，析构时落 `host->log` |
| `bot::http_get` | `std::string http_get(const std::string& url, int verify_ssl = 1)` | GET 封装；失败返回空串 |
| `bot::setting_get` | `std::string setting_get(const std::string& key, std::string def = {})` | 读设置；不存在返回默认值 |
| `bot::setting_set` | `bool setting_set(const std::string& key, std::string_view value = {})` | 写设置；value 为空则删除键 |
| `bot::panel_push` | `bool panel_push(std::string_view json)` | 推送面板事件 |
| `bot::shutdown_hook` | `void (*shutdown_hook)()` | 可选清理钩子；静态对象注册，`shutdown` 时调用（见 [生命周期回调](/plugin-dev/lifecycle)） |

```cpp
// 典型用法：日志 + 回复 + 读设置
bot::Logger::info() << "[mybot] text=" << m.text();
m.reply("好");
std::string greeting = bot::setting_get("greeting", "你好");

// KV 没有 SDK 封装，直接用能力表
const char* out = nullptr; size_t len = 0;
if (bot::host()->kv_get("score:alice", &out, &len) == BOT_OK && out) {
    std::string value(out, len);        // 立刻复制
}
```

## 错误码与日志级别

| 错误码 | 值 | 含义 |
| --- | --- | --- |
| `BOT_OK` | 0 | 成功 |
| `BOT_EINVAL` | -1 | 参数不合法 |
| `BOT_ENOTSUP` | -2 | 能力不支持 |
| `BOT_EBUSY` | -3 | 忙碌 / 被限流 |
| `BOT_EINTERNAL` | -4 | 内部错误 |

| 日志级别 | 值 |
| --- | --- |
| `BOT_LOG_TRACE` | 0 |
| `BOT_LOG_DEBUG` | 1 |
| `BOT_LOG_INFO` | 2 |
| `BOT_LOG_WARN` | 3 |
| `BOT_LOG_ERROR` | 4 |

## 下一步

- [插件元数据](/reference/meta)：`BotPluginMeta` 逐字段说明与注册宏
- [平台能力码](/reference/capabilities)：`has_capability` / `capability_invoke` 用的能力码目录
- [存储与配置](/plugin-dev/storage)：KV / Blob / 设置的用法与示例
