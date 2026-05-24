# 非交互写入 .env 密钥（保留已有 DEEPSEEK）
# 用法示例:
#   .\scripts\configure-env.ps1 -JustOneToken "你的token"
#   .\scripts\configure-env.ps1 -SerperKey "xxx" -XhsAppId "id" -XhsAppSecret "secret"

param(
  [string]$JustOneToken,
  [string]$SerperKey,
  [string]$XhsAppId,
  [string]$XhsAppSecret,
  [string]$XhsAccessToken,
  [string]$WeiboAppKey,
  [string]$WeiboAppSecret,
  [string]$WeiboAccessToken
)

$root = Split-Path $PSScriptRoot -Parent
$envPath = Join-Path $root ".env"

if (-not (Test-Path $envPath)) {
  Copy-Item (Join-Path $root ".env.example") $envPath
}

function Set-Line($key, $value) {
  if (-not $value) { return }
  $content = Get-Content $envPath -Raw -Encoding UTF8
  $line = "$key=$value"
  if ($content -match "(?m)^$key=.*$") {
    $content = $content -replace "(?m)^$key=.*$", $line
  } elseif ($content -match "(?m)^#\s*$key=.*$") {
    $content = $content -replace "(?m)^#\s*$key=.*$", $line
  } else {
    $content = $content.TrimEnd() + "`n$line`n"
  }
  Set-Content $envPath $content -Encoding UTF8 -NoNewline
  Write-Host "OK $key" -ForegroundColor Green
}

Set-Line "JUSTONE_API_TOKEN" $JustOneToken
Set-Line "SERPER_API_KEY" $SerperKey
Set-Line "XHS_ARK_APP_ID" $XhsAppId
Set-Line "XHS_ARK_APP_SECRET" $XhsAppSecret
Set-Line "XHS_ARK_ACCESS_TOKEN" $XhsAccessToken
Set-Line "WEIBO_APP_KEY" $WeiboAppKey
Set-Line "WEIBO_APP_SECRET" $WeiboAppSecret
Set-Line "WEIBO_ACCESS_TOKEN" $WeiboAccessToken

Write-Host "`n已更新 $envPath — 请重启 npm run dev" -ForegroundColor Cyan
