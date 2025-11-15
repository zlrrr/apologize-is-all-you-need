#!/bin/bash

# 前后端连接诊断工具
# 用于快速诊断前端无法连接后端的问题

set -e

echo "========================================="
echo "🔍 前后端连接诊断工具"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 读取配置
echo "请提供以下信息："
echo ""
read -p "📍 后端 URL (例如: https://apologize-backend-xxx.onrender.com): " BACKEND_URL

if [ -z "$BACKEND_URL" ]; then
  echo -e "${RED}❌ 后端 URL 不能为空${NC}"
  exit 1
fi

echo ""
echo "前端在哪里运行？"
echo "1) 本地开发环境 (npm run dev)"
echo "2) Vercel 或其他部署平台"
read -p "请选择 (1 或 2): " FRONTEND_ENV

FRONTEND_ORIGIN=""
if [ "$FRONTEND_ENV" = "1" ]; then
  FRONTEND_ORIGIN="http://localhost:3000"
  echo "使用本地开发环境: $FRONTEND_ORIGIN"
elif [ "$FRONTEND_ENV" = "2" ]; then
  read -p "📍 前端 URL (例如: https://your-app.vercel.app): " FRONTEND_ORIGIN
else
  echo -e "${RED}❌ 无效的选择${NC}"
  exit 1
fi

echo ""
echo "========================================="
echo "开始诊断..."
echo "========================================="

# 测试 1: 后端健康检查
echo ""
echo "[1/6] 🏥 检查后端健康状态..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/health" 2>&1 || echo "FAILED")

if echo "$HEALTH_RESPONSE" | tail -1 | grep -q "200"; then
  HEALTH_DATA=$(echo "$HEALTH_RESPONSE" | head -n -1)
  if echo "$HEALTH_DATA" | grep -q "healthy"; then
    echo -e "${GREEN}✅ 后端运行正常${NC}"
    echo "响应: $HEALTH_DATA"
  else
    echo -e "${YELLOW}⚠️  后端响应异常${NC}"
    echo "响应: $HEALTH_DATA"
  fi
else
  echo -e "${RED}❌ 后端健康检查失败${NC}"
  echo "可能原因："
  echo "  - 服务正在休眠（免费计划），请等待 30-60 秒"
  echo "  - 服务未正确启动，检查 Render 日志"
  echo "  - URL 错误"
  echo ""
  echo "响应: $HEALTH_RESPONSE"
fi

# 测试 2: LLM 服务检查
echo ""
echo "[2/6] 🤖 检查 LLM 服务..."
LLM_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/health/llm" 2>&1 || echo "FAILED")

if echo "$LLM_RESPONSE" | tail -1 | grep -q "200"; then
  LLM_DATA=$(echo "$LLM_RESPONSE" | head -n -1)
  if echo "$LLM_DATA" | grep -q "healthy"; then
    echo -e "${GREEN}✅ LLM 服务正常${NC}"
    echo "响应: $LLM_DATA"
  else
    echo -e "${YELLOW}⚠️  LLM 服务不可用${NC}"
    echo "响应: $LLM_DATA"
    echo ""
    echo "可能原因："
    echo "  - LLM_PROVIDER 环境变量未设置"
    echo "  - API Key 未配置或无效"
    echo "  - API Key 额度用尽"
  fi
else
  echo -e "${RED}❌ LLM 健康检查失败${NC}"
  echo "响应: $LLM_RESPONSE"
fi

# 测试 3: CORS Preflight 检查
echo ""
echo "[3/6] 🌐 检查 CORS 配置..."
CORS_RESPONSE=$(curl -i -s -X OPTIONS "$BACKEND_URL/api/health" \
  -H "Origin: $FRONTEND_ORIGIN" \
  -H "Access-Control-Request-Method: GET" 2>&1)

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
  ALLOWED_ORIGIN=$(echo "$CORS_RESPONSE" | grep "Access-Control-Allow-Origin" | cut -d' ' -f2 | tr -d '\r')
  echo -e "${GREEN}✅ CORS 配置正确${NC}"
  echo "允许的 Origin: $ALLOWED_ORIGIN"
else
  echo -e "${RED}❌ CORS 配置缺失或错误${NC}"
  echo ""
  echo "修复方法："
  echo "1. 登录 Render Dashboard: https://dashboard.render.com"
  echo "2. 进入您的服务 → Settings → Environment"
  echo "3. 添加以下环境变量："
  echo ""
  echo "   Key:   FRONTEND_URL"
  echo "   Value: $FRONTEND_ORIGIN"
  echo ""
  echo "   Key:   CORS_ORIGIN"
  echo "   Value: $FRONTEND_ORIGIN"
  echo ""
  echo "4. 保存后等待自动重新部署（2-3 分钟）"
fi

# 测试 4: 实际 API 调用（带 Origin）
echo ""
echo "[4/6] 📡 测试实际 API 调用..."
API_RESPONSE=$(curl -i -s "$BACKEND_URL/api/health" \
  -H "Origin: $FRONTEND_ORIGIN" 2>&1)

if echo "$API_RESPONSE" | grep -q "HTTP/.* 200"; then
  if echo "$API_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✅ API 调用成功，CORS 头正确${NC}"
  else
    echo -e "${YELLOW}⚠️  API 调用成功，但缺少 CORS 头${NC}"
    echo "这会导致浏览器阻止请求"
  fi
else
  echo -e "${RED}❌ API 调用失败${NC}"
fi

# 测试 5: 前端环境变量检查
echo ""
echo "[5/6] ⚙️  检查前端环境变量..."

if [ "$FRONTEND_ENV" = "1" ]; then
  # 本地开发环境
  if [ -f "frontend/.env.local" ]; then
    echo -e "${GREEN}✅ .env.local 文件存在${NC}"
    echo "内容:"
    cat frontend/.env.local

    if grep -q "VITE_API_URL.*$BACKEND_URL" frontend/.env.local; then
      echo -e "${GREEN}✅ VITE_API_URL 配置正确${NC}"
    else
      echo -e "${YELLOW}⚠️  VITE_API_URL 可能不正确${NC}"
      echo ""
      echo "建议的配置:"
      echo "VITE_API_URL=$BACKEND_URL"
    fi
  else
    echo -e "${RED}❌ .env.local 文件不存在${NC}"
    echo ""
    echo "创建文件的命令:"
    echo "cd frontend && cat > .env.local << 'EOF'"
    echo "VITE_API_URL=$BACKEND_URL"
    echo "EOF"
    echo ""
    echo "创建后需要重启前端开发服务器！"
  fi
else
  # Vercel 或其他平台
  echo -e "${YELLOW}⚠️  需要在部署平台配置环境变量${NC}"
  echo ""
  echo "Vercel 配置步骤:"
  echo "1. 访问: https://vercel.com/dashboard"
  echo "2. 选择项目 → Settings → Environment Variables"
  echo "3. 添加:"
  echo "   Name:  VITE_API_URL"
  echo "   Value: $BACKEND_URL"
  echo "4. 重新部署项目"
fi

# 测试 6: 连接延迟测试
echo ""
echo "[6/6] ⏱️  测试连接延迟..."
START_TIME=$(date +%s%3N)
curl -s "$BACKEND_URL/api/health" > /dev/null 2>&1
END_TIME=$(date +%s%3N)
LATENCY=$((END_TIME - START_TIME))

if [ $LATENCY -lt 1000 ]; then
  echo -e "${GREEN}✅ 连接延迟正常: ${LATENCY}ms${NC}"
elif [ $LATENCY -lt 5000 ]; then
  echo -e "${YELLOW}⚠️  连接延迟较高: ${LATENCY}ms${NC}"
  echo "可能原因: 服务刚从休眠唤醒"
else
  echo -e "${RED}❌ 连接延迟过高: ${LATENCY}ms${NC}"
  echo "可能原因: 网络问题或服务响应慢"
fi

# 总结
echo ""
echo "========================================="
echo "📊 诊断总结"
echo "========================================="
echo ""
echo "后端 URL: $BACKEND_URL"
echo "前端 Origin: $FRONTEND_ORIGIN"
echo ""

# 生成建议
echo "🔧 建议的修复步骤:"
echo ""

NEEDS_FIX=0

if ! echo "$HEALTH_RESPONSE" | tail -1 | grep -q "200"; then
  echo "${NEEDS_FIX}. ❌ 后端服务不可用"
  echo "   → 检查 Render Dashboard 日志"
  echo "   → 确认服务状态为 'Live'"
  echo "   → 等待服务从休眠唤醒（30-60秒）"
  echo ""
  NEEDS_FIX=$((NEEDS_FIX + 1))
fi

if ! echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
  echo "${NEEDS_FIX}. ❌ CORS 配置缺失"
  echo "   → 在 Render 添加环境变量："
  echo "      FRONTEND_URL=$FRONTEND_ORIGIN"
  echo "      CORS_ORIGIN=$FRONTEND_ORIGIN"
  echo ""
  NEEDS_FIX=$((NEEDS_FIX + 1))
fi

if [ "$FRONTEND_ENV" = "1" ] && [ ! -f "frontend/.env.local" ]; then
  echo "${NEEDS_FIX}. ❌ 前端环境变量未配置"
  echo "   → 创建 frontend/.env.local 文件"
  echo "   → 添加: VITE_API_URL=$BACKEND_URL"
  echo "   → 重启前端开发服务器"
  echo ""
  NEEDS_FIX=$((NEEDS_FIX + 1))
fi

if ! echo "$LLM_RESPONSE" | tail -1 | grep -q "200" || ! echo "$LLM_DATA" | grep -q "healthy"; then
  echo "${NEEDS_FIX}. ⚠️  LLM 服务不可用（可选修复）"
  echo "   → 检查 LLM_PROVIDER 环境变量"
  echo "   → 检查对应的 API Key（GEMINI_API_KEY / OPENAI_API_KEY）"
  echo "   → 验证 API Key 有效且有额度"
  echo ""
  NEEDS_FIX=$((NEEDS_FIX + 1))
fi

if [ $NEEDS_FIX -eq 0 ]; then
  echo -e "${GREEN}✅ 未发现明显问题！${NC}"
  echo ""
  echo "如果前端仍然报错，请："
  echo "1. 清除浏览器缓存"
  echo "2. 重启前端开发服务器"
  echo "3. 打开浏览器控制台（F12）查看详细错误"
  echo "4. 查看 Network 标签确认请求 URL"
else
  echo "共发现 $NEEDS_FIX 个问题，请按顺序修复。"
fi

echo ""
echo "========================================="
echo "📚 更多帮助"
echo "========================================="
echo ""
echo "详细排障指南:"
echo "  cat FRONTEND_BACKEND_CONNECTION_GUIDE.md"
echo ""
echo "Render 配置指南:"
echo "  cat RENDER_FIRST_TIME_SETUP.md"
echo ""
echo "========================================="
echo "诊断完成！"
echo "========================================="
