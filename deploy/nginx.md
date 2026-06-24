# Nginx 反向代理

> **你会学到**：用 Nginx 把 V3 暴露到公网、配置 HTTPS、正确转发域名头。

生产环境**强烈建议**用 Nginx 反向代理，而不是直接把 V3 端口暴露到公网。原因：

- 方便配置 HTTPS（QQ 官方等平台要求 HTTPS 回调）。
- 统一域名访问，授权系统靠域名识别。
- 安全：V3 只监听本地。

## 最小配置

假设 V3 监听本地 `8000`，你的域名是 `bot.example.com`：

```nginx
server {
    listen 80;
    server_name bot.example.com;

    # WebSocket 支持（实时通知、控制台用）
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

::: warning 必须转发 Host 头
授权系统通过 `Host` 头识别你的域名。Nginx 配置里的 `proxy_set_header Host $host;` **不能少**，否则授权校验会拿不到正确域名。
:::

## 配置 HTTPS

QQ 官方等平台要求 Webhook 回调地址必须是 HTTPS。用 Let's Encrypt 免费证书：

```nginx
server {
    listen 443 ssl http2;
    server_name bot.example.com;

    ssl_certificate     /etc/letsencrypt/live/bot.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bot.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# 80 跳转到 443
server {
    listen 80;
    server_name bot.example.com;
    return 301 https://$host$request_uri;
}
```

申请证书（certbot）：

```bash
certbot --nginx -d bot.example.com
```

## 上传超时（插件上传用）

如果上传大插件包超时，加长上传相关配置：

```nginx
client_max_body_size 100m;
proxy_read_timeout 300s;
proxy_send_timeout 300s;
```

## 让 V3 只监听本地

部署时让容器端口绑定到 `127.0.0.1`，避免直接公网访问绕过 Nginx：

```yaml
# docker-compose.yml
ports:
  - "127.0.0.1:8000:8000"
```

这样只有 Nginx（本机）能访问 V3，公网只能走 Nginx。

## 下一步

- 域名授权怎么生效 → [授权激活](./authorization)
- 后续升级 → [在线更新](./update)
