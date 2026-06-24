# 拦截器

> **你会学到**：怎么在消息发出前/后介入，实现内容过滤、敏感词替换、消息审计、自动撤回。

## 什么是拦截器

普通插件只处理**入站事件**（收到消息）。拦截器是一种特殊插件，额外在**出站消息**的两个时机介入：

- **发出前**（`handle_outgoing`）：消息即将发给平台前，可以**修改内容**或**阻断发送**。
- **发出后**（`handle_after_send`）：消息成功发出后，可以做统计、审计、自动撤回。

典型用途：敏感词过滤、广告注入、发送统计、消息审计日志。

## 启用拦截器

拦截器需要满足三个条件才会触发：

1. 机器人绑定该插件时，开启 **「拦截出站消息」** 开关。
2. 插件实现对应的钩子函数（`handle_outgoing` / `handle_after_send`）。
3. 插件和绑定都是启用状态。

::: tip 拦截器也是普通插件
一个插件可以**同时**处理入站事件（`handle_event`）和拦截出站消息（`handle_outgoing`）。不需要单独做一种"拦截器插件"。纯拦截器插件把 `meta.yaml` 的 `events` 设为 `[]` 即可。
:::

## handle_outgoing —— 发出前拦截

```python
async def handle_outgoing(context):
    message = context.message          # 当前消息（可读可改）

    # 示例：敏感词替换
    text = message.get("content", "")
    if "违禁词" in text:
        context.set_message({"content": text.replace("违禁词", "***")})

    # 示例：完全阻断发送
    if "禁止发送" in text:
        context.block()
```

可用的操作：

| 方法 | 说明 |
|------|------|
| `context.message` | 当前消息字典（可读取） |
| `set_message(msg)` | 替换整个消息内容 |
| `add_message(msg)` | 添加替代消息 |
| `block()` | 阻断原消息发送 |
| `stop()` | 停止后续拦截器（不再往下传） |

也支持返回字典的方式（等价）：

```python
async def handle_outgoing(context):
    return {"message": {"content": "替换内容"}, "block": True}
```

## handle_after_send —— 发出后回调

```python
async def handle_after_send(context):
    if context.ok:
        # 发送成功
        msg_id = context.sent_message_id
        # 例：统计发送量、记审计日志、定时撤回
        ...
    else:
        # 发送失败
        context.log("消息发送失败", "WARN")
```

可用信息：

| 属性 | 说明 |
|------|------|
| `context.ok` | 是否发送成功 |
| `context.sent_message_id` | 平台返回的消息 ID（可用来撤回） |
| `context.message` | 已发送的消息 |
| `context.source_plugin_code` | 触发发送的插件 |

也可调 `context.recall_message(msg_id)` 撤回。

## 优先级与传播

一个机器人可以装**多个**拦截器。它们的执行顺序由**优先级**决定：

- 优先级数值**越小越先执行**（默认 100）。
- 同优先级按绑定顺序排。
- 某个拦截器调 `stop()` 后，**后续拦截器不再执行**。

::: warning 拦截器不会拦截自身
如果插件 A 调用 `send_message`，插件 A 自己的 `handle_outgoing` **不会被触发**，避免无限递归。通过 `context.source_plugin_code` 可识别消息来自哪个插件。
:::

## 设置优先级

优先级在机器人绑定插件时配置（控制台里的「优先级」字段），不在 `meta.yaml` 里。

| 数值 | 含义 |
|------|------|
| 小（如 1-50） | 先执行，适合高优先级过滤（如安全审计） |
| 100（默认） | 常规 |
| 大（如 500+） | 后执行 |

## 传播策略

入站事件（`handle_event`）也有传播概念：

- **continue**（默认）：本插件处理完后，后续插件继续处理同一事件。
- **stop**：本插件处理完后，事件不再传给后续插件（适合"独占"该命令的插件）。

## 下一步

- 给插件做个管理界面 → [插件 WebUI](./webui)
- 跨平台注意 → [跨平台开发](./cross-platform)
