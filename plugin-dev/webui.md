# 插件 WebUI

> **C++ 框架（Xiaoyi_QQ_C）注意**：当前版本**尚未实现插件 WebUI**（`BotHostApi` 无 webui 接口）。以下为 V3 的插件 WebUI 设计，供后续参考。
>
> > **你会学到**：怎么给插件做一个内嵌管理界面，让用户在后台可视化查看 / 操作插件数据。

## 什么是插件 WebUI

`setting.json` 只能配置静态参数。如果你的插件需要**动态展示数据**（比如签到排行榜、商城订单列表、统计图表），就做一个 **WebUI**——一个内嵌在机器人配置页里的网页。

## 目录结构

在插件目录下加一个自包含的 HTML：

```
plugins/your_plugin/
├── meta.yaml
├── main.py
└── webui/
    └── dist/
        └── index.html   # 自包含 HTML（CSS/JS 全部内联，无外部依赖）
```

::: warning 必须自包含
`index.html` 要把 CSS、JS 全部内联，不能引用外部文件或 CDN——因为页面是在后台内嵌渲染的，外部依赖可能加载失败。
:::

## 后端：handle_webui 钩子

在 `main.py` 里实现 `handle_webui`，处理前端发来的请求：

```python
async def handle_webui(context, action: str, payload: dict) -> dict:
    if action == "summary":
        # 返回统计数据
        records = await context.data_store.get("checkin", "records", {})
        return {"total": len(records), "today_active": 80}

    if action == "list":
        # 返回列表数据
        items = await context.data_store.get("my_plugin", "items", [])
        return {"items": items}

    if action == "add":
        # 写入数据
        items = await context.data_store.get("my_plugin", "items", [])
        items.append(payload)
        await context.data_store.set("my_plugin", "items", items)
        return {"success": True}

    raise ValueError(f"未知动作：{action}")
```

- `action`：前端传来的动作名，你自己定义。
- `payload`：前端传来的参数。
- **返回 `dict`**，框架序列化为 JSON 返回给前端。

## 前端：index.html

前端通过固定的 API 路径调用后端 `handle_webui`。URL 参数里带 `token`、`botId`、`pluginCode`：

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>我的插件</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    .stat { font-size: 24px; font-weight: bold; color: #3c8cff; }
  </style>
</head>
<body>
  <h2>签到统计</h2>
  <div>累计签到：<span id="total" class="stat">-</span> 人</div>
  <script>
    // 从 URL 取认证信息
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const botId = params.get('botId');
    const pluginCode = params.get('pluginCode');

    // 调用后端 handle_webui
    async function callApi(action, payload = {}) {
      const res = await fetch(
        `/api/console/bots/${botId}/plugins/${pluginCode}/webui-api/${action}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      return res.json();
    }

    // 加载统计
    callApi('summary').then(data => {
      document.getElementById('total').textContent = data.total;
    });
  </script>
</body>
</html>
```

## 调用约定

| 项 | 说明 |
|----|------|
| 请求方法 | `POST` |
| 路径 | `/api/console/bots/{botId}/plugins/{pluginCode}/webui-api/{action}` |
| 认证 | `Authorization: Bearer {token}`（token 从 URL 参数取） |
| 请求体 | JSON（对应 `payload`） |
| 响应体 | JSON（你 `handle_webui` 返回的 dict） |

`action` 就是你 `handle_webui` 里判断的字符串，前端和后端自己约定。

## 典型用法

| 场景 | action 示例 | 说明 |
|------|------------|------|
| 概览统计 | `summary` | 返回总数、今日数等 |
| 列表查询 | `list` | 分页返回数据列表 |
| 新增 | `add` | 写入一条记录 |
| 删除 | `delete` | 删一条记录 |
| 配置导出 | `export` | 导出数据 |

## 下一步

- WebUI 操作的数据用 data_store 存 → [数据存储](./data-store)
- 插件写好了怎么上架 → [发布与上架](./publish)
