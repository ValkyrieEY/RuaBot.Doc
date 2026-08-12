import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid({
  // GitHub Pages 项目站点 URL：https://valkyrieey.github.io/RuaBot.Doc/
  base: '/RuaBot.Doc/',
  lang: 'zh-CN',
  title: '小依 QQ V3',
  description: '小依 QQ V3 — 多租户 QQ 机器人 SaaS 管理平台官方文档',
  // 旧草稿不进入构建产物
  srcExclude: ['_draft/**'],
  lastUpdated: true,
  cleanUrls: true,

  head: [
    ['meta', { name: 'theme-color', content: '#3c8cff' }],
  ],

  themeConfig: {
    outline: { level: [2, 3], label: '本页导航' },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdatedText: '最后更新',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '目录',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索' },
          modal: {
            displayDetails: '显示详情',
            resetButtonTitle: '清除',
            backButtonTitle: '返回',
            noResultsText: '没有找到结果',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭',
            },
          },
        },
      },
    },

    nav: [
      { text: '指南', link: '/guide/introduction' },
      { text: '部署', link: '/deploy/requirements' },
      { text: '平台', link: '/platforms/supported' },
      {
        text: '开发',
        items: [
          { text: 'XUBP 协议', link: '/xubp/overview' },
          { text: '插件开发', link: '/plugin-dev/getting-started' },
        ],
      },
      {
        text: '使用',
        items: [
          { text: '管理后台', link: '/admin/overview' },
          { text: '用户控制台', link: '/console/overview' },
          { text: '常见问题', link: '/faq' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始了解',
          items: [
            { text: '产品介绍', link: '/guide/introduction' },
            { text: '核心特性', link: '/guide/features' },
            { text: '系统架构', link: '/guide/architecture' },
            { text: '名词解释', link: '/guide/glossary' },
          ],
        },
      ],
      '/deploy/': [
        {
          text: '部署与运维',
          items: [
            { text: '环境要求', link: '/deploy/requirements' },
            { text: 'Docker 部署', link: '/deploy/docker' },
            { text: '安装向导', link: '/deploy/install' },
            { text: 'Nginx 反向代理', link: '/deploy/nginx' },
            { text: '授权激活', link: '/deploy/authorization' },
            { text: '在线更新', link: '/deploy/update' },
            { text: '运维与备份', link: '/deploy/ops' },
          ],
        },
      ],
      '/platforms/': [
        {
          text: '平台接入',
          items: [
            { text: '支持的平台', link: '/platforms/supported' },
          ],
        },
      ],
      '/xubp/': [
        {
          text: 'XUBP 协议',
          items: [
            { text: '协议概览', link: '/xubp/overview' },
            { text: '事件类型', link: '/xubp/events' },
            { text: '消息流转', link: '/xubp/message-flow' },
          ],
        },
      ],
      '/plugin-dev/': [
        {
          text: '插件开发',
          items: [
            { text: '快速开始', link: '/plugin-dev/getting-started' },
            { text: 'C++ SDK 参考', link: '/plugin-dev/cpp-sdk' },
            { text: '插件元数据 BotPluginMeta', link: '/plugin-dev/meta' },
            { text: '配置项', link: '/plugin-dev/settings' },
            { text: '处理事件', link: '/plugin-dev/events' },
            { text: '上下文 Context', link: '/plugin-dev/context' },
            { text: '数据存储', link: '/plugin-dev/data-store' },
            { text: '发送消息', link: '/plugin-dev/messages' },
            { text: '能力调用 Capabilities（XUBP v2）', link: '/plugin-dev/capabilities' },
            { text: '拦截器', link: '/plugin-dev/interceptors' },
            { text: '插件 WebUI', link: '/plugin-dev/webui' },
            { text: '跨平台开发', link: '/plugin-dev/cross-platform' },
            { text: '发布与上架', link: '/plugin-dev/publish' },
          ],
        },
      ],
      '/admin/': [
        {
          text: '管理后台',
          items: [
            { text: '后台总览', link: '/admin/overview' },
            { text: '用户管理', link: '/admin/users' },
            { text: '适配器集群', link: '/admin/adapters' },
            { text: '插件市场审核', link: '/admin/marketplace' },
            { text: '订阅与计费', link: '/admin/subscriptions' },
            { text: '开发者管理', link: '/admin/developers' },
            { text: '内容与公告', link: '/admin/content' },
            { text: '系统设置', link: '/admin/settings' },
            { text: '审计与日志', link: '/admin/audit' },
          ],
        },
      ],
      '/console/': [
        {
          text: '用户控制台',
          items: [
            { text: '控制台总览', link: '/console/overview' },
            { text: '机器人管理', link: '/console/bots' },
            { text: '插件中心', link: '/console/plugins' },
            { text: '我的订阅', link: '/console/subscriptions' },
            { text: '账户与充值', link: '/console/account' },
            { text: 'Open API', link: '/console/openapi' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://sq.yuafeng.cn' },
    ],

    footer: {
      message: '基于 VitePress 构建 · 闭源商业产品，未经授权禁止复制传播',
      copyright: 'Copyright © 2026 小依 QQ V3',
    },
  },
})
