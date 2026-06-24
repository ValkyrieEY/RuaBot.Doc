# meta.yaml 元数据

> **你会学到**：`meta.yaml` 的全部字段、哪些必填、各字段的作用。

`meta.yaml` 是插件的"身份证"，声明插件的基本信息和行为。**必需文件**，缺了插件无法识别。

## 字段总览

```yaml
# ─── 必需字段 ───
code: my_plugin               # 唯一标识码（英文小写+下划线）
name: 我的插件                  # 显示名称
version: 1.0.0                # 语义化版本号
author: 作者名                  # 作者
description: 插件功能描述        # 详细描述

# ─── 可选字段 ───
category: tool                # game / system / tool / fun / social / ai / other
entry: main.py                # 入口文件名（默认 main.py）

# ─── 事件订阅 ───
events:                       # 要接收的事件类型（XUBP 通用类型）
  - message.group
  - message.private

# ─── 系统字段（建议在控制台设置，而非手填） ───
price: 0                      # 价格（0=免费）
allow_purchase: false         # 是否允许购买
auto_start: false             # 随系统自动启动
auto_restart: true            # 进程崩溃后自动重启
hidden: false                 # 是否在市场隐藏
```

## 必需字段

| 字段 | 说明 | 示例 |
|------|------|------|
| `code` | 插件唯一标识，英文小写 + 下划线 | `video_analysis` |
| `name` | 显示给用户看的名称 | `聚合视频解析` |
| `version` | 语义化版本号，上传新版本时递增 | `3.0.5` |
| `author` | 作者名 | `枫林` |
| `description` | 功能描述，会显示在插件市场 | `支持抖音、快手、B站链接解析` |

::: warning code 一旦确定不要改
`code` 是插件的全局唯一标识，数据存储、购买记录、绑定关系都靠它关联。上传后改 `code` 会被当成全新插件，历史数据丢失。
:::

## 可选字段

| 字段 | 默认 | 说明 |
|------|------|------|
| `category` | `default` | 插件分类：`game` / `system` / `tool` / `fun` / `social` / `ai` / `other` |
| `entry` | `main.py` | 入口文件名，一般不用改 |

## 事件订阅（events）

列出插件要接收的 [XUBP 事件类型](../xubp/events)：

```yaml
events:
  - message.group        # 群消息（@机器人）
  - message.group_full   # 群全量消息（无需 @）
  - message.private      # 私聊消息
  - bot.group_join       # 被加入群
  - interaction          # 交互事件（按钮等）
```

- 只写需要的类型，不写的不会收到。
- 仅作拦截器（只实现 `handle_outgoing`）的插件，`events` 设为 `[]`。

## 系统字段（建议在控制台设置）

这几个字段控制插件的商业化和运行行为。**建议手填 `meta.yaml` 时留默认或省略，上架后在开发者中心 / 控制台里设置**，这样调整时不用重新上传代码。

| 字段 | 默认 | 说明 |
|------|------|------|
| `price` | `0` | 插件价格，`0` 表示免费 |
| `allow_purchase` | `false` | 是否允许在市场购买（默认不上架） |
| `auto_start` | `false` | 是否随系统启动而自动启动 |
| `auto_restart` | `true` | 进程崩溃后是否自动重启 |
| `hidden` | `false` | 是否在插件市场隐藏（内部插件用） |

::: tip 默认不上架
新上传的插件 `allow_purchase` 默认为 `false`，不会自动出现在市场。你需要确认没问题后，在控制台手动改为允许上架。
:::

## 完整示例

```yaml
code: checkin
name: 每日签到
version: 1.2.0
author: 枫林
category: tool
description: 每日签到打卡，连续签到有奖励
entry: main.py
events:
  - message.group
  - message.private
```

## 下一步

- 让用户能配置参数 → [配置项 setting.json](./settings)
- 开始写逻辑 → [处理事件](./events)
