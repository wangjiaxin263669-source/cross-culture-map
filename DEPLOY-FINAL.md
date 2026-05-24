# 最终版上线指南（免费 · 无需 VPS）

账号、历史、余额使用 **Netlify DB（免费 Neon 数据库）** 永久保存。  
本地开发用文件存储，线上启用 Netlify DB 即可（比 Blobs 更稳定）。

---

## 一键发布（推荐）

### 1. 推送到 GitHub

```powershell
cd cross-culture-map
.\scripts\deploy-final.ps1
```

### 2. 启用免费数据库（必做，约 1 分钟）

1. [Netlify](https://app.netlify.com) → 你的站点 → **Extensions**
2. 安装 **Netlify DB**（免费 Neon）→ 按提示创建
3. 完成后会自动有环境变量 `DATABASE_URL`

### 3. 环境变量

**Site configuration → Environment variables**：

- `DEEPSEEK_API_KEY`
- `JWT_SECRET`（随机长字符串）
- `PAYMENT_PROVIDER=mock`（测试）或 `zpay`（正式收款）
- `DATABASE_URL`（安装 Netlify DB 后自动出现，无需手填）

### 4. 重新部署并验证

**Deploys** → **Trigger deploy** → **Deploy site**

访问 `https://你的站点/api/health`：

```json
"auth": { "dbWritable": true, "storage": "postgres" }
```

然后：注册 → 充值 → 生成报告 → 刷新页面，历史与余额仍在。

---

## 本地开发

`npm run dev` 使用本地文件 `server/data/platform-db.json`，与线上 Blobs **数据分离**（正常）。

---

## 存储说明

| 环境 | 存储方式 | 费用 |
|------|----------|------|
| Netlify 线上 | Netlify DB (Postgres) | 免费额度内 $0 |
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
