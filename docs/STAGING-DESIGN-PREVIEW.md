# 视觉测试版（Design Preview）

面向设计师的高端视觉升级**先在此测试**，确认满意后再合并到 `main` 并手动发布正式站。

## 测试版地址

https://cross-culture-design-preview.netlify.app

顶部会显示 **「视觉测试版 · 非正式环境」** 标识。

## 正式站（未改动）

https://ephemeral-bubblegum-a79332.netlify.app

## 设计变更摘要（v2）

- 配色：去掉霓虹青，改为香槟金 + 暖灰编辑风（参考 Linear / 高端设计工作室站点）
- 字体：Noto Serif SC 标题 + DM Sans 界面
- 玻璃拟态、阴影、间距、按钮统一升级
- 交互与功能逻辑**完全不变**

## 本地预览

```bash
npm run dev
```

## 部署测试版

```bash
npm run deploy:staging
```

或 GitHub Actions → **Deploy Staging (Design Preview)** → Run workflow

## 满意后上线正式站

1. 合并 `staging/design-v2` → `main`
2. GitHub Actions → **Deploy Production (Manual)** → 输入 `DEPLOY`
