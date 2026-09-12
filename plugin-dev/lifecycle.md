---
title: 生命周期回调
description: 插件要导出哪些符号、哪些必需哪些可选、分别在什么时候被调用，以及怎么用 shutdown 钩子把数据落盘。
---

# 生命周期回调

一个插件对框架来说就是**一组固定名字的 C 函数**。这页逐个讲清这些符号：谁必需、谁可选、什么时候被调用、在回调里能做什么。

## 总览

| 符号 | 必需 | 何时被调用 | 备注 |
| --- | --- | --- | --- |
| `bot_plugin_abi_version` | 是 | 加载的第一步 | 返回版本号，框架据此决定是否加载 |
| `bot_plugin_meta` | 是 | 加载时 | 返回元数据指针（编码/优先级/订阅/拦截位） |
| `bot_plugin_init` | 是 | 加载时 | 传入 `BotHostApi*`，插件在此缓存它 |
| `bot_plugin_shutdown` | 是 | 卸载 / 停机时 | 清理与落盘的最后机会 |
| `bot_plugin_on_message` | 否 | 收到消息类事件时 | 群聊、私聊、频道消息 |
| `bot_plugin_on_notice` | 否 | 收到通知类事件时 | 入群/退群、好友变动等 |
| `bot_plugin_on_request` | 否 | 收到请求类事件时 | 加群申请、加好友申请 |
| `bot_plugin_intercept_incoming` | 否 | 路由后、派发前 | 可改写事件，返回非 0 停止传播 |
| `bot_plugin_intercept_outgoing` | 否 | 出站消息真正发出前 | 返回非 0 阻断 |
| `bot_plugin_intercept_after_send` | 否 | 消息发送完成后 | 只读回执，不能阻断 |
| `bot_plugin_web_route` | 否 | 面板发起动态请求时 | ABI 1.3；不导出则只能展示静态面板 |
| `bot_plugin_logo_data` / `bot_plugin_logo_size` | 否 | 加载与上传读元数据时 | 内嵌 logo 字节，成对导出才生效 |

用注册宏（`BOT_REGISTER_PLUGIN` / `_EX` / `_WEB`）时，**前四个必需符号已自动生成**，你只需要按需实现可选回调。用拦截器、指令注册这类需要自己写初始化的场景，也可以手写导出——参见框架的 `plugins/intercept/intercept.cpp`。

## 加载与卸载顺序

```text
dlopen(.so)
  → bot_plugin_abi_version()      版本协商（不通过则直接拒绝，后面的都不调用）
  → bot_plugin_meta()             读取元数据（编码、优先级、订阅位、拦截位）
  → bot_plugin_init(api, 0)       传入 Host API 表；返回非 0 视为加载失败
  → 可选：读 logo（内嵌符号 或 元数据里的字符串）
  → 按 meta.events_mask / intercepts 注册到该机器人

卸载 / 停机
  → bot_plugin_shutdown()         等待在途回调结束后调用
  → dlclose(.so)
```

::: warning 在途回调
卸载会等**在途回调结束**再关闭动态库，但你在回调里起的后台线程、定时器、异步请求并不在这个保护范围内。它们要么在 `shutdown` 里停掉，要么确保不跨卸载存活。
:::

## bot_plugin_init

```cpp
int bot_plugin_init(const BotHostApi* api, uint32_t reserved);
```

- `api`：框架提供的能力表指针，**进程级唯一**，插件应当缓存它（SDK 的 `bot::init_sdk(api)` 就是干这个的）。
- `reserved`：保留参数，当前恒为 `0`。
- 返回 `BOT_OK`（0）表示加载成功；返回非 0 框架会放弃这个插件并关闭动态库。

注册宏展开的 `init` 只做一件事：`bot::init_sdk(api); return BOT_OK;`。如果你要在加载时注册指令或建缓存，就手写 `bot_plugin_init`：

```cpp
// init 里注册一个 /hello 指令（handler 见 BotCommandCtx）
extern "C" int bot_plugin_init(const BotHostApi* api, uint32_t /*reserved*/) {
    bot::init_sdk(api);                                        // 缓存 Host API
    api->register_command("/hello", "say hello", &cmd_hello);   // 注册指令
    return BOT_OK;
}
```

## bot_plugin_shutdown 与落盘钩子

`bot_plugin_shutdown` 是插件的**最后一通电话**：卸载插件或框架停机时调用。插件可以把内存里攒着的数据在这里落到持久化存储（KV / Blob / per-bot 设置）里。

用注册宏时这个符号已被生成，它做的是「如果注册过 `bot::shutdown_hook` 就调它」。所以插件只需要在**自己的动态库里用一个静态对象注册钩子**——静态对象的构造函数在 `.so` 被载入时执行，无需任何显式初始化调用：

```cpp
static void flush_state();                     // 你的落盘函数：把内存数据写进 KV/设置

struct ShutdownHook {                          // .so 载入时构造，把自己挂到 SDK 的钩子上
    ShutdownHook() { bot::shutdown_hook = &flush_state; }
} g_shutdown_hook;                             // 全局静态对象，必须有个实例
```

对应的落盘函数按你实际的数据结构写，例如把内存里的计分板写进 KV：

```cpp
// 落盘：把内存里的计数写进 KV（key 示例：score:total）
static void flush_state() {
    if (!bot::host()) return;                       // 框架已开始拆表，别再调用宿主能力
    std::string v = std::to_string(g_score);        // 先取成具名字符串，避免临时对象失效
    bot::Logger::info() << "[flush] 停机，写入 score:total=" << v;
    bot::host()->kv_set("score:total", v.data(), v.size());
}
```

要点：

- **静态对象必须实例化**（`g_shutdown_hook` 那个变量），只定义类型不会触发构造；
- 钩子只会被 `shutdown` 调用一次，里面**不要再抛异常**；
- 手写导出（不用注册宏）时，框架调用的就是你自己的 `bot_plugin_shutdown`，此时要落盘就直接写在里面，不需要 `shutdown_hook`；
- 不要在 `shutdown` 里做耗时很久的网络等待：卸载路径上的阻塞会拖住管理操作。

## 事件类回调

三个事件回调都由 `events_mask` 声明后才会被派发：

```cpp
void bot_plugin_on_message(const BotMessageEvent* evt);   // 群/私聊/频道消息
void bot_plugin_on_notice (const BotNoticeEvent*  evt);   // 入群/退群/好友变动
void bot_plugin_on_request(const BotRequestEvent* evt);   // 加群/加好友申请
```

`BotNoticeEvent` 就是把 `BotMessageEvent` 包一层（`{ BotMessageEvent base; }`），字段完全一样；`BotRequestEvent` 在此基础上多两个字段：`request_type`（`friend` 或 `group`）与 `comment`（申请附言）。字段逐个说明见 [处理事件](/plugin-dev/events) 与 [事件类型](/reference/events)。

注意：**事件是否会被上报，取决于该机器人所在平台**。例如 QQ 官方机器人在未获授权时只推送 @ 它的群消息。插件侧订阅到的位决定框架是否把它派发给你，但框架无法派发平台根本没推过来的事件。

## 拦截器回调

```cpp
int  bot_plugin_intercept_incoming (BotMessageEvent* evt);   // 非 0 = 停止传播
int  bot_plugin_intercept_outgoing(BotOutgoing* msg);        // 非 0 = 阻断发送
void bot_plugin_intercept_after_send(const BotSendResult* r);
```

三个回调都需要在元数据的 `intercepts` 位里声明（`bit0` = incoming，`bit1` = outgoing，`bit2` = after_send），并且**每台机器人可以在控制台单独开关**。细节见 [拦截器](/plugin-dev/interceptors)。

## Web 面板回调

```cpp
int32_t bot_plugin_web_route(const BotWebRequest* req, BotWebResponse* out);   // ABI 1.3
```

面板发起动态请求（`panel/api/<动作>`）时被调用，请求与响应结构见 [插件 Web 面板](/plugin-dev/webui)。不导出这个符号时插件也能有面板，只是面板拿不到动态数据（纯静态展示）。

## logo 符号

```cpp
const void* bot_plugin_logo_data(void);
size_t      bot_plugin_logo_size(void);
```

**必须成对导出且 `size > 0`** 才会生效，生效时优先于元数据里的 logo 字符串。用 `BOT_PLUGIN_LOGO_EMBED(kLogo, sizeof(kLogo) - 1)` 一行即可生成。

## 下一步

- [处理事件](/plugin-dev/events)：事件结构体字段与常用判断
- [拦截器](/plugin-dev/interceptors)：三个拦截点怎么用
- [存储与配置](/plugin-dev/storage)：`shutdown` 里落盘用到的 KV 与设置接口
