# 运维与备份

> **你会学到**：日常运维命令、数据备份、故障排查、卸载。

## 常用命令

部署目录下，用 Docker Compose 管理容器：

```bash
docker compose ps              # 查看容器状态
docker compose logs -f         # 实时查看日志
docker compose restart         # 重启容器
docker compose down            # 停止并删除容器
docker compose up -d           # 重新启动
docker compose exec xiaoyi sh  # 进入容器
```

## 健康检查

```bash
curl http://127.0.0.1:8000/api/health
# 正常返回 {"status":"ok",...}
```

## 数据备份

::: warning 定期备份
强烈建议定期备份。以下三样东西丢不得：数据库、插件目录、上传文件。
:::

### 1. 数据库（最重要）

```bash
pg_dump -h 数据库地址 -U 用户名 库名 | gzip > backup_$(date +%F).sql.gz
```

恢复：

```bash
gunzip -c backup_2026-06-24.sql.gz | psql -h 数据库地址 -U 用户名 库名
```

### 2. 插件目录

备份部署目录下的 `plugins/` 文件夹——这里是你安装的所有插件。

### 3. 上传文件

备份部署目录下的 `uploads/` 文件夹——插件上传的文件、用户上传的内容。

### 4. 配置

备份部署目录下的 `config/`（含数据库连接、授权码等）。**注意保密**，里面含敏感信息。

## 故障排查

### 容器无法启动

```bash
docker compose logs xiaoyi | tail -50
```

常见原因：

- 数据库连不上：检查配置里的数据库地址、账号密码、安全组放行。
- 端口被占用：改 `docker-compose.yml` 的端口映射。
- 配置文件损坏：恢复备份的配置。

### 数据库连不上（容器内）

容器内连宿主机数据库，地址不要填 `localhost`，用宿主机内网 IP 或 Docker 网关 `172.17.0.1`。

### 授权失败

见 [授权激活 · 常见问题](./authorization#常见问题)。多数是 Host 头没正确转发或域名未登记。

### 子进程（适配器/插件）不工作

```bash
docker compose logs xiaoyi | grep -E "适配器|插件|runtime"
```

看是否有进程启动失败、崩溃重启的日志。单个插件崩溃不影响其他插件。

### 性能问题

- 加 Redis 提升事件通知速度。
- 检查数据库连接数、慢查询。
- 看服务器 CPU/内存是否打满。

## 卸载

部署包附带 `uninstall.sh`，支持多级别清理，按提示选择：

| 级别 | 清理范围 |
|------|---------|
| 轻量 | 只停止并删除容器、网络 |
| 标准 | 上述 + 删除 V3 数据（插件、上传、日志、配置） |
| 彻底 | 上述 + 删除整个部署目录 |
| 保留镜像 | 可选是否删除 Docker 镜像 |

::: warning 数据库不会自动删
PostgreSQL 是你自备的，卸载脚本**不会**删除数据库里的数据。如需彻底清除，手动 drop 数据库。
:::

::: tip 原始下载包不删
彻底卸载只删部署目录，**不会**删除你下载的原始发布包（zip/tar），方便你重新部署。
:::

## 下一步

- 出问题先看这里 → [常见问题](../faq)
- 了解架构辅助排查 → [系统架构](../guide/architecture)
