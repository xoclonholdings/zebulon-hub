# Zebulon Oracle System - Complete Setup Guide

## 🚀 Quick Deployment

### Prerequisites
- Node.js 20+ installed
- PostgreSQL 12+ (optional for offline mode)
- 2GB RAM minimum
- 5GB storage space

### 1. Extract and Install
```bash
tar -xvf zebulon_offline_bundle.tar
cd zebulon_offline_bundle/
npm install
```

### 2. Database Setup

#### Option A: Cloud Database (Online)
```bash
# Copy environment template
cp .env.template .env

# Edit .env with your database URL
DATABASE_URL="postgresql://user:pass@host:port/db"

# Initialize database
psql "$DATABASE_URL" < zebulon_oracle_backup.sql
npx prisma generate
```

#### Option B: Local Database (Offline)
```bash
# Install PostgreSQL locally
sudo apt update && sudo apt install postgresql postgresql-contrib

# Create local database
sudo -u postgres createdb zebulon_local
sudo -u postgres createuser zebulon_user -P

# Configure environment
cp .env.template .env
# Edit DATABASE_URL_LOCAL in .env

# Initialize local database
psql "postgresql://zebulon_user:password@localhost:5432/zebulon_local" < zebulon_oracle_backup.sql
```

### 3. Build and Start
```bash
# Build the application
npm run build

# Start in production mode
npm start

# Or start in development mode
npm run dev
```

### 4. Access System
- Open browser to: `http://localhost:5000`
- Login with: `admin` / `admin123`
- Change default password immediately

## 🔧 Module Configuration

### Available Modules
1. **ZED** - Chat Interface (Purple) - Connect external chat applications
2. **ZYNC** - IDE Interface (Green) - Connect development environments  
3. **ZETA** - Security Panel (Blue) - Connect security tools
4. **ZWAP!** - Financial Utility (Pink) - Connect financial applications
5. **LEGACY** - Genealogy Archive (Orange) - GEDCOM file processing built-in
6. **Config** - System Settings (Gray) - Internal configuration panel

### Module Integration
Each module (except Config and Legacy) can connect to external applications:

1. **URL/Website**: Connect web applications
2. **Custom Script**: Embed JavaScript applications  
3. **Embed Code**: Iframe-based applications

#### To Connect a Module:
1. Click on any module tile
2. If not connected, module settings will open
3. Choose integration type and configure
4. Save configuration
5. Module will now open connected application

## 💾 Database Features

### Dual Database System
- **Primary**: Cloud database for online operation
- **Fallback**: Local database for offline operation
- **Automatic**: System switches based on connectivity

### Health Monitoring
```bash
# Check system status
curl http://localhost:5000/api/health

# Expected response:
{
  "status": "ok",
  "message": "Zebulon Oracle System is running with Prisma",
  "database": {
    "connection": "neon|local",
    "database": "Neon (Online)|Local (Offline)"
  }
}
```

## 📁 GEDCOM Processing

### Upload Genealogy Files
1. Click **LEGACY** module tile
2. Upload .ged files (up to 50MB)
3. System parses and stores family tree data
4. Browse individuals and families
5. Export data in JSON or TXT format

### Sample GEDCOM File
A sample file `test-sample.ged` is included for testing.

## 🔒 Security Features

### Authentication System
- Session-based authentication
- Bcrypt password hashing
- Role-based access control
- Rate limiting enabled

### File Upload Security
- File type validation
- Size limits enforced
- User authentication required
- Secure file storage

## 🛠 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check database status
psql "$DATABASE_URL" -c "SELECT 1;"

# Regenerate Prisma client
npx prisma generate

# Reset database schema
npx prisma db push --force-reset
```

#### Port Already in Use
```bash
# Change port in .env
PORT=5001

# Or kill existing process
pkill -f "node.*5000"
```

#### Module Not Loading
1. Check browser console for errors
2. Verify module integration configuration
3. Test with simple URL integration first
4. Check CORS settings for external apps

### Environment Variables
All configuration is through `.env` file:
- `DATABASE_URL` - Primary database connection
- `DATABASE_URL_LOCAL` - Local database fallback
- `PORT` - Server port (default: 5000)
- `SESSION_SECRET` - Session encryption key
- `NODE_ENV` - Environment mode

## 🚢 Production Deployment

### Docker Deployment
```bash
# Build container
docker build -t zebulon .

# Run container
docker run -d -p 5000:5000 \
  -e DATABASE_URL="your_db_url" \
  -e SESSION_SECRET="your_secret" \
  zebulon
```

### Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Process Management (PM2)
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "zebulon" -- start

# Monitor
pm2 monit

# Auto-restart on boot
pm2 startup
pm2 save
```

## 📊 System Monitoring

### Log Files
- Application logs: `console output`
- Database logs: `postgresql logs`
- Upload logs: `uploads/ directory`

### Performance Metrics
- Memory usage: ~90MB runtime
- Response time: <50ms average
- Database queries: Optimized with indexes
- File upload: Concurrent processing

## 🔄 Offline Operation

### Enable Offline Mode
1. Configure `DATABASE_URL_LOCAL` in `.env`
2. Initialize local database with backup file
3. System automatically detects connectivity
4. Switches to local database when offline

### Offline Features
- All modules remain functional
- GEDCOM processing continues
- User authentication works
- Module integrations (if locally accessible)

## 📞 Support

### Verification Checklist
- [ ] Database connection successful
- [ ] Admin login working
- [ ] All 6 modules clickable
- [ ] GEDCOM upload functional
- [ ] Health endpoint responding
- [ ] Module integration configurable

### Logs and Debugging
```bash
# View application logs
npm run dev  # Shows real-time logs

# Check database connectivity
npm run db:test  # If available

# Verify build
npm run build  # Should complete without errors
```

---

**Zebulon Oracle System**  
*Complete offline-capable integration platform*  
*Ready for deployment on any environment*