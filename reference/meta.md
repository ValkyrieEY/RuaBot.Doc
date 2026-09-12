---
title: 插件元数据
description: BotPluginMeta 逐字段说明、events_mask 与 intercepts 位含义、三个注册宏的参数，以及完整的注册示例。
---

# 插件元数据

插件的「身份证」是 `BotPluginMeta`：框架在加载时读它，决定这个插件叫什么、排在哪、订阅什么、能不能拦截消息、有没有面板。用注册宏时可以完全不用手写结构体，但参数含义必须搞清楚。

## BotPluginMeta 结构

```c
typedef struct {
    const char* code;
    const char* name;
    const char* version;
    const char* author;
    const char* category;
    uint32_t    priority;        /* 越小越先 */
    uint8_t     propagation;     /* 0=continue 1=stop */
    uint32_t    events_mask;     /* 订阅事件位集 */
    uint8_t     intercepts;      /* bit0=in bit1=out bit2=after */
    const char* setting_schema_json;
    const char* logo;
    /* ---- Web 面板（ABI 1.3 尾加）---- */
    const char* web_entry;
    const char* web_title;
} BotPluginMeta;
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `code` | `const char*` | **插件唯一编码**，全站不重复；决定安装目录名与面板地址里的标识 |
| `name` | `const char*` | 展示名称（插件市场、机器人详情页） |
| `version` | `const char*` | 版本号字符串，如 `"1.0.0"`；仅展示与识别用 |
| `author` | `const char*` | 作者名 |
| `category` | `const char*` | 分类标签，取值见 [目录结构与打包](/plugin-dev/structure)；不在规范集合内会归到 `other` |
| `priority` | `uint32_t` | 优先级，**数字越小越先**处理；默认 `1000`。每台机器人可在控制台单独覆盖 |
| `propagation` | `uint8_t` | 传播策略：`0` = continue（继续给后面的插件），`1` = stop（本插件处理完即中断派发） |
| `events_mask` | `uint32_t` | 订阅的事件位集，见下一节 |
| `intercepts` | `uint8_t` | 拦截器开关位，见下一节 |
| `setting_schema_json` | `const char*` | 配置项 schema（JSON 数组字符串），控制台据此渲染表单 |
| `logo` | `const char*` | logo 字符串：网络 URL 或相对 `.so` 目录的文件路径；空串表示无 |
| `web_entry` | `const char*` | 面板入口文件名（如 `"index.html"`）；空或 `NULL` 表示无面板。**ABI 1.3** |
| `web_title` | `const char*` | 面板抽屉标题；空或 `NULL` 回退用 `name`。**ABI 1.3** |

::: warning 后两个字段是尾加的
`web_entry` / `web_title` 是 ABI 1.3 追加到结构体尾部的字段。用更早的 SDK 编译时，插件声明的结构体尺寸更小，框架**不会去读这两个字段**——面板自然也不会出现。写面板必须用 1.3 及以上的 SDK。
:::

## events_mask 位含义

`events_mask` 是位集：第 N 位对应事件枚举值 N（`BOT_EVT_BIT(x) = 1u << (x)`）。

| 位 | 枚举 | 含义 |
| --- | --- | --- |
| 1 | `BOT_EVT_MESSAGE_GROUP` | 群消息 |
| 2 | `BOT_EVT_MESSAGE_PRIVATE` | 私聊消息 |
| 3 | `BOT_EVT_MESSAGE_GUILD` | 频道消息 |
| 4 | `BOT_EVT_MESSAGE_GUILD_AT` | 频道 @ 消息 |
| 5 | `BOT_EVT_BOT_GROUP_JOIN` | 机器人入群 |
| 6 | `BOT_EVT_BOT_GROUP_LEAVE` | 机器人退群 |
| 7 | `BOT_EVT_BOT_FRIEND_ADD` | 好友添加 |
| 8 | `BOT_EVT_BOT_FRIEND_REMOVE` | 好友删除 |
| 9 | `BOT_EVT_INTERACTION` | 交互 / 按钮事件 |
| 10 | `BOT_EVT_REACTION_ADD` | 表情反应添加 |
| 11 | `BOT_EVT_REACTION_REMOVE` | 表情反应移除 |
| 12 | `BOT_EVT_META_HEARTBEAT` | 心跳 |
| 13 | `BOT_EVT_META_LIFECYCLE` | 生命周期 |
| 14 | `BOT_EVT_GROUP_MEMBER_JOIN` | 群成员加入 |
| 15 | `BOT_EVT_GROUP_MEMBER_LEAVE` | 群成员退出 |
| 16 | `BOT_EVT_GROUP_JOIN_REQUEST` | 用户申请入群 |
| 17 | `BOT_EVT_GROUP_MSG_REJECT` | 群拒绝接收机器人消息 |
| 18 | `BOT_EVT_GROUP_MSG_RECEIVE` | 群恢复接收机器人消息 |
| 19 | `BOT_EVT_SUBSCRIBE_STATUS` | 单聊订阅状态变更 |

组合位集最常用的是便捷宏 `BOT_EVT_MASK_MESSAGE`（= 群消息 | 私聊消息），其余用 `BOT_EVT_BIT(BOT_EVT_XXX)` 按位或起来，例如 `BOT_EVT_BIT(BOT_EVT_MESSAGE_GROUP) | BOT_EVT_BIT(BOT_EVT_GROUP_JOIN_REQUEST)`。完整的事件类型说明见 [事件类型](/reference/events)。

## intercepts 位含义

| 位 | 值 | 对应回调 |
| --- | --- | --- |
| `bit0` | `0b001` | `bot_plugin_intercept_incoming`（入站，可改写、返回非 0 停止传播） |
| `bit1` | `0b010` | `bot_plugin_intercept_outgoing`（出站，返回非 0 阻断） |
| `bit2` | `0b100` | `bot_plugin_intercept_after_send`（发送回执） |

三个都开就写 `0b111u`。声明了不等于每台机器人都开启——实际开关是**每台机器人一份**的运行参数，详见 [拦截器](/plugin-dev/interceptors)。

## setting_schema 写法

`setting_schema_json` 是一个 JSON 数组，控制台按顺序渲染成表单：

| 键 | 必填 | 说明 |
| --- | --- | --- |
| `name` | 是 | 设置键名（与 `setting_get` 用的 key 一致） |
| `label` | 否 | 显示标签，缺省显示 `name` |
| `type` | 否 | 控件类型：`text`（默认）/ `password` / `select` / `switch` |
| `default` | 否 | 默认值（字符串） |
| `options` | `select` 时用 | 选项字符串数组 |

```json
[
  { "name": "greeting", "label": "欢迎语", "type": "text", "default": "你好" },
  { "name": "reply_on_private", "label": "私聊也回复", "type": "switch", "default": "true" },
  { "name": "mode", "label": "模式", "type": "select", "options": ["loose", "strict"], "default": "loose" }
]
```

## 三个注册宏

### BOT_REGISTER_PLUGIN

基础版，五个参数，其余取默认值（优先级 `1000`、继续传播、只订阅群 + 私聊消息、无拦截器、无 logo、无配置项）：

```cpp
BOT_REGISTER_PLUGIN(CODE, NAME, VERSION, AUTHOR, CATEGORY)
```

### BOT_REGISTER_PLUGIN_EX

完整版，十一个参数：

```cpp
BOT_REGISTER_PLUGIN_EX(CODE, NAME, VERSION, AUTHOR, CATEGORY,
                       PRIORITY, PROPAGATION, EVENTS_MASK, INTERCEPTS, LOGO, SETTING_SCHEMA)
```

| 参数 | 填什么 |
| --- | --- |
| `PRIORITY` | 整数，越小越先，常用 `500` / `1000` |
| `PROPAGATION` | `0u` 继续 / `1u` 停止后续派发 |
| `EVENTS_MASK` | 位集，如 `BOT_EVT_MASK_MESSAGE` 或 `BOT_EVT_BIT(...) \| BOT_EVT_BIT(...)` |
| `INTERCEPTS` | 位集，如 `0u`（无）或 `0b111u`（三个拦截器全开） |
| `LOGO` | `""` / 网络 URL / 相对 `.so` 目录的文件名 |
| `SETTING_SCHEMA` | schema JSON 字符串；没有配置项写 `""` |

### BOT_REGISTER_PLUGIN_WEB

在 `_EX` 基础上追加面板入口与标题，共十三个参数：

```cpp
BOT_REGISTER_PLUGIN_WEB(CODE, NAME, VERSION, AUTHOR, CATEGORY,
                        PRIORITY, PROPAGATION, EVENTS_MASK, INTERCEPTS, LOGO,
                        SETTING_SCHEMA, WEB_ENTRY, WEB_TITLE)
```

`WEB_ENTRY` 写 `"index.html"` 这类相对 `web/` 根的文件名；没有面板传 `""` 或 `NULL`。还要实现可选回调 `bot_plugin_web_route` 才能提供动态数据（只静态展示可以不实现）。

三个宏都会展开出四个必需符号（`bot_plugin_abi_version` / `bot_plugin_meta` / `bot_plugin_init` / `bot_plugin_shutdown`），事件回调与拦截器由你另行实现。

## BOT_PLUGIN_LOGO_EMBED

把 logo 字节随动态库一起导出，**优先级高于 `LOGO` 字符串**：

```cpp
// logo 原始字节（PNG/JPG/SVG/ICO 均可）
static const char kLogo[] =
    "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>"
    "<rect width='64' height='64' rx='14' fill='#2d8cf0'/></svg>";

BOT_PLUGIN_LOGO_EMBED(kLogo, sizeof(kLogo) - 1)   // 展开出 data / size 两个符号
```

必须**成对导出且 size > 0** 才生效。推荐正方形图（例如 128×128 或 256×256）。

## 完整注册示例（带面板）

框架示例插件 `panel_demo` 的注册行，声明了面板入口与两个配置项：

```cpp
BOT_REGISTER_PLUGIN_WEB("panel_demo", "面板演示", "1.0.0", "xbot", "demo",
                        1000u, 0u, BOT_EVT_MASK_MESSAGE, 0u, "",
                        "[{\"name\":\"greeting\",\"label\":\"欢迎语\",\"type\":\"text\",\"default\":\"你好\"},"
                        "{\"name\":\"reply_on_private\",\"label\":\"私聊也回复\",\"type\":\"switch\",\"default\":\"true\"}]",
                        "index.html", "面板演示")
```

对照参数：

| 参数 | 值 | 含义 |
| --- | --- | --- |
| `CODE` / `NAME` / `VERSION` / `AUTHOR` / `CATEGORY` | `panel_demo` / 面板演示 / 1.0.0 / xbot / demo | 标识信息（分类 `demo` 不在规范集合内，实际会归到 `other`） |
| `PRIORITY` | `1000u` | 默认优先级 |
| `PROPAGATION` | `0u` | 继续传播 |
| `EVENTS_MASK` | `BOT_EVT_MASK_MESSAGE` | 订阅群消息 + 私聊消息 |
| `INTERCEPTS` | `0u` | 不启用拦截器 |
| `LOGO` | `""` | 无字符串 logo |
| `SETTING_SCHEMA` | 两个配置项 | 欢迎语（文本）+ 私聊也回复（开关） |
| `WEB_ENTRY` | `"index.html"` | 面板入口在 `web/index.html` |
| `WEB_TITLE` | `"面板演示"` | 抽屉标题 |

## 下一步

- [插件 Web 面板](/plugin-dev/webui)：面板目录、后端路由与调用约定
- [Host API](/reference/host-api)：元数据里声明的能力对应哪些接口
- [生命周期回调](/plugin-dev/lifecycle)：注册宏展开出的符号什么时候被调用
