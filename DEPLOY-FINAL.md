# 最终版上线指南（免费 · 无需 VPS）

最终版已接入 **Netlify Blobs**（Netlify 免费套餐自带），账号、历史记录、余额会**永久保存**，继续用 Netlify 即可，不必买服务器。

---

## 一键发布（推荐）

### 1. 推送到 GitHub

```powershell
cd cross-culture-map
.\scripts\deploy-final.ps1
```

### 2. Netlify 自动部署

1. 打开 [Netlify](https://app.netlify.com) → 你的站点 → **Deploys**
2. 等待构建完成（读取 `netlify.toml`）
3. **Site configuration → Environment variables**，确认已有：
   - `DEEPSEEK_API_KEY`
   - `JWT_SECRET`（随机长字符串）
   - `PAYMENT_PROVIDER=mock`（仅测试）或 `zpay` + 支付参数（正式收款）

### 3. 验证

访问 `https://你的站点.netlify.app/api/health`，应看到：

```json
"auth": {
  "dbWritable": true,
  "storage": "netlify-blobs"
}
```

然后：注册 → 充值 → 生成报告 → 刷新页面，历史与余额仍在。

---

## 本地开发

`npm run dev` 使用本地文件 `server/data/platform-db.json`，与线上 Blobs **数据分离**（正常）。

---

## 存储说明

| 环境 | 存储方式 | 费用 |
|------|----------|------|
| Netlify 线上 | Netlify Blobs | 免费额度内 $0 |
| 本地 dev | JSON 文件 | $0 |
| Docker / VPS（可选） | JSON 文件卷 | 视主机 |

---

## 正式收款（可选）

`.env` / Netlify 环境变量：

```env
PAYMENT_PROVIDER=zpay
ZPAY_PID=...
ZPAY_KEY=...
ZPAY_API_BASE=...
API_PUBLIC_URL=https://你的站点.netlify.app
PAYMENT_RETURN_URL=https://你的站点.netlify.app/?recharge=success
```

支付回调：`https://你的站点.netlify.app/api/wallet/recharge/notify`

详见 [docs/WALLET.md](./docs/WALLET.md)。

---

## 仍想用 VPS？

```bash
./scripts/deploy-vps.sh
```

会使用本地 JSON 文件，同样持久化，见 `docker-compose.yml`。
