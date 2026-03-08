# 测试

[English](testing.md)

本页总结仓库中最重要的测试，以及它们和架构的关系。

## 主要测试入口

根据项目指令，常用命令包括：

```bash
python -m pytest
python -m pytest tests/unit/test_event_bus.py
python -m pytest tests/integration/test_api.py
python -m pytest tests/test_interceptor_optimization.py
python -m pytest tests/integration
```

## 仓库中的关键测试

### 事件总线单元测试

文件：
- `/tests/unit/test_event_bus.py`

该文件覆盖了事件总线的核心语义，例如：

- 订阅与取消订阅
- 发布行为
- 异步订阅者处理
- 订阅者间的错误隔离
- 事件历史与队列相关行为

如果你修改了 `/src/core/event_bus.py`，建议先读这个测试文件。

## API 集成测试

文件：
- `/tests/integration/test_api.py`

该文件验证了一些代表性 API 行为，例如：

- 健康检查接口
- 登录成功与失败
- 受保护接口的访问行为
- 系统状态和配置接口响应

如果你在修改认证流程、系统 API 或启动阶段接线逻辑，这个文件尤其重要。

## 拦截器优化测试

文件：
- `/tests/test_interceptor_optimization.py`

该文件覆盖：

- serial/parallel/hybrid 三种执行模式
- 断路器语义
- 优先级顺序
- 超时相关行为
- 面向性能的预期

如果你改了拦截器、事件上下文时序或插件消息路由，这个文件就很关键。

## 贡献者如何高效使用测试

一个比较好的习惯是：

1. 先确定你改的是哪个子系统
2. 先跑最相关的窄测试文件
3. 再跑更宽的 pytest 范围

例如：

- 改事件总线内部实现 -> 先跑 `tests/unit/test_event_bus.py`
- 改认证或 API 启动行为 -> 先跑 `tests/integration/test_api.py`
- 改拦截器逻辑 -> 先跑 `tests/test_interceptor_optimization.py`

## 一个现实提醒

当前测试很有价值，但它们并没有覆盖 `/src/ui/api.py` 那个巨大 API 面的全部内容。

所以当你修改大型管理接口时，最好同时依赖测试和仔细的源码审查。

## 继续阅读

- [后端结构](backend-structure_CN.md)
- [事件流](event-flow_CN.md)
- [故障排查](../user-guide/troubleshooting_CN.md)
