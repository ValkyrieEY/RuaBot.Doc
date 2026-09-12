---
title: 事件类型
description: 插件可以订阅的全部事件类型：消息类、通知类、请求类、交互类，以及各平台的触发差异。
---

# 事件类型

框架把不同平台发生的事情**归一化成一套事件**交给插件。插件只需要按这里的事件类型判断，不用关心消息是从哪个平台来的。

## 事件清单

| 值 | 常量 | 含义 |
| --- | --- | --- |
| 1 | `BOT_EVT_MESSAGE_GROUP` | 群消息 |
| 2 | `BOT_EVT_MESSAGE_PRIVATE` | 私聊消息 |
| 3 | `BOT_EVT_MESSAGE_GUILD` | 频道消息 |
| 4 | `BOT_EVT_MESSAGE_GUILD_AT` | 频道中被 @ 的消息 |
| 5 | `BOT_EVT_BOT_GROUP_JOIN` | 机器人被拉进群 |
| 6 | `BOT_EVT_BOT_GROUP_LEAVE` | 机器人被移出群 |
| 7 | `BOT_EVT_BOT_FRIEND_ADD` | 机器人被添加好友 |
| 8 | `BOT_EVT_BOT_FRIEND_REMOVE` | 机器人被删除好友 |
| 9 | `BOT_EVT_INTERACTION` | 按钮 / 交互回调（用户点了消息按钮） |
| 10 | `BOT_EVT_REACTION_ADD` | 消息被添加表情表态 |
| 11 | `BOT_EVT_REACTION_REMOVE` | 消息的表情表态被取消 |
| 12 | `BOT_EVT_META_HEARTBEAT` | 心跳 |
| 13 | `BOT_EVT_META_LIFECYCLE` | 连接生命周期变化 |
| 14 | `BOT_EVT_GROUP_MEMBER_JOIN` | **群成员**加入（不是机器人自己） |
| 15 | `BOT_EVT_GROUP_MEMBER_LEAVE` | 群成员退出 |
| 16 | `BOT_EVT_GROUP_JOIN_REQUEST` | 有用户申请入群 |
| 17 | `BOT_EVT_GROUP_MSG_REJECT` | 平台拒绝机器人向该群发消息 |
| 18 | `BOT_EVT_GROUP_MSG_RECEIVE` | 该群恢复接收机器人消息 |
| 19 | `BOT_EVT_SUBSCRIBE_STATUS` | 单聊订阅状态变更 |

::: tip 别搞混 5 和 14
`BOT_EVT_BOT_GROUP_JOIN`（5）是**机器人自己**被拉进群；`BOT_EVT_GROUP_MEMBER_JOIN`（14）是**群里其他人**进来了。做入群欢迎要用 14。
:::

## 事件分组

按用途可以分成四组，插件通常只关心其中一两组：

| 分组 | 包含事件 | 典型用途 |
| --- | --- | --- |
| 消息类 | 1、2、3、4 | 关键词回复、自定义指令、AI 对话 |
| 通知类 | 5、6、7、8、14、15、17、18 | 入群欢迎、退群统计、掉线告警 |
| 请求类 | 16 | 入群审批、自动放行 |
| 交互类 | 9、10、11 | 按钮审批、点歌选曲、投票 |

## 订阅方式

插件在元数据里声明自己关心的事件，框架只把命中的事件推给它。没声明的事件不会触发你的回调。

```cpp
// 只订阅消息类事件（群消息 + 私聊）
BOT_REGISTER_PLUGIN("kwreply", "关键词回复", "1.0.0", "you", "tool");

// 需要额外订阅群成员入群/退群、入群申请时，用 EX 版宏逐位声明
BOT_REGISTER_PLUGIN_EX("welcome", "入群欢迎", "1.0.0", "you", "welcome",
                       /*priority*/ 100u,
                       /*propagation*/ 0u,
                       /*events_mask*/ BOT_EVT_MASK_MESSAGE |
                           BOT_EVT_BIT(BOT_EVT_GROUP_MEMBER_JOIN) |
                           BOT_EVT_BIT(BOT_EVT_GROUP_MEMBER_LEAVE),
                       /*intercepts*/ 0u, "", "");
```

- `BOT_EVT_MASK_MESSAGE` 是「群消息 + 私聊消息」的便捷掩码。
- 单个事件的位用 `BOT_EVT_BIT(事件值)` 表示。
- 事件掩码只影响**能不能收到**；收到之后仍然要在回调里判断 `evt->type`。

## 各平台的触发差异

归一化只统一了**结构**，能不能收到取决于平台是否上报：

| 事件 | QQ 官方 | OneBot 11 |
| --- | --- | --- |
| 群消息 | 默认只推 @ 机器人的消息；开启**全量消息授权**后可收全部 | 取决于实现端配置，通常可收全部 |
| 私聊消息 | 支持 | 支持 |
| 群成员入群 / 退群 | 支持 | 支持 |
| 入群申请 | 支持（需要平台开通对应权限） | 视实现端而定 |
| 按钮交互 | 支持（按钮仅在 QQ 官方可用） | 不支持（按钮不渲染，用文字指令代替） |
| 表情表态 | 支持 | 视实现端而定 |
| 频道相关 | 支持频道场景 | 不适用 |

::: warning 收不到群消息先查两件事
1. 机器人是否已进群、是否在线；
2. QQ 官方平台下，是否只推了 @ 消息 —— 需要「群全量消息」授权，控制台插件市场里的「全量申请」插件可以生成授权深链。
:::

## 事件里有什么

事件结构体（`BotMessageEvent`）的字段说明见 [处理事件](/plugin-dev/events)。常用的几个：

| 字段 | 说明 |
| --- | --- |
| `type` | 事件类型，对应上表的数值 |
| `bot_id` | 事件属于哪台机器人 |
| `content` | 文本内容（生命周期类事件里是合成出来的描述文字） |
| `sender_id` | 发送者标识 |
| `sender_name` | 发送者昵称 |
| `sender_role` | 发送者在群里的角色（群主 / 管理员 / 普通成员） |
| `chat_group_id` | 群标识（群聊事件才有） |
| `chat_user_id` | 私聊会话标识（私聊事件才有） |
| `message_id` | 消息标识，撤回、引用时要用 |
| `is_at_self` | 这条消息是否 @ 了机器人 |
| `raw_json` | 平台原始事件 JSON，归一化没覆盖的字段从这里取 |

## 下一步

- [处理事件](/plugin-dev/events)：在插件里怎么接这些事件
- [事件掩码与元数据](/reference/meta)：`events_mask` 怎么声明
- [平台能力码](/reference/capabilities)：收到事件之后能做什么操作
