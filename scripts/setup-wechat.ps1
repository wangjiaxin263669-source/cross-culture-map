# 写入本机 .env 的微信登录配置（不会上传 Git）
# 用法：.\scripts\setup-wechat.ps1
param(
  [string]$AppId,
  [string]$AppSecret
)

$root = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $root ".env"

if (-not $AppId) { $AppId = Read-Host "WECHAT_OPEN_APP_ID（网站应用 AppID）" }
if (-not $AppSecret) { $AppSecret = Read-Host "WECHAT_OPEN_APP_SECRET（AppSecret）" -AsSecureString; $AppSecret = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($AppSecret)) }

if (-not $AppId.Trim() -or -not $AppSecret.Trim()) {
  Write-Host "已取消" -ForegroundColor Yellow
  exit 1
}

$lines = @()
if (Test-Path $envFile) {
  $lines = Get-Content $envFile | Where-Object {
    $_ -notmatch '^(WECHAT_OPEN_APP_ID|WECHAT_OPEN_APP_SECRET|WECHAT_REDIRECT_URI|FRONTEND_URL)='
  }
}

$lines += "WECHAT_OPEN_APP_ID=$($AppId.Trim())"
$lines += "WECHAT_OPEN_APP_SECRET=$($AppSecret.Trim())"
$lines += "WECHAT_REDIRECT_URI=http://localhost:3001/api/auth/wechat/callback"
$lines += "FRONTEND_URL=http://localhost:5173"
$lines | Set-Content $envFile -Encoding UTF8

Write-Host "已写入 $envFile" -ForegroundColor Green
Write-Host "请重启 npm run dev，登录页将出现「微信扫码登录」。" -ForegroundColor Cyan
Write-Host ""
Write-Host "线上 Netlify 还需在后台添加相同 AppID/Secret，并确认：" -ForegroundColor Yellow
Write-Host "  授权回调域：ephemeral-bubblegum-a79332.netlify.app"
Write-Host "  回调 URL：https://ephemeral-bubblegum-a79332.netlify.app/api/auth/wechat/callback"
