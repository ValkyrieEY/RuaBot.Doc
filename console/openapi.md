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
     https://example.com/api/user/info
```

```bash
# 列出你名下的机器人
curl -H "X-API-Key: <你的API Key>" \
     https://example.com/api/bots
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
| `bots/{uuid}` | 指定机器人的详情 |
| `bots/{uuid}/stats` | 指定机器人的统计数据 |
| `bots/{uuid}/send` | 通过指定机器人发送消息 |
| `plans` | 可购买的套餐列表 |
| `plugins` | 插件市场列表 |
| `server/stats` | 服务器运行概况 |

`{uuid}` 就是机器人详情页「设置」Tab 里显示的那个 UUID。

::: tip 先确认机器人 UUID
调 `bots/{uuid}/...` 系列接口之前，先在控制台进机器人详情页，从「设置」Tab 复制 UUID，避免手工拼错。
:::

## 4. 管理级接口

除了用户级接口，还有一组**管理级接口**，用于服务商侧的管理操作。

- 管理级接口**不能**用普通用户的 Key 调用
- 需要**管理员的 Key**才可用
- 具体有哪些管理级接口不在本文档展开

如果你确实需要管理级能力，请联系服务商。

## 5. 调用示例

发消息的接口用 `POST`，把内容放在请求体里：

```bash
# 通过指定机器人发一条消息（uuid 与 Key 都换成你自己的）
curl -X POST \
  -H "X-API-Key: <你的API Key>" \
  -H "Content-Type: application/json" \
  -d '{
        "target": "<群号或用户ID>",
        "message": "来自开放 API 的问候"   # 消息内容
      }' \
  https://example.com/api/bots/<机器人UUID>/send
```

不同接口需要的请求体字段不一样，以接口返回的提示为准。调用失败时先看返回里的错误信息，再对照下面的排查表。

## 6. 排查

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
curl -i -H "X-API-Key: <你的API Key>" https://example.com/api/bots
```

```powershell
# Windows PowerShell：等价的写法
Invoke-RestMethod -Uri "https://example.com/api/bots" `
  -Headers @{ "X-API-Key" = "<你的API Key>" }
```

## 下一步

- [控制台总览](/console/overview)
- [我的机器人](/console/bots)
- [订阅 · 卡密 · 充值](/console/billing)
