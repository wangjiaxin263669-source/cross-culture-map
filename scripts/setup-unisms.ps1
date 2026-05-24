# 配置 UniSMS（仅写入本机 .env，不会上传 Git）
# 用法：.\scripts\setup-unisms.ps1
param(
  [string]$AccessKeyId,
  [string]$Signature = "跨文化平台"
)

$envFile = Join-Path $PSScriptRoot ".." ".env" | Resolve-Path -ErrorAction SilentlyContinue
if (-not $envFile) {
  $envFile = Join-Path $PSScriptRoot ".." ".env"
  Copy-Item (Join-Path $PSScriptRoot ".." ".env.example") $envFile -ErrorAction SilentlyContinue
}

if (-not $AccessKeyId) {
  $AccessKeyId = Read-Host "请输入 UniSMS AccessKey ID（https://unisms.apistd.com 控制台）"
}
if (-not $AccessKeyId.Trim()) {
  Write-Host "已取消" -ForegroundColor Yellow
  exit 1
}

$lines = @()
if (Test-Path $envFile) {
  $lines = Get-Content $envFile | Where-Object {
    $_ -notmatch '^(SMS_PROVIDER|UNISMS_|SMS_EXPOSE_DEV_CODE)='
  }
}
$lines += "SMS_PROVIDER=unisms"
$lines += "UNISMS_ACCESS_KEY_ID=$($AccessKeyId.Trim())"
$lines += "UNISMS_SIGNATURE=$Signature"
$lines += "SMS_EXPOSE_DEV_CODE=false"
$lines | Set-Content $envFile -Encoding UTF8

Write-Host "已写入 $envFile" -ForegroundColor Green
Write-Host "本地请重启 npm run dev。线上请在 Netlify → Environment variables 添加相同三项，并设 SMS_EXPOSE_DEV_CODE=false" -ForegroundColor Cyan
