# 发布与装载

> **你会学到**：怎么把写好的插件编译并装载到框架。
>
> ::: tip 本框架（Xiaoyi_QQ_C）
> 本框架**无开发者市场/分成/提现**（D1 决策：插件由平台方/管理员统一提供）。插件的"发布"即**编译成 .so/.dll 并在 `config/bot.toml` 的 `[[plugin]]` 声明装载**，然后由管理员绑定到机器人。以下 V3 开发者中心/上架的说明仅供参考。
> :::

## 编译插件

插件是 C++ 源码（`plugin_sdk.hpp`），用 CMake 编译成 `.so`/`.dll`：

```bash
# plugins/intercept/ 里 CMakeLists 已就绪
cmake --build build --target intercept
# 产物：plugins/intercept/libintercept.dll（或 .so）
```

## 装载插件

在 `config/bot.toml` 声明（重启生效）：

```toml
[[plugin]]
code     = "intercept"                              # 与 BotPluginMeta.code 一致
so       = "./build/plugins/intercept/libintercept.dll"   # 编译产物路径
enabled  = true
priority = 100
```

## 绑定到机器人

管理员在管理后台把插件装载到指定机器人（`bot_plugin_bindings` 表），可配置优先级/启停/拦截开关。

::: tip code 要稳定
`BotPluginMeta.code` 决定插件身份。**一旦确定不要改**——数据存储、绑定关系都靠它关联。改 `code` 会被当成全新插件，历史数据丢失。
:::

## 版本管理

升级插件时 `BotPluginMeta.version` 递增（如 `1.0.0` → `1.0.1`），重新编译 `.so`/`.dll` 并更新 `[[plugin]]` 指向即可。

## 检查清单

发布/装载前过一遍：

- [ ] `BotPluginMeta.code` 稳定、`version` 已递增
- [ ] `events_mask` 声明了关注的事件；纯拦截器插件 `intercepts` 设对应位
- [ ] `setting_schema_json` 的字段都有合理的 `default` 和 `label`
- [ ] 主流程用 `bot::Message` / `BotHostApi` 统一接口（跨平台）
- [ ] 平台特有功能用 `has_capability` 判断并降级处理
- [ ] 没有硬编码的测试数据 / 密钥
- [ ] 内存资源（`capability_invoke` 的 `out`）记得释放
- [ ] `description` 写清楚了功能和用法

## 下一步

- 调用平台能力（禁言/撤回/进群审批…）→ [能力调用](./capabilities)
- C++ SDK 全部接口 → [C++ SDK 参考](./cpp-sdk)
