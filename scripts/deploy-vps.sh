#!/bin/bash
# 在国内 Ubuntu 轻量服务器上快速部署（需已安装 Node 18+、git）
set -e

echo "=== CROSS-CULTURE 国内 VPS 部署 ==="

if [ ! -f .env ]; then
  echo "请先创建 .env 并设置 DEEPSEEK_API_KEY"
  cp -n .env.example .env 2>/dev/null || true
  exit 1
fi

npm install
npm run build
npm run predeploy

if ! command -v pm2 &>/dev/null; then
  echo "安装 PM2..."
  sudo npm install -g pm2
fi

pm2 delete cross-culture 2>/dev/null || true
pm2 start npm --name cross-culture -- run start:prod
pm2 save

echo ""
echo "✅ 部署完成"
echo "   本机测试: curl http://127.0.0.1:3001/api/health"
echo "   公网访问: http://$(curl -s ifconfig.me 2>/dev/null || echo '你的公网IP'):3001"
echo "   建议配置 Nginx 反代 80 端口，见 DEPLOY-CN.md"
echo "   查看日志: pm2 logs cross-culture"
