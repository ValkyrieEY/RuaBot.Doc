# 跨平台开发

> **你会学到**：怎么写出在所有平台通用的插件，以及各平台字段的对应关系。

## 核心原则：用统一接口

XUBP 的设计目标是**一次编写，多平台运行**。要做到这点，记住一个原则：**永远用 Context 的跨平台属性和方法，不要直接翻平台原始字段**。

| ✅ 推荐 | ❌ 避免 |
|---------|---------|
| `context.reply("内容")` | 手动构造 send_message + 群号 |
| `context.sender_id` | `event["sender"]["id"]` |
| `context.chat_id` | `event["conversation"]["group_openid"]` |
| `context.chat_type` | 用 `event_type` 前缀判断群/私聊 |

## 跨平台属性

| 属性 | 含义 |
|------|------|
| `sender_id` | 发送者唯一 ID |
| `sender_name` | 发送者昵称 |
| `chat_id` | 聊天空间 ID（群 / 频道 / 私聊对象） |
| `chat_type` | `"group"` 或 `"private"` |

## 各平台字段映射

同一个属性，在不同平台上对应的底层值不同——但**插件层面完全透明**，你只管用 `context.chat_id`，不用关心它底层是 OpenID 还是 QQ 号。

| 平台 | `sender_id` | `chat_id`（群聊） | `chat_id`（私聊） |
|------|------------|------------------|------------------|
| QQ 官方 | `user_openid` | `group_openid` | `user_openid` |
| QQ OneBot | QQ 号 | 群号 | QQ 号 |
| Telegram | `from_user.id` | `chat_id` | `chat_id` |
| Discord | `author.id` | `channel_id` | `channel_id` |
| KOOK | `author.id` | `chat_code` | `chat_code` |
| 飞书 | `user_id` | `chat_id` | `chat_id` |
| 钉钉 | `sender_staff_id` | `conversation_id` | `conversation_id` |
| 微信公众号 | `FromUserName` | — | `FromUserName` |
| 企业微信 | `FromUserName` | — | `FromUserName` |

## 跨平台回复：reply()

`context.reply()` 自动处理三件事：

1. **自动定位目标**——从事件里取回复地址，不用手动传群号/用户 ID。
2. **自动判断类型**——群聊/私聊自动选对发送方式。
3. **自动引用消息**——平台支持时附带消息引用。

```python
async def handle_event(context):
    msg = (context.event.get("content") or "").strip()
    if msg == "菜单":
        await context.reply("1. 签到\n2. 查询")   # 所有平台通用
```

## 跨平台检测 @机器人

```python
async def handle_event(context):
    if context.event.get("is_at_self"):
        await context.reply("你@我啦！")   # 所有平台通用
```

## 平台特有功能

有些功能只有特定平台支持（如 QQ 官方的 Markdown 消息、Discord 的 Embed）。需要时用 `adapter_code` 判断，并做好降级：

```python
async def handle_event(context):
    adapter = context.event.get("adapter_code", "")

    if adapter == "qq_official":
        # 用 QQ 官方特有的 Markdown
        await context.send_message({
            "msg_type": 2,
            "markdown": {"content": "# 标题\n正文"},
        })
    else:
        # 其他平台降级为纯文本
        await context.reply("标题\n正文")
```

::: tip 判断平台
`event["adapter_code"]` 返回适配器标识，如 `qq_official`、`telegram`、`discord`、`qq_onebot` 等。用它在需要时做平台特化，但**主流程尽量走统一接口**。
:::

## 跨平台开发最佳实践

1. **始终用 `context.reply()`** 代替手动构造 `send_message`。
2. **始终用 `context.sender_id`** 代替从 event 里取发送者。
3. **始终用 `context.chat_id`** 代替从 conversation 里取群号/用户 ID。
4. **用 `context.chat_type`** 判断群聊/私聊，不用 `event_type` 前缀。
5. **订阅多个事件**：`events` 同时写 `message.group` 和 `message.private`，让插件在群和私聊都能响应。
6. **别假设 ID 格式**：不要假设 `sender_id` 是数字（QQ号）还是字符串（OpenID），统一当字符串处理。
7. **平台特有功能做降级**：用 `adapter_code` 判断，不支持的特性用通用方式替代。

## 下一步

- 插件写好了 → [发布与上架](./publish)
