# 快速开始

[English](quickstart.md)

本页帮助你尽快从零搭出一个像样的插件骨架。

## 先建立最小心智模型

在 XQNEXT 中，一个插件通常意味着：

- 位于 `/plugins` 下的一个目录
- 一个 `plugin.json` 清单文件
- 由独立插件运行时进程加载的 Python 代码
- 通常提供 `create_plugin(api, config)` 入口

运行时加载行为实现于：

- `/src/plugins/runtime/main.py`

## 基本目录结构

一个典型插件目录大致如下：

```text
plugins/
  my_plugin/
    plugin.json
    main.py
    requirements.txt   # 可选
```

## 最小 manifest 示例

一个简单的 `plugin.json` 可以写成：

```json
{
  "name": "my_plugin",
  "version": "1.0.0",
  "author": "your_name",
  "entry": "main.py",
  "description": "Example plugin",
  "default_config": {
    "enabled_reply": true
  },
  "config_schema": {
    "enabled_reply": {
      "type": "boolean",
      "default": true,
      "description": "Whether the plugin should reply"
    }
  }
}
```

当前仓库中的 manifest 字段并不完全统一，但 `name`、`author`、`version` 以及配置相关字段都很常见。

## 最小 Python 入口

可以按 `/src/plugins/runtime/main.py` 期待的模式来写一个基础插件：

```python
class MyPlugin:
    def __init__(self, api, config):
        self.api = api
        self.config = config

    async def on_load(self):
        pass

    async def on_unload(self):
        pass


def create_plugin(api, config):
    return MyPlugin(api, config)
```

运行时会读取插件元数据、合并配置、导入入口模块，并调用 `create_plugin(api, config)`。

## 配置合并行为

运行时加载时会合并：

- `plugin.json` 中的 `default_config`
- 数据库中的配置覆盖值

因此，插件代码应该把传入的 `config` 当作最终有效配置，而不是自己再去读一遍 `plugin.json`。

## 如何声明依赖

如果插件依赖第三方 Python 包，可以写在：

- `plugin.json` 的 `dependencies`
- `requirements.txt`

连接器在安装插件时会尝试安装这些依赖。

## 先参考现有示例再发明新规范

建议先看看当前仓库里的 manifest 示例：

- `/plugins/like_plugin/plugin.json`
- `/plugins/github_issues_capture/plugin.json`

这些文件展示的，才是这个代码库今天真正使用的风格。

## 接下来建议阅读

- [插件清单与目录结构](plugin-manifest-and-layout_CN.md)
- [插件 API](plugin-api_CN.md)
- [运行时架构](runtime-architecture_CN.md)
