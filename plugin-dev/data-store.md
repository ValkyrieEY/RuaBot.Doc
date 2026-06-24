# 数据存储

> **你会学到**：怎么在插件里存取数据、二进制文件怎么存、数据如何隔离。

插件通过 `context.data_store` 存取数据。**无需自己建表、无需关心数据库**——框架提供简单的键值接口，数据按 `插件 + 用户 + 机器人` 自动隔离。

## 核心概念

- **命名空间（namespace）**：数据的"分区"，一般用插件 code 当命名空间。
- **键（key）**：命名空间下的具体数据条目。
- **隔离**：同一个插件绑到不同机器人，数据天然隔离——你不用在 key 里区分用户/机器人，框架自动处理。

## JSON 数据

```python
# 读取（带默认值）
value = await context.data_store.get("checkin", "records", {})

# 写入（upsert，存在则更新）
await context.data_store.set("checkin", "records", {"user_001": "2026-06-24"})

# 删除
await context.data_store.delete("checkin", "records")

# 列出某命名空间下的所有 key
keys = await context.data_store.keys("checkin")
```

| 方法 | 说明 |
|------|------|
| `await get(namespace, key, default=None)` | 读，不存在返回 default |
| `await set(namespace, key, value)` | 写（value 任意可 JSON 序列化的对象） |
| `await delete(namespace, key)` | 删，返回是否删除成功 |
| `await keys(namespace)` | 列出命名空间下所有 key |

## 二进制数据（图片/文件）

```python
# 写入二进制（可选指定文件名和 MIME 类型）
await context.data_store.set_binary(
    "images", "avatar",
    image_bytes,
    filename="avatar.png",
    mime_type="image/png",
)

# 读取
data = await context.data_store.get_binary("images", "avatar")  # bytes | None

# 删除
await context.data_store.delete_binary("images", "avatar")

# 列出所有 key
keys = await context.data_store.binary_keys("images")
```

| 方法 | 说明 |
|------|------|
| `await get_binary(namespace, key)` | 读，返回 `bytes` 或 `None` |
| `await set_binary(namespace, key, value, *, filename="", mime_type="application/octet-stream")` | 写 |
| `await delete_binary(namespace, key)` | 删 |
| `await binary_keys(namespace)` | 列出所有 key |

## 实战示例：每日签到

```python
import time

async def handle_event(context):
    msg = (context.event.get("content") or "").strip()
    if msg != "签到":
        return

    user_id = context.sender_id
    today = time.strftime("%Y-%m-%d")

    # 读历史签到记录
    records = await context.data_store.get("checkin", "records", {})
    if records.get(user_id) == today:
        await context.reply("今天已经签到过啦~")
        return

    # 写入今天签到
    records[user_id] = today
    await context.data_store.set("checkin", "records", records)
    await context.reply("签到成功！")
```

::: tip 命名空间约定
习惯上用插件 code 当命名空间（如 `checkin`、`card_shop`），key 用业务标识（如用户 ID）。这样不同功能的数据互不干扰。
:::

## 数据隔离说明

`data_store` 按 `插件 code + 用户 ID + 机器人 ID` 三重隔离：

- 同一个插件，A 客户的机器人和 B 客户的机器人，数据完全独立。
- 同一个客户，绑到 QQ 机器人和 Telegram 机器人的同一插件，数据也独立。
- 你**不需要**在 key 里手动拼 user_id / bot_id——框架根据当前事件自动隔离。

## 下一步

- 发送各种消息 → [发送消息](./messages)
- 在 WebUI 里展示存储的数据 → [插件 WebUI](./webui)
