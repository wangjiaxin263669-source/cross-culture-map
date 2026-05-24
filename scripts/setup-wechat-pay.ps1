# 将微信收款码图片复制到网站 public 目录
$dest = Join-Path $PSScriptRoot "..\public\wechat-pay-qr.png"
$sources = @(
  "$env:USERPROFILE\Desktop\微信收款码.png",
  "$env:USERPROFILE\Desktop\wechat-pay.png",
  "$env:USERPROFILE\Desktop\收款码.png"
)

foreach ($src in $sources) {
  if (Test-Path $src) {
    Copy-Item $src $dest -Force
    Write-Host "已复制: $src -> $dest" -ForegroundColor Green
    Write-Host "请提交到 GitHub 并在 Netlify 设置:"
    Write-Host "  PAYMENT_PROVIDER=wechat_qr"
    Write-Host "  WECHAT_PAY_QR_URL=/wechat-pay-qr.png"
    Write-Host "  RECHARGE_ADMIN_SECRET=你的随机密钥"
    exit 0
  }
}

Write-Host "未找到收款码图片。请手动将微信收款码保存为:" -ForegroundColor Yellow
Write-Host $dest
