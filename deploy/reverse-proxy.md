---
title: 反向代理与 HTTPS
description: 用 Nginx 给 Xiaoyi_QQ_V4 反代 8080、申请 HTTPS 证书，并正确转发 Host 头与调大上传体积。
---

# 反向代理与 HTTPS 🔒

默认情况下控制台直接监听 `8080`，浏览器访问的是 `http://<你的服务器IP>:8080`。想让控制台走上域名和 HTTPS，就在前面加一层 Nginx 反向代理。这页给你一份最小可用配置，并说清两个容易踩的坑：**上传体积 / 读超时**和 **`Host` 头转发**。

## 1. 最小可用的 Nginx 配置

假设你已经有一个域名（下文用 `example.com` 占位）解析到这台服务器。把下面内容存成 `/etc/nginx/sites-available/xiaoyi-qq-c`：

```nginx
server {
    listen 80;
    server_name example.com;          # 换成你自己的域名

    # 上传体积：插件包上传需要放宽，否则大包会被 Nginx 直接 413 拒绝
    client_max_body_size 200m;

    location / {
        proxy_pass http://127.0.0.1:8080;

        # 必须转发 Host，否则程序算出的回调地址会退化成内网地址
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 读超时：插件包上传 / 下载耗时较长，默认 60s 容易断
        proxy_read_timeout    300s;
        proxy_send_timeout    300s;
        proxy_connect_timeout 30s;
    }
}
```

启用配置并重载：

```bash
# 建软链启用站点，检查语法后重载
sudo ln -s /etc/nginx/sites-available/xiaoyi-qq-c /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 2. 两处必须放大的参数

| 参数 | 为什么 |
|---|---|
| `client_max_body_size` | 插件包上传走这个入口。默认只有 1m，包稍大就会被 Nginx 挡掉 |
| `proxy_read_timeout` / `proxy_send_timeout` | 插件包上传、下载都是长耗时请求，默认 60s 会在传输中途断开 |

这两项都写在上面的配置里了，装插件遇到「上传没反应」或「413」时先回头看这里。

## 3. HTTPS 证书

证书用 `certbot` 或你服务器面板自带的一键申请都行，一行带过：

```bash
# certbot 申请并自动改 Nginx 配置（Debian/Ubuntu 系）
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com
```

签发完成后 certbot 会自动改写上面的 server 块，加上 443 监听与证书路径，并把 HTTP 跳转到 HTTPS。

## 4. 关键：转发 `Host` 头

这是最容易出问题的一点。程序生成回调地址时会参考请求的 `Host`，如果反向代理**没有转发原始 `Host`**：

- 回调地址会退化成 `127.0.0.1` 这类内网地址；
- 平台侧回调打不进来，QQ 平台的消息收不到。

所以配置里的这一行不能省：

```nginx
proxy_set_header Host $host;
```

配好后可以打开控制台的「平台设置 → 站点」核对一下生成的公网地址是不是你的域名。

## 5. 让服务只监听本地（安全建议）

既然前面有 Nginx 兜着，就没必要再把 `8080` 暴露到公网。把监听地址改成回环地址即可：

```toml
[server]
admin_listen = "127.0.0.1:8080"   # 只允许本机访问，由 Nginx 转发进来
```

改完重启服务生效：

```bash
sudo systemctl restart xiaoyi-qq-c
```

::: danger 8081 不要一起藏到本地
`8081` 是**适配器数据面端口**，不是给浏览器用的。QQ 平台侧的连接（尤其是 **OneBot 11 的反向 WebSocket**）需要直接连到 `8081`，这是机器人与平台之间的通道。

如果你把 `data_listen` 也改成 `127.0.0.1:8081`，对外就只剩 Nginx 一个入口，**OneBot 反向 WS 将无法建立连接**。

正确做法：

- **只用 QQ 官方适配器**（WebSocket 网关 / Webhook 回调）→ 可以只监听本地，回调走 Nginx 转发；
- **要用 OneBot 11** → `8081` 必须保持对外可访问（或者你自己在 Nginx 上为它单独做一层 stream / WebSocket 转发）。详见 [QQ OneBot 11](/platforms/qq-onebot)。
:::

## 下一步

- [QQ OneBot 11](/platforms/qq-onebot)
- [回调地址与公网域名](/platforms/callback)
- [备份与运维](/deploy/ops)
