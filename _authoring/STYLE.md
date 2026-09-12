# 写作规范（内部，不进构建产物）

本文件夹与本文档**不会出现在站点里**（`srcExclude` 已排除 `_authoring/**`）。所有页面统一按本规范写。

## 一、站点基本信息

- 站点标题 / 品牌名：**Xiaoyi_QQ_V4**（全站统一，**任何地方都不要再出现 V3、RuaBot、xiaoyi-v3-docs**）
- 语言：**只有中文**。不要写英文对照页。
- 框架：VitePress 1.6，`cleanUrls: true`，所有站内链接写**不带 `.md` 后缀**的绝对路径，例如 `/deploy/install`。
- 读者：**两类人**
  - 客户/运营：要能照着做（部署、接入机器人、装插件、排障）
  - 插件开发者：要能写出可上架的插件

## 二、语气与排版

| 项 | 规定 |
|---|---|
| 人称 | 统一用「你」。**不要混用「您」**。 |
| emoji | 克制。只在页面标题或少数小标题点缀（如 `# 安装 🌱`），正文不用。不要用 `😌` `🎉` 这类表情。 |
| 术语 | 首次出现用「中文（English）」格式，例如 `能力码（capability）`；文件名、字段名、命令、代码一律用反引号包起来。 |
| 标点 | 中文全角标点；代码与字段名内部用半角。 |
| 代码块 | 必须标语言（```bash / ```cpp / ```json / ```toml / ```text）。**块前用一句话说明这段代码干什么**，块内关键行加中文注释。 |
| 表格 | 字段说明、能力码、事件类型这类**必须用表格**。 |
| 提示框 | 用 VitePress 原生 `::: tip` / `::: warning` / `::: danger` / `::: details`（**不要**用 GitHub 那种 `> [!TIP]`，本站在 VitePress 1.6 上不保证渲染）。 |
| 步骤 | 一条线性流程用 `## 1. xxx` / `## 2. xxx` 这种把编号写进二级标题的写法（照 LangBot）。 |
| 排错 | 统一「症状 / 原因 / 处理方式」三段式小标题，**症状里直接贴日志原文**，命令区分 Linux 与 Windows。 |
| 图片 | 本次重写**不放图片**（手头没有可用截图）。需要图的位置用 `::: details 截图占位` 说明该截什么图，便于以后补。 |

## 三、每页必备结构

```markdown
---
title: 页面标题
description: 一句话说明这页讲什么（会进搜索索引与社交卡片）
---

# 页面标题

（开场 2–3 句：这页解决什么问题、读完你能做什么）

## 第一节
...

## 下一步

- [xxx](/path/to/xxx)
- [yyy](/path/to/yyy)
```

- **`title` 与 `# H1` 都要写**（VitePress 不会自动把 frontmatter 的 title 渲染成 H1，这点和 Mintlify 不同）。
- 文末**必须有「下一步」**小节，给 2–3 个相关页面的链接。
- 每页正文**控制在 80–200 行**。宁可拆页，不要写巨型单页。

## 四、站内链接白名单（只能链这些路径，不要自己造）

```
/                                      首页
/guide/what-is                         为什么是 Xiaoyi_QQ_V4
/guide/features                        核心特性
/guide/requirements                    系统要求
/guide/glossary                        名词表
/deploy/install                        安装
/deploy/config                         首次配置
/deploy/reverse-proxy                  反向代理与 HTTPS
/deploy/update                         在线更新
/deploy/ops                            备份与运维
/platforms/overview                    接入方式总览
/platforms/qq-official                 QQ 官方：WebSocket 网关
/platforms/qq-official-webhook         QQ 官方：Webhook 回调
/platforms/qq-onebot                   QQ OneBot 11
/platforms/callback                    回调地址与公网域名
/console/overview                      控制台总览
/console/bots                          我的机器人
/console/plugins                       插件市场与安装
/console/billing                       订阅 · 卡密 · 充值
/console/openapi                       开放 API
/plugin-dev/getting-started            快速开始
/plugin-dev/minimal                    最小示例
/plugin-dev/structure                  目录结构与打包
/plugin-dev/abi                        ABI 与兼容规则
/plugin-dev/lifecycle                  生命周期回调
/plugin-dev/events                     处理事件
/plugin-dev/messages                   发送消息
/plugin-dev/storage                    存储与配置
/plugin-dev/capabilities               调用平台能力
/plugin-dev/interceptors               拦截器
/plugin-dev/webui                      插件 Web 面板
/plugin-dev/publish                    云编译与上架
/plugin-dev/debugging                  调试与排错
/reference/events                      事件类型
/reference/capabilities                平台能力码
/reference/host-api                    Host API
/reference/meta                        插件元数据
/reference/config                      配置项
/faq                                   常见问题
```

## 五、绝对不要写的内容（安全红线）

写进文档会帮人破解或暴露内部实现，**任何一页都不许出现**：

1. **授权机制**：不许写校验流程、机器指纹怎么算、公钥/私钥、签名算法、签发工具。授权只允许写一句：「把服务商提供的授权文件放到程序同目录即可，到期或换机器请联系服务商重新签发。」
2. **密钥与会话**：不许写主密钥（`XBOT_MASTER_KEY`）、JWT 密钥、`XBOT_JWT_SECRET`、口令哈希算法与盐、加密算法与密文格式。
3. **管理员提权路径**：不许写超管判定、改角色/余额的后台接口、初始化超管的具体字段。
4. **数据库内部结构**：不许贴建表 SQL、列名、迁移脚本内容。备份章节只说「备份整个数据库」。
5. **许可证激活以外的绕过开关**：不许写 `XBOT_SKIP_TLS_VERIFY` 之类的调试开关。
6. **崩溃处理器 / 内存布局 / 地址偏移**等调试细节。
7. **生产环境凭据**：不许出现任何 IP、密码、私钥、真实域名后台。
8. **已知实现缺陷**：例如某些适配器的鉴权尚未完成之类，**不要写进对外文档**（这类问题会单独修）。

## 六、事实纪律

- **只写事实清单里给你的内容**。清单没提到的功能，宁可不写，也不要"合理推测"。
- 不确定的行为，写成「在 xx 页面可以看到」而不是编造细节。
- 数字（端口、默认值、版本号、条数）必须与清单一致，**不要四舍五入或想当然**。
