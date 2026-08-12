# 插件元数据 BotPluginMeta

> **你会学到**：插件的元数据怎么声明——本框架用 **C 结构体**（`bot_plugin.h` 里的 `BotPluginMeta`），没有 `meta.yaml`。
> 通常你不用手写结构体，直接用 `BOT_REGISTER_PLUGIN` 宏（见下方"快捷方式"）。

## 结构体定义

`BotPluginMeta`（`include/bot_plugin.h`）：

```c
typedef struct BotPluginMeta {
    const char* code;              /* 唯一标识码（英文小写+下划线）*/
    const char* name;              /* 显示名称 */
    const char* version;           /* 语义化版本号 */
    const char* author;            /* 作者 */
    const char* category;          /* game/system/tool/fun/social/ai/other */
    uint32_t    priority;          /* 优先级，越小越先（拦截器链用）*/
    uint8_t     propagation;       /* 传播策略：0=continue 1=stop */
    uint32_t    events_mask;       /* 订阅事件位集（位掩码）*/
    uint8_t     intercepts;        /* 拦截器位：bit0=in bit1=out bit2=after */
    const char* setting_schema_json; /* 配置项 schema（JSON，可空）*/
    const char* logo;              /* 插件 logo：网络 URL / 相对 .so 目录的本地路径 / 空串 */
} BotPluginMeta;
```

## 手动声明（等价于宏展开）

```c
static const BotPluginMeta _meta = {
    "intercept", "拦截器+指令演示", "0.1.0", "xbot", "demo",
    500u,     /* priority */
    0u,       /* propagation: continue */
    BOT_EVT_MASK_MESSAGE,   /* events_mask：订阅消息事件 */
    0b111u,   /* intercepts：in+out+after 三层都实现 */
    "",       /* setting_schema */
    ""        /* logo（可留空）*/
};
extern "C" const BotPluginMeta* bot_plugin_meta(void) { return &_meta; }
```

## 快捷方式：BOT_REGISTER_PLUGIN 宏（推荐）

`plugin_sdk.hpp` 提供宏，自动生成 `abi_version / meta / init / shutdown` 四个必需符号：

```cpp
#include "plugin_sdk.hpp"

BOT_REGISTER_PLUGIN("echo", "回声", "0.1.0", "xbot", "demo");
// 默认：priority=1000, propagation=continue, events_mask=消息事件, 无拦截器
```

需要更多控制用 `BOT_REGISTER_PLUGIN_EX`（末位 `LOGO`：网络 URL / 相对 .so 目录的本地路径 / `""`）：

```cpp
BOT_REGISTER_PLUGIN_EX("intercept", "拦截器", "0.2.0", "xbot", "demo",
                       500u,        // priority
                       0u,          // propagation: continue
                       BOT_EVT_MASK_MESSAGE,   // events_mask
                       0b111u,      // intercepts: in+out+after
                       "");         // logo（网络 URL 或本地路径）
```

## 插件 logo

管理端上传插件后，机器人详情页与插件市场会以**图片卡片/Logo 列**展示插件图标；无 logo 显示默认图标。三种来源（框架读取优先级：**内嵌二进制 > `logo` 字符串**）：

| 方式 | 做法 | 适用 |
|------|------|------|
| **网络 URL** | `logo` 填 `https://…` | 图标托管在 CDN/对象存储 |
| **本地文件** | `logo` 填相对 `.so` 所在目录的路径（如 `logo.png`）；上传时框架读取字节入库 | 图标和 `.so` 一起分发 |
| **内嵌二进制** | 用 `BOT_PLUGIN_LOGO_EMBED` 宏把字节随 `.so/.dll` 导出，无需外链 | 最推荐，单文件分发、离线可用 |

```cpp
#include "plugin_sdk.hpp"

// 内嵌一个 SVG 图标（字节随 .so/.dll 一起导出，框架自动读取）
static const char kLogo[] =
    "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>"
    "<rect width='64' height='64' rx='14' fill='#2d8cf0'/></svg>";
BOT_PLUGIN_LOGO_EMBED(kLogo, sizeof(kLogo) - 1)

BOT_REGISTER_PLUGIN("echo", "回声", "0.1.0", "xbot", "demo");
// 也可以把网络 URL 直接写进 LOGO 参数：
// BOT_REGISTER_PLUGIN_EX(..., "https://cdn.example.com/echo.png")
```

> `BOT_PLUGIN_LOGO_EMBED(DATA, SIZE)` 展开为两个可选导出符号 `bot_plugin_logo_data()` / `bot_plugin_logo_size()`，支持 PNG / ICO / JPG / GIF / SVG 原始字节。

## 字段说明

| 字段 | 默认 | 说明 |
|------|------|------|
| `code` | — | 全局唯一标识，**一旦确定不要改**（数据/绑定靠它关联） |
| `name` | — | 显示名 |
| `version` | — | 语义化版本，上传新版本递增 |
| `category` | `other` | `game/system/tool/fun/social/ai/other` |
| `priority` | `1000` | 越小越先（入站/出站拦截器链顺序） |
| `propagation` | `continue` | `0=continue`（后续插件继续处理）/ `1=stop`（独占） |
| `events_mask` | — | 声明插件关注的[事件类型](../xubp/events)位集，用 `BOT_EVT_BIT(type)` 组合；`BOT_EVT_MASK_MESSAGE` = 群+私聊。**注意：当前版本分发时尚未按此位过滤**（所有事件都经 `bot_plugin_on_message` 投递，插件自行用 `evt->type` 判断），此字段为将来按位过滤预留 |
| `intercepts` | `0` | 实现哪些拦截器：bit0=incoming / bit1=outgoing / bit2=after_send |
| `setting_schema_json` | `""` | 配置项 schema（JSON 数组，见 [配置项](./settings)），可空 |
| `logo` | `""` | 插件 logo 字符串（网络 URL / 本地路径）；内嵌二进制见上方 `BOT_PLUGIN_LOGO_EMBED` |

## 事件订阅（events_mask）

用位掩码声明插件关注的 [XUBP 事件](../xubp/events)：

```c
// 关注 群消息 + 私聊 + 互动（按钮）
BOT_REGISTER_PLUGIN_EX("x", "X插件", "1.0.0", "me", "tool",
                       1000u, 0u,
                       BOT_EVT_BIT(BOT_EVT_MESSAGE_GROUP) |
                       BOT_EVT_BIT(BOT_EVT_MESSAGE_PRIVATE) |
                       BOT_EVT_BIT(BOT_EVT_INTERACTION),
                       0u);
```

- 事件统一经 `bot_plugin_on_message(evt)` 投递，插件用 `evt->type` 区分：
  ```cpp
  extern "C" void bot_plugin_on_message(const BotMessageEvent* evt) {
      if (evt->type == BOT_EVT_MESSAGE_GROUP) { /* 群消息 */ }
      else if (evt->type == BOT_EVT_INTERACTION) { /* 按钮互动 */ }
  }
  ```
- `events_mask` 当前不阻断投递（见上表说明），建议始终写 `BOT_EVT_MASK_MESSAGE`。

## 完整示例（intercept 插件）

见 `plugins/intercept/intercept.cpp`：手写导出 + `init` 里 `register_command` + 三层拦截器 + `has_capability` 能力发现。

## 下一步

- 让用户能配置参数 → [配置项 setting.json](./settings) / `setting_schema_json`
- C++ SDK 全部接口 → [C++ SDK 参考](./cpp-sdk)
- 开始写逻辑 → [处理事件](./events)
