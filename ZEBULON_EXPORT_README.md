# Zebulon Oracle System - Export Package

## 🚀 Quick Start

1. **Install Node.js 20+ and PostgreSQL**
2. **Extract package and install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database URLs
   ```
4. **Initialize database:**
   ```bash
   psql your_database_url < zebulon_oracle_backup.sql
   npx prisma generate
   ```
5. **Start system:**
   ```bash
   npm run build && npm start
   ```

## 🔧 System Features

### Core Functionality
- ✅ Single-server architecture on port 5000
- ✅ Dual database system (online/offline automatic failover)
- ✅ GEDCOM genealogy file processing
- ✅ Module integration platform for external apps
- ✅ Oracle database query engine
- ✅ Complete authentication system

### Modules Available
1. **ZED** - Chat Interface (integration ready)
2. **ZYNC** - IDE Interface (integration ready)
3. **ZETA** - Security Panel (integration ready)
4. **ZWAP!** - Financial Utility (integration ready)
5. **LEGACY** - Genealogy Archive (GEDCOM processing)
6. **Config** - System Settings (internal)

## 💾 Database Configuration

### Online/Offline Dual Setup
```bash
# .env configuration
DATABASE_URL_NEON="postgresql://user:pass@neon-host:5432/db"    # Primary online
DATABASE_URL_LOCAL="postgresql://user:pass@localhost:5432/db"  # Fallback offline
```

### Automatic Failover
- System automatically detects internet connectivity
- Switches to local database when offline
- Seamless operation in both modes
- Health monitoring at `/api/health`

## 📁 Package Contents

```
zebulon_export_bundle/
├── server/                     # Backend Express server
├── client/                     # React frontend source
├── dist/                       # Built production files
├── prisma/                     # Database schema
├── uploads/                    # File upload directory
├── zebulon_oracle_backup.sql   # Database initialization
├── DATABASE_MIGRATION_GUIDE.md # Offline setup guide
├── .env.example               # Environment template
├── package.json               # Dependencies
└── README.md                  # This file
```

## 🔒 Default Credentials

**Admin User:**
- Username: `admin`
- Password: `admin123`

⚠️ **Change default credentials after first login**

## 🌍 Deployment Options

### Local Deployment
```bash
npm run build && npm start
```

### Docker Deployment
```bash
docker build -t zebulon .
docker run -p 5000:5000 zebulon
```

### Production Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database initialization
4. Build and start application
5. Set up reverse proxy (nginx recommended)

## 📊 System Requirements

- **Node.js:** 20+ 
- **PostgreSQL:** 12+
- **RAM:** 2GB minimum
- **Storage:** 5GB minimum
- **Network:** Optional (works offline)

## 🛠 Troubleshooting

### Database Connection Issues
```bash
# Test database connection
npm run db:test

# Reset database schema
npx prisma db push --force-reset
```

### Port Conflicts
```bash
# Change port in server/index.ts
const PORT = process.env.PORT || 5000;
```

### Module Integration
- Access module settings via each module tile
- Configure external app connections
- Support for URL, Script, and Embed integrations

## 📞 Support

For deployment assistance, refer to:
- `DATABASE_MIGRATION_GUIDE.md` - Complete offline setup
- `DEPLOYMENT.md` - Production deployment guide
- System logs at runtime for debugging

## ✅ Verification Checklist

- [ ] Database connection established
- [ ] Admin login successful
- [ ] All 6 modules accessible
- [ ] GEDCOM upload functional
- [ ] System health endpoint responding
- [ ] Offline mode tested (if applicable)

---

**Zebulon Oracle System v1.0**  
*Complete offline-capable integration platform*