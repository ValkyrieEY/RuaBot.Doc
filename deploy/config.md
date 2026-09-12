---
title: 首次配置
description: Xiaoyi_QQ_V4 首次配置的两条路径：Web 安装向导与手动编辑 config/bot.toml。
---

# 首次配置 🔧

装完程序后，你需要把数据库连上、把管理员账号建出来，服务才算真正可用。这页讲两条路径：**Web 安装向导**（推荐，适合绝大多数人）与**手动编辑配置文件**。读完你能独立完成首次配置，也知道装完怎么回到向导重来。

## 1. 安装向导是怎么触发的

程序启动时会检查**当前目录下有没有 `.installed` 这个标记文件**：

- 没有 `.installed` → 进入 **Web 安装向导**模式，监听 `8080`；
- 有 `.installed` → 直接以正常模式启动，提供正式服务。

所以首次安装后，打开浏览器访问 `http://<你的服务器IP>:8080/` 下的任意地址，都会自动跳转到安装向导页面：

```text
http://<你的服务器IP>:8080/install
```

## 2. 用 Web 安装向导（推荐）

向导分两步填表，都是必填项。

**第一步：数据库连接信息**

按你的 PostgreSQL 实例填写：主机、端口、用户名、密码、数据库名。填写前请确认这个库已经存在，且账号有建表权限。

**第二步：管理员账号**

设置管理员用户名与密码，这就是你之后登录控制台的凭据。

提交后向导会在一次流程里做完下面这些事：

1. 用你给的信息连接数据库；
2. **自动建表并应用全部迁移**（`migrations/*.sql`，运行时自动执行，不需要你手工导入）；
3. 创建管理员账号；
4. 给这个账号发放**免费额度**：1 个机器人位、5 个插件位；
5. 生成 `config/bot.toml`，其中 `env = "production"`；
6. 写入 `.installed` 标记，随即在同一进程里切换到正式服务模式。

::: tip `env = "production"` 的意义
向导写入的是 `production`。在这个取值下，找回密码等流程遵循生产安全策略，**不会返回开发链接**。以开发模式手工跑时才会看到开发链接，正式部署请保持 `production`。
:::

::: details 截图占位
分别截两张图：向导第一步的数据库表单、第二步的管理员账号表单，便于以后补图说明每一项填什么。
:::

## 3. 手动编辑 `config/bot.toml`

不想用向导，也可以在启动前直接改配置文件。模板路径是 `config/bot.toml`（`.deb` 安装后位于 `/opt/xiaoyi_qq_c/config/bot.toml`）。

最关键的只有两处：数据库连接和运行环境。下面是一份最小示例：

```toml
[app]
name = "xbot"
env  = "production"     # 正式部署保持 production；开发可写 development

[database]
host     = "127.0.0.1"  # PostgreSQL 地址
port     = 5432         # PostgreSQL 端口
user     = "xiaoyi"     # 数据库用户名
password = ""           # 数据库密码
dbname   = "xiaoyi"     # 数据库名
pool_size = 10          # 连接池大小
```

改完配置文件**必须重启服务**才生效：

```bash
sudo systemctl restart xiaoyi-qq-c
```

::: warning 不要写 `[[bot]]` 段
机器人实例**不由配置文件管理**，而是存在数据库里，在控制台「我的机器人」页面里增删改。老配置里的 `[[bot]]` 段已经废弃，写了不生效。

另外，本产品**没有**「用环境变量覆盖配置项」的机制，所有配置都写在 `config/bot.toml` 或控制台里。
:::

完整的配置项说明见 [配置项](/reference/config)。

## 4. 忘记管理员密码 / 想重新安装

想回到安装向导重来（比如忘了管理员密码），按下面三步做：

```bash
# 1) 先停掉服务（必须先停，否则文件状态会被运行中的进程覆盖）
sudo systemctl stop xiaoyi-qq-c

# 2) 删掉安装标记
sudo rm /opt/xiaoyi_qq_c/.installed

# 3) 重新启动，服务会回到安装向导模式
sudo systemctl start xiaoyi-qq-c
```

之后重新访问 `http://<你的服务器IP>:8080/install` 即可。

::: danger 重新安装会重写配置文件
向导跑完会**重新生成 `config/bot.toml`**，你之前手工改过的内容会被覆盖。操作前建议先备份一份：

```bash
sudo cp /opt/xiaoyi_qq_c/config/bot.toml /opt/xiaoyi_qq_c/config/bot.toml.bak
```
:::

## 下一步

- [配置项](/reference/config)
- [反向代理与 HTTPS](/deploy/reverse-proxy)
- [备份与运维](/deploy/ops)
