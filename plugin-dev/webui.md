---
title: 插件 Web 面板
description: 让插件自带可视化面板：目录与元数据、后端路由、面板与前端的调用约定、保留路径与 CSP 限制，附最小读写配置示例。
---

# 插件 Web 面板

配置项多的插件，光靠控制台自动生成的表单不够用。**插件 Web 面板**让你用自己的 HTML/CSS/JS 画界面，数据由插件的后端路由提供，面板入口出现在机器人详情页的插件配置抽屉里。

## 什么时候需要面板

只要声明了 `setting_schema`，控制台就会自动渲染「功能参数」表单，**大多数插件不需要面板**。只有这几类场景才值得自己画界面：需要下拉/分组/联动校验、要展示实时数据（在线人数、队列、日志流）、要提供操作按钮（重载、清空、手动触发）。

这页讲清面板的目录约定、前后端接口，以及两个必须避开的坑（响应缓冲悬垂、CSP 拦外站脚本）。

## 目录与元数据

面板资源放在插件包的 `web/` 目录里（见 [目录结构与打包](/plugin-dev/structure)），并在注册宏里声明入口与标题：

```cpp
// 用 BOT_REGISTER_PLUGIN_WEB 声明面板：最后两个参数是 web_entry 与 web_title
BOT_REGISTER_PLUGIN_WEB("mybot", "我的插件", "1.0.0", "你的名字", "tool",
                        1000u, 0u, BOT_EVT_MASK_MESSAGE, 0u, "",
                        "[{\"name\":\"greeting\",\"label\":\"欢迎语\",\"type\":\"text\",\"default\":\"你好\"}]",
                        "index.html", "我的插件面板")
```

`WEB_ENTRY` 是相对 `web/` 根目录的入口文件名（通常 `"index.html"`，传空串或 `NULL` 表示没有面板）；`WEB_TITLE` 是面板抽屉标题（传 `NULL` 回退用插件名称）。面板在界面上**按机器人打开**：机器人详情页 → 插件 Tab → 打开面板抽屉。

## 后端路由 bot_plugin_web_route

面板里的动态请求由这个回调处理：

```cpp
int32_t bot_plugin_web_route(const BotWebRequest* req, BotWebResponse* out);   /* ABI 1.3，可选导出 */
```

请求结构（常用字段）：

| 字段 | 说明 |
| --- | --- |
| `method` | 大写方法名：`GET` / `POST` / `PUT` / `DELETE` / … |
| `sub_path` | `panel/api/` 之后的路径，空串表示根；例如请求 `/panel/api/config` 时是 `"config"` |
| `query` | 原始查询串（可空），如 `a=1&b=2` |
| `body` / `body_len` | 请求体（约定 JSON），可能为空 |
| `bot_id` | 该机器人的运行时句柄，可直接传给 `send_proactive` 等接口 |
| `bot_uuid` | 机器人的 UUID（面板地址里的那一段），`plugin_code` 是插件编码 |
| `user_id` | 拥有该机器人的用户 id（后端已鉴权） |

响应结构：

| 字段 | 说明 |
| --- | --- |
| `status` | HTTP 状态码；不设或设 0 → 200，可设 `404` / `500` 等 |
| `content_type` | 不设 → `application/json; charset=utf-8`；`body` / `body_len` 是响应体 |
| 返回值 | 返回 `BOT_OK`；返回非 0 时框架按 500 处理 |

回调被调用前，框架已把上下文切到「本插件 + 该机器人」，所以里面可以直接用 `bot::setting_get` / `setting_set`、`host->kv_*`、`capability_invoke`，**不需要传机器人 id**。

## 面板的调用约定

面板以 **iframe** 加载，地址形如：

```text
/api/bots/{uuid}/plugins/{code}/panel/{入口}?xbt=<token>
```

流程是：控制台先用管理登录态请求 `panel/__session` 换回一个**作用域 token**（TTL 900 秒），再用带 `?xbt=<token>` 的地址打开 iframe；面板 JS 把 token 放进 `Authorization: Bearer` 请求自己的后端动作。面板 JS 需要知道的四件事：

| 项 | 怎么拿 |
| --- | --- |
| `base` | 面板地址里 `/panel` 之前的全部路径：`location.pathname` 截到 `/panel` 为止 |
| `token` | 入口 URL 的 `?xbt=` 参数 |
| 动态请求 | `{base}/api/<动作>`，带头 `Authorization: Bearer <token>`（推荐 POST，也支持 GET/PUT/DELETE） |
| 预置数据 | 框架注入的 `window.XBOT_PANEL`，含 `code`、`bot`、`settings`（当前配置值）、`schema`（配置项定义） |

框架**保留**了三个 `__` 前缀的路径，插件不要占用：

| 保留路径 | 作用 |
| --- | --- |
| `__session` | 用管理登录态换面板作用域 token（返回 `token` / `ttl` / `entry` / `scope`） |
| `__refresh` | 用当前有效 token 静默续期，不重载 iframe |
| `__events` | 轮询收取插件推送的事件（`panel_push`），请求形如 `__events?after=<seq>` |

::: danger 插件自己的动作名不能用下划线开头
除框架保留路径外，**凡是以下划线开头的 `sub_path` 都会被框架直接回 404 `reserved`**。你的动作名请用字母开头，例如 `config`、`stats`、`reload`。
:::

## 最小可用的「读配置 + 存配置」

下面是一个完整可用的后端：`GET config` 读当前机器人的设置，`POST/PUT config` 写入设置。注意响应缓冲用的是**函数外的 static 缓冲**。

```cpp
#include "plugin_sdk.hpp"

#include <string>

// 极简 JSON 字符串取值（生产代码建议用正经 JSON 库）
static std::string pick_string(const std::string& b, const std::string& k) {
    auto p = b.find("\"" + k + "\"");
    if (p == std::string::npos) return {};
    p = b.find('"', b.find(':', p + k.size() + 2) + 1);          // 跳过冒号与空白后的引号
    if (p == std::string::npos) return {};
    auto e = b.find('"', p + 1);
    return (e == std::string::npos) ? std::string() : b.substr(p + 1, e - p - 1);
}

extern "C" int32_t bot_plugin_web_route(const BotWebRequest* req, BotWebResponse* out) {
    static std::string s;                       // 关键：缓冲必须比本次调用活得久
    s.clear();

    const std::string sub    = req->sub_path ? req->sub_path : "";
    const std::string method = req->method   ? req->method   : "";

    if (sub == "config" && method == "GET") {
        // 读当前机器人的设置（同样的值也被注入 window.XBOT_PANEL.settings）
        s = "{\"greeting\":\"" + bot::setting_get("greeting", "你好") + "\"}";
    } else if (sub == "config" && (method == "POST" || method == "PUT")) {
        std::string body = (req->body && req->body_len) ? std::string(req->body, req->body_len) : "";
        bot::setting_set("greeting", pick_string(body, "greeting"));   // 写回 per-bot 设置
        s = "{\"ok\":true}";
    } else {
        out->status = 404;                      // 未匹配的动作
        s = "{\"error\":\"no_such_route\"}";
    }

    out->content_type = "application/json; charset=utf-8";
    out->body         = s.data();               // 指向静态缓冲，框架在回调返回后才拷贝
    out->body_len     = s.size();
    return BOT_OK;
}
```

对应的面板入口 `web/index.html` 里，把请求打到 `./api/config` 即可：

```html
<!-- web/index.html 里的脚本部分：请求打到 ./api/config -->
<script>
  // 与框架的契约：base = /panel 之前的路径，token 来自 ?xbt=
  const path = location.pathname;
  const base = path.slice(0, path.lastIndexOf('/panel') + '/panel'.length);
  const tok  = new URLSearchParams(location.search).get('xbt') || '';

  async function call(api, opts = {}) {
    const r = await fetch(base + '/api/' + api, { ...opts, headers: {
      'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tok } });
    return { status: r.status, body: await r.json().catch(() => null) };
  }

  // 框架注入的 settings 可直接预填：window.XBOT_PANEL.settings.greeting
  document.getElementById('save').onclick = async () => {
    const g = document.getElementById('greeting').value;
    const r = await call('config', { method: 'POST', body: JSON.stringify({ greeting: g }) });
    document.getElementById('log').textContent = r.status + '\n' + JSON.stringify(r.body);
  };
</script>
```

## 两个必须避开的坑

::: danger 坑一：响应体指向了短命缓冲
框架是在 `bot_plugin_web_route` **返回之后**才去拷贝 `out->body` 的内存。所以：

- 正确：`static std::string`、`static thread_local std::string`、插件常驻对象的成员；
- 错误：函数局部 `std::string`（返回即析构，指针悬垂）。

用局部变量时不会报错，只会表现为**面板收到坏 JSON、页面空白或偶发乱码**，非常难查。框架对同一个插件的面板请求是串行处理的，`static` 缓冲在这个前提下安全。
:::

::: danger 坑二：CSP 拦掉了外站脚本
面板入口响应带一条严格的内容安全策略（CSP）：

```text
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'
```

含义是：**插件脚本必须自托管**——`<script src="https://cdn.example.com/x.js">` 之类的写法会被浏览器拦掉，控制台只报一句 CSP 违规。请把用到的 JS/CSS 一律放进插件包的 `web/` 目录里（可以内联在 HTML 中），图片可以用 `https:` 外链或 `data:` 内联。
:::

补充约定：

- 入口 HTML 需要带 `?xbt=` 才能打开（HTML 不缓存）；`web/` 下的**子资源**（JS/CSS/图片）不需要 token，且会被浏览器长期缓存，单个面板文件不能超过 8 MB；面板跑在 sandbox iframe 里（可执行脚本、可提交表单，但没有同源权限），**不能访问父页面**，只能通过 HTTP 接口与框架通信。

## 向面板推事件

插件可以在后端主动推一段 JSON 到面板（ABI 1.4）：

```cpp
// 推给「当前插件 + 当前机器人」已打开的面板；面板用 __events?after=<seq> 轮询收
bot::panel_push("{\"type\":\"config_saved\",\"at\":1730000000}");
```

事件带自增序号，面板轮询 `__events` 时会拿到 `{"seq":N,"events":[...]}`，适合「后端发生了变更，通知面板刷新」这类场景。

## 下一步

- [插件元数据](/reference/meta)：`BOT_REGISTER_PLUGIN_WEB` 的每个参数
- [Host API](/reference/host-api)：`panel_push` 与设置读写的完整签名
- [调试与排错](/plugin-dev/debugging)：面板打不开、空白、动作全部失败怎么查
