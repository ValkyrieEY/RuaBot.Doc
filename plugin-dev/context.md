# 上下文 Context

> **你会学到**：Context 对象的全部属性和方法——这是你写插件最常打交道的对象。

框架调用钩子函数时，会传入一个 Context 对象。它包含事件数据、用户配置、以及发送消息 / 存取数据的方法。

## PluginContext（事件处理）

`handle_event(context)` 收到的是 `PluginContext`。

### 基础属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `event` | `dict` | 标准化事件字典（见[处理事件](./events)） |
| `event_type` | `str` | XUBP 通用事件类型（如 `"message.group"`） |
| `plugin_code` | `str` | 当前插件标识 |
| `settings` | `dict` | 用户配置（来自 setting.json） |
| `data_store` | 对象 | 数据存储接口（见[数据存储](./data-store)） |
| `bot` | 对象 | 机器人实例 |
| `bot_id` | `int` | 机器人 ID |
| `user_id` | `int` | 用户（租户）ID |

### 跨平台属性（推荐用这些）

这几个属性**跨平台统一**，不用关心底层 ID 是 OpenID 还是 QQ 号还是 chat_id：

| 属性 | 说明 |
|------|------|
| `sender_id` | 消息发送者 ID |
| `sender_name` | 发送者昵称 |
| `chat_id` | 聊天空间 ID（群号 / 频道 / 私聊对象） |
| `chat_type` | 聊天类型：`"group"` 或 `"private"` |

```python
async def handle_event(context):
    user = context.sender_id        # 谁发的
    room = context.chat_id          # 发到哪个群/私聊
    if context.chat_type == "group":
        await context.reply(f"群消息，来自群 {room}")
```

### 方法

| 方法 | 说明 |
|------|------|
| `await reply(text)` | 回复当前消息（最常用，跨平台自动定位） |
| `await send_message(payload)` | 发送消息（支持富媒体等，见[发送消息](./messages)） |
| `await send_proactive_message(target, message, *, message_type)` | 主动发消息到指定目标 |
| `await send_notification(target, content, *, message_type)` | 发送文本通知 |
| `await recall_message(message_id, *, target, message_type)` | 撤回消息 |
| `log(message, level="INFO")` | 写运行时日志 |

#### reply —— 最常用的回复

```python
await context.reply("你好！")
```

`reply()` 会自动：① 定位回复目标（不用手动传群号）；② 判断群聊/私聊选对发送方式；③ 附带消息引用（平台支持时）。

#### send_message —— 发复杂消息

```python
await context.send_message({
    "content": "Hello",
    "msg_type": 0,
})
```

省略 `conversation` / `target` 时，自动用当前事件的会话。详见[发送消息](./messages)。

#### send_proactive_message —— 主动推送

不只是"回复"，而是**主动**发到任意目标（定时提醒、后台通知等场景）：

```python
await context.send_proactive_message(
    target="group_openid_xxx",       # 目标 ID
    message={"content": "定时提醒：该签到啦"},
    message_type="group",            # group / private / guild
)
```

::: tip 回复 vs 主动发送
- `reply()` / `send_message()`：回应**当前事件**，目标自动从事件取。
- `send_proactive_message()`：发到**任意指定目标**，不在事件处理流程里也能用（比如 `on_start` 里定时推送）。
:::

## on_start / on_stop 收到的上下文

生命周期钩子 `on_start` / `on_stop` 收到的**不是普通 dict，而是一个特殊的上下文对象**（除 `plugin_code` 外，还提供主动发消息等能力）：

```python
async def on_start(info):
    # info 是一个上下文对象，dict 兼容
    code = info["plugin_code"]       # 像字典一样取值也行
    info.log("插件已启动")            # 也提供方法

async def on_stop(info):
    info.log("插件已停止")
```

这个生命周期上下文额外支持：

| 能力 | 说明 |
|------|------|
| `info["plugin_code"]` / `info.get(...)` | dict 兼容访问 |
| `info.list_active_bindings()` | 列出当前激活的机器人绑定 |
| `info.load_settings(user_id, bot_id)` | 加载某个绑定的配置 |
| `info.send_proactive(...)` | 从后台主动发消息 |
| `info.send_notification(...)` | 从后台发通知 |
| `info.log(msg, level)` | 写日志 |

::: tip 典型用途
在 `on_start` 里拉起一个后台定时任务，用 `send_proactive` 给特定群推送消息——不需要等用户先发消息。
:::

## 其他 Context 类型

| 钩子 | Context 类型 | 关键能力 |
|------|------------|---------|
| `handle_outgoing` | OutgoingMessageContext | 读/改即将发出的消息，可 `block()` 阻断、`stop()` 停止后续拦截器 |
| `handle_after_send` | AfterSendContext | `ok` 是否成功、`sent_message_id` 平台返回的消息 ID，可 `recall_message` |
| `handle_webui` | PluginWebuiContext | 处理 WebUI 前端请求，返回 dict |

详见 [拦截器](./interceptors) 和 [插件 WebUI](./webui)。

## 下一步

- 存取数据 → [数据存储](./data-store)
- 发各种消息 → [发送消息](./messages)
