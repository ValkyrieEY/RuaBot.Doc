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
    ""        /* setting_schema */
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

需要更多控制用 `BOT_REGISTER_PLUGIN_EX`：

```cpp
BOT_REGISTER_PLUGIN_EX("intercept", "拦截器", "0.2.0", "xbot", "demo",
                       500u,        // priority
                       0u,          // propagation: continue
                       BOT_EVT_MASK_MESSAGE,   // events_mask
                       0b111u);     // intercepts: in+out+after
```

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
