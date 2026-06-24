# 快速开始

> **你会学到**：插件长什么样、怎么写一个最简插件、怎么让它跑起来。

## 插件是什么

插件是 V3 里提供某项功能的**可安装模块**——签到、积分商城、视频解析、AI 对话……都做成插件。客户在插件市场浏览、购买、安装，然后绑定到自己的机器人上即可使用。

插件基于 [XUBP 协议](../xubp/overview) 开发，**一份代码在所有平台通用**。

## 插件目录结构

一个插件就是一个文件夹，至少包含两个文件：

```
plugins/your_plugin/
├── meta.yaml        # 插件元数据（必需）
├── main.py          # 插件入口，定义钩子函数（必需）
├── setting.json     # 可视化配置项定义（可选）
└── webui/           # 管理界面（可选）
    └── dist/
        └── index.html   # 自包含 HTML（内联 CSS/JS）
```

| 文件 | 必需 | 作用 |
|------|------|------|
| `meta.yaml` | ✅ | 声明插件的代码、名称、版本、订阅的事件等 |
| `main.py` | ✅ | 写处理逻辑，定义钩子函数 |
| `setting.json` | ❌ | 定义用户在后台填写的配置表单 |
| `webui/dist/index.html` | ❌ | 插件自带的管理界面 |

## 最简插件：收到"你好"就回复

**`meta.yaml`**：

```yaml
code: hello
name: 你好插件
version: 1.0.0
author: 你的名字
description: 收到"你好"就回复
events:
  - message.group
  - message.private
```

**`main.py`**：

```python
async def handle_event(context):
    if context.event.get("content") == "你好":
        await context.reply("你好！我是机器人~")
```

就这么多。框架会自动发现 `handle_event`，在收到群消息或私聊消息时调用它，把回复发回去。

## 环境准备

开发插件只需要一个文本编辑器，**不需要本地跑起整个 V3**。开发流程：

1. 按上面的结构建好插件文件夹。
2. 写好 `meta.yaml` 和 `main.py`。
3. 把文件夹打包成 zip（或直接上传文件夹）。
4. 在 V3 后台 / 开发者中心上传插件。
5. 安装到测试机器人上，发消息验证。

::: tip 本地调试技巧
`main.py` 里的钩子函数可以是普通 `def` 或 `async def`，框架自动适配。本地想验证逻辑时，可以把 `context` 用一个 mock 字典模拟，跑通核心逻辑再上传。
:::

## 钩子函数一览

插件通过定义特定名称的函数来响应事件，框架自动识别并调用：

| 钩子 | 触发时机 |
|------|---------|
| `handle_event(context)` | 收到订阅的事件 |
| `handle_outgoing(context)` | 消息即将发出前（拦截器用） |
| `handle_after_send(context)` | 消息成功发出后 |
| `handle_webui(context, action, payload)` | 插件 WebUI 前端请求 |
| `on_start(info)` | 插件进程启动 |
| `on_stop(info)` | 插件进程停止 |

最常用的是 `handle_event`。其余按需实现，不写就不触发。

## 下一步

- 声明插件信息 → [meta.yaml 元数据](./meta)
- 让用户能配置 → [配置项 setting.json](./settings)
- 写处理逻辑 → [处理事件](./events)
- 看全部可用接口 → [上下文 Context](./context)
