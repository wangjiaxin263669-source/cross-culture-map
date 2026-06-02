# 半自动部署说明

## 当前策略

| 动作 | 以前（全自动） | 现在（半自动） |
|------|----------------|----------------|
| `git push main` | Netlify 自动发布 + Guardian 可能触发重建 | **仅 CI 构建检查**，不自动发布 |
| 站点健康巡检 | 每 3 天自动修复并触发 Netlify 重建 | 每 3 天**仅巡检报告**，不重建 |
| 文化链接守护 | 每周自动改数据 + push + Netlify 重建 | **仅手动** GitHub Actions 运行 |
| 正式发布 | 推送即上线 | **需你确认**后手动部署 |

## 你需要做的一次性设置（Netlify 控制台）

关闭「推送即上线」，避免每次 push 都花钱部署：

1. 打开 [Netlify 站点](https://app.netlify.com) → **Site configuration** → **Build & deploy** → **Continuous deployment**
2. 若已连接 GitHub：可改为 **Stop builds**（停止自动构建），或只保留 **Deploy previews** 不自动 publish production
3. 正式上线改用手动：**Deploys** → **Trigger deploy** → **Deploy site**  
   或在 GitHub → **Actions** → **Deploy Production (Manual)** → 输入 `DEPLOY` 运行

## 代码里的自动化模块（已识别）

| 位置 | 原作用 | 现状态 |
|------|--------|--------|
| `.github/workflows/site-health-guardian.yml` | 定时巡检 + 自动 Netlify 重建 | 改为半自动，不重建 |
| `.github/workflows/culture-link-guardian.yml` | 每周自动改链 + push + 重建 | 改为仅手动审计 |
| `.github/workflows/ci-build.yml` | （新增）push 时只 build | 启用 |
| `.github/workflows/deploy-production.yml` | （新增）手动输入 DEPLOY 才发布 | 启用 |
| `scripts/site-health-guardian.mjs` | 失败时触发 build hook | 需 `ALLOW_NETLIFY_AUTO_DEPLOY=true` 才重建 |
| `scripts/lib/siteHealthSafeFix.mjs` | 调用 Netlify build hook | 同上 |
| `scripts/setup-github-netlify-secret.mjs` | 配置 build hook 密钥 | 保留，供手动部署用 |
| Netlify Git 连接 | push 自动 deploy | **请在控制台关闭自动发布** |

## 推荐发布流程

1. 本地或 CI：`npm run build` 通过
2. `git push origin main`（只更新 GitHub，不自动上正式站）
3. 你确认无误后：GitHub Actions → **Deploy Production (Manual)** → 输入 `DEPLOY`  
   或 Netlify 控制台手动 **Deploy site**

## 管理员积分充值小站

见 [`credit-admin/README.md`](../credit-admin/README.md) — **独立隐藏站点**，不挂在主站 URL 上。
