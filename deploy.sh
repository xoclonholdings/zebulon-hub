#!/bin/bash

# Zebulon Oracle System - Production Deployment Script for xoclon.online

echo "🚀 Starting Zebulon Oracle System deployment for xoclon.online..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build:server
npm run build:client

# Copy built client files to server public directory
echo "📁 Copying built files..."
cp -r dist/public/* server/public/

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️ Creating .env file from template..."
    cp .env.example .env
    echo "❗ Please edit .env file with your database credentials and secrets before starting the server!"
    exit 1
fi

# Push database schema
echo "🗄️ Setting up database schema..."
npx prisma db push

echo "✅ Deployment build complete!"
echo ""
echo "🌍 To start your Zebulon Oracle System on xoclon.online:"
echo "   npm run start"
echo ""
echo "🔧 For production with PM2:"
echo "   npm install -g pm2"
echo "   pm2 start dist/server/index.js --name zebulon-oracle"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "📋 Next steps:"
echo "1. Configure your .env file with production database URL"
echo "2. Set up reverse proxy (Nginx) to point xoclon.online to port 5000"
echo "3. Install SSL certificate for HTTPS"
echo "4. Start the application"
echo ""
echo "🎉 Your Zebulon Oracle System is ready for xoclon.online!"