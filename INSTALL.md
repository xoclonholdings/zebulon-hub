# INSTALL

## Overview

Zebulon is a next-generation personal AI ecosystem that runs completely offline with full AI capabilities, admin controls, and real-time communication. No external API dependencies required after setup.

## Quick Start Options

### 🖥️ Desktop/Laptop Installation (Offline)
**Recommended for personal use**
- Runs completely offline after setup
- No internet required during operation
- Full AI capabilities without external APIs

### ☁️ Cloud Deployment (Replit)
**Recommended for team use**
- Online access from anywhere
- Automatic scaling and updates
- Database persistence

### 🏠 Local Network Server
**Recommended for home/office**
- Access from multiple devices
- Local network only
- Complete privacy

---

## 🖥️ Desktop Installation (Windows/Mac/Linux)

### Prerequisites
- **Node.js 18+** - [Download here](https://nodejs.org)
- **Git** (optional) - [Download here](https://git-scm.com)
- **2GB free disk space**

### Step 1: Download Project
```bash
# Option A: Clone with Git
git clone [repository-url] zebulon-ai
cd zebulon-ai

# Option B: Download ZIP
# Download and extract to folder named 'zebulon-ai'
```

### Step 2: Install Dependencies (One-time internet needed)
```bash
npm install --legacy-peer-deps
```

### Step 3: Build Application
```bash
npm run build
```

### Step 4: Start Zebulon
```bash
# Windows users: Double-click desktop-app/start-offline.bat
# Mac/Linux users: Run ./desktop-app/start-offline.sh
# Or manually: npm start
```

### Step 5: Access Application
- Open browser: **http://localhost:5000**
- Admin access: Click logo → **admin/zebulon2025**

---

## ☁️ Replit Deployment

### Step 1: Import to Replit
1. Go to [Replit](https://replit.com)
2. Create new Repl from GitHub repository
3. Select Node.js environment

### Step 2: Install Dependencies
```bash
npm install --legacy-peer-deps
```

### Step 3: Build and Deploy
```bash
npm run build
```

### Step 4: Configure Environment
Add environment variables in Replit Secrets:
- `NODE_ENV=production`
- `DATABASE_URL=[your-database-url]`
- `SESSION_SECRET=[random-secure-string]`

### Step 5: Start Application
```bash
npm start
```

Your app will be available at: `https://your-repl-name.replit.app`

---

## 🏠 Local Network Server Setup

### For Home/Office Network Access

1. **Follow Desktop Installation** steps above
2. **Find your computer's IP address:**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```
3. **Start with network access:**
   ```bash
   HOST=0.0.0.0 PORT=5000 npm start
   ```
4. **Access from other devices:**
   - URL: `http://[your-computer-ip]:5000`
   - Example: `http://192.168.1.100:5000`

---

## 📱 Mobile Access Setup

### Option 1: Same WiFi Network
1. Start Zebulon on your computer
2. Connect mobile device to same WiFi
3. Visit: `http://[computer-ip]:5000`

### Option 2: Laptop Hotspot
1. Enable hotspot on your laptop
2. Connect mobile device to laptop's WiFi
3. Visit: `http://192.168.137.1:5000`

---

## 🗄️ Database Configuration

### Default: In-Memory Storage
- No setup required
- Data resets on restart
- Perfect for testing

### Persistent: SQLite (Recommended for desktop)
1. Add to package.json dependencies:
   ```json
   "better-sqlite3": "^8.7.0"
   ```
2. Update `server/db.ts` to use SQLite
3. Data persists between restarts

### Advanced: PostgreSQL
1. Install PostgreSQL locally or use cloud service
2. Set `DATABASE_URL` environment variable
3. Run: `npm run db:push`

---

## ⚙️ Configuration Options

### Environment Variables
Create `.env` file in project root:
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=your-database-url
SESSION_SECRET=your-secret-key
OFFLINE_MODE=true
```

### Custom Port
```bash
PORT=8080 npm start
```

### Admin Password Change
1. Access admin panel: Click logo → admin/zebulon2025
2. Go to Admin Settings
3. Change default password

---

## 🔧 Troubleshooting

### Common Issues

#### "npm install" fails
```bash
# Clear cache and retry
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
```

#### "Cannot access from other devices"
```bash
# Start with host binding
HOST=0.0.0.0 npm start
```

#### "Port already in use"
```bash
# Use different port
PORT=8080 npm start
```

#### Build fails
```bash
# Check Node.js version (must be 18+)
node --version

# Update dependencies
npm update
npm run build
```

### Performance Optimization

#### For Low-End Devices
- Use SQLite instead of in-memory storage
- Reduce chat polling frequency in settings
- Close unnecessary browser tabs

#### For Multiple Users
- Increase memory allocation: `NODE_OPTIONS="--max-old-space-size=4096" npm start`
- Use PostgreSQL database
- Consider cloud deployment

---

## 🔒 Security Configuration

### For Local Use
- Change default admin password
- Enable computer firewall
- Use strong WiFi passwords

### For Network Use
- Configure HTTPS (optional)
- Set up VPN for remote access
- Regular security updates

### For Production
- Use environment variables for secrets
- Enable security headers
- Regular vulnerability scans

---

## 🚀 Quick Start Commands

### Desktop Development
```bash
git clone [repo] zebulon-ai && cd zebulon-ai
npm install --legacy-peer-deps
npm run dev
```

### Production Build
```bash
npm run build
NODE_ENV=production npm start
```

### Docker (Advanced)
```bash
# Build image
docker build -t zebulon-ai .

# Run container
docker run -p 5000:5000 zebulon-ai
```

---

## 📋 System Requirements

### Minimum
- **OS**: Windows 10, macOS 10.14, Ubuntu 18.04
- **RAM**: 512MB
- **CPU**: Any modern processor
- **Disk**: 500MB free space
- **Network**: WiFi (for initial setup only)

### Recommended
- **RAM**: 1GB+
- **CPU**: Dual-core
- **Disk**: 2GB free space
- **Network**: Gigabit Ethernet (for multiple users)

---

## 🆘 Getting Help

### Documentation
- **Deployment Guide**: `README-DEPLOYMENT.md`
- **Offline Setup**: `desktop-app/offline-setup.md`
- **Project Architecture**: `replit.md`

### Common Commands
```bash
npm run dev      # Development mode
npm run build    # Build for production
npm start        # Start production server
npm run check    # TypeScript validation
npm run db:push  # Database migration
```

### Support
- Check existing documentation files
- Review troubleshooting section above
- Verify Node.js version compatibility

---

## ✅ Installation Complete

After successful installation, you should have:
- ✅ Zebulon AI chat with memory
- ✅ Admin control panel
- ✅ Mobile-responsive interface
- ✅ Real-time communication
- ✅ Voice interface capabilities
- ✅ Complete offline functionality

**Access your Zebulon system at http://localhost:5000**

**Admin access: Click the logo and use admin/zebulon2025**