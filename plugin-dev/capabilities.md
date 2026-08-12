# 能力调用 Capabilities（XUBP v2）

> **你会学到**：插件如何**发现并调用平台能力**——撤回、禁言、踢人、表情表态、群成员、进群审批、按钮回执、富媒体……都是通过能力码统一调用，一份代码在所有平台通用，平台不支持时自动降级。
>
> 这是 XUBP v2 的核心新增。v1 里插件只能 `if adapter == "qq_official"` 硬编码判断 + 手工降级；v2 改为**运行时能力协商**。

## 什么是能力码

每个平台适配器暴露一组**能力码**（capability code），表示"这个平台支持做什么"。插件先查询，再调用：

```
平台能力码集合（如 QQ 官方）
xubp.message.recall          撤回消息
xubp.reaction.add            表情表态
xubp.group.member.mute       群禁言
xubp.group.join_request.approve  审批入群
...
```

## 发现能力（Capability Discovery）

### C ABI 框架（Xiaoyi_QQ_C / C++）

```c
/* 查询某机器人是否支持某能力码：1=支持 0=不支持 */
int32_t (*has_capability)(uint32_t bot_id, const char* code);
```

### Python 插件（V3）

```python
async def handle_event(context):
    if context.capabilities.has("xubp.group.member.mute"):
        pass   # 该平台支持群禁言
```

## 调用能力（Capability Invoke）

参数和结果都是 JSON。**能力码 + 参数 = 一次平台 API 调用**，插件不需要关心底层 HTTP。

### C ABI 框架

```c
/* 调用能力，args_json 为 JSON 参数串；out 返回平台响应 JSON（需 free） */
int32_t (*capability_invoke)(uint32_t bot_id, const char* code,
                             const char* args_json, size_t args_len,
                             char** out, size_t* out_len);
/* 返回：BOT_OK=成功，BOT_ENOTSUP=平台不支持该能力，BOT_EINTERNAL=其他失败 */
```

### Python 插件（V3）

```python
await context.capabilities.invoke("xubp.group.member.mute", {
    "group_openid": "群OpenID",
    "member_openid": "成员OpenID",
    "op": "add",
    "mute_expire_at": "2026-09-01T10:00:00+08:00",
})
```

## 能力码目录

### 消息
| 能力码 | 说明 | 参数 | QQ 官方实现 |
|---|---|---|---|
| `xubp.message.recall` | 撤回消息 | `{target, message_id, chat_type}` | DELETE /v2/.../messages/{mid} |
| `xubp.reaction.add` | 表情表态 | `{channel_id, message_id, type, id}` | PUT /channels/.../reactions |
| `xubp.reaction.remove` | 取消表态 | 同上 | DELETE /channels/.../reactions |
| `xubp.file.upload` | 富媒体上传 | `{openid, is_group, file_type, url}` | POST /v2/.../files |

### 群管理
| 能力码 | 说明 | 参数 | 权限 |
|---|---|---|---|
| `xubp.group.member.mute` | 群禁言 | `{group_openid, op:add/update/del, member_openid, mute_expire_at}` | 群管理员 |
| `xubp.group.mute.query` | 群禁言查询 | `{group_openid}` | 群管理员 |
| `xubp.group.info` | 群基本信息 | `{group_openid}` | 白名单 |
| `xubp.group.bot_state` | 机器人群状态 | `{group_openid}` | 白名单 |
| `xubp.group.members` | 群成员列表 | `{group_openid}` | 内邀 |
| `xubp.group.member.kick` | 踢人 | `{guild_id, user_id}` | 频道 |
| `xubp.group.join_request.list` | 入群申请列表 | `{group_openid, cursor?}` | 群管理员 |
| `xubp.group.join_request.approve` | 审批入群 | `{group_openid, member_openid, op, join_request_id?, reject_reason?}` | 群管理员 |
| `xubp.group.join_strategy.list/create/update/delete` | 入群自动审批策略 CRUD | `{strategy_id?} + 策略字段` | 群管理员 |
| `xubp.group.join_strategy.execute` | 策略全量扫描 | `{strategy_id}` | 群管理员 |
| `xubp.group.join_strategy.whitelist` | 策略白名单 | `{strategy_id, op, whitelist_users[]}` | 群管理员 |

### 频道 / 互动 / 其他
| 能力码 | 说明 | 参数 |
|---|---|---|
| `xubp.guild.mute` | 频道禁言 | `{guild_id, user_id?, mute_seconds}` |
| `xubp.interaction.respond` | 按钮回执 | `{interaction_id, code}` |
| `xubp.user.stream_message` | 单聊流式消息 | `{openid, input_state, index, content_type, content_raw, ...}` |
| `xubp.link.generate` | 生成分享链接 | `{callback_data}` |
| `xubp.file.upload_chunked` | 大文件分片上传 | `{openid, is_group, file_type, url}`（>20MB） |

## 降级模式

平台不支持某能力时 `invoke` 抛 `CapabilityNotSupported` / 返回 `BOT_ENOTSUP`。插件应降级处理，而不是崩掉：

```python
async def handle_event(context):
    try:
        await context.capabilities.invoke("xubp.group.member.mute", {...})
    except CapabilityNotSupported:
        await context.reply("当前平台不支持群禁言")
```

## C ABI 完整示例（C++ 插件）

```c
// 撤回一条消息
char* out = NULL; size_t out_len = 0;
const char* args = "{\"target\":\"group_openid_xxx\",\"message_id\":\"msg_123\",\"chat_type\":\"1\"}";
if (host->capability_invoke(bot_id, "xubp.message.recall", args, strlen(args), &out, &out_len) == BOT_OK) {
    // out 为平台响应 JSON，用完 free(out)
}
```

## 下一步

- 发送富媒体消息 → [发送消息](./messages)
- 处理按钮/互动事件 → [处理事件](./events)
- 声明版本 → [插件元数据 BotPluginMeta](./meta)
