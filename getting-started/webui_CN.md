# Web UI 说明

[English](webui.md)

本页说明当前仓库中的 Web UI 是如何构建、提供和开发的。

## 当前前端技术栈

当前实际使用的前端栈是：

- React 18
- TypeScript
- Vite
- Zustand 状态管理
- React Router 路由
- i18next 本地化

源码参考：
- `/webui/package.json`
- `/webui/vite.config.ts`

这一点很重要，因为仓库里仍有一些旧文案会提到 Next.js，但代码显然没有配合这种回忆。

## 源码与构建产物位置

前端源码位于：

- `/webui`

生产构建输出位于：

- `/src/ui/static`

这个输出目录在 `/webui/vite.config.ts` 中配置为：

```ts
build: {
  outDir: '../src/ui/static',
  emptyOutDir: true,
}
```

## 开发服务器

Vite 开发服务器运行在 `3000` 端口，并把 `/api` 请求代理到 `http://localhost:8000`。

`/webui/vite.config.ts` 中相关配置：

```ts
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

启动方式：

```bash
cd webui
npm install
npm run dev
```

## 生产环境如何提供页面

生产环境下，FastAPI 负责提供构建后的静态文件。

`/src/ui/api.py` 中的行为大致是：

- 非 API 路由由一个兜底路由处理
- 如果请求的静态文件存在，就直接返回该文件
- 否则返回 `index.html`，交给 SPA 路由处理
- 如果 `web_ui.enabled = false`，访问 Web UI 会返回 `403`
- 如果构建产物缺失，会返回一个后备 HTML 页面，提示你去构建前端

## 登录流程

后端提供的认证接口包括：

- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`

后端通过 `/src/security/auth.py` 使用 bearer token 和内存会话管理认证状态。

所以 Web UI 正常工作的前提至少有两个：

- 前端构建产物存在
- 后端认证接口工作正常

## 实时更新

后端提供了一个 WebSocket 接口：

- `/ws/messages`

`/src/ui/api.py` 中的 `WebSocketManager` 会订阅事件总线事件，例如：

- `onebot.message`
- `onebot.notice`
- `onebot.request`

并将这些事件推送给连接中的 WebSocket 客户端。

## 常见 Web UI 问题

### 问题：页面提示 WebUI 未构建

检查以下文件是否存在：

- `/src/ui/static/index.html`
- `/src/ui/static/assets/`

如果不存在，请在 `/webui` 下重新构建：

```bash
npm install
npm run build
```

### 问题：访问页面返回 403

检查配置：

```toml
[web_ui]
enabled = true
```

### 问题：改了前端源码，生产页面没变化

`/webui` 下的源码修改不会自动反映到 `/src/ui/static`。

需要重新执行：

```bash
cd webui
npm run build
```

## 建议继续阅读

- [首次启动](first-run_CN.md)
- [前端结构](../contributor-guide/frontend-structure_CN.md)
- [实时消息与日志](../user-guide/realtime-and-logs_CN.md)
