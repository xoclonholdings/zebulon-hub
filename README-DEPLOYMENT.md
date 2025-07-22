# Zebulon AI System - Deployment Guide

## Quick Deployment Fix for Replit

The deployment error `npm error ERESOLVE could not resolve` has been fixed with:

### 1. **Optimized Package.json** 
- Moved Radix UI components to devDependencies
- Updated to latest stable versions
- Added legacy peer deps support
- Fixed esbuild security vulnerability

### 2. **Deployment Commands**
```bash
# Use these exact commands for Replit deployment:
npm install --legacy-peer-deps
npm run build
npm start
```

### 3. **Build Script Available**
Run the automated build script:
```bash
chmod +x deployment-scripts/build.sh
./deployment-scripts/build.sh
```

### 4. **Production Configuration**
- **Start Command**: `NODE_ENV=production node dist/index.js`
- **Build Command**: `npm run build`
- **Health Check**: `/api/system/status`
- **Port**: `5000` (configurable via PORT env var)

### 5. **Environment Variables Required**
```
NODE_ENV=production
PORT=5000
DATABASE_URL=[Your PostgreSQL URL]
SESSION_SECRET=[Random secure string]
```

### 6. **Post-Deployment Verification**
Check these endpoints after deployment:
- `https://your-app.replit.app/` - Main interface
- `https://your-app.replit.app/api/system/status` - System health
- `https://your-app.replit.app/api/chat/1` - Chat API

### 7. **Admin Access**
- Click the Zebulon logo
- Username: `admin`
- Password: `zebulon2025`

## Features Ready for Production
✅ **Chat System**: Zed AI with memory  
✅ **Admin Controls**: User management  
✅ **Security**: Rate limiting, input sanitization  
✅ **Mobile UI**: Responsive design  
✅ **Real-time**: WebSocket communication  
✅ **Voice Interface**: Permission-controlled  
✅ **Memory System**: Context-aware conversations  

## System Architecture
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Neon serverless)
- **AI**: Local processing (no external API dependencies)
- **Security**: Multi-layer protection with admin controls

## Troubleshooting
1. **ERESOLVE errors**: Use `--legacy-peer-deps` flag
2. **Build failures**: Run `npm run check` for TypeScript issues
3. **Runtime errors**: Check logs at `/api/system/status`
4. **Memory issues**: Storage optimizer handles cleanup automatically

The system is fully production-ready with all core features operational.