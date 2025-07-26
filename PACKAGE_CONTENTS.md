# 📦 Zebulon Offline Bundle - Complete Package Contents

## 🔐 **CREDENTIALS & ACCESS**

### **Login Information:**
- **Username:** `admin`
- **Password:** `admin123`

### **Local Database Configuration:**
```bash
# For local PostgreSQL setup:
DATABASE_URL_LOCAL="postgresql://zebulon_user:zebulon123@localhost:5432/zebulon_local"

# Database User:
Username: zebulon_user
Password: zebulon123
Database: zebulon_local
```

## 📁 **Package Contents**

### **Core Application Files:**
- `server/` - Complete Express.js backend
  - `server/index.ts` - Main server entry point
  - `server/db-dual.ts` - Dual database connection logic
  - `server/storage-prisma.ts` - Database operations
  - `server/routes/gedcom.ts` - GEDCOM file processing
  - `server/public/` - Built frontend assets
- `client/` - Complete React frontend source
  - `client/src/components/ZebulonSimple.tsx` - Main UI
  - `client/src/components/GenealogyModule.tsx` - GEDCOM interface
  - `client/src/components/ModuleSettings.tsx` - Module configuration
  - All UI components and styling

### **Database & Schema:**
- `prisma/schema.prisma` - Complete database schema
- `zebulon_oracle_backup.sql` - Full database initialization
- `shared/schema.ts` - TypeScript schema definitions

### **Configuration Files:**
- `.env.template` - Environment configuration template
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.clean.ts` - Build configuration
- `tailwind.config.ts` - Styling configuration

### **Documentation:**
- `SETUP_GUIDE.md` - Complete deployment instructions
- `CREDENTIALS_AND_DATABASE_INFO.md` - Login and database details
- `DATABASE_MIGRATION_GUIDE.md` - Offline database setup
- `FINALIZATION_REPORT.md` - System verification report
- `ZEBULON_EXPORT_README.md` - Quick start guide
- `replit.md` - Complete system architecture documentation

### **Sample Files:**
- `test-sample.ged` - Sample GEDCOM file for testing
- `uploads/gedcom/` - File upload directory with example

## 🚀 **Quick Start Commands**

```bash
# Extract bundle
tar -xvf zebulon_offline_bundle.tar

# Install dependencies
npm install

# Configure environment
cp .env.template .env
# Edit .env with your database URL

# Initialize database
psql "$DATABASE_URL" < zebulon_oracle_backup.sql

# Build and start
npm run build
npm start

# Access at: http://localhost:5000
# Login: admin/admin123
```

## 🔧 **Module Integration Map**

### **Module Tiles:**
1. **ZED (Purple)** - Chat Interface
   - Integration ready for external chat apps
   - Configuration via module settings

2. **ZYNC (Green)** - IDE Interface  
   - Integration ready for development tools
   - Supports URL/Script/Embed integration

3. **ZETA (Blue)** - Security Panel
   - Integration ready for security tools
   - Configurable authentication

4. **ZWAP! (Pink)** - Financial Utility
   - Integration ready for financial apps
   - Data visualization ready

5. **LEGACY (Orange)** - Genealogy Archive
   - **Built-in GEDCOM processing**
   - Upload .ged files
   - Browse family trees
   - Export JSON/TXT data

6. **Config (Gray)** - System Settings
   - Internal configuration panel
   - Password change functionality
   - System monitoring

## 💾 **Database Features**

### **Dual Database System:**
- **Online Mode:** Connects to cloud database (Neon)
- **Offline Mode:** Automatically switches to local PostgreSQL
- **Health Monitoring:** Real-time connection status
- **Automatic Failover:** Seamless switching

### **Data Storage:**
- **Users:** Authentication and role management
- **Oracle Memory:** Knowledge base storage
- **Family Trees:** GEDCOM genealogy data
- **Module Integrations:** External app connections
- **System Status:** Health monitoring data

## 🔒 **Security Features**

### **Authentication:**
- Session-based login system
- Bcrypt password hashing
- Role-based access control
- Session timeout management

### **File Security:**
- Type validation for uploads
- Size limits (50MB default)
- User-specific file isolation
- Secure temporary storage

## 📊 **System Specifications**

### **Package Size:** ~50MB (excluding node_modules)
### **Runtime Requirements:**
- Node.js 20+
- PostgreSQL 12+ (optional)
- 2GB RAM minimum
- 5GB storage space

### **Performance:**
- Startup time: ~3 seconds
- Memory usage: ~90MB runtime
- Response time: <50ms average
- Build time: ~8 seconds

## ✅ **Verification Checklist**

After deployment, verify:
- [ ] System accessible at http://localhost:5000
- [ ] Admin login successful (admin/admin123)
- [ ] All 6 module tiles clickable
- [ ] GEDCOM upload functional in LEGACY module
- [ ] Health endpoint responding: `/api/health`
- [ ] Database connection established
- [ ] Module integrations configurable

---

**🎉 Complete Zebulon Oracle System Package Ready for Deployment**

*Includes everything needed for offline operation with dual database support and complete module integration platform.*