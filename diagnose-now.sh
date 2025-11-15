#!/bin/bash

# 交互式远程诊断工具
# 自动引导用户完成诊断

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear

echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}🔍 远程服务诊断工具${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""

# 步骤 1: 获取后端 URL
echo -e "${BLUE}步骤 1/3: 获取后端 URL${NC}"
echo ""
echo "请提供您的 Render 后端 URL"
echo "位置: Render Dashboard → 服务详情页顶部"
echo "格式: https://apologize-backend-xxxx.onrender.com"
echo ""
read -p "后端 URL: " BACKEND_URL

if [ -z "$BACKEND_URL" ]; then
  echo -e "${RED}❌ URL 不能为空${NC}"
  exit 1
fi

# 移除尾部斜杠
BACKEND_URL="${BACKEND_URL%/}"

echo ""
echo -e "${GREEN}✓ 后端 URL: $BACKEND_URL${NC}"

# 步骤 2: 询问是否有前端
echo ""
echo -e "${BLUE}步骤 2/3: 前端部署状态${NC}"
echo ""
echo "您是否已经部署前端到 Vercel？"
echo "1) 是，已部署到 Vercel"
echo "2) 否，只测试后端"
echo ""
read -p "请选择 (1 或 2): " FRONTEND_CHOICE

FRONTEND_URL=""
if [ "$FRONTEND_CHOICE" = "1" ]; then
  echo ""
  echo "请提供您的 Vercel 前端 URL"
  echo "位置: Vercel Dashboard → 项目页面"
  echo "格式: https://apologize-frontend-xxxx.vercel.app"
  echo ""
  read -p "前端 URL: " FRONTEND_URL
  FRONTEND_URL="${FRONTEND_URL%/}"
  echo -e "${GREEN}✓ 前端 URL: $FRONTEND_URL${NC}"
fi

# 步骤 3: 开始诊断
echo ""
echo -e "${BLUE}步骤 3/3: 开始诊断${NC}"
echo ""
echo "========================================="
echo "诊断配置:"
echo "  后端: $BACKEND_URL"
if [ -n "$FRONTEND_URL" ]; then
  echo "  前端: $FRONTEND_URL"
else
  echo "  前端: 未部署（仅测试后端）"
fi
echo "========================================="
echo ""
read -p "按 Enter 开始诊断..."

echo ""
echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}开始远程诊断...${NC}"
echo -e "${CYAN}=========================================${NC}"

# 测试 1: 基础连通性
echo ""
echo -e "${BLUE}[1/7] 🌐 测试后端连通性...${NC}"
if timeout 10 curl -f -s "$BACKEND_URL/api/health" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ 后端可访问${NC}"
  BACKEND_ACCESSIBLE=true
else
  echo -e "${RED}❌ 后端无法访问${NC}"
  echo ""
  echo "可能原因:"
  echo "  1. URL 错误"
  echo "  2. 服务未启动（检查 Render Dashboard）"
  echo "  3. 服务正在休眠（免费计划，等待 30-60 秒）"
  echo ""
  echo "建议操作:"
  echo "  - 访问 Render Dashboard 检查服务状态"
  echo "  - 直接在浏览器访问: $BACKEND_URL/api/health"
  echo "  - 等待 1 分钟后重新运行此脚本"
  BACKEND_ACCESSIBLE=false
fi

# 如果后端不可访问，提前退出
if [ "$BACKEND_ACCESSIBLE" = false ]; then
  echo ""
  echo -e "${YELLOW}⚠️  由于后端不可访问，停止后续测试${NC}"
  echo ""
  echo "========================================="
  echo "诊断中断"
  echo "========================================="
  exit 1
fi

# 测试 2: 健康检查详情
echo ""
echo -e "${BLUE}[2/7] 🏥 获取后端健康状态...${NC}"
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/api/health" 2>&1)

if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
  echo -e "${GREEN}✅ 后端服务健康${NC}"

  # 尝试解析 JSON
  if command -v jq &> /dev/null; then
    echo "$HEALTH_RESPONSE" | jq '.'
  else
    echo "$HEALTH_RESPONSE"
  fi
else
  echo -e "${YELLOW}⚠️  后端响应异常${NC}"
  echo "$HEALTH_RESPONSE"
fi

# 测试 3: LLM 服务
echo ""
echo -e "${BLUE}[3/7] 🤖 测试 LLM 服务...${NC}"
LLM_RESPONSE=$(curl -s "$BACKEND_URL/api/health/llm" 2>&1)

if echo "$LLM_RESPONSE" | grep -q "healthy"; then
  echo -e "${GREEN}✅ LLM 服务正常${NC}"

  if command -v jq &> /dev/null; then
    echo "Provider: $(echo "$LLM_RESPONSE" | jq -r '.provider // "unknown"')"
    echo "Model: $(echo "$LLM_RESPONSE" | jq -r '.model // "unknown"')"
    echo "Status: $(echo "$LLM_RESPONSE" | jq -r '.status // "unknown"')"
  else
    echo "$LLM_RESPONSE"
  fi
else
  echo -e "${YELLOW}⚠️  LLM 服务不可用${NC}"
  echo "$LLM_RESPONSE"
  echo ""
  echo "修复建议:"
  echo "  1. 检查 Render 环境变量: LLM_PROVIDER"
  echo "  2. 检查对应的 API Key:"
  echo "     - GEMINI_API_KEY (如果 LLM_PROVIDER=gemini)"
  echo "     - OPENAI_API_KEY (如果 LLM_PROVIDER=openai)"
  echo "     - ANTHROPIC_API_KEY (如果 LLM_PROVIDER=anthropic)"
  echo "  3. 验证 API Key 有效且有额度"
fi

# 测试 4-6: CORS 相关（仅在有前端 URL 时）
if [ -n "$FRONTEND_URL" ]; then
  # 测试 4: CORS Preflight
  echo ""
  echo -e "${BLUE}[4/7] 🔒 测试 CORS Preflight...${NC}"

  CORS_RESPONSE=$(curl -i -s -X OPTIONS "$BACKEND_URL/api/health" \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: GET" 2>&1)

  if echo "$CORS_RESPONSE" | grep -qi "access-control-allow-origin"; then
    ALLOWED_ORIGIN=$(echo "$CORS_RESPONSE" | grep -i "access-control-allow-origin" | cut -d' ' -f2 | tr -d '\r\n')
    echo -e "${GREEN}✅ CORS 配置正确${NC}"
    echo "  Allowed Origin: $ALLOWED_ORIGIN"

    if [ "$ALLOWED_ORIGIN" != "$FRONTEND_URL" ]; then
      echo -e "${YELLOW}⚠️  警告: 允许的 Origin 与前端 URL 不匹配${NC}"
      echo "  后端配置: $ALLOWED_ORIGIN"
      echo "  前端 URL:  $FRONTEND_URL"
    fi
  else
    echo -e "${RED}❌ CORS 配置缺失${NC}"
    echo ""
    echo "修复方法:"
    echo "  1. 登录 Render Dashboard: https://dashboard.render.com"
    echo "  2. 进入服务 → Settings → Environment"
    echo "  3. 添加环境变量:"
    echo "     Key:   FRONTEND_URL"
    echo "     Value: $FRONTEND_URL"
    echo ""
    echo "     Key:   CORS_ORIGIN"
    echo "     Value: $FRONTEND_URL"
    echo "  4. 保存后等待重新部署（2-3 分钟）"
  fi

  # 测试 5: 实际 API 调用
  echo ""
  echo -e "${BLUE}[5/7] 📡 测试实际 API 调用（带 Origin）...${NC}"

  API_RESPONSE=$(curl -i -s "$BACKEND_URL/api/health" \
    -H "Origin: $FRONTEND_URL" 2>&1)

  if echo "$API_RESPONSE" | grep -q "HTTP/.* 200"; then
    if echo "$API_RESPONSE" | grep -qi "access-control-allow-origin"; then
      echo -e "${GREEN}✅ API 调用成功，CORS 头正确${NC}"
    else
      echo -e "${YELLOW}⚠️  API 调用成功，但缺少 CORS 头${NC}"
      echo "浏览器会阻止此请求"
    fi
  else
    echo -e "${RED}❌ API 调用失败${NC}"
  fi

  # 测试 6: 前端环境变量检查
  echo ""
  echo -e "${BLUE}[6/7] ⚙️  前端配置检查...${NC}"
  echo ""
  echo "请在前端页面执行以下操作:"
  echo "  1. 访问: $FRONTEND_URL"
  echo "  2. 打开浏览器控制台 (F12)"
  echo "  3. Console 标签，执行:"
  echo "     console.log(import.meta.env.VITE_API_URL)"
  echo ""
  echo "  预期输出: $BACKEND_URL"
  echo ""
  echo "  如果输出 undefined 或 http://localhost:5001:"
  echo "  → Vercel Dashboard → Settings → Environment Variables"
  echo "  → 添加: VITE_API_URL = $BACKEND_URL"
  echo "  → 重新部署"

else
  echo ""
  echo -e "${BLUE}[4/7] 跳过 CORS 测试（未提供前端 URL）${NC}"
  echo -e "${BLUE}[5/7] 跳过 API 调用测试${NC}"
  echo -e "${BLUE}[6/7] 跳过前端配置检查${NC}"
fi

# 测试 7: 响应时间
echo ""
echo -e "${BLUE}[7/7] ⏱️  测试响应延迟...${NC}"

START_TIME=$(date +%s%3N)
curl -s "$BACKEND_URL/api/health" > /dev/null 2>&1
END_TIME=$(date +%s%3N)
LATENCY=$((END_TIME - START_TIME))

if [ $LATENCY -lt 500 ]; then
  echo -e "${GREEN}✅ 响应速度优秀: ${LATENCY}ms${NC}"
elif [ $LATENCY -lt 2000 ]; then
  echo -e "${GREEN}✅ 响应速度良好: ${LATENCY}ms${NC}"
elif [ $LATENCY -lt 5000 ]; then
  echo -e "${YELLOW}⚠️  响应速度较慢: ${LATENCY}ms${NC}"
  echo "  可能原因: 服务刚从休眠唤醒"
else
  echo -e "${RED}❌ 响应速度过慢: ${LATENCY}ms${NC}"
  echo "  可能原因: 网络问题或服务响应慢"
fi

# 生成总结
echo ""
echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}📊 诊断总结${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""

# 显示配置信息
echo "配置信息:"
echo "  后端: $BACKEND_URL"
if [ -n "$FRONTEND_URL" ]; then
  echo "  前端: $FRONTEND_URL"
fi
echo ""

# 生成建议
echo "🔧 下一步操作建议:"
echo ""

# 检查后端健康
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
  echo -e "${GREEN}✓${NC} 后端服务正常运行"
else
  echo -e "${RED}✗${NC} 后端服务异常，需要检查 Render 日志"
fi

# 检查 LLM
if echo "$LLM_RESPONSE" | grep -q "healthy"; then
  echo -e "${GREEN}✓${NC} LLM 服务配置正确"
else
  echo -e "${YELLOW}!${NC} LLM 服务需要配置（检查环境变量）"
fi

# 检查 CORS（如果有前端）
if [ -n "$FRONTEND_URL" ]; then
  if echo "$CORS_RESPONSE" | grep -qi "access-control-allow-origin"; then
    echo -e "${GREEN}✓${NC} CORS 配置正确"
  else
    echo -e "${RED}✗${NC} 需要配置 CORS（添加 FRONTEND_URL 和 CORS_ORIGIN）"
  fi

  echo ""
  echo "前端测试步骤:"
  echo "  1. 访问: $FRONTEND_URL"
  echo "  2. F12 打开控制台"
  echo "  3. 验证 VITE_API_URL 是否为: $BACKEND_URL"
  echo "  4. 测试发送消息功能"
fi

# 检查响应速度
if [ $LATENCY -lt 2000 ]; then
  echo -e "${GREEN}✓${NC} 响应速度正常 (${LATENCY}ms)"
else
  echo -e "${YELLOW}!${NC} 响应较慢 (${LATENCY}ms)，可能需要等待服务唤醒"
fi

echo ""
echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}诊断完成！${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""

# 提供快速链接
echo "快速链接:"
echo "  Render Dashboard: https://dashboard.render.com"
if [ -n "$FRONTEND_URL" ]; then
  echo "  Vercel Dashboard: https://vercel.com/dashboard"
  echo "  前端应用: $FRONTEND_URL"
fi
echo "  后端 API: $BACKEND_URL/api/health"
echo ""

echo "需要更多帮助？查看文档:"
echo "  cat QUICK_DEPLOYMENT_GUIDE.md"
echo "  cat VERCEL_RENDER_INTEGRATION.md"
echo ""
