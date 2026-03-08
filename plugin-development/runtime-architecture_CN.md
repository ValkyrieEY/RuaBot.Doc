# 运行时架构

[English](runtime-architecture.md)

本页说明当前代码中插件运行时的真实执行方式。

## 总体设计

XQNEXT 将插件执行拆分到两个进程中：

1. 主应用进程
2. 独立插件运行时进程

两者之间的桥接实现位于：

- `/src/plugins/runtime/connector.py`
- `/src/plugins/runtime/main.py`

通信方式是通过 stdio 传递 JSON 消息。

## 连接器负责什么

`/src/plugins/runtime/connector.py` 中的 `PluginRuntimeConnector` 主要负责：

- 启动运行时子进程
- 跟踪进程状态
- 读取运行时输出
- 向运行时发送 JSON 消息
- 将事件总线事件转发给插件
- 从数据库初始化已启用插件
- 在插件安装时尝试安装依赖
- 协调事件上下文请求和拦截器请求

## 运行时进程如何启动

连接器会用当前 Python 解释器加上 `main.py` 来启动插件运行时。

此外，它还处理了 Windows + Python 3.13 兼容问题；如果 `asyncio.create_subprocess_exec` 不可用，甚至还有 `subprocess.Popen` 的后备实现。

这部分虽然不浪漫，但非常务实。

## 插件初始化流程

启动时，连接器会：

1. 从框架数据库中读取已启用插件设置
2. 根据数据库值、`plugin.json` 和默认值计算优先级
3. 向运行时发送 `init_plugins` 消息
4. 订阅 OneBot 相关事件总线主题

源码位置：
- `PluginRuntimeConnector.initialize()`
- `PluginRuntimeConnector._initialize_plugins()`

## 运行时进程负责什么

`/src/plugins/runtime/main.py` 中的运行时进程负责：

- 读取插件清单
- 导入插件入口模块
- 通过 `create_plugin(api, config)` 创建插件实例
- 调用 `on_load()`、`on_unload()` 等生命周期钩子
- 处理收到的事件
- 支持插件 API 请求和拦截相关逻辑

## 事件转发

连接器会订阅以下事件总线主题，并将其转发给插件运行时：

- `onebot.message`
- `onebot.notice`
- `onebot.request`
- `onebot.meta_event`

对应逻辑位于 `_subscribe_to_events()`。

## 事件上下文处理

为了支持更丰富的插件式消息处理，主应用可以调用：

- `emit_event_with_context()`

它会把结构化的 `EventContext` 发送给运行时，并等待响应。

根据 `/src/plugins/runtime/connector.py`，当前超时策略为：

- `message.before_send`：2 秒
- `message.received`：10 秒
- 其他上下文事件：30 秒
- 超时通常返回原始上下文，让主流程继续

这是一种很现实的权衡：与其为了等插件反应把整条消息链路卡死，不如先让系统继续工作。

## 拦截器桥接

连接器还提供了 `ProxyMessageInterceptor`，用于把拦截请求转发给运行时插件，并等待短时间响应。

如果超时或报错，拦截结果通常会回退为“放行”。

## 运行时健康机制

连接器内部还维护了：

- 心跳循环
- 待处理请求跟踪
- 过期 request/future 清理任务

这些机制的作用是尽量避免陈旧请求一直堆着不走。

## 建议继续阅读

- [插件 API](plugin-api_CN.md)
- [拦截器](interceptors_CN.md)
- [事件流](../contributor-guide/event-flow_CN.md)
