import { defineConfig } from "vitepress";

const enSidebar = [
  {
    text: "Getting Started",
    items: [
      { text: "Overview", link: "/getting-started/overview" },
      { text: "Installation", link: "/getting-started/installation" },
      { text: "Configuration", link: "/getting-started/configuration" },
      { text: "First Run", link: "/getting-started/first-run" },
      { text: "Web UI", link: "/getting-started/webui" },
      { text: "FAQ", link: "/getting-started/faq" },
    ],
  },
  {
    text: "User Guide",
    items: [
      { text: "Operations", link: "/user-guide/operations" },
      { text: "Plugin Management", link: "/user-guide/plugin-management" },
      { text: "AI Features", link: "/user-guide/ai-features" },
      { text: "Realtime and Logs", link: "/user-guide/realtime-and-logs" },
      { text: "Troubleshooting", link: "/user-guide/troubleshooting" },
    ],
  },
  {
    text: "Plugin Development",
    items: [
      { text: "Index", link: "/plugin-development/README" },
      { text: "Quickstart", link: "/plugin-development/quickstart" },
      { text: "Manifest and Layout", link: "/plugin-development/plugin-manifest-and-layout" },
      { text: "Runtime Architecture", link: "/plugin-development/runtime-architecture" },
      { text: "Plugin API", link: "/plugin-development/plugin-api" },
      { text: "Interceptors", link: "/plugin-development/interceptors" },
    ],
  },
  {
    text: "Contributor Guide",
    items: [
      { text: "Architecture Overview", link: "/contributor-guide/architecture-overview" },
      { text: "Backend Structure", link: "/contributor-guide/backend-structure" },
      { text: "Frontend Structure", link: "/contributor-guide/frontend-structure" },
      { text: "Event Flow", link: "/contributor-guide/event-flow" },
      { text: "Security and Auth", link: "/contributor-guide/security-and-auth" },
      { text: "Database and Persistence", link: "/contributor-guide/database-and-persistence" },
      { text: "Testing", link: "/contributor-guide/testing" },
    ],
  },
  {
    text: "Reference",
    items: [
      { text: "Configuration Reference", link: "/reference/configuration-reference" },
      { text: "API Surface Overview", link: "/reference/api-surface-overview" },
      { text: "plugin.json Reference", link: "/reference/plugin-json-reference" },
      { text: "Glossary", link: "/reference/glossary" },
    ],
  },
];

const zhSidebar = [
  {
    text: "快速开始",
    items: [
      { text: "入门概览", link: "/getting-started/overview_CN" },
      { text: "安装指南", link: "/getting-started/installation_CN" },
      { text: "配置说明", link: "/getting-started/configuration_CN" },
      { text: "首次启动", link: "/getting-started/first-run_CN" },
      { text: "Web UI 说明", link: "/getting-started/webui_CN" },
      { text: "常见问题", link: "/getting-started/faq_CN" },
    ],
  },
  {
    text: "使用与运维",
    items: [
      { text: "日常操作", link: "/user-guide/operations_CN" },
      { text: "插件管理", link: "/user-guide/plugin-management_CN" },
      { text: "AI 功能", link: "/user-guide/ai-features_CN" },
      { text: "实时消息与日志", link: "/user-guide/realtime-and-logs_CN" },
      { text: "故障排查", link: "/user-guide/troubleshooting_CN" },
    ],
  },
  {
    text: "插件开发",
    items: [
      { text: "索引", link: "/plugin-development/README_CN" },
      { text: "插件快速开始", link: "/plugin-development/quickstart_CN" },
      { text: "插件清单与目录结构", link: "/plugin-development/plugin-manifest-and-layout_CN" },
      { text: "插件运行时架构", link: "/plugin-development/runtime-architecture_CN" },
      { text: "插件 API", link: "/plugin-development/plugin-api_CN" },
      { text: "拦截器", link: "/plugin-development/interceptors_CN" },
    ],
  },
  {
    text: "贡献指南",
    items: [
      { text: "架构总览", link: "/contributor-guide/architecture-overview_CN" },
      { text: "后端结构", link: "/contributor-guide/backend-structure_CN" },
      { text: "前端结构", link: "/contributor-guide/frontend-structure_CN" },
      { text: "事件流", link: "/contributor-guide/event-flow_CN" },
      { text: "安全与鉴权", link: "/contributor-guide/security-and-auth_CN" },
      { text: "数据库与持久化", link: "/contributor-guide/database-and-persistence_CN" },
      { text: "测试说明", link: "/contributor-guide/testing_CN" },
    ],
  },
  {
    text: "参考资料",
    items: [
      { text: "配置参考", link: "/reference/configuration-reference_CN" },
      { text: "API 总览", link: "/reference/api-surface-overview_CN" },
      { text: "`plugin.json` 参考", link: "/reference/plugin-json-reference_CN" },
      { text: "术语表", link: "/reference/glossary_CN" },
    ],
  },
];

export default defineConfig({
  base: "/RuaBot.Doc/v2/",
  title: "RuaBot Docs",
  description: "RuaBot (XQNEXT) Documentation",
  cleanUrls: true,
  locales: {
    root: {
      label: "English",
      lang: "en-US",
      link: "/",
      themeConfig: {
        nav: [
          { text: "Getting Started", link: "/getting-started/overview" },
          { text: "User Guide", link: "/user-guide/operations" },
          { text: "Plugin Dev", link: "/plugin-development/README" },
          { text: "Contributor Guide", link: "/contributor-guide/architecture-overview" },
          { text: "Reference", link: "/reference/configuration-reference" },
        ],
        sidebar: enSidebar,
      },
    },
    zh: {
      label: "简体中文",
      lang: "zh-CN",
      link: "/zh/",
      themeConfig: {
        nav: [
          { text: "快速开始", link: "/getting-started/overview_CN" },
          { text: "使用与运维", link: "/user-guide/operations_CN" },
          { text: "插件开发", link: "/plugin-development/README_CN" },
          { text: "贡献指南", link: "/contributor-guide/architecture-overview_CN" },
          { text: "参考资料", link: "/reference/configuration-reference_CN" },
        ],
        sidebar: zhSidebar,
      },
    },
  },
  themeConfig: {
    logo: { src: "/logo.png", width: 24, height: 24 },
    siteTitle: "RuaBot Docs",
    search: {
      provider: "local",
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/ValkyrieEY/RuaBot" },
    ],
  },
});
