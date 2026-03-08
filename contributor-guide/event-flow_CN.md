# 事件流

[English](event-flow.md)

本页说明运行时中真正影响行为排查的事件流路径。

## 核心链路

高层来看，大致流程是：

1. OneBot 交付事件
2. 应用把它转换成内部框架结构
3. 可能先经过插件感知的处理流程
4. 事件总线再把事件发布给订阅者
5. WebSocket 客户端和其他消费者再收到结果

主要源码：
- `/src/core/app.py`
- `/src/core/event_bus.py`
- `/src/plugins/runtime/connector.py`
- `/src/ui/api.py`

## 入站 OneBot 事件

在启动过程中，`/src/core/app.py` 会接线 OneBot 事件处理器。

对入站事件，应用会发布内部事件总线事件，例如：

- `onebot.message`
- `onebot.notice`
- `onebot.request`
- `onebot.meta_event`

## 消息与通知的特殊处理

消息和通知并不总是直接一路放行。

在相关场景下，应用会先构造 `EventContext`，再通过插件运行时连接器把它送入插件感知处理流程。

这意味着插件可以：

- 检查事件
- 修改上下文
- 阻止默认行为继续

只有这一轮处理完成后，普通事件发布才会继续。

## 事件总线行为

`/src/core/event_bus.py` 提供了：

- 包含名称、负载、来源、时间戳和 ID 的事件对象
- 异步发布/订阅
- 队列化分发
- 历史记录
- 订阅者与队列统计

`/tests/unit/test_event_bus.py` 基本可以当作行为说明书来读。

## 插件运行时转发

连接器会订阅主要 OneBot 事件主题，并把它们转发给插件运行时进程。

这意味着插件即使不是普通进程内订阅者，也可以对这些入站事件作出反应。

## WebSocket 广播

当第一个 WebSocket 客户端连接时，`/src/ui/api.py` 中的 `WebSocketManager` 会开始订阅事件总线。

面向客户端的链路大致是：

- 事件总线收到 OneBot 事件
- `WebSocketManager` 整理负载
- 消息广播给 `/ws/messages` 客户端

## 为什么事件流问题容易看起来很绕

因为这里实际牵涉了多层：

- 协议输入
- 应用级上下文处理
- 拦截器逻辑
- 事件总线发布
- 插件运行时转发
- WebSocket/UI 展示

任意一层出问题，都可能伪装成别的层出了问题。分布式困惑，本质上还是困惑。

## 继续阅读

- [架构总览](architecture-overview_CN.md)
- [拦截器](../plugin-development/interceptors_CN.md)
- [实时消息与日志](../user-guide/realtime-and-logs_CN.md)
