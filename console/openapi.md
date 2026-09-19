---
title: 开放 API
description: 在用户中心生成 API Key，用 X-API-Key 请求头调用用户级开放接口。
---

# 开放 API 🔌

开放 API 让你用程序调用控制台的能力：查自己的机器人、读日志、发消息、看服务器概况。适合把 Xiaoyi_QQ_V4 接进你自己的面板或运维脚本。

这页讲怎么拿到 Key、怎么带上它发请求、以及用户级都能调哪些接口。

## 1. 生成 API Key

进「用户中心」，找到开放 API 区域，生成一个 API Key。

| 要点 | 说明 |
|---|---|
| 归属 | Key 属于你的**账号**，不是某台机器人 |
| 权限 | 只能访问你自己名下的资源 |
| 保管 | Key 等同于你的身份凭证，不要贴到公开仓库、截图或群里 |

如果 Key 泄露了，在同一个页面重新生成一个，旧的随即失效。

::: danger 不要在任何地方公开你的 Key
本文档里的示例一律用占位值。你自己的 Key 只应出现在服务端配置或环境变量里，不要写进前端代码。
:::

## 2. 怎么调用

所有请求都通过 `X-API-Key` 请求头携带凭据。

```bash
# 查询当前账号信息（把占位 Key 换成你自己的）
curl -H "X-API-Key: <你的API Key>" \
     https://example.com/api/openapi/user/info
```

```bash
# 列出你名下的机器人
curl -H "X-API-Key: <你的API Key>" \
     https://example.com/api/openapi/bots
```

把 `example.com` 换成你实际访问控制台用的域名即可。

## 3. 用户级可用接口

下面这些接口用**你自己的** API Key 就能调，返回范围限于你名下的资源。

| 接口 | 用途 |
|---|---|
| `user/info` | 当前账号信息 |
| `user/logs` | 账号维度的日志 |
| `user/notifications` | 通知中心的消息 |
| `user/subscription` | 当前套餐与额度情况 |
| `bots` | 你的机器人列表 |
| `bot/{uuid}` | 指定机器人的详情 |
| `bot/{uuid}/stats` | 指定机器人的统计数据 |
| `bot/{uuid}/send` | 通过指定机器人发送消息 |
| `plans` | 可购买的套餐列表 |
| `plugins` | 插件市场列表 |
| `server/stats` | 服务器运行概况 |

`{uuid}` 就是机器人详情页「设置」Tab 里显示的那个 UUID。

::: tip 先确认机器人 UUID
调 `bot/{uuid}/...` 系列接口之前，先在控制台进机器人详情页，从「设置」Tab 复制 UUID，避免手工拼错。
:::

## 4. 调用插件接口（插件级 API）

除了上面那些平台接口，**每个插件自己的功能也能通过 API 调**。一条通路覆盖所有插件：

```
POST /api/openapi/plugin/{机器人UUID}/{插件码}/{动作}
Header: X-API-Key: <你的 Key>
Body:   与插件面板里的请求格式完全一致
```

返回也是插件原样返回的 JSON，所以**面板里能做的事，API 都能做**，不用为每个插件学一套新格式。

以「消息发送」插件为例（插件码 `msg_sender`）：

| 动作 | 请求体 | 用途 |
|---|---|---|
| `groups` | `{}` | 机器人收到过消息的群列表 |
| `probe` | `{"group_openid":"..."}` | 该群的发送权限（能否主动、被动窗口） |
| `messages` | `{"group_openid":"...","limit":50}` | 该群最近的聊天记录 |
| `send` | `{"group_openid":"...","mode":"passive\|proactive","kind":"text\|markdown\|image\|mixed","text":"...","markdown":"...","image_url":"..."}` | 发消息 |
| `clear` | `{"group_openid":"..."}` | 清空该群的本地聊天记录 |

```bash
curl -X POST "https://你的域名/api/openapi/plugin/<机器人UUID>/msg_sender/send" \
  -H "X-API-Key: <你的 Key>" -H "Content-Type: application/json" \
  -d '{"group_openid":"<群标识>","mode":"proactive","kind":"text","text":"你好"}'
```

### 用哪把 Key 调插件接口：平台 Key 还是机器人 Key

平台里有**两种 Key**，各自管一摊，别搞混：

| Key | 在哪生成 | 能调什么 |
|---|---|---|
| **平台 Key** | 就是本页（用户中心「开放 API」） | **全部接口**：账号信息、名下所有机器人的平台接口、所有机器人的插件接口 |
| **机器人 Key** | **机器人详情页 →「API」页签** | **只有这一台机器人**的插件接口。不能调平台接口，也不能碰别的机器人 |

**怎么选：**

- 服务端脚本、一次性调用、要管多台机器人 → 用**平台 Key**（本页生成）
- 手机 App、桌面客户端这类**长期存着**的凭据 → 用**机器人 Key**，一台设备一把。
  它万一泄露，影响面只到那一台机器人

机器人 Key 是在**机器人详情页**生成的，不在本页 —— 它的归属就是那台机器人，
放在那台机器人的页面里更直观，也能按机器人分别管理。

不管是哪种 Key，**明文都只显示一次**，关掉就再也看不到，请当场复制保存。丢了就重新生成一把。

::: tip 机器人 Key 为什么不能调平台接口
平台接口（如 `bot/{uuid}/send` 发消息、`bot/{uuid}/stats` 看统计、`user/info` 看账号）
属于**账号级**能力，要用平台 Key。机器人 Key 被刻意限制成「只开插件接口」——
这样一把放在手机上的 Key 就算泄露，也拿不到你的账号信息、动不了别的机器人。
:::

### 插件可以限制 API 能做什么

插件不一定对 API 和面板一视同仁。以「消息发送」为例：

- 面板里**不受限制**（面板要先登录，是你本人在用）
- 通过 **API 发送时，只允许发到你在插件面板「设置」里配置的白名单群**

这是有意为之：API Key 是存在手机上的长期凭据，泄露概率比登录密码高得多。
**白名单留空，则 API 一个群都发不出去**——这是安全默认，要去插件面板的「设置」里把群标识加进去。

被白名单拦下时会返回：

```json
{"ok": false, "error": "target_not_allowed", "hint": "该群不在 API 允许发送的名单里；..."}
```

::: tip 群标识从哪来
在插件面板的群列表里能看到，或用 `groups` 动作列出来。
:::

## 5. 管理级接口

除了用户级接口，还有一组**管理级接口**，用于服务商侧的管理操作。

- 管理级接口**不能**用普通用户的 Key 调用
- 需要**管理员的 Key**才可用
- 具体有哪些管理级接口不在本文档展开

如果你确实需要管理级能力，请联系服务商。

## 6. 调用示例

发消息的接口用 `POST`，把内容放在请求体里：

```bash
# 通过指定机器人发一条消息（uuid 与 Key 都换成你自己的）
curl -X POST \
  -H "X-API-Key: <你的API Key>" \
  -H "Content-Type: application/json" \
  -d '{
        "target": "<群号或用户ID>",
        "chat_type": 1,
        "content": "来自开放 API 的问候"
      }' \
  https://example.com/api/openapi/bot/<机器人UUID>/send
```

`chat_type` 填 `1` 表示群、`0` 表示私聊。**注意这个平台级接口只能发纯文本**；
要发 Markdown / 图片 / 图文混合，用上面第 4 节的**插件级接口**（`msg_sender` 的 `send` 动作）。

不同接口需要的请求体字段不一样，以接口返回的提示为准。调用失败时先看返回里的错误信息，再对照下面的排查表。

## 7. 排查

### 症状：返回 401

- **原因**：没带 `X-API-Key`，或者 Key 写错了、已经失效。
- **处理方式**：确认请求头名字拼写正确（`X-API-Key`），到用户中心核对 Key 是否还有效，必要时重新生成。

### 症状：返回 403

- **原因**：用普通用户的 Key 去调管理级接口，或者访问了不属于你的资源。
- **处理方式**：确认接口是否属于用户级；跨账号访问一律不允许。

### 症状：返回 404

- **原因**：路径拼错，或 `{uuid}` 不是你的机器人。
- **处理方式**：从机器人详情页复制 UUID 重试。

### 症状：机器人不回复，但接口返回成功

- **原因**：机器人本身离线，或目标 ID 不对。
- **处理方式**：先到控制台确认机器人状态在线，并核对目标群号 / 用户 ID。

```bash
# Linux / macOS：把响应头和状态码一起打出来，方便定位
curl -i -H "X-API-Key: <你的API Key>" https://example.com/api/openapi/bots
```

```powershell
# Windows PowerShell：等价的写法
Invoke-RestMethod -Uri "https://example.com/api/openapi/bots" `
  -Headers @{ "X-API-Key" = "<你的API Key>" }
```

## 下一步

- [控制台总览](/console/overview)
- [我的机器人](/console/bots)
- [订阅 · 卡密 · 充值](/console/billing)
