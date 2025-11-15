#!/bin/bash

# 生成安全密钥工具
# 用于生成JWT_SECRET和SESSION_SECRET

echo "================================================"
echo "   安全密钥生成器"
echo "================================================"
echo ""

# 方法1: 使用openssl（推荐）
if command -v openssl &> /dev/null; then
    echo "📝 方法1: OpenSSL生成（最安全）"
    echo "─────────────────────────────────────"
    echo ""
    echo "JWT_SECRET:"
    JWT_SECRET=$(openssl rand -base64 32)
    echo "$JWT_SECRET"
    echo ""
    echo "SESSION_SECRET:"
    SESSION_SECRET=$(openssl rand -base64 32)
    echo "$SESSION_SECRET"
    echo ""
    echo "✅ 已生成！请复制以上两个值到Render环境变量"
    echo ""
fi

# 方法2: 使用Node.js
if command -v node &> /dev/null; then
    echo "📝 方法2: Node.js生成"
    echo "─────────────────────────────────────"
    echo ""
    echo "JWT_SECRET:"
    node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
    echo ""
    echo "SESSION_SECRET:"
    node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
    echo ""
fi

# 方法3: 在线生成器链接
echo "📝 方法3: 在线生成器"
echo "─────────────────────────────────────"
echo ""
echo "如果上述命令不可用，访问以下网站："
echo "1. https://randomkeygen.com/"
echo "   → 选择 'CodeIgniter Encryption Keys'"
echo "   → 复制两个不同的密钥"
echo ""
echo "2. https://www.uuidgenerator.net/api/guid"
echo "   → 刷新页面两次，获得两个不同的UUID"
echo ""
echo "================================================"
echo ""

# 保存到文件
if command -v openssl &> /dev/null; then
    cat > .env.secrets <<EOF
# 请将这些值复制到Render Dashboard的环境变量中
# ⚠️ 不要提交这个文件到Git！

JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET

# 生成时间: $(date)
EOF
    echo "✅ 密钥已保存到 .env.secrets 文件"
    echo "⚠️  请勿将此文件提交到Git！"
    echo ""
fi

echo "下一步："
echo "1. 复制上面生成的两个密钥"
echo "2. 打开Render Dashboard"
echo "3. 进入你的Web Service"
echo "4. 滚动到 'Environment Variables'"
echo "5. 添加这两个环境变量"
