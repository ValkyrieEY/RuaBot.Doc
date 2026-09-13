import { defineConfig } from 'vitepress'

// Xiaoyi_QQ_V4 官方文档站
// 站点部署在 GitHub Pages 项目路径下，base 必须与仓库名一致。
export default defineConfig({
  base: '/RuaBot.Doc/',
  lang: 'zh-CN',
  title: 'Xiaoyi_QQ_V4',
  description: 'Xiaoyi_QQ_V4 —— 单二进制 QQ 机器人框架官方文档：安装部署、机器人接入、插件开发与上架。',
  // 作者手记 / 草稿 / 仓库说明不进构建产物（否则会被当成页面发布出去）
  srcExclude: ['_draft/**', '_authoring/**', 'README.md', 'CONTRIBUTING.md'],
  lastUpdated: true,
  cleanUrls: true,

  head: [
    ['meta', { name: 'theme-color', content: '#3c8cff' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/RuaBot.Doc/logo.svg' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Xiaoyi_QQ_V4 官方文档' }],
    [
      'meta',
      {
        property: 'og:description',
        content: '单二进制 QQ 机器人框架：机器人接入、插件市场、插件开发与云编译上架。',
      },
    ],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Xiaoyi_QQ_V4',

    outline: { level: [2, 3], label: '本页导航' },
    docFooter: { prev: '上一篇', next: '下一篇' },
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
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
      },
    },

    nav: [
      { text: '指南', link: '/guide/what-is' },
      { text: '部署', link: '/deploy/install' },
      { text: '机器人接入', link: '/platforms/qq-official' },
      { text: '控制台', link: '/console/overview' },
      { text: '插件开发', link: '/plugin-dev/getting-started' },
      { text: '参考', link: '/reference/events' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始了解',
          items: [
            { text: '为什么是 Xiaoyi_QQ_V4', link: '/guide/what-is' },
            { text: '核心特性', link: '/guide/features' },
            { text: '系统要求', link: '/guide/requirements' },
            { text: '名词表', link: '/guide/glossary' },
          ],
        },
        {
          text: '遇到问题',
          items: [{ text: '常见问题', link: '/faq' }],
        },
      ],

      '/deploy/': [
        {
          text: '部署',
          items: [
            { text: '安装', link: '/deploy/install' },
            { text: '首次配置', link: '/deploy/config' },
            { text: '反向代理与 HTTPS', link: '/deploy/reverse-proxy' },
            { text: '在线更新', link: '/deploy/update' },
            { text: '备份与运维', link: '/deploy/ops' },
          ],
        },
      ],

      '/platforms/': [
        {
          text: '机器人接入',
          items: [
            { text: '接入方式总览', link: '/platforms/overview' },
            {
              text: 'QQ 官方机器人',
              collapsed: false,
              items: [
                { text: 'WebSocket 网关（推荐）', link: '/platforms/qq-official' },
                { text: 'Webhook 回调', link: '/platforms/qq-official-webhook' },
              ],
            },
            { text: 'QQ OneBot 11', link: '/platforms/qq-onebot' },
            { text: '回调地址与公网域名', link: '/platforms/callback' },
          ],
        },
      ],

      '/console/': [
        {
          text: '控制台',
          items: [
            { text: '控制台总览', link: '/console/overview' },
            { text: '我的机器人', link: '/console/bots' },
            { text: '插件市场与安装', link: '/console/plugins' },
            { text: '内置插件一览', link: '/console/builtin-plugins' },
            { text: '订阅 · 卡密 · 充值', link: '/console/billing' },
            { text: '开放 API', link: '/console/openapi' },
          ],
        },
      ],

      '/plugin-dev/': [
        {
          text: '入门',
          items: [
            { text: '快速开始', link: '/plugin-dev/getting-started' },
            { text: '最小示例', link: '/plugin-dev/minimal' },
            { text: '目录结构与打包', link: '/plugin-dev/structure' },
            { text: 'ABI 与兼容规则', link: '/plugin-dev/abi' },
          ],
        },
        {
          text: '写插件',
          items: [
            { text: '生命周期回调', link: '/plugin-dev/lifecycle' },
            { text: '处理事件', link: '/plugin-dev/events' },
            { text: '发送消息', link: '/plugin-dev/messages' },
            { text: '存储与配置', link: '/plugin-dev/storage' },
            { text: '调用平台能力', link: '/plugin-dev/capabilities' },
            { text: '拦截器', link: '/plugin-dev/interceptors' },
            { text: '插件 Web 面板', link: '/plugin-dev/webui' },
          ],
        },
        {
          text: '发布',
          items: [
            { text: '云编译与上架', link: '/plugin-dev/publish' },
            { text: '调试与排错', link: '/plugin-dev/debugging' },
          ],
        },
      ],

      '/reference/': [
        {
          text: '参考',
          items: [
            { text: '事件类型', link: '/reference/events' },
            { text: '平台能力码', link: '/reference/capabilities' },
            { text: 'Host API', link: '/reference/host-api' },
            { text: '插件元数据', link: '/reference/meta' },
            { text: '配置项', link: '/reference/config' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/valkyrieey/RuaBot.Doc' }],

    footer: {
      message: '闭源商业产品 · 未经授权禁止复制传播',
      copyright: 'Copyright © 2026 Xiaoyi_QQ_V4',
    },
  },
})
