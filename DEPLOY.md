# CROSS-CULTURE 上线部署指南

## 上线前自检（必做）

```bash
npm run build
npm run predeploy
```

全部显示 ✓ 后再部署。

---

## 方案 A：Render（推荐，免费起步）

1. 将项目推送到 GitHub
2. 打开 [Render](https://render.com) → **New +** → **Blueprint** 或 **Web Service**
3. 连接仓库，Render 会读取根目录 `render.yaml`
4. 在环境变量中设置 **`DEEPSEEK_API_KEY`**（Secret）
5. 部署完成后访问：`https://你的服务名.onrender.com`

| 配置项 | 值 |
|--------|-----|
| Build Command | `npm install && npm run build` |
| Start Command | `npm run start:prod` |
| Health Check | `/api/health` |

> 免费实例冷启动约 30–60 秒，首次打开请稍等。

---

## 方案 B：云服务器 / VPS（国内访问更稳）

```bash
# 服务器上
git clone <你的仓库>
cd cross-culture-map
npm install
cp .env.example .env   # 编辑填入 DEEPSEEK_API_KEY
npm run build
npm run start:prod
```

### Nginx 反向代理示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}
```

使用 **PM2** 保持进程常驻：

```bash
npm install -g pm2
pm2 start npm --name cross-culture -- run start:prod
pm2 save
pm2 startup
```

---

## 方案 C：Docker

```bash
docker build -t cross-culture-map .
docker run -d -p 3001:3001 \
  -e DEEPSEEK_API_KEY=sk-xxx \
  -e NODE_ENV=production \
  cross-culture-map
```

---

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `DEEPSEEK_API_KEY` | ✅ | [DeepSeek 开放平台](https://platform.deepseek.com/api_keys) |
| `DEEPSEEK_MODEL` | | 默认 `deepseek-chat` |
| `PORT` | | 云平台自动注入；本地默认 3001 |
| `NODE_ENV` | | 生产环境设为 `production`（`start:prod` 已自动设置） |
| `SKILL_PATH` | | 可选，自定义 SKILL.md 路径 |

**切勿**将 `.env` 提交到 Git。

---

## 本地生产预览

```bash
npm start
# 访问 http://localhost:3001
```

---

## 上线后验证

1. 打开首页，地球与左侧文案正常
2. 访问 `/api/health`，`aiConfigured` 为 `true`
3. 点击国家 → 生成报告
4. 打开 AI 助手发送一条消息

---

## 常见问题

| 现象 | 处理 |
|------|------|
| AI 未配置 | 检查云平台环境变量 `DEEPSEEK_API_KEY` |
| 页面 404 | 确认已执行 `npm run build`，且 `dist/index.html` 存在 |
| 报告超时 | 云平台需允许 60s+ 请求；Nginx 增大 `proxy_read_timeout` |
| 冷启动慢 | Render 免费版正常，可升级付费实例 |
