# 发送消息

> **你会学到**：怎么发纯文本、富媒体、Markdown、按钮、引用回复，以及自动撤回。
>
> ::: tip C++ 框架（Xiaoyi_QQ_C）
> C++ 侧用 `bot::Message::reply(text)` 回文本；复杂消息用 `BotHostApi::send_reply(evt, segments_json, len)` / `send_proactive(...)`，segments 为 XUBP 消息段数组（见下节 v2 统一段模型）。参考 [C++ SDK](./cpp-sdk)。
> :::

## 两种发送方式

- **`context.reply(text)`** —— 最简单，回一段纯文本。自动定位目标和类型，跨平台通用。
- **`context.send_message(payload)`** —— 发复杂消息（富媒体、Markdown、按钮等），payload 是字典。

```python
await context.reply("你好！")                          # 简单文本

await context.send_message({                            # 复杂消息
    "content": "Hello World",
    "msg_type": 0,
})
```

## XUBP v2：统一消息段（推荐）

v2 里入站/出站统一用 `segments` 数组表达富消息（替代 v1 的 `msg_type`+`media_url` 分裂，段类型见 [xubp/v2-overview](../xubp/v2-overview#3-统一消息段模型)）：

```python
await context.send_message({
    "segments": [
        {"type": "text", "text": "你好 "},
        {"type": "at", "user_id": "成员OpenID"},
        {"type": "image", "url": "https://example.com/a.png"},
        {"type": "reply", "message_id": "要回复的消息ID"},
    ],
})
```

支持段类型：`text` / `at` / `reply` / `image` / `audio` / `video` / `file` / `markdown` / `keyboard`。框架按平台能力自动映射为原生消息（QQ 官方：image → /files 上传 → msg_type:7）。以下 v1 的 `msg_type` 写法仍兼容，但新插件建议用 `segments`。

## msg_type 消息类型

| msg_type | 含义 |
|----------|------|
| `0` | 纯文本（默认） |
| `2` | Markdown |
| `3` | Ark 模板 |
| `7` | 富媒体（图片/视频/音频/文件） |

## 纯文本

```python
await context.send_message({
    "content": "Hello World",
    "msg_type": 0,
})
```

省略 `conversation` / `target` 时，自动用当前事件的会话和目标。

## 富媒体（图片/视频/音频/文件）

通过 `media_url` 给一个可访问的 URL，适配器会自动下载并上传到平台：

```python
# 图片（file_type=1）
await context.send_message({
    "msg_type": 7,
    "media_url": "https://example.com/image.png",
    "file_type": 1,
    "content": "图片说明",
})

# 视频（file_type=2）
await context.send_message({
    "msg_type": 7,
    "media_url": "https://example.com/video.mp4",
    "file_type": 2,
})

# 音频（file_type=3）/ 文件（file_type=4）同理
```

::: tip 大文件自动分片
大文件（≥5MB）会自动使用分片上传，无需特殊处理。
:::

## Markdown 消息

```python
await context.send_message({
    "content": " ",
    "msg_type": 2,
    "markdown": {"content": "# 标题\n正文内容"},
})
```

::: warning 平台支持差异
Markdown / Ark / 按钮等富消息类型是**部分平台**（如 QQ 官方）支持的特性。在不支持的平台，建议降级为纯文本。判断方式见 [跨平台开发](./cross-platform#平台特有功能)。
:::

## 内联键盘（按钮）

按钮作为 `keyboard` 字段传入，是一个二维数组（每行一组按钮）：

```python
await context.send_message({
    "msg_type": 2,
    "markdown": {"content": "请选择"},
    "keyboard": [
        [
            {"label": "确认", "type": 1, "data": "confirm"},
            {"label": "取消", "type": 1, "data": "cancel"},
        ],
        [
            {"label": "访问官网", "type": 0, "url": "https://example.com"},
        ],
    ],
})
```

按钮 `type`：`1` = 回调按钮（点击触发 `interaction` 事件，`data` 是回调数据），`0` = 链接按钮（`url` 跳转）。

用户点回调按钮后，插件会收到 `interaction` 事件，从 `interaction_data` 取出 `data` 判断点了哪个。

## 引用回复

附带 `msg_id` 实现消息引用：

```python
await context.send_message({
    "content": "回复内容",
    "msg_id": "要回复的消息ID",   # 从 event["message_id"] 取
})
```

`context.reply()` 默认就会引用当前消息，一般不用手动构造。

## 主动撤回（仅群消息）

发送时指定 `auto_delete_time`，消息发出 N 秒后自动撤回：

```python
await context.send_message({
    "content": "这条消息30秒后自动撤回",
    "auto_delete_time": 30,
})
```

也可以事后用 `context.recall_message(message_id)` 主动撤回。

::: warning 撤回时限
QQ 官方仅支持撤回 **2 分钟内**的消息，超时无法撤回。
:::

## 发到其他目标（主动推送）

`reply` / `send_message` 默认回当前会话。要发到**别的**群或用户，用 `send_proactive_message`：

```python
await context.send_proactive_message(
    target="group_openid_xxx",
    message={"content": "通知内容"},
    message_type="group",
)
```

## 下一步

- 拦截/审计发出的消息 → [拦截器](./interceptors)
- 跨平台注意事项 → [跨平台开发](./cross-platform)
