# 事件类型

> **你会学到**：XUBP 定义了哪些事件类型、它们如何映射到各平台、插件如何订阅。

## 事件类型一览

XUBP 用**点分命名法**（`类别.子类型`）定义了 17 种通用事件类型。所有适配器都必须把平台原始事件映射成下表中的类型。

### 消息类（message.*）

| 事件类型 | 说明 | 场景 |
|---------|------|------|
| `message.group` | 群聊消息（需要 @机器人） | 群里 @你的机器人发的消息 |
| `message.group_full` | 群全量消息（无需 @） | 群里的所有消息（需平台支持 + 开启） |
| `message.private` | 私聊消息 | 用户单独发给机器人的消息 |
| `message.guild` | 频道消息 | 频道里的消息 |
| `message.guild_at` | 频道 @ 消息 | 频道里 @机器人的消息 |
| `message.guild_dm` | 频道私信 | 频道里的私信 |

### 机器人状态类（bot.*）

| 事件类型 | 说明 |
|---------|------|
| `bot.group_join` | 机器人被添加到群 |
| `bot.group_leave` | 机器人被移出群 |
| `bot.friend_add` | 机器人被添加为好友 |
| `bot.friend_remove` | 机器人被删除好友 |
| `bot.group_reject` | 群拒绝了机器人 |
| `bot.group_receive` | 群恢复了机器人 |

### 交互 / 表态 / 审核类

| 事件类型 | 说明 |
|---------|------|
| `interaction` | 交互事件（按钮回调等） |
| `reaction.add` | 表情表态添加 |
| `reaction.remove` | 表情表态删除 |
| `audit.pass` | 消息审核通过 |
| `audit.reject` | 消息审核拒绝 |

::: tip 关于全量消息
`message.group` 是常规群消息（要 @机器人才触发）；`message.group_full` 是群里**所有**消息（无需 @）。
用户可在机器人的「适配器设置」里开启「全量消息当作普通群消息处理」，开启后 `group_full` 会自动转成 `group`，所有订阅 `message.group` 的插件都能收到。
:::

## 跨平台事件映射

同一个 XUBP 事件类型，在不同平台上对应不同的原始事件。**插件无需关心原始事件名**，只需订阅通用类型即可。

| XUBP 通用类型 | QQ 官方 | Discord | Telegram | OneBot v11 |
|-------------|---------|---------|----------|-----------|
| `message.group` | `GROUP_AT_MESSAGE_CREATE` | — | — | `message.group` |
| `message.group_full` | `GROUP_MESSAGE_CREATE` | `MESSAGE_CREATE` | — | `message.group` |
| `message.private` | `C2C_MESSAGE_CREATE` | 应用私信 | 私聊 `message` | `message.private` |
| `message.guild` | `MESSAGE_CREATE` | Guild 消息 | — | — |
| `bot.group_join` | `GROUP_ADD_ROBOT` | — | `my_chat_member` | `notice.group_increase` |
| `bot.group_leave` | `GROUP_DEL_ROBOT` | — | `my_chat_member` | `notice.group_decrease` |
| `bot.friend_add` | `FRIEND_ADD` | — | — | `notice.friend_add` |
| `interaction` | `INTERACTION_CREATE` | `INTERACTION_CREATE` | `callback_query` | — |
| `reaction.add` | `MESSAGE_REACTION_ADD` | `MESSAGE_REACTION_ADD` | — | — |

::: details 完整映射表
上表只列了高频类型。完整映射见各平台适配器实现。"—" 表示该平台暂无对应的原生事件，适配器可在未来版本中通过组合事件或轮询实现。
:::

> 如果插件确实需要针对特定平台做特殊处理，可以从 `event["platform_event_type"]` 读取平台原始事件类型。

## 插件如何订阅事件

在 `meta.yaml` 的 `events` 字段列出要接收的事件类型：

```yaml
events:
  - message.group      # 群消息（@机器人）
  - message.private    # 私聊消息
```

- 只写你需要的类型，不写的不会收到（减少不必要的处理）。
- 仅作为拦截器的插件，`events` 留空 `[]`，不接收任何入站事件。
- 订阅 `message.group` 和 `message.group_full` 两个，就能同时收到 @消息和全量消息。

## 命名规则

- 类别前缀：`message`（消息）、`bot`（机器人状态）、`interaction`（交互）、`reaction`（表态）、`audit`（审核）。
- `meta.yaml` 的 `events` **必须用通用类型**，不能用平台原始事件名。

## 下一步

- 看消息如何流转到插件 → [消息流转](./message-flow)
- 动手处理事件 → [处理事件](../plugin-dev/events)
