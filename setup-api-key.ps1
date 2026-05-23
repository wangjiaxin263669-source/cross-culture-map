# 一键配置 DeepSeek API Key
$envPath = Join-Path $PSScriptRoot ".env"

Write-Host ""
Write-Host "=== 跨文化平台 · DeepSeek API Key 配置 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 浏览器将打开 DeepSeek 开放平台"
Write-Host "2. 登录后进入 API Keys，创建并复制密钥"
Write-Host ""

Start-Process "https://platform.deepseek.com/api_keys"

$key = Read-Host "请把复制的 API 密钥粘贴到这里，然后按 Enter"

if ([string]::IsNullOrWhiteSpace($key)) {
  Write-Host "未输入密钥，已取消。" -ForegroundColor Yellow
  exit 1
}

$key = $key.Trim()
$content = @"
DEEPSEEK_API_KEY=$key
DEEPSEEK_MODEL=deepseek-chat
PORT=3001
"@

Set-Content -Path $envPath -Value $content -Encoding UTF8
Write-Host ""
Write-Host "已写入 .env ！" -ForegroundColor Green
Write-Host "接下来执行: npm run dev" -ForegroundColor Green
Write-Host ""
