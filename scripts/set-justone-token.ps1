# Paste Just One API Token via dialog, write to .env
param([string]$Token)

$root = Split-Path $PSScriptRoot -Parent

if (-not $Token) {
  Add-Type -AssemblyName Microsoft.VisualBasic
  $Token = [Microsoft.VisualBasic.Interaction]::InputBox(
    'Paste your Just One API token from docs.justoneapi.com',
    'CROSS-CULTURE - Just One API',
    ''
  ).Trim()
}

if (-not $Token) {
  Write-Host 'Cancelled: no token entered.'
  exit 1
}

& (Join-Path $PSScriptRoot 'configure-env.ps1') -JustOneToken $Token

Write-Host ''
Write-Host 'Checking API status...'
try {
  $status = Invoke-RestMethod -Uri 'http://localhost:3001/api/open-platform/status' -TimeoutSec 5
  $jo = $status.platforms | Where-Object { $_.platform -eq 'justone' }
  if ($jo.connected) {
    Write-Host 'Just One API: connected OK'
  } else {
    Write-Host 'Token saved. Restart: npm run dev, then click Refresh on the page.'
  }
} catch {
  Write-Host 'Token saved. Restart npm run dev, then Refresh status in the app.'
}
