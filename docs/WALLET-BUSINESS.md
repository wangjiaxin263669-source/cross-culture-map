# 盈利与充值说明

## 商业模式

- **用户**在平台充值 → 钱进入您的**微信收款码**
- **您**自行在 [DeepSeek](https://platform.deepseek.com) 充值 API，承担模型成本
- 用户每次使用 AI 从**平台余额**扣费（对话约 ¥0.02/次，三步报告约 ¥0.10/次，**模拟 AI 访谈完整流程约 ¥0.35/次**）

## 赠送规则（已内置）

| 场景 | 金额 |
|------|------|
| 新用户注册 | ¥0.50 |
| 每日首次登录 | ¥0.06/天（注册当天不重复发） |
| 每日登录赠送有效期 | 当日有效；未使用部分在次日零点（北京时间）自动清零 |

可在 Netlify / `.env` 用 `NEW_USER_BONUS_CENTS=50`、`DAILY_LOGIN_BONUS_CENTS=6` 调整。

## 微信收款码上线（3 步）

1. 将微信收款码图片保存为 `public/wechat-pay-qr.png`（或运行 `.\scripts\setup-wechat-pay.ps1`）
2. `git push` 后，在 Netlify → Environment variables 添加：
   - `PAYMENT_PROVIDER` = `wechat_qr`
   - `WECHAT_PAY_QR_URL` = `/wechat-pay-qr.png`
   - `RECHARGE_ADMIN_SECRET` = 随机长密码（仅您知道）
   - `NEW_USER_BONUS_CENTS` = `50`（0.5 元）
   - `DAILY_LOGIN_BONUS_CENTS` = `6`（0.06 元，未使用次日零点清零）
3. 用户付款后，您在微信里核对备注码，在电脑上执行入账：

```powershell
$env:RECHARGE_ADMIN_SECRET = "您的密钥"
.\scripts\list-pending-recharge.ps1
.\scripts\confirm-recharge.ps1 -OrderId "订单UUID"
```

## 本地开发

`.env` 保持 `PAYMENT_PROVIDER=mock` 可一键模拟充值，无需真实付款。
