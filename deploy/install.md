---
title: 安装
description: 在 Ubuntu 24.04 服务器上安装 Xiaoyi_QQ_V4：.deb 包、tar.gz 便携包与直接运行二进制三种方式。
---

# 安装 🌱

这页讲怎么把 Xiaoyi_QQ_V4 装到服务器上并让它跑起来。读完你能完成：选择安装方式、确认前置依赖、启动并确认服务状态，然后进入首次配置。

Xiaoyi_QQ_V4 是**单二进制**程序，前端资源已经内嵌进可执行文件，不需要额外部署 Web 服务。

## 1. 确认前置依赖

| 项目 | 要求 |
|---|---|
| 系统 | Ubuntu 24.04 x86_64（推荐），Debian 系同版本亦可 |
| 运行库（动态链接版） | `libpq5`、`libssl3t64` |
| 数据库 | 一个可用的 PostgreSQL 实例（本地或远程都行） |
| 消息队列 | **不需要**。本产品不使用 Redis 或任何消息队列 |

Xiaoyi_QQ_V4 **不依赖** Redis、RabbitMQ、Nginx 之类的中间件；除了 PostgreSQL，没有别的外部服务。

安装 .deb 前如果不确定运行库是否齐全，先补上：

```bash
# 补装动态链接所需的两个运行库（Ubuntu 24.04 包名）
sudo apt-get update
sudo apt-get install -y libpq5 libssl3t64
```

## 2. 方式一：安装 `.deb` 包（推荐）

Ubuntu 原生安装包，一条命令装完并自动接好 systemd 服务。安装包文件名形如 `xiaoyi-qq-c_0.1.0_amd64.deb`。

```bash
# 安装包本体；会自动装到 /opt/xiaoyi_qq_c/ 并注册 systemd 服务
sudo dpkg -i xiaoyi-qq-c_0.1.0_amd64.deb
```

装完后会发生三件事：

1. 程序文件落到 `/opt/xiaoyi_qq_c/`；
2. systemd 服务 `xiaoyi-qq-c` 被 `enable` 并启动；
3. 因为还没有安装标记，服务进入 **Web 安装向导**模式，监听 `8080`。

接着浏览器打开 `http://<你的服务器IP>:8080/install` 完成首次配置，详见 [首次配置](/deploy/config)。

::: tip 安装后的目录布局
```text
/opt/xiaoyi_qq_c/
  xbot                    # 主程序（前端已内嵌）
  config/bot.toml         # 配置文件
  migrations/*.sql        # 数据库迁移脚本（启动时自动应用）
  plugins/*.so            # 内置插件
  .installed              # 安装完成标记（向导跑完才生成）
```
:::

## 3. 方式二：`tar.gz` 便携包 + `install.sh`

便携包和 `.deb` 目录结构一致，附带一个安装脚本，会帮你装依赖并注册 systemd 服务。

```bash
# 解压便携包
tar -xzf xiaoyi-qq-c_0.1.0_amd64.tar.gz
cd xiaoyi-qq-c

# 安装脚本：装依赖 + 注册 systemd 服务（需要 root）
sudo ./install.sh
```

装完后同样访问 `http://<你的服务器IP>:8080/install` 走安装向导。

## 4. 方式三：直接运行二进制（开发 / 测试）

不想用 systemd 时，可以直接把程序跑起来，适合本机调试。

```bash
# 必须先进到程序所在目录（项目根目录），再启动
cd /opt/xiaoyi_qq_c
./xbot
```

Windows 上开发测试同理，在项目根目录执行 `build\src\xbot.exe`，依赖的 DLL 已经放在可执行文件旁边。

::: danger 必须在项目根目录启动
`config/`、`plugins/`、`migrations/` 以及安装标记 `.installed` 都是**相对当前工作目录**解析的。

如果你在其他目录用绝对路径启动（例如 `/opt/xiaoyi_qq_c/xbot`），程序会找不到 `config/bot.toml`，也不会认出 `.installed`。systemd 服务里已经通过 `WorkingDirectory` 固定了目录，手动运行时请自己 `cd` 进去。
:::

## 5. 密钥文件：请务必备份

首次启动时程序会在 `config/secrets.env` 里生成两个随机密钥（权限 600），用于加密数据库中的敏感字段与签发登录态。

::: danger 这个文件丢了，数据就再也解不开
- **请把 `config/secrets.env` 复制一份到别的地方保存**（离线介质、密码管理器都行）。
  它不在任何版本库里，丢了**没有任何办法恢复**，联系授权方也恢复不了。
- **迁移服务器、重装、换机器时，它必须和数据库一起搬**。只搬数据库不搬它，等于数据全废。
- 不要把它发给任何人，也不要提交进任何代码仓库。

`./xbot --help` 可以查看全部命令；`./xbot --verify` 可以校验程序文件自身的完整性。
:::

## 6. 启动、停止与查看状态

`.deb` 与 `install.sh` 两种方式都用 systemd 托管服务，服务名统一是 `xiaoyi-qq-c`：

```bash
# 查看运行状态（是否 active、最近日志）
sudo systemctl status xiaoyi-qq-c

# 启动 / 停止 / 重启
sudo systemctl start xiaoyi-qq-c
sudo systemctl stop xiaoyi-qq-c
sudo systemctl restart xiaoyi-qq-c

# 设为开机自启 / 取消
sudo systemctl enable xiaoyi-qq-c
sudo systemctl disable xiaoyi-qq-c

# 实时跟踪日志（按 Ctrl+C 退出）
sudo journalctl -u xiaoyi-qq-c -f
```

直接跑二进制时，用 `Ctrl+C` 停止即可。

## 7. 确认服务已经起来

两个端口分别承担不同职责：

| 端口 | 用途 |
|---|---|
| `8080` | 控制台 / Web 安装向导（人访问的界面） |
| `8081` | 适配器数据面（QQ 平台连接走这里，例如 OneBot 反向 WS） |

```bash
# 看端口有没有在监听
ss -lntp | grep -E '8080|8081'

# 健康检查应该返回 {"status":"ok"}
curl http://127.0.0.1:8080/healthz
```

::: details 截图占位
截一张浏览器打开 `http://<你的服务器IP>:8080/install` 时的安装向导首页，用来展示向导长什么样（本次文档不放图）。
:::

## 下一步

- [首次配置](/deploy/config)
- [反向代理与 HTTPS](/deploy/reverse-proxy)
- [备份与运维](/deploy/ops)
