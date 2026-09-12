---
title: 快速开始
description: 插件是什么、能做什么、需要准备什么环境，以及从新建 .cpp 到在群里跑通第一个插件的完整流程。
---

# 快速开始

这页解决一个问题：**从零写出并跑通你的第一个 Xiaoyi_QQ_V4 插件**。读完你能走完「新建源码 → 注册 → 编译 → 上传 → 装到机器人 → 群里测试」这条完整链路，并且知道为什么插件的 ABI 版本必须和框架匹配。

如果你已经写过 C++，全程大约十几分钟；不熟 C++ 也没关系，第一个插件不到 30 行。

## 插件是什么

插件就是一个**动态库文件**（Linux 下 `.so`，Windows 下 `.dll`），在**框架进程内**被加载运行。

| 事实 | 说明 |
| --- | --- |
| 形态 | 一个动态库（`.so` / `.dll`），不是脚本、不需要解释器 |
| 语言 | 纯 C 或 C++（C++ 用官方 header-only SDK `plugin_sdk.hpp`） |
| 运行方式 | 加载进框架进程，和框架共享地址空间，事件直接以函数回调的形式进来 |
| 接口 | 与框架之间靠一套**冻结的 C ABI** 通信，只有函数指针表和少量结构体 |
| 依赖 | 官方 SDK 只有一个头文件，无第三方依赖；插件自身的依赖需要静态链接进来 |
| 分发 | 上传插件包到控制台即热加载，不需要重启服务 |

::: warning 因为跑在同一个进程里
插件里未捕获的崩溃（段错误、未定义行为）会影响整个框架进程。请做好参数判空与异常处理，只依赖 `BotHostApi` 提供的能力。
:::

## 插件能做什么

| 能力 | 用到的接口 | 展开页 |
| --- | --- | --- |
| 接收消息与事件 | `bot_plugin_on_message` 等回调 | [处理事件](/plugin-dev/events) |
| 拦截与改写消息 | 三个 `bot_plugin_intercept_*` 回调 | [拦截器](/plugin-dev/interceptors) |
| 回复与主动推送消息 | `send_reply` / `send_proactive` | [发送消息](/plugin-dev/messages) |
| 撤回消息 | `recall` 或 `xubp.message.recall` 能力 | [调用平台能力](/plugin-dev/capabilities) |
| 存数据 | KV（键值）/ Blob（二进制） | [存储与配置](/plugin-dev/storage) |
| 每个机器人独立配置 | `setting_get` / `setting_set` | [存储与配置](/plugin-dev/storage) |
| 调用平台能力（禁言、踢人、审批…） | `has_capability` / `capability_invoke` | [调用平台能力](/plugin-dev/capabilities) |
| 出站 HTTP 请求 | `http_get` / `http_request` | [Host API](/reference/host-api) |
| 自带 Web 配置面板 | `bot_plugin_web_route` + `web/` 目录 | [插件 Web 面板](/plugin-dev/webui) |
| 给机器人注册指令 | `register_command` | [Host API](/reference/host-api) |

## 开发环境准备

需要两样东西：

1. **一个支持 C++17 的编译器**
   - Linux：`g++`（`apt install -y build-essential`）
   - Windows：MSYS2 的 `g++`，或任意支持 `-shared` 的 C++17 编译器
2. **SDK 头文件 `plugin_sdk.hpp`**（它会 `#include "bot_plugin.h"`，两个文件都要有）
   - 从框架源码的 `include/` 目录取得，放进你的工程目录
   - 用云编译服务打包时不需要本地准备 SDK（详见 [云编译与上架](/plugin-dev/publish)）

先确认编译器可用：

```bash
g++ --version           # 能看到版本号即可
```

## 1. 新建源码文件

新建一个目录，把 `plugin_sdk.hpp` 与 `bot_plugin.h` 放进去，然后新建 `mybot.cpp`：

```text
myplugin/
├── plugin_sdk.hpp      # SDK（header-only，从框架源码 include/ 取得）
├── bot_plugin.h        # SDK 依赖的 C ABI 合同
└── mybot.cpp           # 你的插件源码
```

## 2. 注册插件

每个插件都要用注册宏声明自己的元数据（编码、名称、版本、作者、分类）：

```cpp
#include "plugin_sdk.hpp"   // 只用 SDK 头，别 include 框架内部头文件

// 插件被 @ 或私聊时的处理逻辑
extern "C" void bot_plugin_on_message(const BotMessageEvent* evt) {
    bot::Message m(evt);
    if (m.is_group() && !m.at_me()) return;   // 群里只在被 @ 时回复
    m.reply("你好，我是插件");
}

// 注册：编码 / 名称 / 版本 / 作者 / 分类
BOT_REGISTER_PLUGIN("mybot", "我的插件", "0.1.0", "你的名字", "tool")
```

`BOT_REGISTER_PLUGIN` 会展开出四个必需导出符号（`bot_plugin_abi_version` / `bot_plugin_meta` / `bot_plugin_init` / `bot_plugin_shutdown`），你不用自己写。想自定义优先级、订阅事件、拦截器、logo、配置项时改用 `BOT_REGISTER_PLUGIN_EX`，见 [插件元数据](/reference/meta)。

## 3. 编译成 .so

用一条 `g++` 命令把源码编成动态库）：

```bash
# -shared：产出动态库；-fPIC：位置无关代码；-std=c++17：C++17 标准
g++ -shared -fPIC -std=c++17 mybot.cpp -o mybot.so -I.
```

参数说明：`-I.` 指向 SDK 头文件所在目录；只要 `-o` 的文件名以 `.so` 结尾，上传时就会被识别（Windows 下产出 `.dll` 同样可以）。

## 4. 上传到控制台

进入管理后台的**插件上传**页，把 `.so`（或带 Web 面板的 `.zip`）拖进去：

- 上传时会**自动从动态库里读取元数据**（编码、名称、版本、作者、分类、logo、设置项），不需要你手填；
- **上传即热加载**，不需要重启服务；
- 上传成功的插件会出现在「插件市场」，可随时启停或隐藏。

## 5. 装到机器人

在**插件市场**里找到刚上传的插件，点「安装」，选择要安装到的机器人。安装后每台机器人可以**单独**设置：

| 设置项 | 说明 |
| --- | --- |
| 启用 / 停用 | 该机器人是否加载这个插件 |
| 优先级 | 数字越小越先收到事件（默认 1000） |
| Incoming / Outgoing / AfterSend 开关 | 该机器人是否启用这个插件的三层拦截器 |

上传后如果想改这些，进**机器人详情页 → 插件 Tab → 配置**。

## 6. 在群里测试

把机器人拉进一个群（或在私聊里），发一条消息：

- 私聊：插件会回「你好，我是插件」；
- 群里：需要 **@ 机器人** 才会触发（这是 QQ 官方机器人的默认行为：未获授权「接收所有消息」时只能收到 @ 机器人的消息）。

没反应时，去**机器人详情页 → 日志 Tab** 看有没有插件相关日志，或对照 [调试与排错](/plugin-dev/debugging)。

::: warning ABI 版本必须匹配
插件的 ABI 版本由 SDK 头文件决定，框架按 `major` 一致、插件 `minor` 不高于框架 `minor` 的规则协商：**major 不一致直接拒绝加载，插件 minor 比框架新也拒绝加载**。所以你升级了 SDK 或框架后，可能需要重新编译插件。
:::

## 下一步

- [最小示例](/plugin-dev/minimal)：把框架自带的最短插件逐行讲清楚
- [目录结构与打包](/plugin-dev/structure)：插件包该长什么样、上传时哪些文件会被采用
- [ABI 与兼容规则](/plugin-dev/abi)：什么时候必须重新编译插件
