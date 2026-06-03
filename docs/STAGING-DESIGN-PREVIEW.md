# 视觉测试版（Design Preview · 仅本地）

**不部署 Netlify**，避免消耗积分。请在本地预览新视觉，满意后再合并发布正式站。

## 最快启动（Windows）

双击项目内的 **`cross-culture-map\启动视觉测试版.bat`**

或在终端执行（注意目录）：

```powershell
cd c:\Users\ASUS\Desktop\cross-culture-map\cross-culture-map
npm run dev:staging
```

浏览器打开 **http://localhost:5173**，顶部会显示「视觉测试版 · 非正式环境」。

> 若在外层文件夹 `cross-culture-map`（上一级）也可运行：
> ```powershell
> cd c:\Users\ASUS\Desktop\cross-culture-map
> npm run dev:staging
> ```

## 接近正式打包的本地预览

```powershell
cd cross-culture-map
npm run preview:staging
```

打开 **http://localhost:4173**（会自动启动本地 API）

## 常见问题

| 现象 | 处理 |
|------|------|
| `Missing script: preview:staging` | 请进入 **`cross-culture-map\cross-culture-map`** 子目录再运行 |
| 页面白屏 | 等终端出现 `Local: http://localhost:5173` 后再打开 |
| 登录/接口失败 | 用 `dev:staging`（含后端），不要只开静态文件 |

## 满意后上线正式站

1. 合并 `staging/design-v2` → `main`
2. GitHub Actions → **Deploy Production (Manual)** → 输入 `DEPLOY`
