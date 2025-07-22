#!/bin/bash

# Zebulon AI System - Production Build Script
# Comprehensive build process for deployment

set -e

echo "🚀 Building Zebulon AI System for production deployment..."

# Check prerequisites
echo "📋 Checking prerequisites..."
node --version || { echo "❌ Node.js not found"; exit 1; }
npm --version || { echo "❌ npm not found"; exit 1; }

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf build/
mkdir -p dist/public

# Install dependencies with production optimizations
echo "📦 Installing dependencies..."
npm ci --production=false
npm audit fix --force || echo "⚠️ Some audit fixes may have conflicts"

# Build client (frontend)
echo "🔨 Building client application..."
npm run build:client || {
    echo "❌ Client build failed"
    exit 1
}

# Build server (backend)
echo "🔧 Building server application..."
npm run build:server || {
    echo "❌ Server build failed"
    exit 1
}

# Copy static assets
echo "📁 Copying static assets..."
cp -r client/public/* dist/public/ 2>/dev/null || echo "No public assets to copy"

# Database preparation
echo "🗄️ Preparing database schema..."
npm run db:generate || echo "⚠️ Database generation skipped"

# Security optimization
echo "🔒 Running security optimizations..."
npm run security:optimize || echo "⚠️ Security optimization skipped"

# Performance optimization
echo "⚡ Running performance optimizations..."
npm run optimize:assets || echo "⚠️ Asset optimization skipped"

# Create production package
echo "📦 Creating production package..."
tar -czf zebulon-production.tar.gz \
    dist/ \
    package.json \
    package-lock.json \
    deployment-config.json \
    deployment-scripts/ \
    README.md

echo "✅ Build completed successfully!"
echo "📊 Build summary:"
echo "   - Client: dist/public/"
echo "   - Server: dist/index.js"
echo "   - Package: zebulon-production.tar.gz"
echo "   - Size: $(du -h zebulon-production.tar.gz | cut -f1)"
echo ""
echo "🚀 Ready for deployment!"