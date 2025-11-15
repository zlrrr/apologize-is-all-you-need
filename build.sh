#!/bin/bash
set -e

echo "=== Starting build process ==="
echo "Current directory: $(pwd)"
echo "Listing files:"
ls -la

echo "=== Entering frontend directory ==="
cd frontend
pwd

echo "=== Frontend package.json content ==="
cat package.json

echo "=== Cleaning old installation ==="
rm -rf node_modules package-lock.json

echo "=== Installing dependencies ==="
npm install --legacy-peer-deps --verbose 2>&1 | tail -50

echo "=== Checking installed packages ==="
echo "Total packages:"
npm ls --depth=0 | wc -l

echo "=== Checking for vite ==="
if [ -f "node_modules/.bin/vite" ]; then
    echo "✅ vite found at node_modules/.bin/vite"
    ls -la node_modules/.bin/vite
    npm ls vite
else
    echo "❌ vite NOT found"
    echo "Installed packages:"
    ls node_modules/ | head -20
fi

echo "=== Building with vite ==="
npx vite build

echo "=== Build complete ==="
ls -la dist/
