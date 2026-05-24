# 开放平台 API 接入说明

## 重要说明（请先读）

| 平台 | 官方开放能力 | 模拟调研「笔记/UGC 语料」推荐 |
|------|----------------|------------------------------|
| **小红书** | [open.xiaohongshu.com](https://open.xiaohongshu.com) ARK：商家 OAuth、商品/订单/ERP | **Just One API** 笔记搜索，或 Serper `site:xiaohongshu.com` |
| **微博** | [open.weibo.com](https://open.weibo.com) OAuth2，高级搜索需单独申请 | **Just One API** 关键词搜索 |
| **知乎** | 无公开笔记搜索 API | Just One（若开通）或 Serper |

小红书**官方**开放平台目前面向**商家/服务商**（店铺主账号授权），不是 C 端笔记开放检索。atypica 类产品的 UGC 语料通常来自**数据合作或合规第三方接口**。

---

## 快速配置（本机）

```powershell
cd cross-culture-map
.\setup-open-platform.ps1
npm run dev
```

浏览器打开 `http://localhost:5174` → 选国家 → **模拟调研** → **开放平台连接**。

---

## 环境变量

见项目根目录 `.env.example`。

### Just One API（推荐）

1. 注册 [docs.justoneapi.com](https://docs.justoneapi.com)
2. 购买/获取 `token`
3. `.env` 添加：`JUSTONE_API_TOKEN=你的token`
4. 重启 `npm run dev`

### 小红书 ARK 官方

1. 登录 [open.xiaohongshu.com](https://open.xiaohongshu.com) 创建应用
2. 回调地址填：`http://localhost:3001/api/open-platform/xhs/callback`
3. `.env`：`XHS_ARK_APP_ID`、`XHS_ARK_APP_SECRET`
4. 页面点击 **授权连接**（需店铺主账号登录小红书）

### 微博官方

1. [open.weibo.com](https://open.weibo.com) 创建应用
2. 回调：`http://localhost:3001/api/open-platform/weibo/callback`
3. `.env`：`WEIBO_APP_KEY`、`WEIBO_APP_SECRET`
4. 点击 **授权连接**

### Netlify 线上

- OAuth 回调需在本地完成，将 `accessToken` 写入 Netlify 环境变量：`XHS_ARK_ACCESS_TOKEN` / `WEIBO_ACCESS_TOKEN`
- `JUSTONE_API_TOKEN`、`SERPER_API_KEY` 可直接在 Netlify 配置

---

## API 路由

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/open-platform/status` | 各平台连接状态 |
| GET | `/api/open-platform/xhs/authorize` | 跳转小红书授权 |
| GET | `/api/open-platform/xhs/callback` | 小红书 OAuth 回调 |
| POST | `/api/open-platform/xhs/refresh` | 刷新 ARK token |
| GET | `/api/open-platform/weibo/authorize` | 跳转微博授权 |
| GET | `/api/open-platform/weibo/callback` | 微博 OAuth 回调 |
| POST | `/api/open-platform/disconnect` | 断开本地 token |
| POST | `/api/corpus/search` | 聚合语料检索 |

Token 本地保存在 `server/data/open-platform-tokens.json`（已 gitignore 建议勿提交密钥）。
