---
title: 处理事件
description: BotMessageEvent 的字段、怎么区分群聊私聊、怎么判断被 @、怎么读原始 JSON，以及 events_mask 订阅机制。
---

# 处理事件

插件收到的每一条消息都会被归一化成同一个结构体 `BotMessageEvent`——不管底层是 QQ 官方还是 OneBot 11。这页讲清它的字段怎么读、常用判断怎么写，以及怎么只订阅你关心的事件。

## 事件结构体

```cpp
typedef struct {
    uint32_t      bot_id;          /* 收到事件的机器人句柄 */
    uint32_t      tenant_id;
    BotEventType  type;            /* 事件类型，见下表 */
    const char*   event_id;        /* 事件唯一 id（去重用） */
    const char*   message_id;      /* 消息 id（撤回、引用时用） */
    int64_t       timestamp_ms;    /* 毫秒时间戳 */
    const char*   sender_id;       /* 发送者 id */
    const char*   sender_name;     /* 发送者昵称 */
    const char*   sender_role;     /* owner|admin|member|"" */
    const char*   chat_user_id;    /* 会话用户 id（私聊目标） */
    const char*   chat_group_id;   /* 群 id；空串 = 私聊 */
    const char*   content;         /* 纯文本 */
    const char*   segments_json;   /* 消息段 JSON 数组 */
    int           is_at_self;      /* 是否 @ 了机器人 */
    int           is_at_all;       /* 是否 @ 全体 */
    const void*   raw_json;        /* 平台原始事件，只读 */
    /* ---- XUBP v2（尾加，保持 v1 ABI 兼容）---- */
    const char*   interaction_data;      /* 按钮/互动事件数据 JSON */
    const char*   referenced_message_id; /* 引用/回复的消息 id */
    const char*   chat_openid;           /* 会话 openid */
} BotMessageEvent;
```

常用字段：

| 字段 | 说明 | 注意 |
| --- | --- | --- |
| `content` | 已去掉 @ 与表情的**纯文本** | 做关键词匹配用这个就够 |
| `sender_id` | 发送者在平台上的用户 id | |
| `sender_name` | 昵称（群名片优先） | |
| `sender_role` | 群内角色：`owner` / `admin` / `member`，无角色为空串 | 权限判断用 |
| `chat_group_id` | 群 id | **空串表示私聊** |
| `chat_user_id` | 会话用户 id | 私聊回复的目标 |
| `message_id` | 消息 id | 撤回、引用、被动回复都靠它 |
| `is_at_self` | 是否 @ 了机器人 | 群聊里必查 |
| `is_at_all` | 是否 @ 全体 | |
| `type` | 事件类型枚举 | 见下 |
| `segments_json` | 消息段数组 JSON（富媒体用） | 写法见 [发送消息](/plugin-dev/messages) |
| `raw_json` | 平台原始事件的 JSON | 高级用法，见下文 |

::: warning 所有 `const char*` 只在本次回调期间有效
事件字符串指向框架的事件缓冲，回调返回后立即失效。需要留用（比如丢进异步任务、缓存起来）**必须立刻复制成 `std::string`**。
:::

## 事件类型

`type` 的取值是 `BotEventType` 枚举。消息类回调里常见的是：

| 枚举 | 值 | 含义 |
| --- | --- | --- |
| `BOT_EVT_MESSAGE_GROUP` | 1 | 群消息 |
| `BOT_EVT_MESSAGE_PRIVATE` | 2 | 私聊消息 |
| `BOT_EVT_MESSAGE_GUILD` | 3 | 频道消息 |
| `BOT_EVT_MESSAGE_GUILD_AT` | 4 | 频道 @ 消息 |
| `BOT_EVT_INTERACTION` | 9 | 按钮/交互事件（`interaction_data` 非空） |

入群退群、好友变动、心跳生命周期等类型见 [事件类型](/reference/events)。

## 区分群聊与私聊

最稳的写法是直接用 SDK 的封装，或者看 `chat_group_id` 是否为空：

```cpp
extern "C" void bot_plugin_on_message(const BotMessageEvent* evt) {
    bot::Message m(evt);

    if (m.is_group()) {
        // 群聊：回复目标是群，通常要求被 @ 才响应
        if (!m.at_me()) return;
        m.reply("群里收到你的消息");
    } else {
        // 私聊：chat_group_id 为空串，回复目标是这个人
        m.reply("私聊收到你的消息");
    }
}
```

别用 `type == BOT_EVT_MESSAGE_GROUP` 来判断群聊——频道消息、某些平台的群事件同样可能落到消息回调里，`chat_group_id` 才是会话维度的真相。

## 判断被 @ 与 @ 全体

```cpp
bot::Message m(evt);
if (m.at_me())  { /* 这条消息 @ 了机器人 */ }
if (evt->is_at_all) { /* 这条消息 @ 了全体成员 */ }
```

- `is_at_self` 由适配器在归一化时算好，插件不需要自己去 `content` 里找 @ 文本；
- `content` 里已经被**去掉了 @ 部分**，所以 `content` 是干净的指令文本；
- 群里处理消息的通行约定是 `if (m.is_group() && !m.at_me()) return;`——原因见 [最小示例](/plugin-dev/minimal)；
- 也有例外：某些平台允许机器人接收「全量群消息」授权（QQ 官方可通过 `xubp.qqofficial.full_message` 能力查询当前是否处于全量模式），此时你可能会收到没 @ 机器人的群消息。

## 读原始 JSON

归一化会丢掉平台特有信息。确实需要时（比如读取 QQ 官方的原始事件字段），可以读 `raw_json`——它指向**平台原始事件的 JSON 文本**：

```cpp
#include <string>

extern "C" void bot_plugin_on_message(const BotMessageEvent* evt) {
    if (!evt->raw_json) return;
    // raw_json 是以 \0 结尾的 JSON 文本
    const char* raw = static_cast<const char*>(evt->raw_json);
    std::string raw_copy(raw);          // 要留用就立刻复制
    bot::Logger::debug() << "raw=" << raw_copy;
}
```

::: tip 优先用统一字段
读 `raw_json` 会让插件和平台绑死。绝大多数需求（发消息、撤回、禁言、审批）都有对应的统一字段或能力码，见 [调用平台能力](/plugin-dev/capabilities)。
:::

## events_mask 订阅机制

`events_mask` 是插件声明的**事件订阅位集**：框架按位判断这个插件要不要收某类事件。位与枚举值对应：

```cpp
#define BOT_EVT_BIT(x) (1u << (x))                       // 第 x 位对应枚举值 x
#define BOT_EVT_MASK_MESSAGE \
    (BOT_EVT_BIT(BOT_EVT_MESSAGE_GROUP) | BOT_EVT_BIT(BOT_EVT_MESSAGE_PRIVATE))
```

也就是说：要群消息就置第 1 位，要私聊就置第 2 位，要频道 @ 就置第 4 位，依次类推。

### 怎么只订阅自己关心的事件

只在宏里写你需要的事件：

```cpp
// 只订阅群消息 + 私聊消息（最常用），优先级 500、继续传播、无拦截器、无 logo、无配置项
BOT_REGISTER_PLUGIN_EX("mybot", "我的插件", "0.1.0", "你的名字", "tool",
                       500u, 0u,
                       BOT_EVT_BIT(BOT_EVT_MESSAGE_GROUP) | BOT_EVT_BIT(BOT_EVT_MESSAGE_PRIVATE),
                       0u, "", "")

// 群消息 + 入群申请事件（要处理用户进群申请）
BOT_REGISTER_PLUGIN_EX("welcome", "欢迎", "1.0.0", "你的名字", "social",
                       1000u, 0u,
                       BOT_EVT_BIT(BOT_EVT_MESSAGE_GROUP) | BOT_EVT_BIT(BOT_EVT_GROUP_JOIN_REQUEST),
                       0u, "", "")
```

用基础宏 `BOT_REGISTER_PLUGIN` 时等价于订阅 `BOT_EVT_MASK_MESSAGE`（群消息 + 私聊）。

### 订阅时的两条经验

1. **只订阅需要的**：每多订阅一类事件，所有装了该插件的机器人都会多一次回调开销；
2. **回调里仍要查 `type`**：一个回调可能对应多位事件（例如 `on_message` 可能收到群、私聊、频道消息），按 `type` 或 `chat_group_id` 再分支一次更稳。

## 下一步

- [事件类型](/reference/events)：全部事件类型枚举与各平台原始事件对照
- [发送消息](/plugin-dev/messages)：拿到事件后怎么回、怎么发富媒体
- [拦截器](/plugin-dev/interceptors)：不只是收事件，还要改写或阻断消息
