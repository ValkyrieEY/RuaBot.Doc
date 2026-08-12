# 配置项

> **你会学到**：如何给插件做一个可视化配置表单，让用户在后台填写参数。
>
> ::: tip C++ 框架（Xiaoyi_QQ_C）
> 本框架的配置 schema 是 **`BotPluginMeta.setting_schema_json`** 字段（JSON 字符串，即 `BOT_REGISTER_PLUGIN_EX` 宏传入的 schema），**没有 `setting.json` 文件**。插件在 `bot_plugin_init` 里用 `api->setting_get` 读取用户配置。
> :::

## 一个完整示例

```json
{
  "fields": [
    {
      "name": "trigger_keyword",
      "label": "触发关键词",
      "type": "text",
      "required": false,
      "default": "菜单",
      "placeholder": "输入触发关键词"
    },
    {
      "name": "max_count",
      "label": "最大数量",
      "type": "number",
      "default": 10
    },
    {
      "name": "mode",
      "label": "运行模式",
      "type": "select",
      "default": "default",
      "options": [
        {"label": "默认模式", "value": "default"},
        {"label": "简洁模式", "value": "simple"}
      ]
    },
    {
      "name": "admin_list",
      "label": "管理员列表",
      "type": "array",
      "default": [],
      "placeholder": "输入用户ID后回车"
    },
    {
      "name": "enabled",
      "label": "启用功能",
      "type": "switch",
      "default": "true"
    }
  ]
}
```

## 全部字段类型

VitePress 后台渲染器支持以下 **11 种**字段类型：

| type | 说明 | 控件 | default 示例 |
|------|------|------|-------------|
| `text` | 单行文本（默认） | 输入框 | `""` |
| `textarea` | 多行文本 | 文本域 | `""` |
| `number` | 数字 | 数字输入框 | `30` |
| `switch` | 开关 | 开关 | `"true"` / `"false"` |
| `select` | 下拉选择（需配 `options`） | 下拉框 | `"default"` |
| `password` | 密码（隐藏显示） | 密码框 | `""` |
| `array` | 字符串数组 | 标签输入（回车/逗号分隔） | `[]` |
| `file` | 单文件上传 | 文件选择 | — |
| `file_array` | 多文件上传 | 多文件选择 | — |
| `group` | 字段分组（容器） | 卡片，内嵌子字段 | — |
| `object_array` / `table` | 对象数组 | 可增删的多条记录，每条内嵌子字段 | `[]` |

::: tip object_array / table
需要让用户配置"一组结构化数据"时用，比如多套回复规则、多个关键词映射。它配合 `fields` 子字段使用，用户可以增删多条记录。
:::

## 字段公共属性

每个字段都支持这些属性：

| 属性 | 说明 |
|------|------|
| `name` | 字段标识（代码里用它取值） |
| `label` | 显示名称 |
| `type` | 字段类型 |
| `default` | 默认值 |
| `required` | 是否必填 |
| `placeholder` | 占位提示文本 |
| `extra` | 字段下方的补充说明文字 |
| `options` | `select` 类型的选项列表 `[{label, value}]` |
| `fields` | `group` / `object_array` / `table` 的子字段 |

## 嵌套结构：group 与 object_array

**`group`**——把几个字段归到一张卡片里：

```json
{
  "name": "advanced",
  "label": "高级设置",
  "type": "group",
  "fields": [
    {"name": "timeout", "label": "超时秒数", "type": "number", "default": 30},
    {"name": "retry", "label": "重试次数", "type": "number", "default": 3}
  ]
}
```

**`object_array`**——让用户配置多条结构化记录：

```json
{
  "name": "rules",
  "label": "回复规则",
  "type": "object_array",
  "default": [],
  "fields": [
    {"name": "keyword", "label": "关键词", "type": "text"},
    {"name": "reply", "label": "回复内容", "type": "textarea"}
  ]
}
```

用户在后台可以点"添加回复规则"，每条填一个关键词和回复，组成一个数组。

## 在插件里读取配置

用户填写的配置通过 `context.settings` 传入：

```python
async def handle_event(context):
    settings = context.settings or {}

    keyword = str(settings.get("trigger_keyword") or "菜单").strip()
    max_count = int(settings.get("max_count") or 10)
    enabled = str(settings.get("enabled")).lower() == "true"

    # array 类型读出来是列表
    admins = settings.get("admin_list") or []

    # object_array 读出来是字典列表
    rules = settings.get("rules") or []
    for rule in rules:
        if rule.get("keyword") in context.event.get("content", ""):
            await context.reply(rule.get("reply"))
            return
```

::: warning 类型注意
- `switch` 的值是字符串 `"true"` / `"false"`，读出来要手动转 bool。
- `number` 读出来可能是字符串或数字，用 `int()` / `float()` 包一层更稳妥。
- 配置有约 30 秒缓存，改完后台设置后最多延迟 30 秒生效。
:::

## 下一步

- 配置好了，开始处理事件 → [处理事件](./events)
- 看读取配置的完整上下文 → [上下文 Context](./context)
