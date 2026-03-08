# 安装指南

[English](installation.md)

本页介绍如何根据当前仓库代码实际安装并运行 XQNEXT。

## 你要安装的到底是什么

XQNEXT 主要由两部分组成：

- 后端：Python FastAPI 应用
- 前端：`/webui` 下的 React 18 + TypeScript + Vite 项目

生产环境下，前端会被构建到 `/src/ui/static`，再由后端提供静态资源。

相关源码：
- `/src/main.py`
- `/run.py`
- `/webui/package.json`
- `/webui/vite.config.ts`
- `/config.toml`

## 环境要求

### 后端要求

至少需要：

- Python 3.11+，推荐较新版本
- `pip`
- 如果要连接 OneBot，还需要能访问对应 OneBot 服务

`/src/main.py` 中专门处理了 Windows + Python 3.13 兼容问题，所以这不是“理论上也许能跑”，而是代码明确照顾过的场景。

### 前端要求

如果你要开发或重新构建 Web UI，还需要：

- Node.js
- npm

如果 `src/ui/static` 中已经有构建产物，那么单纯运行后端时并不一定需要 Node.js。

## 安装后端依赖

在仓库根目录执行：

```bash
pip install -r requirements.txt
```

这会安装 FastAPI、数据库层、插件运行时以及可选 AI 子系统所需的 Python 依赖。

## 安装前端依赖

如果你要运行 Vite 开发服务器或构建 Web UI：

```bash
cd webui
npm install
```

`/webui` 下常用命令：

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## 推荐安装流程

对大多数用户来说，建议按下面顺序来：

1. 安装 Python 依赖
2. 检查 `/config.toml`
3. 启动后端
4. 如果 Web UI 构建产物不存在，再去 `/webui` 里构建前端

这个流程不花哨，但一般不太会害你。

## 不构建前端也能不能运行

如果以下文件已经存在：

- `/src/ui/static/index.html`
- `/src/ui/static/assets/`

那么后端可以直接提供 Web UI。

如果它们不存在且 `web_ui.enabled = true`，`/src/ui/api.py` 会返回一个后备页面，提示你前端还没有构建。

## 启动命令

### 推荐后端启动方式

```bash
python -m src.main
```

Windows 下还可以使用：

```bash
python run.py
```

项目指令中还给出了便捷脚本：

```bash
start.bat
./start.sh
```

## Docker 说明

仓库中有 `/docker` 目录，也支持 compose 部署，但本质上跑起来的还是同一套应用结构。

项目指令中的参考命令：

```bash
cd docker && docker-compose up -d
cd docker && docker-compose logs -f xqnext
```

如果你是第一次接触这个项目，建议先本地跑通。先把事情弄清楚，再把它装进更多容器里，通常更省时间。

## 安装完成后继续看

- [配置说明](configuration_CN.md)
- [首次启动](first-run_CN.md)
- [Web UI 说明](webui_CN.md)
- [常见问题](faq_CN.md)
