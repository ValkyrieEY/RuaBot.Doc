# Xiaoyi_QQ_V4 文档站

Xiaoyi_QQ_V4 的官方文档，基于 [VitePress](https://vitepress.dev) 构建，发布到 GitHub Pages。

> 本文件不进站点构建产物（见 `.vitepress/config.ts` 里的 `srcExclude`），只用于仓库说明。

## 本地开发

```bash
npm install
npm run dev        # 本地预览，默认 http://localhost:5173
```

## 构建与发布

```bash
npm run build      # 产物在 .vitepress/dist/
npm run preview    # 本地预览构建产物
```

推送到 `main` 分支后，`.github/workflows/docs-deploy.yml` 会自动构建并发布到 `gh-pages` 分支。

线上地址：`https://valkyrieey.github.io/RuaBot.Doc/`
（`base` 与仓库名绑定，改仓库名时记得同步 `.vitepress/config.ts` 里的 `base`。）

## 目录结构

```
guide/          产品介绍、特性、系统要求、名词表
deploy/         安装、首次配置、反向代理、升级、备份运维
platforms/      机器人接入：QQ 官方（网关/回调）、OneBot 11、回调与域名
console/        控制台使用：总览、机器人、插件、订阅、开放 API
plugin-dev/     插件开发：入门、写插件、发布
reference/      参考：事件类型、能力码、Host API、插件元数据、配置项
faq.md          常见问题
_authoring/     写作规范与素材（不进构建产物）
public/         静态资源（logo 等）
```

## 写作规范

改文档前先看 [`_authoring/STYLE.md`](_authoring/STYLE.md)：品牌名、语气、frontmatter 格式、站内链接白名单，以及**不允许写进对外文档的内容**（授权机制、密钥、数据库结构等）。

## 新增页面

1. 在对应目录下新建 `.md`；
2. 写 frontmatter 的 `title` 与 `description`，正文第一行是 `# H1`；
3. 到 `.vitepress/config.ts` 的 `sidebar` 里挂上入口，**否则页面不会出现在导航里**（只能靠直链访问）；
4. 文末补 `## 下一步`，链接到相关的 2–3 个页面。
