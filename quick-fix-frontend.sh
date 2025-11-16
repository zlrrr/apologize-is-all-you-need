#!/bin/bash

# 快速修复前端连接问题
# 适用于本地开发环境

set -e

echo "========================================="
echo "🚀 前端连接快速修复工具"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 读取后端 URL
echo "请提供您的 Render 后端 URL:"
echo "（可在 Render Dashboard 的服务详情页顶部找到）"
echo ""
read -p "📍 后端 URL: " BACKEND_URL

if [ -z "$BACKEND_URL" ]; then
  echo "❌ URL 不能为空"
  exit 1
fi

# 验证 URL 格式
if [[ ! "$BACKEND_URL" =~ ^https:// ]]; then
  echo "⚠️  URL 应该以 https:// 开头"
  read -p "继续？(y/n): " CONTINUE
  if [ "$CONTINUE" != "y" ]; then
    exit 1
  fi
fi

# 移除尾部斜杠
BACKEND_URL="${BACKEND_URL%/}"

echo ""
echo "========================================="
echo "执行修复步骤..."
echo "========================================="

# 步骤 1: 创建 .env.local
echo ""
echo "[1/4] 📝 创建 frontend/.env.local 文件..."

if [ -f "frontend/.env.local" ]; then
  echo "文件已存在，备份为 .env.local.backup"
  cp frontend/.env.local frontend/.env.local.backup
fi

cat > frontend/.env.local << EOF
# 后端 API URL
# 由 quick-fix-frontend.sh 自动生成于 $(date)
VITE_API_URL=$BACKEND_URL
EOF

echo -e "${GREEN}✅ 已创建 frontend/.env.local${NC}"
echo "内容:"
cat frontend/.env.local

# 步骤 2: 验证后端可访问
echo ""
echo "[2/4] 🔍 验证后端服务..."

HEALTH_CHECK=$(curl -s "$BACKEND_URL/api/health" 2>&1 || echo "FAILED")

if echo "$HEALTH_CHECK" | grep -q "healthy"; then
  echo -e "${GREEN}✅ 后端服务正常${NC}"
else
  echo -e "${YELLOW}⚠️  后端服务可能未就绪${NC}"
  echo "响应: $HEALTH_CHECK"
  echo ""
  echo "可能原因："
  echo "  - 服务正在休眠，请等待 30-60 秒后重试"
  echo "  - URL 不正确"
  echo "  - 服务未启动，检查 Render Dashboard"
fi

# 步骤 3: 检查 CORS
echo ""
echo "[3/4] 🌐 检查 CORS 配置..."

CORS_CHECK=$(curl -i -s -X OPTIONS "$BACKEND_URL/api/health" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" 2>&1)

if echo "$CORS_CHECK" | grep -q "Access-Control-Allow-Origin"; then
  echo -e "${GREEN}✅ CORS 已正确配置${NC}"
else
  echo -e "${YELLOW}⚠️  CORS 未配置，前端可能仍然无法连接${NC}"
  echo ""
  echo "修复方法："
  echo "1. 登录 Render Dashboard: https://dashboard.render.com"
  echo "2. 进入您的服务 → Settings → Environment"
  echo "3. 添加两个环境变量："
  echo ""
  echo "   Key:   FRONTEND_URL"
  echo "   Value: http://localhost:3000"
  echo ""
  echo "   Key:   CORS_ORIGIN"
  echo "   Value: http://localhost:3000"
  echo ""
  echo "4. 保存后等待重新部署（2-3 分钟）"
  echo ""
  read -p "按 Enter 继续..."
fi

# 步骤 4: 创建 .env.example
echo ""
echo "[4/4] 📄 创建 frontend/.env.example（示例文件）..."

cat > frontend/.env.example << 'EOF'
# API 后端 URL
# 本地开发：使用您的 Render 后端 URL
# 生产环境：将在 Vercel 等平台配置
VITE_API_URL=https://your-backend.onrender.com
EOF

echo -e "${GREEN}✅ 已创建 frontend/.env.example${NC}"

# 总结
echo ""
echo "========================================="
echo "✅ 修复完成！"
echo "========================================="
echo ""
echo "下一步操作："
echo ""
echo "1. 重启前端开发服务器:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "2. 打开浏览器访问: http://localhost:3000"
echo ""
echo "3. 打开浏览器控制台（F12），验证:"
echo "   - Console 标签应显示: [API Request] $BACKEND_URL/api/..."
echo "   - Network 标签应显示请求到 $BACKEND_URL"
echo ""
echo "如果仍然有问题："
echo "  - 运行诊断工具: ./diagnose-connection.sh"
echo "  - 查看详细指南: cat FRONTEND_BACKEND_CONNECTION_GUIDE.md"
echo ""
echo "========================================="
