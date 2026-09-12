---
title: 发送消息
description: 被动回复与主动推送的用法、消息段 JSON 的写法（文本/富媒体/Markdown/按钮/@/引用）、平台差异与撤回。
---

# 发送消息

插件发消息只有两条路：**被动回复**（回触发你的那条消息）和**主动推送**（自己指定目标和会话）。两者都收一份**消息段 JSON** 作为内容。这页把这两条路和消息段的写法讲全。

## 被动回复 send_reply

```cpp
int32_t (*send_reply)(const BotMessageEvent* evt, const char* seg_json, size_t len);
```

把触发事件原样传进去，框架自己判断是群还是私聊、该发给谁，并且**把回复绑定到原消息**上：

```cpp
// 最省事：SDK 的 reply() 把纯文本拼成消息段 JSON 再调 send_reply
extern "C" void bot_plugin_on_message(const BotMessageEvent* evt) {
    bot::Message m(evt);
    if (m.is_group() && !m.at_me()) return;
    m.reply("这是被动回复");     // 等价于 host->send_reply(evt, "[{\"type\":\"text\",\"text\":\"...\"}]", n)
}
```

为什么优先用它：**被动回复绑定原消息，在 QQ 官方平台上 5 分钟内免主动频控**（群 @ 消息与单聊消息都适用）。能被动回复就不要用主动推送。

## 主动推送 send_proactive

```cpp
int32_t (*send_proactive)(uint32_t bot_id, const char* target, uint8_t chat_type,
                          const char* seg_json, size_t len);
```

要在**没有触发事件**的时候发消息（定时提醒、事件通知）就用它，需要自己给全三件事：

| 参数 | 取值 | 说明 |
| --- | --- | --- |
| `bot_id` | 机器人句柄 | 从事件里拿到的 `evt->bot_id`，或面板请求里的 `req->bot_id` |
| `target` | 群 id 或用户 id | 群聊填 `chat_group_id`（QQ 官方是 group_openid），私聊填 `chat_user_id` |
| `chat_type` | `0` 私聊 / `1` 群 / `2` 频道 | 决定了 `target` 该怎么解释 |
| `seg_json` | 消息段 JSON | 见下文 |

```cpp
// 主动发一条群消息：bot_id 与群 id 来自之前保存的事件
std::string seg = "[{\"type\":\"text\",\"text\":\"定时提醒：该打卡了\"}]";
bot::host()->send_proactive(bot_id, group_id.c_str(), /*chat_type=*/1,
                            seg.data(), seg.size());
```

::: warning 主动消息受平台频控
主动推送没有「绑定原消息」这层关系，会受平台主动消息额度与频控限制，发不出去时通常表现为接口调用失败或平台静默丢弃。排查看 [调试与排错](/plugin-dev/debugging)。
:::

## 消息段 JSON 的写法

消息段是一个 **JSON 数组**，按顺序拼接。下面是最常用的几种：

### 纯文本

```json
[{ "type": "text", "text": "你好，我是机器人" }]
```

### 富媒体（图片 / 语音 / 视频 / 文件）

```json
[
  { "type": "text", "text": "给你看张图" },
  { "type": "image", "url": "https://example.com/a.png" }
]
```

`type` 换成 `audio` / `video` / `file` 即为对应媒体，统一用 `url` 字段给资源地址。**一条消息里只会采用第一个媒体段**，不要指望一次发多张图。

### Markdown

```json
[{ "type": "markdown", "content": "# 标题\n**加粗**的正文" }]
```

### 内联键盘（按钮）

```json
[
  { "type": "markdown", "content": "请选择：" },
  { "type": "keyboard", "json": "{\"content\":{\"rows\":[{\"buttons\":[{\"id\":\"1\",\"render_data\":{\"label\":\"确认\",\"visited_label\":\"已确认\"},\"action\":{\"type\":2,\"permission\":{\"type\":2},\"data\":\"click_ok\"}}]}]}}" }
]
```

`json` 字段里是平台的键盘对象 JSON 原样字符串。按钮被点击时会产生**交互事件**（`BOT_EVT_INTERACTION`），事件里的 `interaction_data` 带着按钮数据，插件据此响应。

### @ 某人

```json
[
  { "type": "at", "user_id": "123456789" },
  { "type": "text", "text": " 该交作业了" }
]
```

### 引用回复

```json
[
  { "type": "reply", "message_id": "原消息 id" },
  { "type": "text", "text": "引用这条消息回复" }
]
```

::: tip Markdown 与按钮只有 QQ 官方渲染
**Markdown 段与键盘（按钮）段目前只有 QQ 官方机器人会渲染**；其它平台不支持这两个段，会发生降级——Markdown 与按钮不会被渲染成富文本，实际效果等同纯文本。想让插件跨平台可用，**正文一律用 `text` 段**，只在明确跑在 QQ 官方机器人上的场景使用 Markdown 与按钮。`@` 段在各平台都会正确映射（QQ 官方会内联成平台自己的 @ 标记）。
:::

## 撤回消息

两种方式，效果一样：

```cpp
// 方式一：统一接口（需要机器人 id 与消息 id）
bot::host()->recall(evt->bot_id, evt->message_id);

// 方式二：能力码（推荐跨平台写法，先探测再调用）
if (bot::host()->has_capability(evt->bot_id, "xubp.message.recall") == 1) {
    std::string args = std::string("{\"message_id\":\"") + msg_id + "\"}";
    char* out = nullptr; size_t ol = 0;
    bot::host()->capability_invoke(evt->bot_id, "xubp.message.recall",
                                   args.data(), args.size(), &out, &ol);
    if (out && bot::host()->free) bot::host()->free(out);   // 返回缓冲由框架分配，必须 free
}
```

撤回的两个前提：**平台支持撤回**，且消息在平台的**可撤回时限内**（撤回一条很久以前的消息会失败，这是平台规则）。先用 `has_capability` 探测，不支持就降级为发一条提示消息。

## 发送时的三条实用约定

1. **回复优先**：能用 `send_reply` 就不要用 `send_proactive`——省去目标计算，还能吃到免频控窗口；
2. **文本用 `text` 段**：跨平台最稳，`@` 用 `at` 段而不是拼字符串；
3. **拿不准平台能力就先探测**：调能力前一律 `has_capability`，见 [调用平台能力](/plugin-dev/capabilities)。

## 下一步

- [调用平台能力](/plugin-dev/capabilities)：禁言、踢人、审批、点赞等平台操作
- [处理事件](/plugin-dev/events)：事件从哪来、字段怎么读
- [调试与排错](/plugin-dev/debugging)：消息发不出去时怎么查
