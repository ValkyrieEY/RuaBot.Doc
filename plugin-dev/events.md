# 处理事件

> **你会学到**：事件钩子怎么写、收到的事件长什么样、怎么取常用字段。
>
> ::: tip C++ 框架（Xiaoyi_QQ_C）
> 本框架用 C++ SDK：入口是 `bot_plugin_on_message(const BotMessageEvent*)`，事件字段即 `BotMessageEvent` 结构（`text()`/`sender_id()`/`group_id()`/`at_me()` 等见 [C++ SDK](./cpp-sdk)）。以下 Python 示例说明的是 XUBP 事件语义，C++ 侧对应字段在事件结构体里都能取到。
> :::

## 事件钩子

**C++ 框架**：最核心的是 `bot_plugin_on_message(const BotMessageEvent* evt)`，所有事件（消息/互动/通知）都经它投递，用 `evt->type` 区分。以下 Python 示例（`handle_event`）说明的是同一套事件语义：

```python
async def handle_event(context):
    # context.event —— 标准化事件字典
    # context.event_type —— XUBP 事件类型
    msg = context.event.get("content")
    if msg == "菜单":
        await context.reply("1. 签到\n2. 查询\n3. 设置")
```

::: tip 同步/异步都行
钩子可以是 `async def` 或普通 `def`，框架自动适配。涉及 `await`（发消息、读写数据）时用 `async def`。
:::

## 事件字典结构（event）

所有平台的事件经适配器标准化后，`context.event` 是统一格式的字典：

```python
event = {
    # 基本标识
    "event_type": "message.group",        # XUBP 通用事件类型
    "platform_event_type": "GROUP_AT_MESSAGE_CREATE",  # 平台原始类型
    "event_id": "EVENT_XXX",
    "message_id": "MSG_XXX",
    "message_type": "group",              # group / private / guild / system
    "adapter_code": "qq_official",        # 来源适配器
    "timestamp": "1700000000",

    # 发送者
    "sender": {
        "id": "用户OpenID",               # 发送者唯一标识（核心）
        "username": "昵称",
        "bot": False,
    },

    # 会话定位
    "conversation": {
        "group_openid": "群OpenID",       # 群聊场景
        "user_openid": "用户OpenID",      # 私聊场景
        "channel_id": "子频道ID",          # 频道场景
    },

    # 消息内容
    "content": "用户发送的纯文本",          # 已清理 @提及前缀，适合关键词匹配
    "meta_content": "@机器人 你好",        # 原始内容（含 @）

    # 附件
    "segments": [
        {"type": "image", "url": "https://..."},
        {"type": "video", "url": "https://..."},
    ],

    # @信息
    "is_at_self": False,                  # 是否 @了机器人
    "is_at_all": False,                   # 是否 @全体

    # 原始平台数据（完整保留）
    "raw": {"t": "GROUP_AT_MESSAGE_CREATE", "d": {...}},
}
```

::: details 完整字段
不同事件类型有额外字段：`interaction` 有 `interaction_data`，`reaction` 有 `emoji`，`audit` 有 `audit_id` 等。需要时直接打印 `context.event` 查看。
:::

## 取常用字段的推荐方式

**优先用 Context 的跨平台属性**，而不是直接翻 event 字典：

```python
async def handle_event(context):
    # ✅ 推荐：跨平台统一
    sender_id = context.sender_id      # 发送者 ID
    chat_id = context.chat_id          # 聊天空间 ID（群/私聊）
    chat_type = context.chat_type      # "group" 或 "private"

    # 消息内容
    msg = context.event.get("content") or ""
```

详见 [上下文 Context](./context) 的跨平台属性。

## 判断群聊 / 私聊

用 `message_type` 字段（平台无关）：

```python
message_type = context.event.get("message_type", "system")

if message_type == "group":
    # 群聊（@消息 和 全量消息都是 group）
    pass
elif message_type == "private":
    # 私聊
    pass
elif message_type == "guild":
    # 频道
    pass
```

::: warning 别用 event_type 前缀判断
不要用 `context.event_type.startswith("message.group")` 来判断群聊——全量消息也是 group。统一用 `message_type` 或 `context.chat_type`。
:::

## 区分 @消息和全量消息

```python
async def handle_event(context):
    if context.event_type == "message.group":
        # 普通 @消息
        pass
    elif context.event_type == "message.group_full":
        # 群全量消息（无需 @）
        # 如果用户在适配器设置里开启了「全量消息当作普通群消息」，
        # 那么 group_full 会被自动转成 group，这里收不到
        pass
```

## 处理附件（图片/视频）

```python
async def handle_event(context):
    segments = context.event.get("segments") or []
    for seg in segments:
        if seg.get("type") == "image":
            url = seg.get("url")
            await context.reply(f"收到图片：{url}")
```

## XUBP v2 事件补充

### 按钮/互动事件（interaction）

用户点击消息按钮 / 快捷菜单时，框架归一化为 **`BOT_EVT_INTERACTION`** 事件，经 `bot_plugin_on_message` 投递（`evt->type == BOT_EVT_INTERACTION`），`evt->interaction_data` 含回调信息（JSON 串：`interaction_id` / `button_id` / `button_data` / `message_id` / `scene`）。框架已自动回执（消除 loading），插件无需处理回执。

```cpp
extern "C" void bot_plugin_on_message(const BotMessageEvent* evt) {
    if (evt->type != BOT_EVT_INTERACTION) return;
    if (!evt->interaction_data) return;
    // interaction_data = {"interaction_id":...,"button_id":...,"button_data":...}
    if (std::string_view(evt->interaction_data).find("\"button_data\":\"confirm\"") != std::string_view::npos) {
        // 用 bot::Message(evt).reply(...) 回复
    }
}
```

（Python 侧示例：`context.event_type == "interaction"`，`event["interaction_data"]`。）

### 引用/回复消息

收到"回复机器人消息"时，事件带 `referenced_message_id`（被回复的原消息）：

```python
async def handle_event(context):
    ref = context.event.get("referenced_message_id")
    if ref:
        await context.reply(f"你回复了消息 {ref}")
```

### 统一会话标识

v2 事件新增 `chat.chat_openid`（群 group_openid / 私聊 user_openid），作为发送目标统一标识。见 [xubp/v2-overview](../xubp/v2-overview#5-统一身份模型)。

## 下一步

- 调用平台能力（禁言/撤回/进群审批…）→ [能力调用](./capabilities)
- 看全部可用接口 → [上下文 Context](./context)
- 存取数据 → [数据存储](./data-store)
- 发送各种消息 → [发送消息](./messages)
