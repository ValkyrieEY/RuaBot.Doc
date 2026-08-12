# 快速开始

> **你会学到**：插件长什么样、怎么写一个最简插件、怎么让它跑起来。

## 插件是什么

插件是框架里提供某项功能的**可安装模块**——签到、积分、视频解析、AI 对话……都做成插件。管理员装载插件到机器人上即可使用。

插件基于 [XUBP 协议](../xubp/overview) 开发，**一份代码在所有平台通用**。

> **注意**：本框架是 **C++ + C ABI 插件**（编译成 `.so`/`.dll`），插件元数据用 **C 结构体**声明（见 `bot_plugin.h`），**没有 `meta.yaml`**。SDK 见 [`plugin_sdk.hpp`](./cpp-sdk)。

## 插件目录结构

一个插件就是一个目录，包含源码 + 构建脚本：

```
plugins/your_plugin/
├── CMakeLists.txt    # 构建配置（编译成 .so/.dll）
├── your_plugin.cpp   # 插件源码（必需）
```

## 加载方式（bot.toml 声明）

插件**不是自动扫描目录**，而是在 `config/bot.toml` 里用 `[[plugin]]` 声明 .so 路径、启停和优先级，框架启动时 `dlopen` 加载：

```toml
[[plugin]]
code     = "intercept"                        # 插件码（与 BotPluginMeta.code 一致）
so       = "./build/plugins/intercept/libintercept.dll"   # 编译产物路径
enabled  = true
priority = 100
```

编译插件 → 把 `.so`/`.dll` 路径填进 `[[plugin]]` → 重启框架即可装载。

## 最简插件：收到"你好"就回复

**`echo.cpp`**：

```cpp
#include "plugin_sdk.hpp"   // C++ SDK（header-only，内部含 bot_plugin.h）
#include <string_view>

extern "C" void bot_plugin_on_message(const BotMessageEvent* evt) {
    bot::Message m(evt);                       // 消息视图
    if (m.is_group() && !m.at_me()) return;    // 群消息：只回 @我的
    m.reply(m.text());                          // 把内容原样回给发送者
}

// 注册元数据 + 必需导出符号（内部生成 abi_version/meta/init/shutdown）
BOT_REGISTER_PLUGIN("echo", "回声", "0.1.0", "xbot", "demo");
```

就这么多。框架自动调用 `bot_plugin_on_message`，收到群/私聊消息时把它原样回过去。

## 环境准备

插件是 C++ 源码，用框架的 `plugin_sdk.hpp`（header-only，无需链接库）。开发流程：

1. 在 `plugins/<code>/` 建好源码 + CMakeLists。
2. 写处理逻辑，用 `BOT_REGISTER_PLUGIN` 声明元数据。
3. 编译成 `.so`/`.dll`，放入插件目录。
4. 在管理后台把插件装载到机器人，发消息验证。

## 必需导出符号

C ABI 要求插件导出以下符号（`BOT_REGISTER_PLUGIN` 宏已替你生成）：

| 符号 | 作用 |
|------|------|
| `bot_plugin_abi_version()` | ABI 版本号（宏生成） |
| `bot_plugin_meta()` | 返回 `const BotPluginMeta*` 元数据（宏生成） |
| `bot_plugin_init(api, reserved)` | 初始化，拿到 `BotHostApi`（宏调用 `bot::init_sdk`） |
| `bot_plugin_shutdown()` | 卸载时清理（宏生成空实现） |

可选回调（按需实现，见 [事件](./events)）：
- `bot_plugin_on_message(const BotMessageEvent*)` —— **所有事件都走它**（含互动/通知，用 `evt->type` 区分）
- `bot_plugin_intercept_incoming/outgoing/after_send` —— 拦截器
- 指令 handler（`register_command` 注册）

> **注意**：`bot_plugin_on_notice` 已在 ABI 声明为可选，但**当前框架版本尚未接线**（通知事件尚未派发到插件）。现阶段插件通过 `bot_plugin_on_message` 接收所有事件，用 `evt->type` 区分类型。

## 钩子一览

| C 符号 | 触发时机 | 当前版本 |
|------|---------|---------|
| `bot_plugin_on_message` | 收到事件（消息/互动等，`evt->type` 区分） | ✅ |
| `bot_plugin_intercept_incoming` | 入站消息进入插件链前 | ✅ |
| `bot_plugin_intercept_outgoing` | 消息发出前（拦截器用） | ✅ |
| `bot_plugin_intercept_after_send` | 消息成功发出后 | ✅ |
| `bot_plugin_on_notice` | 通知事件（进群/退群/好友/表情） | ⏳ ABI 预留未接线 |
| `api->register_command` | 注册指令 | ✅ |
| `bot::Logger` | 写运行时日志 | ✅ |

## 下一步

- C++ SDK 全部接口 → [C++ SDK 参考](./cpp-sdk)
- 声明插件元数据（`BotPluginMeta` 结构）→ [插件元数据](./meta)
- 处理事件 → [处理事件](./events)
- 调用平台能力（禁言/撤回/进群审批…）→ [能力调用](./capabilities)
