---
title: 拦截器
description: 三个拦截点（入站改写、出站阻断、发送回执）的语义、声明方式、每机器人开关与优先级传播规则。
---

# 拦截器

回调让插件**看见**消息，拦截器让插件**插手**消息：在事件派发给插件之前改写它、在消息真正发出去之前拦住它、在发送完成后拿到回执。这页讲清三个拦截点的语义和三条容易踩的规则。

## 三个拦截点

| 拦截点 | 导出符号 | 时机 | 能做什么 | 返回值含义 |
| --- | --- | --- | --- | --- |
| 入站 | `bot_plugin_intercept_incoming` | 路由后、派发给插件之前 | 改写事件（内容、发送者等） | **非 0 = 停止传播**，后续插件收不到 |
| 出站 | `bot_plugin_intercept_outgoing` | 插件发出消息之后、适配器真正发送之前 | 改写或丢弃出站消息 | **非 0 = 阻断**，消息不发 |
| 回执 | `bot_plugin_intercept_after_send` | 适配器发送完成后 | 只读观察结果 | 无（`void`） |

对应签名：

```cpp
int  bot_plugin_intercept_incoming (BotMessageEvent* evt);   /* 非 0 = 停止传播 */
int  bot_plugin_intercept_outgoing(BotOutgoing* msg);        /* 非 0 = 阻断发送 */
void bot_plugin_intercept_after_send(const BotSendResult* r);
```

`BotOutgoing` 带三个可写字段：`bot_id`、`target`（群 id 或用户 id）、`chat_type`（`0` 私聊 / `1` 群 / `2` 频道）、`segments_json`（出站消息段 JSON）。`BotSendResult` 提供 `ok`（`1` 成功）、`message_id`、`error`（错误码）。

## 声明与开关

三个回调都必须在元数据里用 `intercepts` 位**声明**，否则框架不会把它们挂上：

| 位 | 值 | 对应拦截点 |
| --- | --- | --- |
| `bit0` | `0b001` | incoming |
| `bit1` | `0b010` | outgoing |
| `bit2` | `0b100` | after_send |

```cpp
// 三个拦截器全开：INTERCEPTS 传 0b111（= 7）
BOT_REGISTER_PLUGIN_EX("gatekeeper", "消息管家", "1.0.0", "你的名字", "admin",
                       500u, 0u, BOT_EVT_MASK_MESSAGE, 0b111u, "", "")
```

手写导出时就在 `meta` 结构里给 `intercepts` 字段赋值（框架的 `plugins/intercept/intercept.cpp` 就是这么写的）。**导出符号名字必须完全正确**，写错等于没实现。

::: tip 绑定粒度是「每台机器人」
`intercepts` 声明的是**插件具备**哪几个拦截点；而**每台机器人**可以在控制台单独开关：

- 机器人详情页 → 插件 Tab → 配置 → 「运行参数」里的 **Incoming 拦截 / Outgoing 拦截 / AfterSend 回调** 三个开关；
- 同一个插件装在机器人 A 上可以只开 incoming，装在机器人 B 上可以三个都开。

所以插件里不要假设「我声明了 incoming 就一定每台机器人都会调到」。
:::

## 入站拦截：改写事件

最典型的用法是改写 `content`（例如加前缀、做敏感词替换）：

```cpp
static thread_local std::string g_in_buf;   // 必须用 thread_local / static 缓冲

extern "C" int bot_plugin_intercept_incoming(BotMessageEvent* evt) {
    if (!evt->content) return 0;
    g_in_buf  = "[in] ";
    g_in_buf += evt->content;
    evt->content = g_in_buf.c_str();   // 让 evt 指向生命周期足够长的缓冲
    return 0;                          // 0 = 继续传播给后续插件
}
```

::: danger 改写字符串必须用长生命周期缓冲
`evt->content` 只是一个指针。指向函数局部 `std::string` 的 `c_str()`，函数一返回就是**悬垂指针**，后续插件会读到垃圾数据甚至崩溃。用 `static` / `static thread_local` 缓冲，或者插件常驻对象里的缓冲。
:::

返回非 0 表示**停止传播**：后面的插件（以及 `on_message` 派发）都不会再看到这条事件。适合做「拦截即终结」的场景（例如命中违禁词直接回一句并终止）。改写后的内容才是后续插件看到的内容——这是入站拦截的语义约定。

## 出站拦截：阻断或改写

出站拦截能看到**所有**出站消息（包括插件自己发的、框架被动回复的），因为 `send_reply` / `send_proactive` 都走这条链。

```cpp
extern "C" int bot_plugin_intercept_outgoing(BotOutgoing* msg) {
    if (msg->segments_json &&
        std::string_view(msg->segments_json).find("bad") != std::string_view::npos) {
        bot::Logger::warn() << "outgoing blocked (contains 'bad')";
        return 1;          // 非 0 = 这条消息不发
    }
    return 0;              // 0 = 放行
}
```

两条语义要点：

- **阻断后消息不会发出，也不会触发 `after_send` 回执**；
- 改写也和入站一样：`msg->segments_json` 与 `msg->target` 必须指向生命周期长于本次调用的缓冲。

## 发送回执

发送完成后被调用，用来记账、统计、排错：

```cpp
extern "C" void bot_plugin_intercept_after_send(const BotSendResult* r) {
    bot::Logger::info() << "[after_send] ok=" << (r->ok ? 1 : 0) << " err=" << r->error;
}
```

它拿不到消息内容，只有成功与否、消息 id 和错误码。想按内容统计请在出站拦截里做。

## 优先级与传播策略

同一台机器人上可能装了多个带拦截器的插件，顺序由这套规则决定：

| 规则 | 说明 |
| --- | --- |
| 优先级 | `priority` **数字越小越先**执行；同优先级按安装/加载顺序稳定排列 |
| 每机器人独立 | 优先级是**每台机器人**一份配置（控制台「运行参数 → 优先级」可改），插件元数据里的值只是安装时的默认值 |
| 入站链 | 按优先级依次调用；一旦某个插件返回非 0，**立即停止后续传播** |
| 出站链 | 按优先级依次调用；一旦某个插件返回非 0，**立即阻断**（后续插件不再拿到这条消息） |
| 回执链 | 按优先级全部调用一遍，没有阻断概念 |
| `propagation` | 元数据里的 `propagation`（`0`=continue / `1`=stop）作用于消息派发：该插件处理完 `on_message` 后中断后续插件，用于「终结型」插件 |

实践建议：

- 只做**观察**的插件（日志、统计）给一个较大的 `priority`（例如 9000），排在改写类插件后面，看到的就是最终形态的事件；
- 做**改写/拦截**的插件给较小的 `priority`（例如 100）先跑；
- 用 `propagation=stop` 要慎重：它会让同机器人上后面所有插件都收不到这条消息。

## 下一步

- [生命周期回调](/plugin-dev/lifecycle)：三个拦截器与其它符号的调用时机对照
- [插件元数据](/reference/meta)：`intercepts` 位与宏参数怎么写
- [处理事件](/plugin-dev/events)：不改写事件时，普通回调怎么处理消息
