#!/bin/bash
# Zebulon AI System - Offline Desktop Launcher (Mac/Linux)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

clear

echo -e "${BLUE}"
echo "████████████████████████████████████████████████"
echo "█                                              █"
echo "█           ZEBULON AI SYSTEM                  █"
echo "█          Offline Desktop Mode                █"
echo "█                                              █"
echo "████████████████████████████████████████████████"
echo -e "${NC}"

echo -e "${YELLOW}[INFO]${NC} Starting Zebulon AI System..."
echo -e "${YELLOW}[INFO]${NC} Mode: Offline Desktop"
echo -e "${YELLOW}[INFO]${NC} Port: 5000"
echo -e "${YELLOW}[INFO]${NC} Access URL: http://localhost:5000"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Node.js not found. Please install Node.js 18+ first."
    echo -e "${YELLOW}[INFO]${NC} Download from: https://nodejs.org"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}[ERROR]${NC} Node.js version 18+ required. Found: $(node --version)"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[INFO]${NC} Installing dependencies (requires internet for first run)..."
    npm install --legacy-peer-deps
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR]${NC} Failed to install dependencies."
        exit 1
    fi
fi

# Build if needed
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}[INFO]${NC} Building application..."
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR]${NC} Build failed."
        exit 1
    fi
fi

echo -e "${YELLOW}[INFO]${NC} Zebulon AI is now starting..."
echo

echo -e "${GREEN}"
echo "████████████████████████████████████████████████"
echo "█                                              █"
echo "█  🚀 ZEBULON AI ONLINE - OFFLINE MODE         █"
echo "█                                              █"
echo "█  Access: http://localhost:5000               █"
echo "█  Admin:  Click logo → admin/zebulon2025     █"
echo "█                                              █"
echo "█  Press Ctrl+C to stop the server            █"
echo "█                                              █"
echo "████████████████████████████████████████████████"
echo -e "${NC}"

# Set environment variables for offline mode
export NODE_ENV=production
export PORT=5000
export OFFLINE_MODE=true

# Start the application
npm start