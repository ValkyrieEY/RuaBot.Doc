---
title: 存储与配置
description: KV 键值存储、二进制 Blob、per-bot 设置读写（setting_get/setting_set）的用法与隔离规则，附记分板例子。
---

# 存储与配置

插件有三种存数据的方式，选错了会很别扭，所以先看这张表：

| 方式 | 接口 | 隔离范围 | 适合存什么 |
| --- | --- | --- | --- |
| KV 键值 | `kv_get` / `kv_set` / `kv_delete` / `kv_keys` | 插件 + 租户 + 机器人 | 运行时状态、统计、缓存、用户数据 |
| Blob 二进制 | `blob_get` / `blob_set` / `blob_delete` | 插件 + 租户 + 机器人 | 图片、序列化数据等任意字节 |
| per-bot 设置 | `setting_get` / `setting_set` | 插件 + 机器人 | **要展示给用户配置的键值**（控制台/面板可读写） |

区别在最后一列：**用户能在界面上改的用设置，插件自己攒的用 KV**。设置项还会被控制台的配置抽屉与插件 Web 面板读到（`window.XBOT_PANEL.settings`），KV 不会。

## KV 键值存储

```cpp
int32_t (*kv_get)   (const char* key, const char** out, size_t* out_len);
int32_t (*kv_set)   (const char* key, const char* value, size_t len);
int32_t (*kv_delete)(const char* key);
int32_t (*kv_keys)  (const char* prefix, char** out, size_t* out_len);   /* 返回 JSON 数组 */
```

**三重隔离**：同一个 `key`，不同的**插件**、不同的**租户**、不同的**机器人**之间完全隔离。插件 A 在机器人 1 上写的 `score:alice`，插件 B 读不到，机器人 2 读到的也是它自己那份。你不需要在 key 里拼机器人 id。

```cpp
// 写：任意字符串（要存结构就把 JSON 序列化成字符串）
std::string v = "42";
bot::host()->kv_set("score:alice", v.data(), v.size());

// 读：值放在框架的缓冲里，**下次调用会被覆盖**，要留用必须立刻复制
const char* out = nullptr; size_t len = 0;
if (bot::host()->kv_get("score:alice", &out, &len) == BOT_OK && out) {
    std::string value(out, len);          // 立刻复制
}

// 列 key：给前缀，返回 JSON 数组字符串，如 ["score:alice","score:bob"]
char* keys = nullptr; size_t klen = 0;
if (bot::host()->kv_keys("score:", &keys, &klen) == BOT_OK && keys) {
    std::string arr(keys, klen);
    bot::host()->free(keys);              // 框架分配的缓冲，必须 free
}

// 删
bot::host()->kv_delete("score:alice");
```

::: warning 返回值生命周期
- `kv_get`：key 不存在时返回 `BOT_OK`，`*out` 为 `nullptr`、`*out_len` 为 0——**不是错误**，按「没有值」处理即可；
- `kv_get` 的值指针是**线程局部缓冲**，只在本次调用到下次宿主调用之间有效，跨调用必须复制；
- `kv_keys` 的输出是**框架分配**的，用完要调 `host->free` 释放。

接口不属于 SDK 的封装层，直接用 `bot::host()->kv_*`。
:::

值本身没有格式约束，你可以直接存 JSON 文本（`{"wins":3,"loses":1}`），读出来自己解析——控制台的「插件数据」Tab 也能看到这些键值。

## 二进制 Blob

```cpp
int32_t (*blob_get)   (const char* key, const uint8_t** out, size_t* len);
int32_t (*blob_set)   (const char* key, const uint8_t* data, size_t len);
int32_t (*blob_delete)(const char* key);
```

用法与 KV 同构，只是值换成 `uint8_t*` + 长度，用于存图片字节、序列化后的结构等。隔离规则与生命周期约定和 KV 一致。

```cpp
// 存一段二进制（例如生成好的图片）
std::vector<uint8_t> bytes = make_image();
bot::host()->blob_set("avatar:alice", bytes.data(), bytes.size());

// 读出来
const uint8_t* data = nullptr; size_t n = 0;
if (bot::host()->blob_get("avatar:alice", &data, &n) == BOT_OK && data) {
    std::vector<uint8_t> copy(data, data + n);   // 同样要立刻复制
}
```

## per-bot 设置 setting_get / setting_set

```cpp
int32_t (*setting_get)(const char* key, const char** out, size_t* len);          /* ABI 1.0 */
int32_t (*setting_set)(const char* key, const char* value, size_t len);          /* ABI 1.3 */
```

设置是**每个机器人一份**的用户可配置项，SDK 已经封好，直接用这两个函数：

```cpp
std::string greeting = bot::setting_get("greeting", "你好");   // 第二个参数是默认值
bot::setting_set("greeting", "欢迎光临");                       // 写入
bot::setting_set("greeting");                                   // 传空值 = 删除该键
```

规则如下：

| 规则 | 说明 |
| --- | --- |
| 键名字符集 | **只允许**字母、数字、下划线 `_`、短横线 `-`；其它字符会返回 `BOT_EINVAL` 且不写入 |
| 值的类型 | 写入的字符串**如果是合法 JSON 字面量就按 JSON 存**（以 `{`、`[`、`"`、`-`、数字、`t`/`f`/`n` 开头）；否则按**字符串**存 |
| 读回 | `setting_get` 总是返回**字符串**形式的值；存进去 `true` 读回来是 `"true"`，存进去 `123` 读回来是 `"123"` |
| 删除 | `bot::setting_set(key)` 传空值即删除该键 |
| 上下文 | 设置作用于「**当前插件 + 当前机器人**」——在事件回调与面板请求里都自动带上了上下文，不需要传机器人 id |

::: tip 想让用户看得见，就在元数据里声明 schema
`setting_schema_json` 里声明的键会渲染成控制台的「功能参数」表单（支持 `text` / `password` / `select` / `switch`），用户在界面上改的值与 `setting_get` 读到的是同一份数据。schema 写法见 [插件元数据](/reference/meta)。
:::

## 完整例子：记分板

一个「群里被 @ 就给自己加一分」的记分板插件，演示完整的**读 KV → 改 → 写回**闭环：

```cpp
#include "plugin_sdk.hpp"

#include <cstdlib>
#include <string>

// 读-改-写：把某个用户的分值 +1，并返回新分值
static int bump_score(const std::string& user) {
    const std::string key = "score:" + user;

    // 1) 读：key 不存在时返回 BOT_OK + out=nullptr，视为 0 分
    int score = 0;
    const char* out = nullptr; size_t len = 0;
    if (bot::host()->kv_get(key.c_str(), &out, &len) == BOT_OK && out && len > 0) {
        score = std::atoi(std::string(out, len).c_str());   // 立刻复制后再转换
    }

    // 2) 改
    score += 1;

    // 3) 写回
    std::string v = std::to_string(score);
    bot::host()->kv_set(key.c_str(), v.data(), v.size());
    return score;
}

extern "C" void bot_plugin_on_message(const BotMessageEvent* evt) {
    bot::Message m(evt);
    if (m.is_group() && !m.at_me()) return;

    if (m.text() == "签到") {
        int s = bump_score(std::string(m.sender_id()));
        m.reply("签到成功，当前积分：" + std::to_string(s));
    }
}

BOT_REGISTER_PLUGIN("score", "记分板", "1.0.0", "你的名字", "fun")
```

想换成分机器人共用的榜单，把 key 从 `score:<用户>` 改成 `score:<群>` 即可——KV 已经按机器人隔离，你只需要再按用户/群自己分一层。

## 数据能活多久

KV、Blob 与插件设置都属于**插件自己的业务数据**，作用域由框架按「插件 + 租户 + 机器人」自动圈定，你不需要自己清理命名空间。要主动删除某个键，就调 `kv_delete` / `blob_delete` 或给设置写空值。服务器整体备份的范围见 [备份与运维](/deploy/ops)。

## 下一步

- [插件元数据](/reference/meta)：`setting_schema` 怎么写、有哪些表单类型
- [插件 Web 面板](/plugin-dev/webui)：把配置做成自己的可视化面板
- [生命周期回调](/plugin-dev/lifecycle)：在卸载/停机时把内存数据落盘
