# 插件管理

[English](plugin-management.md)

本页说明运维和高级用户视角下，XQNEXT 的插件管理是如何工作的。

## 先记住一个重要事实

插件不是直接运行在主进程里的。

主进程通过以下文件管理一个独立插件运行时进程：

- `/src/plugins/runtime/connector.py`
- `/src/plugins/runtime/main.py`

这会影响插件安装、重载、异常排查和生命周期理解。

## 插件文件放在哪里

已安装插件目录位于：

- `/plugins`

每个插件都应包含一个 `plugin.json` 清单文件。

当前仓库中的示例包括：

- `/plugins/like_plugin/plugin.json`
- `/plugins/github_issues_capture/plugin.json`
- `/plugins/group_manager/plugin.json`

## 插件状态存在哪里

插件相关状态分布在两个地方：

1. 磁盘上的插件文件
2. 框架数据库中的插件设置

数据库中保存的内容至少包括：

- 启用/禁用状态
- 配置覆盖值
- 优先级
- 安装来源与安装信息

源码参考：
- `/src/core/database.py`

## 查看插件列表

主要接口是：

- `GET /api/plugins`

此外还有：

- `GET /api/plugins/{plugin_name}`
- `GET /api/plugins/{plugin_name}/config-schema`

这些接口都定义在 `/src/ui/api.py`。

## 启用、禁用、重载与其他动作

相关接口包括：

- `POST /api/plugins/{plugin_name}/action`
- `POST /api/plugins/reload-all`
- `DELETE /api/plugins/{plugin_name}`
- `PUT /api/plugins/{plugin_name}/config`

典型动作包括启用、禁用、加载、卸载和重载。

## 安装插件

安装相关接口包括：

- `POST /api/plugins/upload`
- `POST /api/plugins/install-from-github`
- `GET /api/plugins/install-progress/{task_id}`

`/src/plugins/runtime/connector.py` 中的安装逻辑支持：

- 本地目录
- 本地 zip 包
- URL 下载，包括 GitHub 风格 zip 压缩包

## 依赖安装行为

安装插件时，连接器会尝试从以下位置安装依赖：

- `plugin.json` 的 `dependencies`
- 插件目录下的 `requirements.txt`

这部分逻辑由 `/src/plugins/runtime/connector.py` 中的 `install_plugin_dependencies()` 实现。

需要注意的是：依赖安装失败通常会记录警告，但不一定会让整个插件安装硬失败。它对用户很友好，对排障者就未必了。

## 插件配置是怎么工作的

插件配置界面和接口很依赖 `plugin.json` 中的这两个字段：

- `default_config`
- `config_schema`

当前仓库中的一个示例：

```json
{
  "name": "like_plugin",
  "version": "1.0.0",
  "author": "XQNEXT",
  "default_config": {
    "bot_name": "机器人",
    "reminder": ""
  },
  "config_schema": {
    "bot_name": {
      "type": "string",
      "default": "机器人",
      "description": "机器人名称"
    }
  }
}
```

来源：
- `/plugins/like_plugin/plugin.json`

## 优先级是怎么决定的

插件优先级可能来自：

- 数据库中的插件设置
- `plugin.json`
- 默认值 `100`

`PluginRuntimeConnector._initialize_plugins()` 会合并这些来源，并优先使用数据库中的设置值。

## 卸载插件时会发生什么

按照连接器中的逻辑，卸载插件时可能会执行：

1. 从运行时中卸载插件
2. 删除插件目录
3. 删除插件存储数据
4. 删除数据库中的插件设置

这部分逻辑实现于：
- `/src/plugins/runtime/connector.py`

## 继续阅读

- [插件开发索引](../plugin-development/README_CN.md)
- [`plugin.json` 参考](../reference/plugin-json-reference_CN.md)
- [故障排查](troubleshooting_CN.md)
