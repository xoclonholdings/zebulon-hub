# 🖥️ Zebulon Offline Desktop Setup

## Complete Offline Installation

Zebulon runs **100% offline** on your laptop with no internet required after initial setup.

## Prerequisites
- Node.js 18+ installed on your laptop
- Git (optional, for cloning)
- 2GB free disk space

## Installation Steps

### 1. Download Project
```bash
# Option A: Clone repository (if you have git)
git clone [your-repo-url] zebulon-ai
cd zebulon-ai

# Option B: Download as ZIP and extract
# Download the project files to a folder called 'zebulon-ai'
```

### 2. Install Dependencies (One-time, requires internet)
```bash
npm install --legacy-peer-deps
```

### 3. Build for Production
```bash
npm run build
```

### 4. Start Offline (No internet needed)
```bash
npm start
```

## Access Your App
- **URL**: http://localhost:5000
- **Admin**: Click logo → admin/zebulon2025
- **Mobile**: Works on any device connected to your laptop's network

## Offline Features
✅ **Full AI Chat**: Zed AI with memory (no OpenAI needed)  
✅ **Admin Controls**: Complete user management  
✅ **Voice Interface**: Uses browser microphone  
✅ **Real-time Updates**: WebSocket communication  
✅ **Mobile Interface**: Responsive design  
✅ **File Processing**: Local file handling  
✅ **Database**: Local PostgreSQL or SQLite  
✅ **Security**: Full authentication system  

## Network Options

### Local Only (Laptop Only)
- Access: http://localhost:5000
- Users: Just you on your laptop

### Local Network (Home/Office WiFi)
- Access: http://[your-laptop-ip]:5000
- Users: Anyone on your WiFi network
- Find IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

### Hotspot Mode
- Enable laptop hotspot
- Others connect to your laptop's WiFi
- Access: http://192.168.137.1:5000

## Database Options

### Option 1: In-Memory (Default)
- No setup required
- Data resets on restart
- Perfect for testing

### Option 2: Local SQLite
- Persistent data storage
- No external database needed
- Add to package.json: `"better-sqlite3": "^8.7.0"`

### Option 3: Local PostgreSQL
- Install PostgreSQL on laptop
- Full database features
- Survives restarts

## Advanced Offline Setup

### Auto-Start on Boot (Windows)
Create batch file in Startup folder:
```batch
@echo off
cd "C:\path\to\zebulon-ai"
npm start
```

### Auto-Start on Boot (Mac/Linux)
Add to crontab:
```bash
@reboot cd /path/to/zebulon-ai && npm start
```

### Port Configuration
Change port in package.json:
```json
"start": "PORT=8080 NODE_ENV=production node dist/index.js"
```

## System Requirements
- **RAM**: 512MB minimum, 1GB recommended
- **CPU**: Any modern processor
- **Disk**: 500MB for app + dependencies
- **OS**: Windows 10+, macOS 10.14+, Linux (Ubuntu 18+)

## Troubleshooting

### App Won't Start
```bash
# Check Node.js version
node --version  # Should be 18+

# Rebuild dependencies
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

### Can't Access from Other Devices
```bash
# Start with specific IP binding
HOST=0.0.0.0 PORT=5000 npm start
```

### Performance Issues
- Close unnecessary programs
- Use SQLite instead of in-memory storage
- Reduce chat polling in settings

## Security for Offline Use
- Change default admin password
- Enable firewall on laptop
- Use strong WiFi passwords
- Consider VPN for remote access

Your Zebulon system will run completely independently with full AI capabilities, admin controls, and all features working offline.