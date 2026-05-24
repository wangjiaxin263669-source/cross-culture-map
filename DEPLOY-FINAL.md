# 最终版上线指南（账号 · 历史记录 · 充值）

> **重要**：含注册登录、历史记录、余额充值的最终版 **不能只用 Netlify**。  
> Netlify 无持久化磁盘，用户数据和余额会丢失。请用 **VPS / 云服务器 / Docker**。

---

## 一、推荐方案：国内轻量服务器（阿里云 / 腾讯云）

### 1. 准备

- 系统：Ubuntu 22.04
- 开放端口：80、443（及 3001 若暂不用 Nginx）
- 安装 Node.js 18+、Git

### 2. 拉代码

```bash
git clone https://github.com/wangjiaxin263669-source/cross-culture-map.git
cd cross-culture-map
```

### 3. 配置环境

```bash
cp .env.production.example .env
nano .env   # 填写 DEEPSEEK_API_KEY、JWT_SECRET、域名、支付参数
```

`JWT_SECRET` 生成示例（PowerShell）：

```powershell
[guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
```

### 4. 一键部署

```bash
chmod +x scripts/deploy-vps.sh
./scripts/deploy-vps.sh
```

或 Windows 本地打包后上传服务器，在服务器执行同上。

### 5. Nginx 反代（推荐）

```nginx
server {
    listen 80;
    server_name 你的域名;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 120s;
    }
}
```

配置 HTTPS 后，`.env` 中 `FRONTEND_URL`、`API_PUBLIC_URL` 改为 `https://你的域名`。

### 6. 支付回调

在易支付后台设置异步通知：

`https://你的域名/api/wallet/recharge/notify`

---

## 二、Docker 部署

```bash
cp .env.production.example .env
# 编辑 .env

docker compose up -d --build
curl http://127.0.0.1:3001/api/health
```

数据保存在 Docker 卷 `culture_data`（用户、余额、历史记录）。

---

## 三、Windows 本机发布到 GitHub

```powershell
cd cross-culture-map
.\scripts\deploy-final.ps1
```

脚本会：构建前端 → 上线自检 → 提交并推送到 GitHub。

---

## 四、Netlify 说明（旧方案）

| 功能 | Netlify |
|------|---------|
| 地图 + AI（无登录） | ✅ |
| 账号 / 历史 / 余额 | ❌ 数据不持久 |

若仍用 Netlify 做演示，只能体验 AI，**不要**依赖注册和充值。

最终版请按本文 **VPS 或 Docker** 部署。

---

## 五、上线检查清单

- [ ] `npm run predeploy` 全部通过
- [ ] `JWT_SECRET` 已改为随机值（非默认值）
- [ ] `PAYMENT_PROVIDER=zpay` 且已填商户号（生产勿用 mock）
- [ ] 访问 `/api/health` 见 `auth.dbWritable: true`
- [ ] 注册 → 充值 → 生成报告 → 历史记录可查看

---

## 六、环境变量速查

见 `.env.production.example` 与 `docs/WALLET.md`。
