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

## Secrets 一键配置

本机已 `netlify login` 且能 `git push` 时，在项目根目录执行：

```powershell
.\scripts\setup-github-netlify-secret.ps1
```

会自动创建 Netlify Build Hook，并写入 GitHub Secrets：

- `NETLIFY_BUILD_HOOK` — 自动重建正式站  
- `NETLIFY_AUTH_TOKEN` — 备用 API 触发部署  

| Secret | 作用 |
|--------|------|
| `DEEPSEEK_API_KEY` | CI 内跑 AI 冒烟（需在 GitHub 手动加） |

工作流：`.github/workflows/site-health-guardian.yml`  
推送 `main` 即上线，无需手动 Run workflow。
