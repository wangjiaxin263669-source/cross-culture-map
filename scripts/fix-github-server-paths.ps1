# 将本地修复文件上传到 GitHub 正确路径（server/ 与 src/services/）
$ErrorActionPreference = 'Stop'

$credInput = "url=https://github.com/wangjiaxin263669-source/cross-culture-map.git`n`n"
$credOut = $credInput | git credential fill 2>$null
$token = ($credOut | Where-Object { $_ -match '^password=' }) -replace '^password=', ''
if (-not $token) { throw '未找到 GitHub 凭据，请先在 Git 中登录 GitHub' }

$owner = 'wangjiaxin263669-source'
$repo = 'cross-culture-map'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

$headers = @{
  Authorization = "Bearer $token"
  'User-Agent'  = 'cross-culture-fix'
  Accept        = 'application/vnd.github+json'
}
$msg = 'fix: correct server paths for Netlify API'

function Set-GhFile([string]$repoPath, [string]$localPath) {
  $uri = "https://api.github.com/repos/$owner/$repo/contents/$repoPath"
  $sha = $null
  try {
    $existing = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
    $sha = $existing.sha
  } catch { }
  $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($localPath))
  $body = @{ message = $msg; content = $b64 }
  if ($sha) { $body.sha = $sha }
  Invoke-RestMethod -Uri $uri -Headers $headers -Method Put -Body ($body | ConvertTo-Json) -ContentType 'application/json' | Out-Null
  Write-Host "OK  $repoPath"
}

Set-GhFile 'server/paths.js' (Join-Path $root 'server\paths.js')
Set-GhFile 'server/app.js' (Join-Path $root 'server\app.js')
Set-GhFile 'server/knowledge.js' (Join-Path $root 'server\knowledge.js')
Set-GhFile 'server/loadSkill.js' (Join-Path $root 'server\loadSkill.js')
Set-GhFile 'src/services/aiApi.js' (Join-Path $root 'src\services\aiApi.js')

foreach ($bad in @('app.js', 'paths.js', 'knowledge.js', 'loadSkill.js', 'aiApi.js')) {
  $uri = "https://api.github.com/repos/$owner/$repo/contents/$bad"
  try {
    $existing = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
    $body = @{ message = 'chore: remove misplaced root files'; sha = $existing.sha }
    Invoke-RestMethod -Uri $uri -Headers $headers -Method Delete -Body ($body | ConvertTo-Json) -ContentType 'application/json' | Out-Null
    Write-Host "DEL $bad"
  } catch {
    Write-Host "SKIP $bad"
  }
}

Write-Host '完成。等待 Netlify 自动部署 2-5 分钟后访问 /api/health'
