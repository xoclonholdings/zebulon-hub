# Zebulon Oracle System - Credentials & Database Information

## 🔐 Default Login Credentials

**Admin Account:**
- **Username:** `admin`
- **Password:** `admin123`

⚠️ **IMPORTANT:** Change these credentials immediately after first login for security.

## 💾 Database Configuration

### Current Setup - DUAL DATABASE SYSTEM ACTIVE ✅
The system now has **dual database functionality** with automatic failover:

1. **Primary (Online):** Neon cloud database
2. **Secondary (Offline):** Local PostgreSQL database configured via DATABASE_URL_LOCAL secret

**System Status:**
- Current Connection: **Neon (Online)** ✅
- Failover Ready: **Yes** ✅
- Auto-switching: **Enabled** ✅

### Local Database Setup (For Offline Operation)

#### Option 1: Using Local PostgreSQL
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE zebulon_local;
CREATE USER zebulon_user WITH ENCRYPTED PASSWORD 'zebulon123';
GRANT ALL PRIVILEGES ON DATABASE zebulon_local TO zebulon_user;
\q

# Local database URL
DATABASE_URL_LOCAL="postgresql://zebulon_user:zebulon123@localhost:5432/zebulon_local"
```

#### Option 2: Using Docker PostgreSQL
```bash
# Run PostgreSQL in Docker
docker run --name zebulon-postgres \
  -e POSTGRES_DB=zebulon_local \
  -e POSTGRES_USER=zebulon_user \
  -e POSTGRES_PASSWORD=zebulon123 \
  -p 5432:5432 \
  -d postgres:15

# Local database URL
DATABASE_URL_LOCAL="postgresql://zebulon_user:zebulon123@localhost:5432/zebulon_local"
```

### Database Initialization
```bash
# Initialize local database with backup
psql "postgresql://zebulon_user:zebulon123@localhost:5432/zebulon_local" < zebulon_oracle_backup.sql

# Or if using the current Neon database
psql "$DATABASE_URL" < zebulon_oracle_backup.sql
```

## 🔄 Environment Configuration

### Complete .env Example
```bash
# Primary Database (Current Neon)
DATABASE_URL="postgresql://neondb_owner:password@ep-lively-shape-aeft23w3-pooler.c-2.us-east-2.aws.neon.tech:5432/neondb"

# Local Database (For offline mode)
DATABASE_URL_LOCAL="postgresql://zebulon_user:zebulon123@localhost:5432/zebulon_local"

# Server Configuration
NODE_ENV="production"
PORT=5000
SESSION_SECRET="your-secure-random-session-secret-here"

# File Upload
MAX_FILE_SIZE=50MB
UPLOAD_PATH="./uploads"
```

## 🧪 Testing Database Connections

### Test Current Database
```bash
# Test main database connection
curl http://localhost:5000/api/health

# Expected response:
{
  "status": "ok",
  "message": "Zebulon Oracle System is running with Prisma",
  "database": {
    "connection": "neon",
    "database": "Neon (Online)"
  }
}
```

### Test Local Database Connection
```bash
# Test local PostgreSQL connection
psql "postgresql://zebulon_user:zebulon123@localhost:5432/zebulon_local" -c "SELECT 1;"

# Should return:
# ?column? 
# ----------
#        1
# (1 row)
```

## 🔑 Security Notes

### Password Policy
- Default admin password: `admin123`
- Database user password: `zebulon123`
- Change all default passwords in production
- Use strong passwords (16+ characters)

### Session Security
- Generate a unique SESSION_SECRET for production
- Use HTTPS in production environments
- Regular password rotation recommended

### Database Security
- Restrict database access to localhost only
- Use firewall rules to limit connections
- Regular backup and recovery testing
- Monitor for unauthorized access attempts

## 📋 Quick Setup Checklist

- [ ] Extract Zebulon bundle
- [ ] Run `npm install`
- [ ] Copy `.env.template` to `.env`
- [ ] Configure database URLs in `.env`
- [ ] Initialize database: `psql "$DATABASE_URL" < zebulon_oracle_backup.sql`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Build application: `npm run build`
- [ ] Start system: `npm start`
- [ ] Login with admin/admin123
- [ ] Change default password
- [ ] Test all 6 modules
- [ ] Configure module integrations as needed

## 🆘 Emergency Access

If you lose access to the admin account:

### Reset Admin Password
```sql
-- Connect to database
psql "$DATABASE_URL"

-- Reset admin password (hash for 'newpassword123')
UPDATE users SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE username = 'admin';
```

### Create New Admin User
```sql
-- Create backup admin account
INSERT INTO users (username, password_hash, role) VALUES 
('backup_admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
```

---

**Save this information securely and update passwords before deployment!**