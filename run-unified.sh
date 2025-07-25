#!/bin/bash

# Zebulon Unified Server Startup
# Only runs Express server on port 5000 with built React app

echo "🚀 Building React application..."
npm run build:client

echo "🌐 Starting Zebulon Unified Server on port 5000..."
echo "📦 Serving built React app from Express server"
echo "🎯 Single interface deployment - no competing ports"

# Start only the Express server
NODE_ENV=development PORT=5000 npx tsx server/index.ts