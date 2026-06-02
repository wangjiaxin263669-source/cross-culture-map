# 管理员积分充值站（独立隐藏站点）

管理员充值页**不再**挂在主站 `/admin-credits/`，避免学生猜到 URL。  
单独部署为一个 Netlify 小站，只有你知道地址，自行收藏即可。

| 站点 | 地址 |
|------|------|
| **主站（学生平台）** | https://ephemeral-bubblegum-a79332.netlify.app |
| **管理员充值页** | 独立 Netlify 地址（部署后获得，见下方） |

## 首次部署（只需一次）

### 方式 A：本机部署

```powershell
npx netlify-cli login
npm run build:credit-admin
node scripts/deploy-credit-admin.mjs
```

脚本会创建/更新独立站点（默认名称 `cc-credits-private`，可在 Netlify 控制台改名），并输出 **仅你可见的 URL**。请收藏，勿发给学生。

### 方式 B：GitHub Actions

1. 在 GitHub 仓库 **Settings → Secrets** 配置 `NETLIFY_AUTH_TOKEN`
2. （推荐）配置 `CREDIT_ADMIN_SITE_ID` 固定到同一隐藏站点
3. **Actions → Deploy Credit Admin Site → Run workflow**

## 日常使用

1. 打开你收藏的 **独立管理员 URL**
2. 输入用户在主站注册的 **11 位手机号**
3. 输入 **金额（元）** → 确认充值

用户通过微信扫码充值时，会在转账备注里填写自己的账号（通常为注册手机号），请据此核对后再入账。

## 验证 API 联动

```bash
node scripts/test-credit-admin-linkage.mjs
```

若已部署隐藏站，可额外验证页面：

```bash
$env:ADMIN_PAGE_URL="https://你的隐藏站.netlify.app/"
node scripts/test-credit-admin-linkage.mjs
```

## 安全说明

- 主站学生入口**没有**管理员充值链接
- 页面含 `noindex`，搜索引擎不会收录
- 管理员密钥已内置，无需手填
- 请勿把隐藏站 URL 分享给学生或写在公开文档里
