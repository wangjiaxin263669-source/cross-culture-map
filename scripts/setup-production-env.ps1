$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$envPath = Join-Path $root '.env'
$example = Join-Path $root '.env.production.example'

if (-not (Test-Path $envPath)) {
  if (Test-Path $example) { Copy-Item $example $envPath }
  else { Copy-Item (Join-Path $root '.env.example') $envPath }
}

$content = Get-Content $envPath -Raw -ErrorAction SilentlyContinue
if ($content -notmatch 'JWT_SECRET=') {
  $secret = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
  Add-Content $envPath "`nJWT_SECRET=$secret"
}
if ($content -notmatch 'PAYMENT_PROVIDER=') {
  Add-Content $envPath "`nPAYMENT_PROVIDER=mock"
}
if ($content -notmatch 'STORAGE_BACKEND=') {
  Add-Content $envPath "`nSTORAGE_BACKEND=file"
}
