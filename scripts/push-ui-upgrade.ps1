# 一键上传界面升级相关文件到 GitHub（Netlify 会自动部署）
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$files = @(
  'src/App.jsx',
  'src/App.css',
  'src/data/countries.js',
  'src/data/markets.js',
  'src/data/regions/_regionFactory.js',
  'src/data/regions/china-provinces.js',
  'src/data/regions/usa-states.js',
  'src/data/regions/japan-prefectures.js',
  'src/data/regions/brazil-states.js',
  'src/data/regions/germany-states.js',
  'src/data/regions/india-states.js',
  'src/components/CulturalStoryPanel.jsx',
  'src/components/RegionPicker.jsx',
  'src/services/aiApi.js',
  'server/deepseek.js'
)
& (Join-Path $PSScriptRoot 'push-files-to-github.ps1') -Files $files
