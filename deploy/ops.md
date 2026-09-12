---
title: 备份与运维
description: Xiaoyi_QQ_V4 的日常运维：systemd 命令、日志查看、健康检查、Prometheus 指标、数据备份与保留清理、故障排查与卸载。
---

# 备份与运维 🧰

服务跑起来之后，日常要管的无非几件事：看状态、看日志、做备份、出问题能定位。这页把常用命令和排错思路集中在一起，建议收藏。

## 1. systemd 常用命令

`install.sh` 与 `.deb` 都注册了名为 `xiaoyi-qq-c` 的服务：

```bash
sudo systemctl status xiaoyi-qq-c      # 状态
sudo systemctl start xiaoyi-qq-c       # 启动
sudo systemctl stop xiaoyi-qq-c        # 停止
sudo systemctl restart xiaoyi-qq-c     # 重启
sudo systemctl enable xiaoyi-qq-c      # 开机自启
sudo systemctl disable xiaoyi-qq-c     # 取消自启
```

## 2. 日志位置与查看方式

日志有两个去处：**文件日志**（配置项 `log.dir` 指定，默认 `logs/`）和 **stdout**（被 systemd 收进 journal）。

```bash
# 实时跟踪服务日志（含 stdout）
sudo journalctl -u xiaoyi-qq-c -f

# 看最近 200 行
sudo journalctl -u xiaoyi-qq-c -n 200

# 看程序自己写的文件日志（在程序目录下）
sudo tail -f /opt/xiaoyi_qq_c/logs/*.log
```

日志级别由 `config/bot.toml` 的 `[log] level` 控制（`trace` / `debug` / `info` / `warn` / `error`），排障时可临时调成 `debug`，定位完记得调回 `info`。

## 3. 健康检查端点

三个端点用途不同，别搞混：

| 端点 | 用途 | 返回 |
|---|---|---|
| `/healthz` | 存活检查：进程还在、HTTP 层能响应 | `{"status":"ok"}` |
| `/readyz` | 就绪检查：数据库连通 **且** 至少一个适配器在线 | 就绪 `200`，未就绪 `503` |
| `/metrics` | 运行时指标，Prometheus 文本格式，可接入监控面板；**需管理员 API Key** | 未带凭证 `403`，带凭证返回指标文本 |

::: warning 别拿控制台页面地址当探活
控制台对未知路径会回落到前端页面并返回 `200`，所以「首页能打开」只说明 HTTP 服务在跑，**不能说明数据库和机器人是好的**。写监控或部署脚本时请用 `/healthz` 与 `/readyz`。
:::

```bash
# 存活检查
curl http://127.0.0.1:8080/healthz

# 就绪检查（返回 503 说明数据库没连上，或还没有机器人上线）
curl -i http://127.0.0.1:8080/readyz
```

## 4. Prometheus 指标

`/metrics` 以 Prometheus 文本格式暴露运行指标，可以直接挂到 Prometheus 上抓取：

```bash
curl http://127.0.0.1:8080/metrics
```

包含的指标：累计收到事件数、累计发送消息数、近 60 秒事件速率（QPS）、按适配器聚合的在线机器人数与机器人总数、数据库连接池占用、进程常驻内存、运行时长。

::: warning `/metrics` 需要管理员 API Key
指标含平台业务量与容量，**默认不对外开放**：不带凭证访问会返回 `403`。抓取时带上**管理员账号**的 API Key（在「用户中心」生成，见 [开放 API](/console/openapi)）：

```bash
curl -H "X-API-Key: <管理员账号的 API Key>" http://127.0.0.1:8080/metrics
```
:::

Prometheus 抓取配置示例：

```yaml
scrape_configs:
  - job_name: xiaoyi_qq_v4
    metrics_path: /metrics
    static_configs:
      - targets: ['127.0.0.1:8080']
    # 指标需要管理员 API Key
    authorization:
      type: ''            # 走自定义请求头而不是 Bearer
    http_headers:
      X-API-Key:
        values: ['<管理员账号的 API Key>']
```

## 5. 数据备份

需要备份三类东西：**数据库**、**程序目录**、**授权文件**。

```bash
# 1) 备份 PostgreSQL（导出整个数据库）
pg_dump -h 127.0.0.1 -U <数据库用户名> -d <数据库名> -F c \
  -f /root/xiaoyi-db-$(date +%F).dump

# 2) 备份程序目录（含 config/、license.key、plugins/）
sudo tar -czf /root/xiaoyi-app-$(date +%F).tar.gz -C /opt xiaoyi_qq_c
```

恢复时反过来：

```bash
# 恢复数据库（--clean 会先清掉同名对象）
pg_restore -h 127.0.0.1 -U <数据库用户名> -d <数据库名> --clean \
  /root/xiaoyi-db-<日期>.dump

# 恢复程序目录（先停服务）
sudo systemctl stop xiaoyi-qq-c
sudo rm -rf /opt/xiaoyi_qq_c
sudo tar -xzf /root/xiaoyi-app-<日期>.tar.gz -C /opt
sudo systemctl start xiaoyi-qq-c
```

::: warning 别漏了 `license.key`
授权文件 `license.key` 在程序目录根下。丢失后需要联系服务商重新签发，**备份时必须一起打包**。
:::

## 6. 数据保留与自动清理

程序会**每 6 小时**自动清理一次过期数据，默认保留天数如下（都在 `config/bot.toml` 的 `[retention]` 段里，可自行调整）：

| 数据 | 默认保留 |
|---|---|
| 消息留痕 | 7 天 |
| 通知 | 30 天 |
| 审计日志 | 90 天 |
| 用户日志 | 90 天 |
| AI 会话 | 30 天 |
| 插件 KV | 永久（`kv_days = 0` 表示永久） |

要留更久就调大对应天数；某项设为 `0` 表示**永久保留、不清理**。改完重启服务生效。完整说明见 [配置项](/reference/config)。

## 7. 常见故障排查

### 服务起不来

**症状**：`systemctl status` 显示 `activating (auto-restart)` 反复重启，日志里出现

```text
config parse failed: ...
```

**原因**：`config/bot.toml` 语法写错（括号、引号不配对），或文件根本不存在。

**处理方式**：检查配置文件语法；若文件丢失，删掉 `.installed` 回安装向导重新生成。

### 数据库连不上

**症状**：日志里出现

```text
db_unavailable
```

`/readyz` 返回 `503`，控制台页面报错。

**原因**：数据库没启动、地址/端口/账号密码填错，或数据库不允许从本机外的地址连接。

**处理方式**：先用 `psql` 手工连一次确认凭据无误，再核对 `config/bot.toml` 的 `[database]` 段。

### 端口被占用

**症状**：启动日志里出现

```text
bind: Address already in use
```

**原因**：`8080` 或 `8081` 已被别的进程占用（常见于上一次没退干净的进程）。

**处理方式**：

```bash
# Linux：先查出占用端口的进程
sudo ss -lntp | grep -E '8080|8081'
# 确认后结束它（把 <PID> 换成上一步查到的进程号）
sudo kill -9 <PID>
```

```bat
:: Windows：先查出占用端口的进程
netstat -ano | findstr :8080
:: 确认后结束它（把 <PID> 换成最后一列的进程号）
taskkill /F /PID <PID>
```

### 上传插件失败 / 平台回调收不到

**症状**：上传大插件包时报 `413 Request Entity Too Large`，或传到一半断连；或机器人显示离线，回调没有任何请求进来。

**原因**：反向代理的上传体积、读超时太小，或者没有转发 `Host` 头，导致程序生成的回调地址退化成内网地址。

**处理方式**：调大 Nginx 的 `client_max_body_size` 与 `proxy_read_timeout`，并确保配置里有 `proxy_set_header Host $host;`，详见 [反向代理与 HTTPS](/deploy/reverse-proxy) 与 [回调地址与公网域名](/platforms/callback)。

## 8. 卸载

```bash
# 1) 停服务并取消开机自启
sudo systemctl stop xiaoyi-qq-c
sudo systemctl disable xiaoyi-qq-c

# 2) 用 dpkg 卸载（会删掉 /opt/xiaoyi_qq_c/ 下的程序文件）
sudo dpkg -r xiaoyi-qq-c
```

::: danger 卸载前先备份
卸载会删除程序目录，**数据库不会自动删除**。如果这台机器不再使用，请先按第 5 节导出数据库和程序目录，再手工清理残留的 `/opt/xiaoyi_qq_c/` 与数据库。
:::

## 下一步

- [升级](/deploy/update)
- [反向代理与 HTTPS](/deploy/reverse-proxy)
- [配置项](/reference/config)
