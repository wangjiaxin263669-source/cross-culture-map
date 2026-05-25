# 站点健康守护 · 全自动托管

每 **3 天**在 GitHub Actions 自动执行，**无需人工查看报告**。

## 安全红线（与视频换链事故隔离）

- **不会**修改 `src/data`、国家/地区链接、BV 视频
- **不会** `git commit` / `git push` 业务代码
- **不会**批量替换外链

## 自动做什么

1. `npm ci` + `npm run build` 验证工程可构建  
2. 巡检正式站：注册登录、钱包充值、语料、AI 对话/报告/模拟调研、链接抽样  
3. 若正式站 **502/503/504/usage_exceeded**：自动触发 **Netlify 重建**（Build Hook 或 API Token）  
4. 等待后 **自动复检**，最多 3 轮  

## 自动修复白名单

仅 `netlify_rebuild`（运维动作，零文件变更）。

## Secrets（建议配置，否则重建步骤跳过）

| Secret | 作用 |
|--------|------|
| `DEEPSEEK_API_KEY` | CI 内跑 AI 冒烟 |
| `NETLIFY_BUILD_HOOK` 或 `NETLIFY_AUTH_TOKEN` | 自动触发正式站部署 |

工作流：`.github/workflows/site-health-guardian.yml`  
推送 `main` 即上线，无需手动 Run workflow。
