# 国内稳定上线指南（长期可访问）

海外平台（Render、Vercel、GitHub Pages）在国内常出现 **慢、打不开、冷启动** 等问题。  
本项目 API 使用 **DeepSeek（国内）**，推荐把整站部署在 **国内云服务器**，一次配置可长期运行。

---

## 推荐方案对比

| 方案 | 国内访问 | 稳定性 | 成本 | 适合 |
|------|----------|--------|------|------|
| **腾讯云轻量 / 阿里云轻量** | ⭐⭐⭐⭐⭐ | 7×24 常驻 | 约 ¥50–112/年（新用户活动） | **最推荐** |
| 华为云耀云服务器 | ⭐⭐⭐⭐⭐ | 同上 | 类似 | 备选 |
| Render 免费版 | ⭐⭐ | 15 分钟休眠 | 免费 | 仅演示、不适合国内用户 |
| 仅静态托管 | ⭐⭐⭐ | — | 免费 | **不行**（本项目需要 Node 后端） |

> **结论**：买一台国内 **轻量应用服务器**（1核2G 足够），用 PM2 保活，是最稳、国内打开最快的方式。

---

## 方案一：腾讯云轻量应用服务器（推荐）

### 1. 购买

1. 打开 [腾讯云轻量应用服务器](https://cloud.tencent.com/product/lighthouse)
2. 选 **Linux** 镜像（推荐 **Ubuntu 22.04**）
3. 地域选离用户近的（如 **上海 / 广州 / 北京**）
4. 套餐 1核2G 即可，新用户常有 **年付几十元** 活动

### 2. 安全组放行端口

在控制台 → 防火墙 / 安全组：

| 端口 | 用途 |
|------|------|
| **80** | HTTP（配 Nginx 后用户访问） |
| **443** | HTTPS（可选，配证书后） |
| **3001** | 临时直连测试（上线后可关） |

### 3. SSH 登录服务器后执行

```bash
# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx

# 拉取代码（或 scp 上传 zip）
git clone <你的仓库地址> cross-culture-map
cd cross-culture-map

# 配置环境变量
cp .env.example .env
nano .env   # 填入 DEEPSEEK_API_KEY

# 安装、构建、自检
npm install
npm run build
npm run predeploy

# PM2 常驻运行（崩溃自动重启）
sudo npm install -g pm2
pm2 start npm --name cross-culture -- run start:prod
pm2 save
pm2 startup   # 按提示执行一行命令，开机自启
```

### 4. Nginx 反向代理（用 80 端口访问，更专业）

```bash
sudo nano /etc/nginx/sites-available/cross-culture
```

写入：

```nginx
server {
    listen 80;
    server_name _;   # 有域名后改成 yourdomain.com

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
    }
}
```

启用：

```bash
sudo ln -s /etc/nginx/sites-available/cross-culture /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

浏览器访问：**http://你的服务器公网IP** 即可。

### 5. 绑定域名（可选）

- 域名 **DNS A 记录** 指向服务器 IP
- 国内服务器 + **国内域名** 通常需 **[ICP 备案](https://beian.miit.gov.cn/)**（约 1–2 周）
- 未备案前可先用 **IP 直接访问**，不影响课程演示

### 6. HTTPS（可选）

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 方案二：阿里云轻量应用服务器

步骤与腾讯云相同，控制台：

- [阿里云轻量应用服务器](https://www.aliyun.com/product/swas)
- Node 安装、PM2、Nginx 配置一致

---

## 方案三：本机当服务器（仅内网/答辩演示）

适合教室 WiFi 演示，**不适合**公网长期访问：

```bash
npm start
# 同网段访问 http://你的电脑IP:3001
```

需在 Windows 防火墙放行 3001 端口。

---

## 环境变量（服务器上的 `.env`）

```env
DEEPSEEK_API_KEY=sk-xxxxxxxx
DEEPSEEK_MODEL=deepseek-chat
NODE_ENV=production
PORT=3001
```

云平台 **不要** 把 `.env` 提交到 Git；在服务器上单独创建。

---

## 更新版本

```bash
cd cross-culture-map
git pull
npm install
npm run build
pm2 restart cross-culture
```

---

## 上线检查清单

- [ ] `npm run predeploy` 全部 ✓
- [ ] `http://IP/api/health` → `aiConfigured: true`
- [ ] 地球贴图正常（已改用国内友好 CDN）
- [ ] 选国家 → 生成报告成功
- [ ] AI 助手对话成功
- [ ] PM2 `pm2 status` 显示 online

---

## 常见问题

**Q：为什么不继续用 Render？**  
A：服务器在海外，国内访问慢且免费版会休眠，不适合「稳定永久」。

**Q：DeepSeek 要翻墙吗？**  
A：不需要，国内服务器直连 DeepSeek API 即可。

**Q：最低成本？**  
A：轻量服务器年付活动价 + DeepSeek 按量计费（用量少时几元钱级别）。

**Q：学生优惠？**  
A：腾讯云 / 阿里云均有学生认证优惠，可搜索「云+校园」「学生机」。

---

## 一键脚本（Ubuntu）

项目内已提供 `scripts/deploy-vps.sh`，上传服务器后：

```bash
chmod +x scripts/deploy-vps.sh
./scripts/deploy-vps.sh
```

（需先 `git clone` 并配置好 `.env`）
