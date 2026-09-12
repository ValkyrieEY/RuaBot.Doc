import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './custom.css'

// 只做品牌色与少量排版微调，其余沿用 VitePress 默认主题。
// 刻意不做 CSS hack 去改导航栏结构——升级 VitePress 时才不会崩。
export default {
  extends: DefaultTheme,
} satisfies Theme
