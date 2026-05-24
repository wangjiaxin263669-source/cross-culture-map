# 查看待核实充值订单
param(
  [string]$SiteUrl = "https://ephemeral-bubblegum-a79332.netlify.app",
  [string]$Secret = $env:RECHARGE_ADMIN_SECRET
)

if (-not $Secret) {
  Write-Host "请设置 RECHARGE_ADMIN_SECRET" -ForegroundColor Red
  exit 1
}

$uri = "$SiteUrl/api/wallet/recharge/admin/pending"
$r = Invoke-RestMethod -Uri $uri -Headers @{ "X-Admin-Secret" = $Secret }
$r.orders | ForEach-Object {
  Write-Host "---"
  Write-Host "订单: $($_.id)"
  Write-Host "金额: ¥$([math]::Round($_.amountCents/100, 2))  状态: $($_.status)"
  Write-Host "备注码: $($_.id.Replace('-','').Substring($_.id.Length-9).ToUpper())"
  Write-Host "时间: $($_.createdAt)"
}
