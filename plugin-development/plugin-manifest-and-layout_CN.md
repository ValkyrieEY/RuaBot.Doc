# 插件清单与目录结构

[English](plugin-manifest-and-layout.md)

本页说明当前插件系统实际期待的目录和清单结构。

## 插件必须放在哪里

插件目录应位于：

- `/plugins/<plugin_name>/`

插件目录通常应包含：

- `plugin.json`
- 插件入口模块，通常是 `main.py`
- 可选的 `requirements.txt`

## plugin.json 是核心文件

运行时和管理 UI 都依赖 `plugin.json`。

当前代码会用它来提供：

- 插件元数据
- 入口模块路径
- 默认配置
- 用于生成配置 UI 的 schema
- 依赖声明
- 可选优先级

相关运行时逻辑：
- `/src/plugins/runtime/main.py`
- `/src/plugins/runtime/connector.py`

## 当前插件中常见字段

从当前仓库里的 `plugin.json` 看，常见字段包括：

- `name`
- `version`
- `author`
- `description`
- `entry`
- `category`
- `tags`
- `dependencies`
- `default_config`
- `config_schema`

例如 `/plugins/github_issues_capture/plugin.json` 包含：

```json
{
  "name": "github_issues_capture",
  "version": "1.0.0",
  "author": "XQNEXT",
  "entry": "main.py",
  "dependencies": [
    {"name": "requests", "version": ">=2.31.0", "required": true},
    {"name": "pillow", "version": ">=10.3.0", "required": true}
  ]
}
```

而 `/plugins/like_plugin/plugin.json` 则体现了配置相关字段：

```json
{
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

## 推荐目录布局

一个较合理的插件目录可以长这样：

```text
plugins/
  my_plugin/
    plugin.json
    main.py
    requirements.txt
    assets/
    data/
```

但对加载器来说，真正基础且必要的是 `plugin.json` 和入口代码。

## 配置 UI 的含义

普通插件配置并不依赖自定义前端页面。

Web UI 会通过后端插件接口读取 `plugin.json` 里的 `config_schema`，并按 schema 生成配置表单。

因此，如果插件允许用户配置，请尽量保持以下三者一致：

- `default_config`
- `config_schema`
- 插件代码真正期待的配置结构

这会替你和后续维护者节省很多时间。

## 关于优先级

插件优先级可以在 `plugin.json` 中声明，但数据库设置可以覆盖它。

启用插件初始化时，连接器会优先使用数据库中的优先级，除非数据库里还只是默认值。

## 继续阅读

- [`plugin.json` 参考](../reference/plugin-json-reference_CN.md)
- [运行时架构](runtime-architecture_CN.md)
