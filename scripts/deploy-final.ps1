# Final release: build, check, push to GitHub
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $root

Write-Host ''
Write-Host '=== CROSS-CULTURE FINAL DEPLOY ===' -ForegroundColor Cyan

Write-Host '[1/4] npm install...' -ForegroundColor Yellow
npm install

Write-Host '[2/4] npm run build...' -ForegroundColor Yellow
npm run build

Write-Host '[3/4] predeploy check...' -ForegroundColor Yellow
& (Join-Path $PSScriptRoot 'setup-production-env.ps1')
node scripts/predeploy.mjs
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host '[4/4] git commit and push...' -ForegroundColor Yellow
git add -A
git status -sb
$status = git status --porcelain
if (-not $status) {
  Write-Host 'Nothing to commit.' -ForegroundColor Green
} else {
  git commit -m "release: final - auth, history, wallet recharge (VPS/Docker)"
  git push origin main
  Write-Host 'Pushed to GitHub: wangjiaxin263669-source/cross-culture-map' -ForegroundColor Green
}

Write-Host ''
Write-Host 'Done. See DEPLOY-FINAL.md for VPS/Docker production.' -ForegroundColor Cyan
