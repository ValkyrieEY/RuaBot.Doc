# XUBP v2 —— 通用机器人协议（第 2 版）

> XUBP = Xiaoyi Universal Bot Protocol。v2 在 v1 基础上补齐：**统一消息段模型、能力协商/发现、事件字段 schema、协议版本协商、统一身份模型**，并接入 QQ 官方平台新增能力（群禁言/频道禁言/富媒体/按钮互动等）。
>
> **兼容性**：v2 是 v1 的超集（加法演进）。v1 插件仍可运行；新字段/能力码仅在框架支持时暴露。插件应通过 capability discovery 感知能力，而非硬编码 `adapter_code` 判断。

---

## 1. 版本协商

事件/请求统一携带 `xubp_version`：

```json
{ "xubp_version": "2", "adapter_code": "qq_official", "event_type": "message.group", ... }
```

- 插件声明最低支持版本：`meta.yaml` 加 `xubp_version: "2"`（缺省=1，按 v1 语义）。
- 框架能力面携带 `supported_xubp_version`；插件若声明 v2 而框架只支持 v1，降级提示。

## 2. 能力协商 / Capability Discovery（v2 核心）

取代 v1"硬编码 adapter_code 判断 + 手工降级"：

- 每个适配器暴露**能力码集合**（capability codes），插件运行时查询：

```json
// GET adapter/capabilities → 平台能力码数组
["xubp.message.recall", "xubp.group.member.mute", "xubp.reaction.add", ...]
```

- 插件在 `context.capabilities` 查询单能力：`has("xubp.group.member.mute")`；调用：`invoke("xubp.group.member.mute", {group_openid, member_openid, op:"add", mute_expire_at})`。
- 不支持的平台返回 `BOT_ENOTSUP`，插件自行降级（如无禁言能力则提示"该平台不支持"）。

### 能力码目录（v2 新增）

| 能力码 | 说明 | QQ 官方实现 |
|---|---|---|
| `xubp.message.recall` | 撤回消息 | DELETE /v2/{users\|groups}/{openid}/messages/{mid} |
| `xubp.message.forward` | 转发消息 | — |
| `xubp.reaction.add` | 表情表态 | PUT /channels/{id}/messages/{mid}/reactions/{type}/{id} |
| `xubp.reaction.remove` | 取消表态 | DELETE /channels/{id}/messages/{mid}/reactions/{type}/{id} |
| `xubp.file.upload` | 富媒体上传 | POST /v2/{users\|groups}/{openid}/files |
| `xubp.file.download` | 附件下载 | 附件 url 直链 |
| **`xubp.group.member.mute`** | **群禁言** | POST /v2/groups/{openid}/restrict_chat_setting（op: add/update/del） |
| **`xubp.group.mute.query`** | **群禁言查询** | GET /v2/groups/{openid}/restrict_chat_setting |
| `xubp.group.member.kick` | 踢人 | DELETE /guilds/{gid}/members/{uid}（频道） |
| `xubp.group.members` | 群成员列表 | POST /v2/groups/{openid}/members |
| **`xubp.guild.mute`** | **频道禁言** | PATCH /guilds/{gid}/mute、/members/{uid}/mute |
| `xubp.interaction.respond` | 按钮回执 | PUT /interactions/{interaction_id} |
| `xubp.qqofficial.full_message` | 群全量消息 | GROUP_MESSAGE_CREATE |
| **`xubp.group.info`** | **群基本信息** | GET /v2/groups/{openid}/info |
| **`xubp.group.bot_state`** | **机器人群状态** | GET /v2/groups/{openid}/bot_state |
| **`xubp.group.join_request.list`** | **入群申请列表** | GET /v2/groups/{openid}/join_request_list |
| **`xubp.group.join_request.approve`** | **审批入群申请** | POST /v2/groups/{openid}/approval_join_request/{member} |
| **`xubp.group.join_strategy.list/create/update/delete/execute/whitelist`** | **入群自动审批策略 CRUD+扫描+白名单** | /v2/groups/join_approval_strategy... |
| **`xubp.user.stream_message`** | **单聊流式消息**（AI 分片输出） | POST /v2/users/{openid}/stream_messages |
| **`xubp.link.generate`** | **生成分享链接**（callback_data 透传） | POST /v2/generate_url_link |
| **`xubp.file.upload_chunked`** | **大文件分片上传**（>20MB，prepare+part_finish+合并） | /v2/{users\|groups}/{id}/upload_prepare... |

## 3. 统一消息段模型（双向，替代 v1 分裂）

v2 入站/出站统一使用 `segments` 数组，段类型正式化：

| 段类型 | 字段 | 说明 |
|---|---|---|
| `text` | `text` | 文本 |
| `image` | `url` | 图片 |
| `audio` | `url` | 语音 |
| `video` | `url` | 视频 |
| `file` | `url`, `name` | 文件 |
| `at` | `user_id` | @某人 |
| `reply` | `message_id` | 引用/回复 |
| `markdown` | `content` | Markdown |
| `keyboard` | `json` | 按钮组件 JSON |

```json
// 出站（context.reply）
{ "segments": [
    {"type":"text","text":"你好 "},
    {"type":"at","user_id":"u_openid_1"},
    {"type":"image","url":"https://..."}
] }
```

```json
// 入站（context.event.segments）
[{ "type":"text","text":"你好" }, { "type":"image","url":"https://..." }]
```

## 4. 事件字段 Schema（补全）

### 统一事件结构
```json
{
  "xubp_version": "2",
  "event_type": "interaction",
  "platform_event_type": "INTERACTION_CREATE",
  "event_id": "EVENT_1",
  "adapter_code": "qq_official",
  "timestamp": 1700000000,
  "sender": {"id": "...", "username": "..."},
  "chat": {"chat_type": "group", "chat_openid": "...", "guild_id": "..."},
  "content": "...",
  "segments": [...],
  "raw": {...}
}
```

### 附加字段（v2 正式 schema 化）
| 事件类型 | 附加字段 |
|---|---|
| `interaction` | `interaction_data`: {`interaction_id`, `button_id`, `button_data`, `message_id`, `scene`} |
| `reaction.add/remove` | `reaction_data`: {`channel_id`, `message_id`, `emoji_type`, `emoji_id`} |
| `audit.pass/reject` | `audit_data`: {`audit_id`, `message_id`} |
| `bot.group_join/leave` | `group_data`: {`group_openid`, `operator_openid`} |
| `message.*` | `referenced_message_id`（引用回复）|

## 5. 统一身份模型

`sender` / `chat` / `guild` 三级抽象（openid 体系）：

```json
{
  "sender":  { "id": "member_openid 或 user_openid", "platform_id": "union_openid", "username": "昵称" },
  "chat":    { "chat_type": "group|private|guild|guild_dm", "chat_openid": "会话 openid", "guild_id": "频道 id", "channel_id": "子频道 id" },
  "guild":   { "guild_id": "..." }
}
```

- `chat.chat_openid` 统一标识会话（群 group_openid / 单聊 user_openid），替代 v1 混乱的 `chat_group_id/chat_user_id`。
- 发送目标即 `chat.chat_openid`，无需再判断平台 ID 形态。

## 6. 出站发送（context.reply / send_message）

- 入参为 `segments`（第 3 节）或快捷字段：`content`（纯文本）、`markdown`、`keyboard`、`media`（富媒体：`{type, url}`）。
- 框架按适配器能力把 segments 映射为平台原生消息（如 QQ 官方：image→/files 上传→msg_type:7）。
- 发送结果回 `sent_message_id`（可撤回）。

## 7. v1 → v2 迁移说明

| v1 | v2 |
|---|---|
| 入站 `segments[{type,url}]` | 完整段类型（text/at/reply/image/...） |
| 出站 `msg_type` 数值 + `media_url` | 统一 `segments` 数组 |
| 无能力发现，硬编码 `adapter_code` | `context.capabilities.has/invoke` |
| `interaction_data` 无 schema | 正式字段定义 |
| `chat_group_id/chat_user_id` 混用 | `chat.chat_openid` 统一 |
| 无版本协商 | `xubp_version` |

- 框架 C ABI：`BotMessageEvent` 尾加 `interaction_data` / `referenced_message_id` / `chat_openid`（向后兼容，v1 插件字段偏移不变）。
- 新增段类型常量 `BOT_SEG_*`；插件编译时按 `xubp_version: "2"` 启用 v2 语义。
