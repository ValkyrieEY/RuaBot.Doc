---
title: 调用平台能力
description: 用能力码探测并调用平台操作（禁言、踢人、撤回、审批等），先探测再调用的写法与两个完整例子。
---

# 调用平台能力

发消息之外，插件还经常要做平台操作：撤回消息、禁言、踢人、审批入群、点赞。这些操作各平台叫法不同、参数不同，框架把它们统一成**能力码（capability）**：插件只写一个能力码 + 一段 JSON 参数，由适配器翻译成对应平台的调用。

## 什么是能力码

能力码是形如 `xubp.<域>.<实体>.<动作>` 的字符串，例如：

| 能力码 | 含义 |
| --- | --- |
| `xubp.message.recall` | 撤回消息 |
| `xubp.group.member.mute` | 群成员禁言 / 解除禁言 |
| `xubp.group.member.kick` | 踢出群成员 |
| `xubp.profile.like` | 给用户点赞 |
| `xubp.reaction.add` | 给消息加表态 |

能力分两层：

- **核心域**：所有平台都有的能力（发文本/图片、撤回等），可以无条件依赖；
- **扩展域**：某个平台特有的能力（QQ 官方的入群审批策略、OneBot 的点赞等）。**扩展域能力调用前必须先探测**。

具体某个平台支持哪些能力码，见 [平台能力码](/reference/capabilities)。

## 探测与调用

```cpp
/* 探测：返回 1 = 支持，0 = 不支持 */
int32_t (*has_capability)(uint32_t bot_id, const char* code);

/* 调用：参数与结果都是 JSON */
int32_t (*capability_invoke)(uint32_t bot_id, const char* code,
                             const char* args_json, size_t args_len,
                             char** out, size_t* out_len);
```

返回码：

| 返回码 | 值 | 含义 |
| --- | --- | --- |
| `BOT_OK` | 0 | 调用成功，`*out` 是结果 JSON |
| `BOT_ENOTSUP` | -2 | 平台不支持这个能力 |
| `BOT_EINVAL` | -1 | 参数不合法（缺字段、格式错） |
| `BOT_EBUSY` | -3 | 平台侧忙碌 / 被限流 |
| `BOT_EINTERNAL` | -4 | 其它内部错误（机器人未连接等） |

::: danger 铁律：先探测再调用，不支持就降级
**每个扩展域能力码在使用前都要用 `has_capability` 探测一次。** 直接调用不支持的能力只会拿到 `BOT_ENOTSUP`；一个跨平台插件必须在探测失败时选择降级路径（改用纯文本提示、跳过该功能、换别的方式实现），而不是把失败抛给用户。

这不是可选的编码风格——能力并集里绝大多数能力只有部分平台提供，不探测就会在别的平台上必然失败。
:::

## 例子一：撤回消息

```cpp
#include "plugin_sdk.hpp"

// 撤回一条消息；平台不支持时返回 false，由调用方决定怎么降级
static bool try_recall(uint32_t bot_id, const std::string& message_id,
                       const std::string& target, int chat_type) {
    auto* h = bot::host();

    // 1) 先探测
    if (!h->has_capability || h->has_capability(bot_id, "xubp.message.recall") != 1) {
        bot::Logger::warn() << "[recall] 平台不支持撤回，跳过";
        return false;                                   // 降级：不做撤回
    }

    // 2) 再调用：参数给全（不同平台需要不同字段，缺字段会返回 BOT_EINVAL）
    std::string args = "{\"message_id\":\"" + message_id + "\","
                       "\"target\":\"" + target + "\","
                       "\"chat_type\":\"" + std::to_string(chat_type) + "\"}";
    char* out = nullptr; size_t len = 0;
    int32_t rc = h->capability_invoke(bot_id, "xubp.message.recall",
                                      args.data(), args.size(), &out, &len);
    std::string result = (out && len) ? std::string(out, len) : std::string();
    if (out && h->free) h->free(out);                   // 结果缓冲必须由 host->free 释放

    if (rc != BOT_OK) {
        bot::Logger::warn() << "[recall] 调用失败 rc=" << rc << " resp=" << result;
        return false;
    }
    return true;
}
```

调用失败不一定代表参数错：平台对**可撤回时限**有规定，超时的消息撤回会失败，这也是要降级处理的场景。

## 例子二：禁言成员

```cpp
#include "plugin_sdk.hpp"

#include <ctime>
#include <string>

// 禁言某成员 seconds 秒；seconds<=0 表示解除禁言
static bool mute_member(uint32_t bot_id, const std::string& group, const std::string& member,
                        long long seconds) {
    auto* h = bot::host();
    if (!h->has_capability || h->has_capability(bot_id, "xubp.group.member.mute") != 1) {
        bot::Logger::warn() << "[mute] 平台不支持禁言";
        return false;
    }

    // 参数用「绝对解禁时间戳」（秒）；0 = 解除禁言
    long long end_ts = (seconds > 0) ? (static_cast<long long>(std::time(nullptr)) + seconds) : 0;
    std::string args = "{\"group_openid\":\"" + group + "\","
                       "\"member_openid\":\"" + member + "\","
                       "\"mute_end_timestamp\":" + std::to_string(end_ts) + "}";

    char* out = nullptr; size_t len = 0;
    int32_t rc = h->capability_invoke(bot_id, "xubp.group.member.mute",
                                      args.data(), args.size(), &out, &len);
    std::string result = (out && len) ? std::string(out, len) : std::string();
    if (out && h->free) h->free(out);

    if (rc == BOT_ENOTSUP) { bot::Logger::warn() << "[mute] 不支持，降级为提示"; return false; }
    if (rc != BOT_OK)      { bot::Logger::error() << "[mute] rc=" << rc << " resp=" << result; return false; }
    return true;
}
```

在群里触发时，`group` 取 `evt->chat_group_id`、`member` 取 `evt->sender_id`（或你要处理的 @ 对象）。

## 跨平台写法

**能力码是跨平台的**：同一个能力码在 QQ 官方与 OneBot 上语义一致，插件**不需要写 `if (平台 == ...)`** 去分支。适配器会把它翻译成各自平台的调用。

写跨平台插件时遵循两条：

1. **参数一次给全**：不同平台可能用到不同字段，把参考页里该能力列的字段都填上，多余字段会被忽略；
2. **优先用 `*_openid` 命名的字段**：`group_openid` / `member_openid` 这类命名在 QQ 官方与 OneBot 上都被接受（OneBot 侧同时兼容 `group_id` / `user_id`）。

下面这段代码在两种平台上都能跑，不需要判断平台：

```cpp
// 跨平台禁言：能力码相同、参数给全 → 两个平台各自翻译成自己的调用
std::string args = "{\"group_openid\":\"" + group + "\","      // QQ 官方用；OneBot 侧也接受
                    "\"group_id\":\"" + group + "\","          // OneBot 兼容字段
                    "\"member_openid\":\"" + member + "\","
                    "\"user_id\":\"" + member + "\","
                    "\"mute_end_timestamp\":" + std::to_string(end_ts) + "}";
char* out = nullptr; size_t len = 0;
bot::host()->capability_invoke(bot_id, "xubp.group.member.mute", args.data(), args.size(), &out, &len);
if (out && bot::host()->free) bot::host()->free(out);
```

哪些能力码在哪些平台上可用、每个能力的参数与返回结构，统一看 [平台能力码](/reference/capabilities)。

## 结果怎么处理

- 结果 JSON 常见形式是 `{"ok":true}` 或平台原始响应，字段以参考页为准；
- **结果缓冲由框架分配，必须 `host->free` 释放**，否则会泄漏；请求失败时也要照常检查并释放（可能为空指针）；
- 平台错误（例如权限不足、可撤回时限已过）通常仍以 `BOT_OK` 返回、在结果 JSON 里体现，所以**成功返回也要看结果内容**。

## 下一步

- [平台能力码](/reference/capabilities)：完整能力码目录与参数
- [Host API](/reference/host-api)：`has_capability` / `capability_invoke` 的完整签名
- [调试与排错](/plugin-dev/debugging)：用能力探针插件逐个验证能力码
