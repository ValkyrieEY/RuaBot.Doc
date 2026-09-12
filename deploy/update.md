---
title: 升级
description: Xiaoyi_QQ_V4 手动升级流程：备份数据库与程序目录、停服务、替换文件、启动、验证。
---

# 升级 ⬆️

这页讲怎么把已有部署升级到新版本。**目前没有「控制台里点一下就自动更新」的功能**，升级是手动流程，但步骤不多、每一步都可复制。

核心思路：**先备份，再停服务，再换文件，再启动**。数据库迁移由程序启动时自动完成，你不需要手工执行 SQL。

## 1. 升级前检查清单

动手前逐项确认：

- [ ] 已经拿到新版本安装包（`.deb` 或 `tar.gz`），并核对文件名里的版本号
- [ ] 数据库**已完成备份**（见下一步）
- [ ] 程序目录**已完成备份**，尤其是 `config/`、`license.key`、`plugins/`
- [ ] 确认当前没有正在进行的插件上传、批量操作
- [ ] 记下当前版本号，回滚时要用
- [ ] 选择低峰时段操作（升级期间服务会短暂中断）

## 2. 备份数据库

升级前务必先备份整个数据库：

```bash
# 导出整个数据库到一个带日期的文件（在服务器上执行）
pg_dump -h 127.0.0.1 -U <数据库用户名> -d <数据库名> -F c \
  -f /root/xiaoyi-backup-$(date +%F).dump
```

## 3. 备份程序目录

配置文件、授权文件和插件都是宝贵数据，一起打包：

```bash
# 打包程序目录（含配置、授权文件、插件）
sudo tar -czf /root/xiaoyi-app-$(date +%F).tar.gz \
  -C /opt xiaoyi_qq_c
```

::: tip 要备份哪些东西
- **数据库**：所有业务数据
- `config/`：你的配置（数据库连接、支付、SMTP、保留策略）
- `license.key`：授权文件，丢失需要联系服务商重新签发
- `plugins/`：通过后台上传的插件包
:::

## 4. 停服务

```bash
# 停掉服务，确保替换文件时没有进程占用
sudo systemctl stop xiaoyi-qq-c

# 确认已经停下来（状态应为 inactive）
sudo systemctl status xiaoyi-qq-c
```

## 5. 替换程序文件

用新版本的二进制覆盖旧文件。程序目录固定是 `/opt/xiaoyi_qq_c/`。

**用 `.deb` 包升级：**

```bash
# dpkg 会覆盖程序文件，postinst 会自动重载并重启服务
sudo dpkg -i xiaoyi-qq-c_<新版本>_amd64.deb
```

**用 `tar.gz` 便携包升级：**

```bash
# 解压新版本，然后覆盖程序文件（保留 config/ 与 plugins/ 数据）
tar -xzf xiaoyi-qq-c_<新版本>_amd64.tar.gz
cd xiaoyi-qq-c
sudo ./install.sh
```

::: warning 别把 `.installed` 弄丢
升级时**不要删除** `/opt/xiaoyi_qq_c/.installed`。这个标记一旦丢失，程序会以为这是全新安装，重启后会进入安装向导并要求重新配置。

同时 **`config/bot.toml` 也建议保留**，不要被安装包的干净模板覆盖掉。
:::

## 6. 启动服务

```bash
# 启动服务
sudo systemctl start xiaoyi-qq-c

# 跟踪日志，确认启动过程没有报错
sudo journalctl -u xiaoyi-qq-c -f
```

## 7. 数据库迁移（自动）

**不需要你手工做任何事。** 程序启动时会读取 `migrations/*.sql`，把尚未应用的迁移依次执行一遍。新版本带来的表结构变更会在这一步自动完成。

日志里能看到迁移执行的记录；如果迁移失败，程序通常会报错退出，此时看日志定位原因，必要时用第 2、3 步的备份回滚。

## 8. 升级后验证

```bash
# 健康检查应该返回 {"status":"ok"}
curl http://127.0.0.1:8080/healthz

# 服务状态应为 active (running)
sudo systemctl status xiaoyi-qq-c
```

然后用浏览器登录控制台，确认：

1. 页面能正常打开，登录正常；
2. 「我的机器人」列表里机器人都还在；
3. 至少有一个机器人显示在线；
4. 插件列表正常，能打开插件页面。

## 9. 升级后回滚

如果新版本有问题，用备份退回：

```bash
# 1) 停服务
sudo systemctl stop xiaoyi-qq-c

# 2) 还原程序目录（会覆盖成升级前的状态）
sudo rm -rf /opt/xiaoyi_qq_c
sudo tar -xzf /root/xiaoyi-app-<日期>.tar.gz -C /opt

# 3) 还原数据库
pg_restore -h 127.0.0.1 -U <数据库用户名> -d <数据库名> --clean \
  /root/xiaoyi-backup-<日期>.dump

# 4) 重新启动
sudo systemctl start xiaoyi-qq-c
```

::: danger 回滚会丢数据
还原数据库会把数据退回到备份那一刻，**备份之后产生的新数据（消息、订单、用户）都会丢失**。回滚前请再次确认，并尽量先导出一份当前数据库作为兜底。
:::

## 下一步

- [备份与运维](/deploy/ops)
- [安装](/deploy/install)
- [配置项](/reference/config)
