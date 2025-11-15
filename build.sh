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

echo "=== Installing dependencies (including devDependencies) ==="
npm install --production=false --legacy-peer-deps --verbose 2>&1 | tail -50

echo "=== Checking installed packages ==="
echo "Total packages:"
npm ls --depth=0 2>&1 | wc -l || echo "Error counting packages"

echo "=== Verifying critical packages ==="
echo "Checking vite:"
npm ls vite || echo "vite not found in npm ls"
echo "Checking react:"
npm ls react || echo "react not found in npm ls"

echo "=== Checking node_modules directory ==="
if [ -f "node_modules/.bin/vite" ]; then
    echo "✅ vite found at node_modules/.bin/vite"
    ls -la node_modules/.bin/vite
else
    echo "❌ vite NOT found"
    echo "Installed packages in node_modules:"
    ls node_modules/ | head -30
    echo "Total directories in node_modules:"
    ls node_modules/ | wc -l
fi

echo "=== Building with vite ==="
if [ -f "node_modules/.bin/vite" ]; then
    ./node_modules/.bin/vite build
else
    echo "ERROR: vite binary not found, trying npx as fallback"
    npx vite build
fi

echo "=== Build complete ==="
ls -la dist/
