# CROSS-CULTURE · 开放平台 API 配置向导
# 在 PowerShell 中运行: .\setup-open-platform.ps1

$envPath = Join-Path $PSScriptRoot ".env"
$examplePath = Join-Path $PSScriptRoot ".env.example"

Write-Host "`n=== CROSS-CULTURE 开放平台配置向导 ===`n" -ForegroundColor Cyan

if (-not (Test-Path $envPath)) {
  if (Test-Path $examplePath) {
    Copy-Item $examplePath $envPath
    Write-Host "已从 .env.example 创建 .env`n"
  } else {
    New-Item $envPath -ItemType File | Out-Null
  }
}

function Set-EnvLine($key, $value) {
  $content = Get-Content $envPath -Raw -ErrorAction SilentlyContinue
  if ($null -eq $content) { $content = "" }
  $pattern = "(?m)^$key=.*$"
  $line = "$key=$value"
  if ($content -match $pattern) {
    $content = $content -replace $pattern, $line
  } else {
    $content = $content.TrimEnd() + "`n$line`n"
  }
  Set-Content $envPath $content -Encoding UTF8
  Write-Host "  OK $key" -ForegroundColor Green
}

Write-Host "1) DeepSeek（必填，若已配置可回车跳过）"
$ds = Read-Host "DEEPSEEK_API_KEY"
if ($ds) { Set-EnvLine "DEEPSEEK_API_KEY" $ds }

Write-Host "`n2) Just One API — 小红书笔记/微博搜索（模拟调研语料，推荐）"
Write-Host "   注册: https://docs.justoneapi.com"
$jo = Read-Host "JUSTONE_API_TOKEN"
if ($jo) { Set-EnvLine "JUSTONE_API_TOKEN" $jo }

Write-Host "`n3) 小红书官方 ARK 开放平台（商家 OAuth，可选）"
Write-Host "   控制台: https://open.xiaohongshu.com"
$xhsId = Read-Host "XHS_ARK_APP_ID"
$xhsSec = Read-Host "XHS_ARK_APP_SECRET"
if ($xhsId) { Set-EnvLine "XHS_ARK_APP_ID" $xhsId }
if ($xhsSec) { Set-EnvLine "XHS_ARK_APP_SECRET" $xhsSec }
Set-EnvLine "XHS_ARK_REDIRECT_URI" "http://localhost:3001/api/open-platform/xhs/callback"

Write-Host "`n4) 微博开放平台 OAuth（可选）"
Write-Host "   控制台: https://open.weibo.com"
$wbKey = Read-Host "WEIBO_APP_KEY"
$wbSec = Read-Host "WEIBO_APP_SECRET"
if ($wbKey) { Set-EnvLine "WEIBO_APP_KEY" $wbKey }
if ($wbSec) { Set-EnvLine "WEIBO_APP_SECRET" $wbSec }
Set-EnvLine "WEIBO_REDIRECT_URI" "http://localhost:3001/api/open-platform/weibo/callback"

Write-Host "`n5) Serper 全网搜索（可选）"
$serper = Read-Host "SERPER_API_KEY"
if ($serper) { Set-EnvLine "SERPER_API_KEY" $serper }

Write-Host "`n配置已写入 .env" -ForegroundColor Green
Write-Host "下一步:"
Write-Host "  1. 在小红书/微博控制台将回调地址设为上面显示的 localhost:3001 地址"
Write-Host "  2. 运行 npm run dev"
Write-Host "  3. 打开 http://localhost:5174 → 模拟调研 → 开放平台连接 → 授权连接"
Write-Host ""

$open = Read-Host "是否用浏览器打开本地健康检查? (y/n)"
if ($open -eq 'y') {
  Start-Process "http://localhost:3001/api/open-platform/status"
}
