# Netlify 部署指南

> **最终版（账号 + 历史 + 充值）** 已支持 Netlify 免费持久化（Netlify Blobs），见 [DEPLOY-FINAL.md](./DEPLOY-FINAL.md)。

# Netlify 部署指南（轻量演示）（你想用的这个平台）

> ⚠️ **不要用页面底部的「拖拽文件夹 Drop」** —— 那只会上传静态文件，**AI 接口不会运行**。  
> 请按下面 **「连接 GitHub」** 方式部署。

---

## 一、准备 GitHub 仓库

1. 在 GitHub 新建仓库（如 `cross-culture-map`）
2. 在项目文件夹执行：

```bash
git init
git add .
git commit -m "准备 Netlify 部署"
git remote add origin https://github.com/你的用户名/cross-culture-map.git
git push -u origin main
```

确保 **不要** 提交 `.env`（已在 .gitignore 中）。

---

## 二、Netlify 创建站点

1. 登录 [Netlify](https://app.netlify.com)（你截图里的账号即可）
2. 点击 **Add new project** → **Import an existing project**
3. 选择 **GitHub** → 授权 → 选中仓库 `cross-culture-map`
4. 构建设置 **不用手改**，会自动读取项目里的 `netlify.toml`：
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions: `netlify/functions`

5. 展开 **Environment variables**，添加：

| Key | Value |
|-----|--------|
| `DEEPSEEK_API_KEY` | 你的 DeepSeek 密钥 |
| `DEEPSEEK_MODEL` | `deepseek-chat`（可选） |
| `NODE_VERSION` | `20`（可选，建议填） |

6. 点击 **Deploy site**，等待 2–5 分钟

---

## 三、部署成功后的地址

Netlify 会分配域名，例如：

`https://random-name-12345.netlify.app`

- 打开即你的跨文化平台首页
- 健康检查：`https://你的域名.netlify.app/api/health`

---

## 四、验证清单

- [ ] 首页地球与文字正常
- [ ] `/api/health` 里 `aiConfigured: true`
- [ ] AI 助手能对话
- [ ] 选国家后能生成报告（见下方超时说明）

---

## 五、重要限制（必读）

| 项目 | 说明 |
|------|------|
| **免费版函数超时** | 单次请求约 **10 秒**，长报告可能超时 |
| **Pro 计划** | 函数最长约 **26 秒**，报告成功率更高 |
| **国内访问** | 比 Render 好，但 `.netlify.app` 偶发偏慢；可绑自定义域名 |
| **DeepSeek** | 国内可直连，无需翻墙 |

若报告经常失败，聊天正常 → 考虑升级 Netlify Pro，或前端放 Netlify、API 放国内轻量服务器（见 DEPLOY-CN.md）。

---

## 六、更新网站

以后改代码后：

```bash
git add .
git commit -m "更新说明"
git push
```

Netlify 会 **自动重新部署**。

---

## 七、自定义域名（可选）

Netlify → Site settings → Domain management → Add custom domain

绑定自己的域名后，分享链接更专业。国内访问自定义域名通常比默认子域名更稳定。

---

## 架构说明

```
用户浏览器
    ↓
Netlify CDN（dist 静态页面）
    ↓ /api/*
Netlify Function（server + DeepSeek）
```

项目已包含 `netlify.toml` 与 `netlify/functions/api.mjs`，无需额外配置。
