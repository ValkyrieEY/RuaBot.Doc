# 前端结构

[English](frontend-structure.md)

本页说明仓库中当前真实存在的前端结构。

## 技术栈概览

当前前端使用：

- React 18
- TypeScript
- Vite
- Zustand
- React Router
- i18next

源码参考：
- `/webui/package.json`
- `/webui/vite.config.ts`

## 入口文件

主要前端入口为：

- `/webui/src/main.tsx`
- `/webui/src/App.tsx`

## 项目指令中特别点名的结构

几个重要前端区域包括：

- `/webui/src/store/`：Zustand 状态存储
- `/webui/src/utils/api.ts`：API 调用封装
- `/webui/src/pages/`：页面与路由
- `/webui/src/i18n/`：本地化资源
- `/webui/src/hooks/useWebSocket.ts`：实时更新支持

## 开发服务器与 API 集成

根据 `/webui/vite.config.ts`：

- 开发服务器端口：`3000`
- `/api` 代理目标：`http://localhost:8000`
- 别名 `@` -> `./src`

这个配置让前端开发时可以直接对接后端，而不必手动处理一堆跨域问题。

## 构建输出与后端提供方式

生产构建输出目录是：

- `/src/ui/static`

这些静态文件由 `/src/ui/api.py` 提供给浏览器。

如果构建产物不存在，后端不会假装一切正常，而是返回一个提示你去构建前端的页面。

## 给贡献者的提醒

如果你在做会影响生产行为的前端改动，请记住：

1. 在 `/webui` 中修改源码
2. 执行 `npm run build`
3. 确认输出已写入 `/src/ui/static`

如果少了第 2 步，生产效果通常会非常稳定地保持原样。

## 继续阅读

- [Web UI 说明](../getting-started/webui_CN.md)
- [API 总览](../reference/api-surface-overview_CN.md)
- [测试](testing_CN.md)
