#!/bin/bash

# Test script for local deployment
# This script tests all endpoints to verify the application is working

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BACKEND_URL="${BACKEND_URL:-http://localhost:5001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"

echo -e "${YELLOW}================================================${NC}"
echo -e "${YELLOW}   Testing Local Deployment${NC}"
echo -e "${YELLOW}================================================${NC}"
echo ""

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}

    echo -n "Testing $name... "

    status=$(curl -o /dev/null -s -w "%{http_code}" "$url")

    if [ "$status" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status)"
        return 1
    fi
}

# Test backend
echo -e "${YELLOW}Backend Tests ($BACKEND_URL)${NC}"
echo "─────────────────────────────────────────"

test_endpoint "Health Check" "$BACKEND_URL/api/health"
test_endpoint "LLM Health" "$BACKEND_URL/api/health/llm"
test_endpoint "Detailed Health" "$BACKEND_URL/api/health/detailed"
test_endpoint "Auth Status" "$BACKEND_URL/api/auth/status"

# Test frontend
echo ""
echo -e "${YELLOW}Frontend Tests ($FRONTEND_URL)${NC}"
echo "─────────────────────────────────────────"

test_endpoint "Homepage" "$FRONTEND_URL"

# Test API integration
echo ""
echo -e "${YELLOW}Integration Tests${NC}"
echo "─────────────────────────────────────────"

echo -n "Testing message endpoint... "

response=$(curl -s -X POST "$BACKEND_URL/api/chat/message" \
    -H "Content-Type: application/json" \
    -d '{
        "message": "Test message",
        "style": "gentle",
        "sessionId": "test-session"
    }')

if echo "$response" | grep -q "reply"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "Response: $response"
fi

# Summary
echo ""
echo -e "${YELLOW}================================================${NC}"
echo -e "${YELLOW}   Test Summary${NC}"
echo -e "${YELLOW}================================================${NC}"
echo ""
echo "Backend URL:  $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""
echo -e "${GREEN}All tests completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Visit $FRONTEND_URL to test the UI"
echo "2. Check backend logs: backend/logs/combined.log"
echo "3. Ready to deploy? See DEPLOYMENT_OVERVIEW.md"
