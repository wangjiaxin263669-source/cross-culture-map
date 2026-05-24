# 一键推送到 GitHub，触发 Netlify 正式部署
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

git add -A
$status = git status --porcelain
if ($status) {
  git -c user.name="wangjiaxin263669-source" -c user.email="wangjiaxin263669-source@users.noreply.github.com" commit -m "deploy: production wechat QR payment"
}
git push origin main

$site = "https://ephemeral-bubblegum-a79332.netlify.app"
Write-Host "等待 Netlify 部署..."
for ($i = 1; $i -le 24; $i++) {
  Start-Sleep -Seconds 10
  try {
    $h = Invoke-RestMethod -Uri "$site/api/health" -TimeoutSec 20
    if ($h.ok -and $h.payment.wechatQrMode) {
      Write-Host "部署成功: wechat_qr 已启用"
      exit 0
    }
  } catch { }
}
Write-Host "已推送，Netlify 仍在构建中，请稍后访问 $site"
exit 0
