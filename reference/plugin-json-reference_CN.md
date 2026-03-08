# plugin.json 参考

[English](plugin-json-reference.md)

本页说明当前仓库中插件 manifest 常见字段的实际含义。

## 位置

插件清单文件通常位于：

- `/plugins/<plugin_name>/plugin.json`

示例：

- `/plugins/like_plugin/plugin.json`
- `/plugins/github_issues_capture/plugin.json`

## 常见字段

### name

插件名称。

示例：

```json
"name": "like_plugin"
```

### version

插件版本字符串。

示例：

```json
"version": "1.0.0"
```

### author

插件作者标识。

示例：

```json
"author": "XQNEXT"
```

### description

给人看的描述信息。

### entry

运行时导入的 Python 入口文件。

示例：

```json
"entry": "main.py"
```

即使某些插件可能依赖默认约定，显式声明 `entry` 仍然更清晰，而且当前仓库已经在这么做。

### category

可选的插件分类。

当前可见于：

- `/plugins/like_plugin/plugin.json`

### tags

可选标签列表。

示例：

```json
"tags": ["like", "qq", "profile"]
```

### dependencies

可选依赖声明，用于插件安装阶段。

当前支持的形式包括：

- 字符串，例如 `"package>=1.0"`
- 对象，例如：

```json
{
  "name": "requests",
  "version": ">=2.31.0",
  "required": true
}
```

安装器会在 `/src/plugins/runtime/connector.py` 中读取这些字段。

### default_config

插件默认配置对象。

示例来自 `plugins/like_plugin/plugin.json`：

```json
"default_config": {
  "bot_name": "机器人",
  "reminder": ""
}
```

### config_schema

用于后端和 Web UI 生成可编辑配置表单的 schema。

示例模式，来自 `plugins/like_plugin/plugin.json`：

```json
"config_schema": {
  "bot_name": {
    "type": "string",
    "default": "机器人",
    "description": "机器人名称"
  }
}
```

### priority

可选插件优先级。

但有个重要提醒：

- 数据库设置可能覆盖它
- 连接器初始化时会合并多个优先级来源

## 实际使用建议

如果你的插件要暴露给用户配置：

- 保持 `default_config` 与 `config_schema` 一致
- 再让它们与代码真正期待的配置结构一致

如果插件需要第三方包：

- 写入 `dependencies`
- 或提供 `requirements.txt`

如果你希望插件更容易被稳定加载：

- 请显式声明 `entry`

## 继续阅读

- [插件清单与目录结构](../plugin-development/plugin-manifest-and-layout_CN.md)
- [插件管理](../user-guide/plugin-management_CN.md)
