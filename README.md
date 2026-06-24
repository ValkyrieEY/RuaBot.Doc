# 小依 QQ V3 文档

小依 QQ V3 —— 多租户 QQ 机器人 SaaS 管理平台的官方文档站，基于 [VitePress](https://vitepress.dev) 构建。

## 本地预览

```bash
npm install
npm run dev      # http://localhost:5173
```

## 构建

```bash
npm run build    # 产物在 .vitepress/dist/
npm run preview  # 预览构建产物
```

## 部署

推送到 `main` 分支后，GitHub Actions（`.github/workflows/docs-deploy.yml`）会自动构建并发布到 `gh-pages` 分支，由 GitHub Pages 提供：

```
https://valkyrieey.github.io/RuaBot.Doc/
```

## 文档结构

| 目录 | 内容 | 受众 |
|------|------|------|
| `guide/` | 产品介绍、核心特性、架构、名词 | 所有人 |
| `deploy/` | 部署、安装、Nginx、授权、更新、运维 | 运营方 |
| `platforms/` | 支持的 IM 平台 | 所有人 |
| `xubp/` | XUBP 通用插件协议 | 开发者 |
| `plugin-dev/` | 插件开发完整指南 | 开发者 |
| `admin/` | 管理后台使用 | 运营方 |
| `console/` | 用户控制台使用 | 最终用户 |

> 闭源商业产品文档。请勿在文档中暴露平台内部实现（框架、数据库表、类名、加密等），仅记录面向用户/开发者的公开接口与使用方式。
