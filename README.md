# CROSS-CULTURE · 跨文化研究设计决策平台

基于 Hofstede 文化维度、3D 地球交互与 **DeepSeek AI**（`cross-cultural-research` 智能体）的跨文化产品设计平台。

## 功能

- 🌍 交互式地球仪 · 多国文化维度雷达图
- 📚 课程 PDF 知识库 RAG
- 💬 跨文化研究专家对话助手
- 📄 本地化设计报告一键生成

## 快速开始

```bash
npm install
cp .env.example .env   # 填入 DEEPSEEK_API_KEY
npm run dev
```

开发地址见终端（通常 `http://localhost:5173`）。

## 上线

```bash
npm run predeploy   # 自检
npm start           # 本地生产预览 → http://localhost:3001
```

- **Netlify 部署** → **[DEPLOY-NETLIFY.md](./DEPLOY-NETLIFY.md)**（连接 GitHub 自动发布）
- **国内稳定上线** → **[DEPLOY-CN.md](./DEPLOY-CN.md)**（腾讯云/阿里云轻量 + PM2）
- 其他海外 → [DEPLOY.md](./DEPLOY.md)（Render / Docker）

## 技术栈

React 18 · Vite · Express · DeepSeek API · react-globe.gl · Recharts
