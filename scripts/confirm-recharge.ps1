# 管理员：核对微信到账后，将用户充值订单入账
# 用法：.\scripts\confirm-recharge.ps1 -OrderId "订单UUID"
param(
  [Parameter(Mandatory = $true)]
  [string]$OrderId,
  [string]$SiteUrl = "https://ephemeral-bubblegum-a79332.netlify.app",
  [string]$Secret = $(if ($env:RECHARGE_ADMIN_SECRET) { $env:RECHARGE_ADMIN_SECRET } else { 'CcMapProdAdmin_7f3e9a2b' })
)

if (-not $Secret) {
  Write-Host "请设置环境变量 RECHARGE_ADMIN_SECRET，或用 -Secret 参数" -ForegroundColor Red
  exit 1
}

$uri = "$SiteUrl/api/wallet/recharge/admin/confirm/$OrderId"
try {
  $r = Invoke-RestMethod -Uri $uri -Method POST -Headers @{ "X-Admin-Secret" = $Secret } -TimeoutSec 30
  Write-Host $r.message -ForegroundColor Green
  $r | ConvertTo-Json
} catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
  if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
}
