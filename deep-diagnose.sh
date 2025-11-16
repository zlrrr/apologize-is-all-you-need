#!/bin/bash

# 深度诊断脚本 - 尝试多种方法获取详细信息

BACKEND_URL="https://apologize-is-all-you-need.onrender.com"
FRONTEND_URL="https://apologize-is-all-you-need-web.vercel.app"

echo "========================================="
echo "🔍 深度远程诊断"
echo "========================================="
echo "后端: $BACKEND_URL"
echo "前端: $FRONTEND_URL"
echo "时间: $(date)"
echo "========================================="
echo ""

# 测试各种端点和方法
echo "测试 1: 根路径"
echo "----------------------------------------"
curl -s -w "\nHTTP Code: %{http_code}\n" --max-time 10 "$BACKEND_URL/" 2>&1 | head -20
echo ""

echo "测试 2: /api/health"
echo "----------------------------------------"
curl -s -w "\nHTTP Code: %{http_code}\n" --max-time 10 "$BACKEND_URL/api/health" 2>&1 | head -20
echo ""

echo "测试 3: /api/test"
echo "----------------------------------------"
curl -s -w "\nHTTP Code: %{http_code}\n" --max-time 10 "$BACKEND_URL/api/test" 2>&1 | head -20
echo ""

echo "测试 4: 详细 HTTP 头信息"
echo "----------------------------------------"
curl -I -s --max-time 10 "$BACKEND_URL/api/health" 2>&1
echo ""

echo "测试 5: 使用不同的 User-Agent"
echo "----------------------------------------"
curl -s -H "User-Agent: Mozilla/5.0" --max-time 10 "$BACKEND_URL/api/health" 2>&1 | head -10
echo ""

echo "测试 6: 带 Origin 头的请求"
echo "----------------------------------------"
curl -s -H "Origin: $FRONTEND_URL" --max-time 10 "$BACKEND_URL/api/health" 2>&1 | head -10
echo ""

echo "测试 7: DNS 解析"
echo "----------------------------------------"
host apologize-is-all-you-need.onrender.com 2>&1 || nslookup apologize-is-all-you-need.onrender.com 2>&1
echo ""

echo "测试 8: SSL/TLS 信息"
echo "----------------------------------------"
openssl s_client -connect apologize-is-all-you-need.onrender.com:443 -servername apologize-is-all-you-need.onrender.com < /dev/null 2>&1 | grep -E "subject=|issuer=|Verify return code" | head -5
echo ""

echo "========================================="
echo "诊断完成"
echo "========================================="
