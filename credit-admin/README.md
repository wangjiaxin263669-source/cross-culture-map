# 单独部署为「管理员积分充值」小站（与主站分离）

## 用途

给 [跨文化研究设计平台](https://ephemeral-bubblegum-a79332.netlify.app) 已注册手机号充值 AI 余额，供管理者自测与给用户到账。

## 部署步骤（Netlify 新建站点）

1. Netlify → **Add new site** → **Deploy manually** 或连接同一 GitHub 仓库
2. **Base directory**: `credit-admin`（若在 monorepo 根目录选子目录）
3. **Publish directory**: `.`（即 credit-admin 根）
4. 无需 build command（纯静态 HTML）
5. 建议站点 URL 仅自己收藏，不要写在主站导航里

## 使用

1. 打开管理员小站
2. **主站 API** 填 `https://ephemeral-bubblegum-a79332.netlify.app`
3. **管理员密钥** 填主站环境变量 `RECHARGE_ADMIN_SECRET`（当前与 `netlify.toml` / 本地脚本一致）
4. 输入用户 **手机号** 与 **金额（元）** → 确认充值

## 安全

- 密钥保存在浏览器 `sessionStorage`，关闭标签页后仍在本会话有效
- 请勿把密钥写进 GitHub 公开仓库
- 生产环境建议定期更换 `RECHARGE_ADMIN_SECRET`
