# 站点健康守护（Site Health Guardian）

每 **3 天**自动巡检正式站，覆盖登录注册、钱包充值、AI 生成、开放平台、文化链接抽样与前端可访问性。

## 与文化链接守护的区别

| 项目 | Culture Link Guardian | Site Health Guardian |
|------|----------------------|----------------------|
| 周期 | 每周一 | 每 3 天 |
| 改 `src/data` | 是（仅确认失效视频等） | **永不** |
| 自动提交代码 | 可能 | **永不** |
| 自动修复 | 换链（曾有误伤，已收紧） | 仅 Netlify 重建 Hook |

## 检查项

- 正式站首页与 `/api/health`
- 注册 → 登录 → `/me`、重复注册拦截
- 钱包配置、余额、充值下单
- 语料检索、开放平台 Just One
- AI：对话、三步报告、模拟调研人设（CI 需 `DEEPSEEK_API_KEY`）
- 从 `countries.js` 等 **只读抽样**外链可达性（不自动换链）

## 安全修复（白名单）

仅当正式站 **502/503/usage_exceeded** 且配置了密钥时：

- `NETLIFY_BUILD_HOOK`：POST 触发 Netlify 重建（**不改仓库任何文件**）

失效文化链接、AI 报错、逻辑缺陷 → 只写入报告，需人工处理或使用每周 **culture-link-guardian**（已防误伤）。

## 本地运行

```bash
npm run site-health          # 巡检，不写库、不修复
npm run site-health:fix      # 巡检 + 安全修复（需 NETLIFY_BUILD_HOOK）
```

## GitHub Actions

工作流：`.github/workflows/site-health-guardian.yml`

建议 Secrets：

- `DEEPSEEK_API_KEY` — CI 中跑 AI 冒烟
- `NETLIFY_BUILD_HOOK`（可选）— 临时故障时自动触发重建

报告产物：`scripts/guardian-reports/site-health-latest.json`（已 gitignore，以 Artifact 保存）

## 上线正式

推送 `main` 后工作流自动启用；也可在 Actions 页 **Run workflow** 手动跑一次验证。
