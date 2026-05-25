# 一键：Netlify Build Hook + GitHub Secrets（全自动托管用）
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
Write-Host "配置 NETLIFY_BUILD_HOOK / NETLIFY_AUTH_TOKEN …" -ForegroundColor Cyan
node scripts/setup-github-netlify-secret.mjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "完成。" -ForegroundColor Green
