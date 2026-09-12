---
title: 最小示例
description: 逐行讲解框架自带的最短插件 echo.cpp：注册宏参数、事件回调、回复消息与 @ 判断，附编译命令。
---

# 最小示例

这页把框架自带的最短插件 `plugins/echo/echo.cpp` 拆开讲一遍。读完你能说清一个插件的最小闭环：**注册自己 → 收到消息 → 回一条消息**，并知道每一行在干什么。

## 完整源码

下面就是 `plugins/echo/echo.cpp` 的全文（含空行共 20 行，未做任何改动）——它的功能是：群聊里被 @ 或私聊时，原样回显收到的文本。

```cpp
// echo —— M1 demo 插件：群里被 @ 或私聊时，原样回显消息文本。
// 编译为 libecho.so，由 PluginManager 经 C ABI dlopen 加载。
#include "plugin_sdk.hpp"

// 内嵌 SVG logo（演示 BOT_PLUGIN_LOGO_EMBED：logo 字节随 .so/.dll 一起导出，无需外链）
static const char kLogo[] =
    "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' rx='14' fill='#2d8cf0'/>"
    "<path d='M16 26h32v14a4 4 0 0 1-4 4h-18l-8 7v-7h-2a4 4 0 0 1-4-4V26z' fill='#fff'/></svg>";
BOT_PLUGIN_LOGO_EMBED(kLogo, sizeof(kLogo) - 1)

extern "C" void bot_plugin_on_message(const BotMessageEvent* evt) {
    bot::Message m(evt);
    // 群里只在被 @ 时回复（避免噪音）；私聊全回
    if (m.is_group() && !m.at_me()) return;

    bot::Logger::info() << "[" << m.sender_name() << "] " << m.text();
    m.reply(m.text());
}

BOT_REGISTER_PLUGIN("echo", "回声", "0.1.0", "xbot", "demo")
```

## 逐行讲解

### 头文件与注册宏

**`#include "plugin_sdk.hpp"`**：只引入官方 SDK，它是 header-only 的，内部会自动包含 C ABI 合同 `bot_plugin.h`。**不要** include 框架的内部头文件——那些不属于冻结接口。

**`BOT_REGISTER_PLUGIN(...)`**（最后一行）：注册宏，展开成四个必需导出符号（ABI 版本、元数据、初始化、卸载），另外两个宏 `_EX` / `_WEB` 还能声明优先级、订阅事件、拦截器、logo、设置项、Web 面板。五个参数依次是：

| 参数 | 示例值 | 含义 |
| --- | --- | --- |
| `CODE` | `"echo"` | 插件唯一编码，全站不重复；也是安装目录名与面板地址里的标识 |
| `NAME` | `"回声"` | 展示名称，出现在插件市场与机器人详情页 |
| `VERSION` | `"0.1.0"` | 版本号，重新上传时会覆盖同编码插件 |
| `AUTHOR` | `"xbot"` | 作者名 |
| `CATEGORY` | `"demo"` | 分类标签；不在规范集合内的会被归到 `other`，见 [目录结构与打包](/plugin-dev/structure) |

::: tip 注册宏放在文件最后一行也没问题
宏只是展开出符号定义，位置不影响加载。习惯上放在文件末尾，避免读者被样板代码打断。
:::

### 内嵌 logo

`kLogo` 是一段 SVG 文本，`BOT_PLUGIN_LOGO_EMBED(kLogo, sizeof(kLogo) - 1)` 把它作为二进制字节随动态库一起导出（`- 1` 是去掉 C 字符串末尾的 `\0`）。框架加载/上传时会优先读取这段字节作为插件图标，不需要外链图片。三种 logo 来源与优先级见 [目录结构与打包](/plugin-dev/structure)。

### 事件回调与取文本

**`extern "C" void bot_plugin_on_message(const BotMessageEvent* evt)`** 是消息事件回调。注意两点：

- 必须写 `extern "C"`，否则 C++ 会做名字修饰，框架按 C 符号名找不到它；
- 回调由框架在事件线程上同步调用，`evt` 指向的字符串**只在本次回调期间有效**，要留用请立刻复制。

**`bot::Message m(evt);`** 是 SDK 的零拷贝包装，不复制数据。它提供的常用方法：

| 方法 | 返回 | 说明 |
| --- | --- | --- |
| `text()` | `std::string_view` | 纯文本内容（已去掉 @ 与表情） |
| `sender_id()` / `sender_name()` | `std::string_view` | 发送者 ID / 昵称 |
| `group_id()` | `std::string_view` | 群 ID；私聊为空串 |
| `is_group()` | `bool` | 是否群聊 |
| `at_me()` | `bool` | 这条消息是否 @ 了机器人 |
| `message_id()` | `std::string_view` | 消息 ID（撤回、引用时用） |
| `bot_id()` | `uint32_t` | 收到这条消息的机器人句柄 |
| `raw()` | `const BotMessageEvent*` | 底层结构体指针，字段全量见 [处理事件](/plugin-dev/events) |

### 回消息

**`m.reply(m.text())`** 是最省事的回复方式：SDK 会把纯文本拼成消息段 JSON（`[{"type":"text","text":"..."}]`），再调用 `host->send_reply(evt, json, len)`。`send_reply` 是**被动回复**：它绑定触发这条回复的原消息，因此在 QQ 官方平台上可以享受 5 分钟内的免主动频控窗口。想发富媒体、Markdown、按钮，或主动推送，见 [发送消息](/plugin-dev/messages)。

**`bot::Logger::info() << ...`** 是流式日志，析构时把内容交给 `host->log`。日志会出现在机器人详情页的「日志」Tab，是调试插件最直接的手段。

### 为什么群消息要判断 is_at_self

关键的一行：

```cpp
if (m.is_group() && !m.at_me()) return;   // 群里没 @ 机器人就直接返回
```

原因有两层：

1. **QQ 官方机器人在群里默认只能收到 @ 自己的消息**，但获得「接收所有消息」授权后会推送全量群消息——那时如果不判断，机器人会对群里每一句话都回复，形成刷屏；
2. 其它平台（如 OneBot）能收到全部群消息，判断 `at_me()` 是避免噪音的通行做法。

所以约定是：**群里必须检查 `is_at_self`，私聊不必**。如果你就是要在群里处理全量消息（比如做违禁词检测），应当忽略这条约定，并在插件说明里写清楚。

## 编译

一条命令编成动态库：

```bash
# 把 echo.cpp 编成 echo.so；-I 指向 SDK 头文件所在目录
g++ -shared -fPIC -std=c++17 echo.cpp -o echo.so -I<sdk目录>
```

- `-shared`：产出动态库（`.so`；Windows 下为 `.dll`，上传时同样被识别）；
- `-fPIC`：位置无关代码，动态库必需；
- `-std=c++17`：SDK 用到 `std::string_view` 等 C++17 特性，标准不能低于 C++17；
- `-I<sdk目录>`：`plugin_sdk.hpp` 与 `bot_plugin.h` 所在目录，例如 `-I./include`。

更省事的方式是用官方云编译服务：只上传源码 zip，不用本地配编译器。见 [云编译与上架](/plugin-dev/publish)。

## 下一步

- [目录结构与打包](/plugin-dev/structure)：插件包该放哪些文件、分类与 logo 规范
- [生命周期回调](/plugin-dev/lifecycle)：注册宏展开出了哪些符号、什么时候被调用
- [处理事件](/plugin-dev/events)：`BotMessageEvent` 的全部字段与常用判断
