---
title: 回调地址与公网域名
description: 什么时候需要公网域名、怎么配 webhook_domain，以及 8080 与 8081 两个端口的区别。
---

# 回调地址与公网域名 🌍

这页解决两个问题：**什么时候必须准备公网域名**，以及**端口该怎么放行**。这两件事配错了，表现都是「机器人配置没问题，但就是收不到消息」。

如果你用的是 WebSocket 网关接入 QQ 官方，或者用 OneBot 11 反向 WebSocket，这页里只有「端口放行」一节和你有关；公网域名部分可以跳过。

## 1. 什么时候需要公网域名

只有当**平台要主动连你**的时候才需要公网域名：

| 接入方式 | 谁发起连接 | 需要公网域名吗 |
|---|---|---|
| QQ 官方：WebSocket 网关 | 框架连平台 | 不需要 |
| QQ 官方：Webhook 回调 | 平台回调你 | **需要** |
| QQ OneBot 11：反向 WebSocket | 实现端连框架 | 不需要 |

Webhook 模式下，QQ 开放平台会把事件 POST 到你给的回调地址，所以那个地址必须是公网上能解析、能访问、证书有效的地址。内网地址、`localhost`、只在你本机能解析的域名都不行。

## 2. 回调地址是怎么拼出来的

回调地址形如：

```text
{协议}://{域名}/api/webhooks/adapters/qq_official/{机器人UUID}
```

`{协议}` 和 `{域名}` 不是手填的，来自「平台设置 → 站点」里的两个配置项：

| 配置项 | 作用 | 建议值 |
|---|---|---|
| `webhook_protocol` | 决定回调地址用 `http` 还是 `https` | `https` |
| `webhook_domain` | 决定回调地址用哪个域名 | 你的公网域名，例如 `example.com` |

配好这两个值之后，再去控制台创建 / 查看 Webhook 模式的机器人，弹出的回调地址就是固定的了。

::: danger 没配 `webhook_domain` 会退化成当前 Host
这是最容易踩的坑：`webhook_domain` 为空时，回调地址会**退化成你当前浏览器访问控制台所用的 Host**。

后果是——你在公司电脑上看到的是 `http://<内网地址>:8080/...`，在另一台机器上看到的是另一个地址，填到 QQ 开放平台的那一个，平台根本回调不到。**务必先配 `webhook_domain`，再复制回调地址。**
:::

## 3. 配好域名之后要做的事

一个能用的公网入口，通常包括这几步：

1. 把域名解析到你的服务器
2. 反向代理（reverse proxy）把外部请求转发到框架的管理面端口
3. 申请证书、开启 HTTPS，并把 `webhook_protocol` 设成 `https`
4. 反向代理**必须透传 `Host` 头**

第 4 条单独强调一下。如果代理不转发 `Host`，框架看到的主机名就是代理自己的地址，凡是用到主机名判断的逻辑都会失准。

```nginx
# Nginx：站点入口转发到管理面（8080），并透传 Host
server {
    listen 443 ssl;
    server_name example.com;

    location / {
        proxy_pass http://<你的服务器IP>:8080;  # 框架与代理同机时填回环地址
        proxy_set_header Host $host;              # 必须：透传原始 Host
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

完整的反代与 HTTPS 步骤见 [反向代理与 HTTPS](/deploy/reverse-proxy)。

## 4. 端口：8080 和 8081 不是一回事

这是第二个高频坑。两个端口都监听着，但服务的东西完全不同：

| 端口 | 用途 | 谁连它 |
|---|---|---|
| `8080` | 管理面：控制台页面、开放 API、Webhook 回调 | 你的浏览器、QQ 开放平台 |
| `8081` | 适配器数据面：OneBot 反向 WebSocket | NapCat / Lagrange / go-cqhttp 等实现端 |

由此推出两条实践建议：

- **对外只需要暴露 8080**（通常再套一层反向代理和 HTTPS）。控制台、回调、开放 API 都走这里。
- **8081 不用对外开放**。它是 OneBot 实现端连进来的入口。如果实现端和框架不在同一台机器上，才需要放行 8081，并且最好限制来源。
- 在防火墙 / 安全组里，别把 8081 当成「另一个 8080」对外放开。

## 5. 排查清单

### 症状：浏览器打不开控制台，但服务明明是启动的

- **原因**：只放行了 8081，或反向代理指向了 8081。
- **处理方式**：确认代理的 `proxy_pass` 指向 **8080**。用下面命令确认 8080 在监听。

```bash
# Linux：确认两个端口的监听情况
ss -lntp | grep -E '8080|8081'
```

```powershell
# Windows：确认两个端口的监听情况
Get-NetTCPConnection -LocalPort 8080,8081 -State Listen
```

### 症状：控制台能开，但 OneBot 机器人一直离线

- **原因**：只放行了 8080，实现端连不上 8081。
- **处理方式**：按第 4 节确认实现端填的端口是 **8081**，并确认该端口对实现端可达。

### 症状：Webhook 模式下平台上校验回调失败

- **原因**：`webhook_domain` 没配，回调地址退化成了内网 Host。
- **处理方式**：配好 `webhook_domain` 与 `webhook_protocol`，重新复制回调地址并回填 QQ 开放平台。

### 症状：回调通了，但事件里的来源信息不对

- **原因**：反向代理没有透传 `Host`。
- **处理方式**：在代理配置里补上 `proxy_set_header Host $host;` 并重载。

## 下一步

- [QQ 官方：Webhook 回调](/platforms/qq-official-webhook)
- [反向代理与 HTTPS](/deploy/reverse-proxy)
- [QQ OneBot 11](/platforms/qq-onebot)
