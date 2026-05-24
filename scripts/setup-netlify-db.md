# Netlify 免费数据库（一次设置，永久保存账号/余额）

1. 打开 https://app.netlify.com → 你的站点
2. 左侧 **Extensions** → 搜索 **Netlify DB** → **Install**
3. 按提示创建免费 Neon 数据库（约 1 分钟）
4. 安装完成后 Netlify 会自动注入 `DATABASE_URL`
5. **Deploys** → **Trigger deploy** → **Deploy site**
6. 打开 `https://你的站点/api/health`，应看到 `"storage": "postgres"`

无需 VPS，免费额度内 $0。
