# 管理员积分充值站

## 已部署地址（与主站联动）

| 站点 | 地址 |
|------|------|
| **主站（用户平台）** | https://ephemeral-bubblegum-a79332.netlify.app |
| **管理员充值页** | https://ephemeral-bubblegum-a79332.netlify.app/admin-credits/ |

管理员页随主站一起发布，**独立 URL、不在学生导航里出现**；调用主站同一套 `/api/wallet/admin/grant` 接口。

## 使用步骤

1. 打开 **管理员充值页**（建议收藏，勿公开给学生）
2. **主站 API** 默认已填当前站点（同域自动识别）
3. **管理员密钥** 填 `RECHARGE_ADMIN_SECRET`（与 Netlify 环境变量 / `netlify.toml` 一致）
4. 输入用户在主站注册的 **11 位手机号**
5. 输入 **金额（元）** → 确认充值

充值成功后，用户回到主站刷新即可看到右上角余额增加。

## 验证联动

```bash
node scripts/test-credit-admin-linkage.mjs
```

## 可选：完全独立的第二个 Netlify 站点

若希望域名与主站完全不同：

1. 本机执行 `npx netlify-cli login`
2. `node scripts/deploy-credit-admin.mjs`（会创建 `cross-culture-credit-admin` 站点）

或在 GitHub Actions 手动运行 **Deploy Credit Admin Site**（需配置 `NETLIFY_AUTH_TOKEN`）。

## 安全

- 密钥仅存浏览器 sessionStorage
- 定期更换 `RECHARGE_ADMIN_SECRET`
- 勿把密钥提交到公开仓库
