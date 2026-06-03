# 视觉测试版（Design Preview · 仅本地）

面向设计师的高端视觉升级**先在本地验收**，确认满意后再合并到 `main` 并手动发布正式站。

**不部署独立 Netlify 测试站**，避免额外消耗积分。

## 本地预览（推荐）

```powershell
# 开发模式（热更新 + 本地 API）
npm run dev:staging
```

浏览器打开 http://localhost:5173 ，顶部会显示 **「视觉测试版 · 非正式环境」**。

## 接近正式环境的本地预览

```powershell
npm run preview:staging
```

打开 http://localhost:4173

## 正式站（旧视觉，未合并 v2 前不变）

https://ephemeral-bubblegum-a79332.netlify.app

## 设计变更摘要（v2）

- 配色：香槟金 + 暖灰编辑风
- 字体：Noto Serif SC 标题 + DM Sans 界面
- 玻璃拟态、阴影、间距、按钮统一升级
- 交互与功能逻辑**完全不变**

## 满意后上线正式站

1. 合并 `staging/design-v2` → `main`
2. GitHub Actions → **Deploy Production (Manual)** → 输入 `DEPLOY`

## 若曾创建过 Netlify 测试站点

可在 [Netlify 控制台](https://app.netlify.com) 删除站点 `cross-culture-design-preview`，避免误触部署产生费用。
