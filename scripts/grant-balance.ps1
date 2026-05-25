# 管理员：按手机号赠送余额
# 用法：.\scripts\grant-balance.ps1 -Phone 15016249923 -Yuan 10
param(
  [Parameter(Mandatory = $true)]
  [string]$Phone,
  [double]$Yuan = 10,
  [string]$Note = '管理员赠送',
  [string]$SiteUrl = 'https://ephemeral-bubblegum-a79332.netlify.app',
  [string]$Secret = $(if ($env:RECHARGE_ADMIN_SECRET) { $env:RECHARGE_ADMIN_SECRET } else { 'CcMapProdAdmin_7f3e9a2b' })
)

$uri = "$SiteUrl/api/wallet/admin/grant"
$body = @{ phone = $Phone; amountYuan = $Yuan; note = $Note } | ConvertTo-Json
try {
  $r = Invoke-RestMethod -Uri $uri -Method POST -Headers @{ 'X-Admin-Secret' = $Secret; 'Content-Type' = 'application/json' } -Body $body -TimeoutSec 30
  Write-Host $r.message -ForegroundColor Green
  $r | ConvertTo-Json
} catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
  if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
  exit 1
}
