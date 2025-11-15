#!/bin/bash

# 生产环境远程调试工具
# 用于测试 Vercel + Render 集成

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================="
echo "🔍 Vercel + Render 生产环境调试工具"
echo "========================================="
echo ""

# 读取 URL
if [ -z "$1" ]; then
  echo "请提供后端 URL 或按 Enter 使用交互模式"
  read -p "后端 URL (Render): " BACKEND_URL
else
  BACKEND_URL="$1"
fi

if [ -z "$2" ]; then
  read -p "前端 URL (Vercel): " FRONTEND_URL
else
  FRONTEND_URL="$2"
fi

# 验证 URL
if [ -z "$BACKEND_URL" ]; then
  echo -e "${RED}❌ 后端 URL 不能为空${NC}"
  exit 1
fi

if [ -z "$FRONTEND_URL" ]; then
  echo -e "${YELLOW}⚠️  未提供前端 URL，跳过 CORS 测试${NC}"
fi

# 移除尾部斜杠
BACKEND_URL="${BACKEND_URL%/}"
FRONTEND_URL="${FRONTEND_URL%/}"

echo ""
echo "========================================="
echo "测试配置:"
echo "  后端: $BACKEND_URL"
echo "  前端: $FRONTEND_URL"
echo "========================================="

# 测试 1: 后端基础连通性
echo ""
echo -e "${BLUE}[1/7] 🌐 测试后端连通性...${NC}"
if curl -f -s "$BACKEND_URL/api/health" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ 后端可访问${NC}"
else
  echo -e "${RED}❌ 后端无法访问${NC}"
  echo "可能原因:"
  echo "  - URL 错误"
  echo "  - 服务未启动"
  echo "  - 服务正在休眠（等待 30-60 秒）"
  echo ""
  echo "尝试直接访问: $BACKEND_URL/api/health"
  exit 1
fi

# 测试 2: 后端健康检查详情
echo ""
echo -e "${BLUE}[2/7] 🏥 获取后端健康状态...${NC}"
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/api/health" 2>&1)

if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
  echo -e "${GREEN}✅ 后端服务健康${NC}"
  echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
else
  echo -e "${YELLOW}⚠️  后端响应异常${NC}"
  echo "$HEALTH_RESPONSE"
fi

# 测试 3: LLM 服务检查
echo ""
echo -e "${BLUE}[3/7] 🤖 测试 LLM 服务...${NC}"
LLM_RESPONSE=$(curl -s "$BACKEND_URL/api/health/llm" 2>&1)

if echo "$LLM_RESPONSE" | grep -q "healthy"; then
  echo -e "${GREEN}✅ LLM 服务正常${NC}"
  echo "$LLM_RESPONSE" | jq '.provider, .model, .status' 2>/dev/null || echo "$LLM_RESPONSE"
else
  echo -e "${YELLOW}⚠️  LLM 服务不可用${NC}"
  echo "$LLM_RESPONSE" | jq '.' 2>/dev/null || echo "$LLM_RESPONSE"
  echo ""
  echo "修复建议:"
  echo "  - 检查 Render 环境变量: LLM_PROVIDER"
  echo "  - 检查对应的 API Key (GEMINI_API_KEY / OPENAI_API_KEY)"
fi

# 测试 4: CORS Preflight
if [ -n "$FRONTEND_URL" ]; then
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
      echo "  配置: $ALLOWED_ORIGIN"
      echo "  前端: $FRONTEND_URL"
    fi
  else
    echo -e "${RED}❌ CORS 配置缺失${NC}"
    echo ""
    echo "修复方法:"
    echo "1. 登录 Render Dashboard"
    echo "2. 进入服务 → Settings → Environment"
    echo "3. 添加环境变量:"
    echo "   FRONTEND_URL=$FRONTEND_URL"
    echo "   CORS_ORIGIN=$FRONTEND_URL"
    echo "4. 保存后等待重新部署"
  fi
else
  echo ""
  echo -e "${BLUE}[4/7] 🔒 跳过 CORS 测试（未提供前端 URL）${NC}"
fi

# 测试 5: 实际 API 调用
if [ -n "$FRONTEND_URL" ]; then
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
    echo "$API_RESPONSE" | head -20
  fi
else
  echo ""
  echo -e "${BLUE}[5/7] 📡 跳过 API 调用测试${NC}"
fi

# 测试 6: 响应时间
echo ""
echo -e "${BLUE}[6/7] ⏱️  测试响应延迟...${NC}"

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

# 测试 7: 认证端点
echo ""
echo -e "${BLUE}[7/7] 🔐 测试认证端点...${NC}"
AUTH_RESPONSE=$(curl -s "$BACKEND_URL/api/auth/status" 2>&1)

if echo "$AUTH_RESPONSE" | grep -q "enabled\|disabled"; then
  echo -e "${GREEN}✅ 认证端点可访问${NC}"
  echo "$AUTH_RESPONSE" | jq '.' 2>/dev/null || echo "$AUTH_RESPONSE"
else
  echo -e "${YELLOW}⚠️  认证端点响应异常${NC}"
  echo "$AUTH_RESPONSE"
fi

# 总结
echo ""
echo "========================================="
echo "📊 测试总结"
echo "========================================="
echo ""

# 统计结果
PASS=0
FAIL=0
WARN=0

# 简单的结果统计（基于上面的测试）
echo "测试结果:"
echo ""

# 后端连通性
if curl -f -s "$BACKEND_URL/api/health" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ 后端连通性${NC}"
  PASS=$((PASS + 1))
else
  echo -e "${RED}❌ 后端连通性${NC}"
  FAIL=$((FAIL + 1))
fi

# 健康检查
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
  echo -e "${GREEN}✅ 后端健康检查${NC}"
  PASS=$((PASS + 1))
else
  echo -e "${RED}❌ 后端健康检查${NC}"
  FAIL=$((FAIL + 1))
fi

# LLM 服务
if echo "$LLM_RESPONSE" | grep -q "healthy"; then
  echo -e "${GREEN}✅ LLM 服务${NC}"
  PASS=$((PASS + 1))
else
  echo -e "${YELLOW}⚠️  LLM 服务${NC}"
  WARN=$((WARN + 1))
fi

# CORS（如果测试了）
if [ -n "$FRONTEND_URL" ]; then
  if echo "$CORS_RESPONSE" | grep -qi "access-control-allow-origin"; then
    echo -e "${GREEN}✅ CORS 配置${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}❌ CORS 配置${NC}"
    FAIL=$((FAIL + 1))
  fi
fi

# 响应速度
if [ $LATENCY -lt 2000 ]; then
  echo -e "${GREEN}✅ 响应速度 (${LATENCY}ms)${NC}"
  PASS=$((PASS + 1))
else
  echo -e "${YELLOW}⚠️  响应速度 (${LATENCY}ms)${NC}"
  WARN=$((WARN + 1))
fi

echo ""
echo "统计: ${GREEN}$PASS 通过${NC} | ${RED}$FAIL 失败${NC} | ${YELLOW}$WARN 警告${NC}"

if [ $FAIL -eq 0 ] && [ $WARN -eq 0 ]; then
  echo ""
  echo -e "${GREEN}🎉 所有测试通过！系统运行正常。${NC}"
elif [ $FAIL -eq 0 ]; then
  echo ""
  echo -e "${YELLOW}⚠️  有警告项目，但核心功能正常。${NC}"
else
  echo ""
  echo -e "${RED}❌ 有失败项目，需要修复。${NC}"
fi

# 前端测试提示
if [ -n "$FRONTEND_URL" ]; then
  echo ""
  echo "========================================="
  echo "🌐 前端测试"
  echo "========================================="
  echo ""
  echo "1. 访问前端: $FRONTEND_URL"
  echo ""
  echo "2. 打开浏览器开发者工具 (F12)"
  echo ""
  echo "3. Console 标签，执行:"
  echo "   console.log(import.meta.env.VITE_API_URL)"
  echo "   应该输出: $BACKEND_URL"
  echo ""
  echo "4. Network 标签，刷新页面"
  echo "   查看请求是否发送到: $BACKEND_URL"
  echo ""
  echo "5. 测试发送消息功能"
  echo ""
fi

echo "========================================="
echo "📚 更多帮助"
echo "========================================="
echo ""
echo "详细集成指南:"
echo "  cat VERCEL_RENDER_INTEGRATION.md"
echo ""
echo "前端连接排障:"
echo "  cat FRONTEND_BACKEND_CONNECTION_GUIDE.md"
echo ""
echo "本地诊断工具:"
echo "  ./diagnose-connection.sh"
echo ""
echo "========================================="
echo "调试完成"
echo "========================================="
