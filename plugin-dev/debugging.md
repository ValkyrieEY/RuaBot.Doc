---
title: 调试与排错
description: 用日志和控制台定位插件问题：加载失败、不触发、面板异常、消息发不出去的症状、原因与处理方式。
---

# 调试与排错

插件的问题大多落在这三类：**装不上**（上传/加载失败）、**不干活**（回调不触发）、**干了没用**（面板 / 发消息失败）。这页按「症状 / 原因 / 处理方式」三段式给出逐个排查路径，日志原文直接照贴，方便你对着搜。

## 先用日志

插件里用 SDK 的流式日志打点，析构时自动交给框架；级别从低到高是 `trace` / `debug` / `info` / `warn` / `error`：

```cpp
bot::Logger::info()  << "[mybot] 收到消息 from=" << m.sender_id();
bot::Logger::error() << "[mybot] 调用失败 rc=" << rc;
```

日志**在机器人详情页的「日志」Tab 看**，不需要登服务器。排查顺序建议：先看日志 Tab，再看插件是否出现在机器人详情页的插件 Tab 里（绑定状态），最后才怀疑代码。

## 用能力探针验证能力码

拿不准某个能力码在这台机器人上到底支不支持，用框架自带的探针插件最快：装上 `cap_probe`，在群里发

```text
/cap xubp.group.members.get
/cap xubp.message.recall {"message_id":"xxx"}
```

它会自动注入当前群的 openid 并回复原始结果：支持则回平台原始 JSON，不支持回 `[cap] 平台不支持/未实现: <能力码>`，调用失败回 `[cap] 调用失败 rc=<错误码>`。跑一圈比读文档更直接。

## ① 上传报「无法读取插件元数据」

### 症状

```text
无法从 .so 读取插件元数据（缺 bot_plugin_meta）
```

### 原因

- 源码里**没有用注册宏**，也没有手写导出 `bot_plugin_meta`；
- 手写了但**忘了 `extern "C"`**，C++ 名字修饰后框架按原名找不到符号；
- 产物不是动态库（比如误编成了可执行文件）；
- 平台不匹配（在 Windows 上编的库拿到 Linux 服务器上传，加载失败自然读不到元数据）。

### 处理方式

先看动态库里有没有导出符号（Linux 下）：

```bash
nm -D mybot.so | grep bot_plugin
# 期望至少看到：bot_plugin_abi_version / bot_plugin_meta / bot_plugin_init / bot_plugin_shutdown
```

没有符号就回到源码，确认使用注册宏、并且在正确的平台上编译：

```bash
g++ -shared -fPIC -std=c++17 mybot.cpp -o mybot.so -I./include
```

## ② 加载报 ABI 不兼容

### 症状

```text
plugins/mybot/mybot.so: ABI 不兼容——插件 v2.0 要求 major=2，但框架为 1.5 (major=1)；需用与框架同版本的 SDK 重新编译插件
plugins/mybot/mybot.so: 插件 v1.6 需要更新的宿主 API，但框架为 1.5；请升级框架或改用 v1.5 SDK 编译
```

### 原因

插件声明的 ABI 版本与框架不匹配：第一条是 major 不一致，第二条是插件 minor 比框架新。

### 处理方式

用自己的发行版 SDK 重编插件，或升级框架到不低于插件 minor 的版本。规则与版本对照见 [ABI 与兼容规则](/plugin-dev/abi)。

## ③ 插件不触发

### 症状

上传成功、也装到了机器人，但发消息完全没有反应。日志里可能看到：

```text
plugin 'mybot' 已上架但未安装到任何机器人，跳过加载
```

或加载成功但没收到回调：

```text
plugin loaded: echo v0.1.0 [ABI 1.5] 绑定 1 台 (msg=0x7f..., in=(nil), out=(nil), after=(nil))
```

### 原因

按概率排序，四种都常见：**没装到机器人**（上传只代表「上架」，还要在目标机器人上点「安装」，被停用也不加载）；**事件没订阅**（`events_mask` 里没有你要的事件位，基础宏默认只订阅群 + 私聊消息）；**群里没 @ 机器人**（QQ 官方在群里默认只推 @ 它的消息）；**被前面插件的拦截器挡住**（入站拦截返回非 0 = 停止传播）。

### 处理方式

1. 机器人详情页 → 插件 Tab，确认插件是「已安装 + 已启用」，并核对注册宏里的 `events_mask`（见 [处理事件](/plugin-dev/events)）；
2. 群聊场景**先 @ 机器人再发**：能触发说明只是全量授权（群主在开放平台授权「接收所有消息」）没开；
3. 在机器人详情页的「运行参数」里调小本插件的优先级，或排查同机器人上的拦截器插件（见 [拦截器](/plugin-dev/interceptors)）。

## ④ 面板能打开但动作全部失败

### 症状

面板页面能显示，但每个请求都返回错误 JSON：

```json
{"error":"unauthorized"}
{"error":"plugin_not_bound"}
{"error":"web_route_unavailable"}
{"error":"reserved"}
```

### 原因

| 响应 | 原因 |
| --- | --- |
| `unauthorized` | token 缺失或已过期（面板 token 有效期 900 秒，过期后要续期） |
| `plugin_not_bound` | 插件没有安装到这台机器人，或绑定已被停用 |
| `web_route_unavailable` | 插件没有导出 `bot_plugin_web_route`，只有静态面板 |
| `reserved` | 你的动作名**以下划线开头**，撞上了框架保留路径 |

### 处理方式

- token 过期：用 `panel/api/__refresh` 静默续期（带当前有效 token），或提示用户重新打开面板；
- 确认插件在插件市场已「安装」到该机器人且处于启用状态；
- 需要动态数据就导出 `bot_plugin_web_route`；动作名改成字母开头（`config`、`stats`），`__` 前缀留给框架。

## ⑤ 面板空白或显示坏 JSON

### 症状

面板打开是白屏；或者偶尔能显示、偶尔拿到一段被截断/乱码的 JSON；浏览器控制台报 CSP 违规：

```text
Refused to load the script 'https://cdn.example.com/x.js' because it violates the
following Content Security Policy directive: "script-src 'self' 'unsafe-inline'".
```

### 原因

1. **响应缓冲悬垂**：`out->body` 指向了 `bot_plugin_web_route` 里的**函数局部 `std::string`**——框架是在回调返回**之后**才拷贝这段内存的，局部变量已析构，于是面板收到坏 JSON 或空白；
2. **CSP 拦了外站脚本**：面板入口带严格 CSP，只允许自托管脚本；
3. 面板文件超过 8 MB 被拒（返回 413 `too_large`）。

### 处理方式

把响应缓冲改成静态缓冲，这是唯一正确的写法：

```cpp
extern "C" int32_t bot_plugin_web_route(const BotWebRequest* req, BotWebResponse* out) {
    static std::string s;          // 或 static thread_local std::string
    s.clear();
    // ... 按动作填 s ...
    out->body = s.data();          // 生命周期长于本次调用，框架返回后才拷贝
    out->body_len = s.size();
    return BOT_OK;
}
```

CSP 问题就把 JS/CSS 放进插件包的 `web/` 目录（可内联在 HTML 里），别引外站；文件超限就精简或改成从接口按需拉取。详见 [插件 Web 面板](/plugin-dev/webui)。

## ⑥ 主动消息发不出去

### 症状

`send_reply` 正常，但 `send_proactive` 没有任何效果，日志里出现：

```text
send: bot 3 已停用
send: no active session for bot 3
send: qq_official client 未就绪
```

### 原因

- **平台频控/额度**：主动推送没有绑定原消息，受平台主动消息额度限制，超出会失败或被静默丢弃；
- **目标或会话类型给错**：`target` 与 `chat_type` 不匹配（群消息要 `chat_type=1` + 群 id / group_openid）；
- **机器人没连接**：机器人被停用、连接断开（`no active session` / `client 未就绪`）；
- **资源不可访问或没权限**：富媒体由平台去拉取，外链必须公网可达；未获主动消息权限的机器人只能被动回复。

### 处理方式

1. 能用被动回复就**别用主动推送**——`send_reply` 绑定原消息，在 QQ 官方平台上 5 分钟内免主动频控（见 [发送消息](/plugin-dev/messages)）；
2. 核对 `target` 与 `chat_type`：群用 `1` + 群 id，私聊用 `0` + 用户 id；
3. 到机器人详情页确认机器人在线、已启用；
4. 富媒体先换成纯文本 `text` 段验证链路，再排查资源 URL 是否公网可达。

## 下一步

- [日志与运行状态](/console/bots)：在控制台定位机器人与插件状态
- [插件 Web 面板](/plugin-dev/webui)：面板的调用约定与两个坑
- [调用平台能力](/plugin-dev/capabilities)：先探测再调用的完整写法
