---
title: 平台能力码
description: 平台能力的统一编号清单：QQ 官方与 OneBot 11 各自支持哪些能力、怎么探测、怎么调用、不支持时怎么降级。
---

# 平台能力码

**能力码**是平台操作的统一编号，形如 `xubp.group.member.mute`。插件通过能力码调用「禁言」「踢人」「撤回」这类操作，不用为每个平台写一套分支。

## 怎么用

两步：**先探测，再调用**。

```cpp
auto* h = bot::host();

// 1. 探测：这台机器人（这个平台）支持这个能力吗？
if (h->has_capability(evt->bot_id, "xubp.group.member.mute") != 1) {
    bot::Logger::warn() << "当前平台不支持禁言，改用提醒";
    return;                     // 不支持就走降级分支，不要硬调
}

// 2. 调用：JSON 进，JSON 出
const char* args = R"({"group_openid":"<群标识>","members":[
    {"member_openid":"<成员标识>","mute_end_timestamp":0}]})";
char*  out = nullptr;
size_t len = 0;
int rc = h->capability_invoke(evt->bot_id, "xubp.group.member.mute", args, strlen(args), &out, &len);
if (rc == BOT_OK && out) {
    // out 里是平台返回的原始结果（JSON），用于判断成功与失败原因
    h->free(out);
}
```

::: warning 一定要判断返回值
平台可能因为**没有开通权限**或**机器人不是管理员**而失败。失败时 `out` 里是平台返回的错误信息（例如未开通权限会返回 `应用无接口访问权限`），把它打进日志，比"操作没生效"好排查得多。
:::

## 参数里的标识从哪来

调用能力需要「群标识」「成员标识」。它们**不是 QQ 号**，而是平台侧的 openid，从事件里取：

| 参数 | 从哪取 | 说明 |
| --- | --- | --- |
| `group_openid` | 事件的 `chat_group_id` | 群聊事件的会话标识 |
| `member_openid` | 事件的 `sender_id` | 触发事件的那个成员 |
| `message_id` | 事件的 `message_id` | 撤回、引用时用 |

要操作事件里没出现过的成员（例如审批某个申请人），就用审批事件里带的那个人标识，或者先从入群申请列表里取。

## 能力码清单

### 两个平台都支持

这几个能力码在 QQ 官方与 OneBot 11 上**语义一致**，插件写一份代码即可跨平台：

| 能力码 | 用途 |
| --- | --- |
| `xubp.message.recall` | 撤回消息 |
| `xubp.group.member.mute` | 禁言 / 解除禁言成员 |
| `xubp.group.member.kick` | 踢出成员（可同时拉黑） |
| `xubp.group.members.get` | 查询单个群成员信息 |

### QQ 官方专属

| 能力码 | 用途 |
| --- | --- |
| `xubp.reaction.add` / `xubp.reaction.remove` | 添加 / 取消表情表态 |
| `xubp.file.upload` / `xubp.file.upload_bytes` / `xubp.file.download` | 上传（路径 / 字节）/ 下载文件 |
| `xubp.qqofficial.full_message` | 群全量消息（免 @）相关 |
| `xubp.group.mute.query` | 查询群禁言状态 |
| `xubp.guild.member.kick` | 频道内踢人（仅频道场景） |
| `xubp.group.member.batch_remove` | 批量踢人 |
| `xubp.group.members.list` / `xubp.group.members.bot` | 群成员列表 / 机器人自身的群内信息 |
| `xubp.group.blacklist.list` / `xubp.group.blacklist.update` | 群黑名单查询 / 增删 |
| `xubp.guild.mute` | 频道禁言 |
| `xubp.interaction.respond` | 回应按钮交互 |
| `xubp.group.info` / `xubp.group.bot_state` | 群信息 / 机器人在群内的状态 |
| `xubp.group.join_request.list` / `xubp.group.join_request.approve` | 入群申请列表 / 审批 |
| `xubp.group.join_strategy.*` | 入群策略的查询、创建、修改、删除、执行与白名单 |
| `xubp.user.stream_message` | 单聊流式消息 |
| `xubp.link.generate` | 生成链接 |
| `xubp.message.wakeup` | 消息召回 |

### OneBot 11 专属

| 能力码 | 用途 |
| --- | --- |
| `xubp.profile.like` | 给资料卡点赞 |
| `xubp.message.poke` | 戳一戳 |
| `xubp.group.member.title` | 设置群头衔 |

::: tip 清单会变
上面的清单以控制台里**机器人详情页 → 设置 → 支持能力**为准 —— 那里列的是这台机器人**当前实际可用**的能力。
:::

## 平台权限的门槛

QQ 官方平台的多数群管理接口属于**需要开通的能力**，且部分接口需要平台白名单：

| 现象 | 原因 | 怎么办 |
| --- | --- | --- |
| 返回 `应用无接口访问权限` | 该能力未开通或未加白名单 | 到 QQ 开放平台为该机器人开通对应能力；无法自助开通的联系平台 |
| 禁言 / 踢人失败 | 机器人不是群管理员 | 让群主把机器人设为群管理员 |
| 主动发消息失败 | 主动消息受限频或未授权 | 优先用**被动回复**（绑定用户消息，5 分钟内不受主动频控）；需要主动推送时先确认机器人有权限 |
| 群消息收不全 | 未开启全量消息授权 | 用「全量申请」插件生成授权深链，让群主在 QQ 里授权 |

## 降级写法

平台能力差异不该让插件"什么都不做"。推荐按这个顺序降级：

```text
支持按钮 / Markdown？  → 用按钮 + Markdown（QQ 官方）
不支持                → 发纯文本，并在文末提示可用指令（例如「回复：同意 1」）

支持禁言？            → 直接禁言
不支持                → 撤回消息 + 在群里口头警告
```

这样同一份插件在 QQ 官方上体验最好，在 OneBot 上也仍然可用。

## 下一步

- [调用平台能力](/plugin-dev/capabilities)：插件里的完整调用写法
- [事件类型](/reference/events)：能力调用需要的标识从哪些事件里取
- [常见问题](/faq)：权限相关的排查
