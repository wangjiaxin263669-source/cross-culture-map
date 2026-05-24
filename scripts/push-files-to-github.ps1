param(
  [string[]]$Files = @(
    'server/app.js',
    'netlify/functions/api.mjs'
  )
)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$credInput = "url=https://github.com/wangjiaxin263669-source/cross-culture-map.git`n`n"
$token = (($credInput | git credential fill) | Where-Object { $_ -match '^password=' }) -replace '^password=', ''
if (-not $token) { throw '未找到 GitHub 凭据' }
$owner = 'wangjiaxin263669-source'
$repo = 'cross-culture-map'
$headers = @{ Authorization = "Bearer $token"; 'User-Agent' = 'cross-culture-push'; Accept = 'application/vnd.github+json' }
$msg = 'fix: parse JSON body on Netlify chat'

foreach ($repoPath in $Files) {
  $localPath = Join-Path $root ($repoPath -replace '/', '\')
  $uri = "https://api.github.com/repos/$owner/$repo/contents/$repoPath"
  $sha = $null
  try { $sha = (Invoke-RestMethod -Uri $uri -Headers $headers -Method Get).sha } catch { }
  $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($localPath))
  $body = @{ message = $msg; content = $b64 }
  if ($sha) { $body.sha = $sha }
  Invoke-RestMethod -Uri $uri -Headers $headers -Method Put -Body ($body | ConvertTo-Json) -ContentType 'application/json' | Out-Null
  Write-Host "OK $repoPath"
}
