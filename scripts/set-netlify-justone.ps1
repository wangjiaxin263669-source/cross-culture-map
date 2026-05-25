# Push Just One API env to Netlify production (reads local .env, never prints token)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$envFile = Join-Path $root '.env'
if (-not (Test-Path $envFile)) { throw '.env not found' }

$justone = $null
$base = 'https://api.justoneapi.com'
Get-Content $envFile -Encoding UTF8 | ForEach-Object {
  if ($_ -match '^JUSTONE_API_TOKEN=(.+)$') { $justone = $matches[1].Trim() }
  if ($_ -match '^JUSTONE_API_BASE=(.+)$') { $base = $matches[1].Trim() }
}
if (-not $justone) { throw 'JUSTONE_API_TOKEN missing in .env — run scripts/set-justone-token.ps1 first' }

$siteId = '6c06b462-2090-44e3-8234-e6d929d01674'
$siteUrl = 'https://ephemeral-bubblegum-a79332.netlify.app'

Write-Host "Linking Netlify site..." -ForegroundColor Cyan
npx --yes netlify-cli@17.38.1 link --id $siteId 2>&1 | Out-Host

Write-Host "Setting production env vars (token hidden)..." -ForegroundColor Cyan
npx --yes netlify-cli@17.38.1 env:set JUSTONE_API_TOKEN $justone --context production --force 2>&1 | Out-Host
npx --yes netlify-cli@17.38.1 env:set JUSTONE_API_BASE $base --context production --force 2>&1 | Out-Host

Write-Host "Triggering production deploy..." -ForegroundColor Cyan
npx --yes netlify-cli@17.38.1 deploy --prod --build 2>&1 | Out-Host

Write-Host "Waiting for API..." -ForegroundColor Cyan
for ($i = 1; $i -le 30; $i++) {
  Start-Sleep -Seconds 10
  try {
    $st = Invoke-RestMethod -Uri "$siteUrl/api/open-platform/status" -TimeoutSec 25
    $jo = $st.platforms.justone
    if ($jo.configured -and $jo.connected) {
      Write-Host "Production OK: Just One API connected" -ForegroundColor Green
      Write-Host $siteUrl
      exit 0
    }
  } catch { }
}
Write-Host "Env set. Deploy may still be building — check $siteUrl in 2 min" -ForegroundColor Yellow
