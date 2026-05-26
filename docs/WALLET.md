# 账户余额与充值

## 机制

- 用户账户有余额（单位：元，内部以**分**存储）。
- 每次调用 DeepSeek（对话、报告、模拟调研等）前**先扣费**；**生成失败、接口报错、前端超时断开**时，该步骤费用**自动退回**余额（流水类型 `refund`）。
- 表单校验（如未填主题）在扣费前拦截，**不扣费**。
- 失败时接口会返回 `refunded: true` 与 `refundedYuan`；前端会刷新右上角余额并提示「已退回」。
- 模拟调研第 3 步（访谈）按整场 `batchId` 只扣一次；该场任一人设访谈失败时，本场未成功的扣费也会退回。
- 默认单价见 `.env` 中 `WALLET_*_COST_CENTS`（如对话 ¥0.02、三步报告 ¥0.10 等）。

## 开发环境

`.env` 设置：

```env
PAYMENT_PROVIDER=mock
```

右上角头像 → **充值余额** → 选择档位 → 立即到账（无需真实支付）。

## 正式上线收款

1. 使用 **VPS** 部署（需持久化 `server/data/platform-db.json`）。
2. 注册易支付兼容平台（如虎皮椒、码支付等），获取 `pid` 与 `key`。
3. 配置：

```env
PAYMENT_PROVIDER=zpay
ZPAY_PID=商户ID
ZPAY_KEY=商户密钥
ZPAY_API_BASE=https://支付平台域名
API_PUBLIC_URL=https://你的API域名
PAYMENT_RETURN_URL=https://你的前端域名/?recharge=success
FRONTEND_URL=https://你的前端域名
```

4. 在支付平台后台填写**异步通知地址**：

`https://你的API域名/api/wallet/recharge/notify`

用户支付成功后，平台回调该地址，系统自动给用户加余额。

## 说明

- 用户充值的钱进入**你的支付商户账户**；DeepSeek 费用在**你的 DeepSeek 账户**扣款。需定期用收款余额为 DeepSeek 充值 API 额度。
- **Netlify 部署**：余额与账号数据保存在 **Netlify Blobs**（免费），无需 VPS。
- **本地开发**：数据在 `server/data/platform-db.json`，与线上分开。
