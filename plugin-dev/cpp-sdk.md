# C++ SDK 参考

> **你会学到**：`plugin_sdk.hpp` 提供的全部 C++ 友好接口，以及底层 `BotHostApi`（C ABI）函数表。
> 插件只需 `#include "plugin_sdk.hpp"`（header-only），底层仍是 C ABI，不破坏 ABI 稳定性。

## 1. 插件注册宏

```cpp
#include "plugin_sdk.hpp"

// 基础版：默认 priority=1000, continue, 消息事件, 无拦截器
BOT_REGISTER_PLUGIN("echo", "回声", "0.1.0", "xbot", "demo");

// 进阶：自定义 priority/propagation/events_mask/intercepts（末位可选 LOGO：网络 URL / 本地路径）
BOT_REGISTER_PLUGIN_EX("x", "X插件", "1.0.0", "me", "tool",
                       500u, 0u, BOT_EVT_MASK_MESSAGE, 0b111u, "");
```

宏自动生成 `bot_plugin_abi_version / bot_plugin_meta / bot_plugin_init / bot_plugin_shutdown` 四个必需符号，并在 `init` 里调用 `bot::init_sdk(api)`。

## 2. 消息视图 `bot::Message`

在 `bot_plugin_on_message(const BotMessageEvent* evt)` 里包装：

```cpp
extern "C" void bot_plugin_on_message(const BotMessageEvent* evt) {
    bot::Message m(evt);
    if (m.is_group() && !m.at_me()) return;   // 群消息只回 @我的
    m.reply(m.text());                          // 回复纯文本
}
```

| 方法 | 返回 | 说明 |
|------|------|------|
| `text()` | `string_view` | 消息纯文本 |
| `message_id()` / `event_id()` | `string_view` | 消息/事件 ID（撤回、引用用） |
| `sender_id()` / `sender_name()` | `string_view` | 发送者 openid / 昵称 |
| `group_id()` | `string_view` | 群 openid（空=私聊） |
| `is_group()` | `bool` | 是否群聊 |
| `at_me()` | `bool` | 是否 @了机器人 |
| `type()` | `BotEventType` | 事件类型 |
| `bot_id()` | `uint32_t` | 机器人 ID（能力调用用） |
| `reply(text)` | void | 回复纯文本（自动定位目标） |

## 3. 日志 `bot::Logger`

流式写日志，析构时经 `host->log` 落到运行时日志：

```cpp
bot::Logger::info()  << "收到消息 from=" << m.sender_id();
bot::Logger::warn()  << "未知指令: " << m.text();
bot::Logger::error() << "发送失败";
// trace/debug/info/warn/error
```

## 4. 访问 Host API `bot::host()`

`bot::host()` 返回 `const BotHostApi*`（在 init 后可用），直接调底层 C ABI：

```c
// 调用平台能力（XUBP v2，见 capabilities.md）
if (bot::host()->has_capability(bot_id, "xubp.group.member.mute")) {
    const char* args = "{\"group_openid\":\"G\",\"member_openid\":\"M\",\"op\":\"add\"}";
    char* out = nullptr; size_t out_len = 0;
    bot::host()->capability_invoke(bot_id, "xubp.group.member.mute", args, strlen(args), &out, &out_len);
    if (out) free(out);   // 记得释放
}
```

## 5. BotHostApi 函数表（C ABI）

| 函数指针 | 说明 |
|---------|------|
| `send_reply(evt, seg_json, len)` | 回复当前消息（segments JSON） |
| `send_proactive(bot_id, target, chat_type, seg_json, len)` | 主动发消息 |
| `recall(bot_id, message_id)` | 撤回消息 |
| `kv_get/set/delete/keys` | 键值存储（plugin+tenant+bot 三重隔离） |
| `blob_get/set/delete` | 二进制存储 |
| `setting_get` | 读取插件配置 |
| `log(level, msg, len)` | 写日志 |
| `register_command(name, help, handler)` | 注册指令（`/name` 触发） |
| `has_capability(bot_id, code)` | 能力发现：1=支持 0=不支持 |
| `capability_invoke(bot_id, code, args_json, args_len, out, out_len)` | 能力调用，JSON 进出 |

## 6. 指令 handler

```cpp
extern "C" int cmd_hello(const BotCommandCtx* ctx) {
    bot::Message m(ctx->evt);                    // ctx->evt 是触发指令的事件
    m.reply("Hello, " + std::string(m.sender_name()));
    return 0;
}

// 在 init 里注册
extern "C" int bot_plugin_init(const BotHostApi* api, uint32_t) {
    bot::init_sdk(api);
    api->register_command("/hello", "打招呼", &cmd_hello);
    return BOT_OK;
}
```

## 7. 拦截器（可选）

```cpp
extern "C" int bot_plugin_intercept_incoming(BotMessageEvent* evt) {
    // 返回非 0 = 停止传播；可改写 evt->content
    return 0;
}
extern "C" int bot_plugin_intercept_outgoing(BotOutgoing* msg) {
    // 返回非 0 = 阻断发送；可检查 msg->segments_json
    return 0;
}
extern "C" void bot_plugin_intercept_after_send(const BotSendResult* r) {
    // r->ok / r->sent_message_id
}
```

详见 [拦截器](./interceptors)。

## 下一步

- 调用平台能力（禁言/撤回/进群审批…）→ [能力调用](./capabilities)
- 发富媒体/按钮消息 → [发送消息](./messages)
- 处理按钮/互动事件 → [处理事件](./events)
