# Zebulon Oracle Database Migration Guide

## Overview
Complete guide for migrating from Neon cloud database to local PostgreSQL for offline operation.

## Current Status
✅ Dual database system implemented with automatic failover
✅ Database backup file created: `zebulon_oracle_backup.sql`
✅ Prisma-based connection management with online/offline detection
✅ Automatic fallback from Neon to local PostgreSQL when internet unavailable

## Migration Steps (7-Step Process)

### Step 1: Backup Current Database ✅
- Created `zebulon_oracle_backup.sql` with complete schema
- Includes all tables: User, OracleMemory, FamilyTree, ModuleIntegration
- Sample admin user included (username: admin, password: admin123)

### Step 2: Install Local PostgreSQL
```bash
# Install PostgreSQL locally
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Step 3: Create Local Database
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE zebulon_local;
CREATE USER zebulon_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE zebulon_local TO zebulon_user;
\q
```

### Step 4: Set Environment Variables
```bash
# Add to .env file
DATABASE_URL_NEON="your_current_neon_url"
DATABASE_URL_LOCAL="postgresql://zebulon_user:your_secure_password@localhost:5432/zebulon_local"
```

### Step 5: Import Schema to Local Database
```bash
# Import backup to local database
psql postgresql://zebulon_user:your_secure_password@localhost:5432/zebulon_local < zebulon_oracle_backup.sql
```

### Step 6: Test Dual Connection
```bash
# Test system with both databases
npm run dev

# Check health endpoint for database status
curl http://localhost:5000/api/health
```

### Step 7: Verify Offline Operation
```bash
# Disconnect from internet and test
# System should automatically switch to local database
# All functionality should remain operational
```

## Current Implementation Features

### Automatic Failover Logic
- Primary: Neon cloud database (online mode)
- Fallback: Local PostgreSQL (offline mode)
- Automatic detection and switching
- Real-time status monitoring

### Database Operations
- All CRUD operations work on both databases
- Seamless switching without data loss
- Connection health monitoring
- Error handling and retry logic

### GEDCOM File Processing
- Upload .ged genealogy files
- Parse and store family tree data
- Export data in JSON/TXT formats
- User-specific data isolation

### Module Integration System
- Connect external apps to modules
- Support for URL, Script, and Embed integrations
- Persistent storage of module connections
- User-specific integration management

## Next Steps for Complete Offline Setup

1. Install local PostgreSQL on deployment machine
2. Configure DATABASE_URL_LOCAL environment variable
3. Import backup file to local database
4. Test offline operation by disconnecting internet
5. Verify all features work in offline mode

## Troubleshooting

### Connection Issues
- Check PostgreSQL service status: `sudo systemctl status postgresql`
- Verify firewall settings allow local connections
- Ensure database user has proper permissions

### Data Sync Issues
- Export current data before switching
- Use backup file to restore data if needed
- Monitor logs for connection switching messages

### Performance Optimization
- Local database typically faster than cloud
- Consider indexing for large datasets
- Monitor memory usage for offline operation

## Security Considerations
- Local database runs on trusted hardware only
- No external network access required for offline mode
- Backup files contain sensitive data - store securely
- Use strong passwords for local database users