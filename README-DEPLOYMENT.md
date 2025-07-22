# Zebulon AI System - Deployment Guide

## 🚀 Production Deployment

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **PostgreSQL**: 12.0 or higher
- **Operating System**: Linux (Ubuntu/CentOS recommended)
- **Memory**: Minimum 2GB RAM
- **Storage**: Minimum 10GB disk space

### Quick Deployment

1. **Download and extract the production package:**
   ```bash
   tar -xzf zebulon-production.tar.gz
   cd zebulon-production/
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run the deployment script:**
   ```bash
   chmod +x deployment-scripts/deploy.sh
   sudo ./deployment-scripts/deploy.sh
   ```

### Manual Deployment

#### 1. System Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y
```

#### 2. Database Setup

```bash
# Create database and user
sudo -u postgres psql -c "CREATE DATABASE zebulon;"
sudo -u postgres psql -c "CREATE USER zebulon_user WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE zebulon TO zebulon_user;"
```

#### 3. Application Setup

```bash
# Create application directory
sudo mkdir -p /opt/zebulon
sudo chown $USER:$USER /opt/zebulon

# Extract application
tar -xzf zebulon-production.tar.gz -C /opt/zebulon

# Install dependencies
cd /opt/zebulon
npm ci --production

# Set up environment
cp .env.example .env
# Edit .env file with your configuration
```

#### 4. Database Migration

```bash
npm run db:push
```

#### 5. Service Configuration

```bash
# Create systemd service
sudo cp deployment-scripts/zebulon-ai.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable zebulon-ai
sudo systemctl start zebulon-ai
```

### Environment Configuration

Create a `.env` file with the following variables:

```env
# Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://zebulon_user:your_password@localhost:5432/zebulon

# Security
SESSION_SECRET=your_very_secure_session_secret_here

# AI Services (Optional)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure_admin_password
```

### Security Hardening

#### 1. Firewall Configuration

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000  # Application port
sudo ufw enable
```

#### 2. SSL/TLS Setup (with Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot -y

# Obtain SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Set up SSL proxy (nginx example)
sudo apt install nginx -y
```

#### 3. Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Performance Optimization

#### 1. System Limits

```bash
# Increase file descriptor limits
echo "zebulon soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "zebulon hard nofile 65536" | sudo tee -a /etc/security/limits.conf
```

#### 2. PostgreSQL Tuning

```sql
-- Add to postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

#### 3. Node.js Optimization

```bash
# Set Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=2048"
```

### Monitoring and Maintenance

#### 1. Health Checks

```bash
# Application health
curl http://localhost:3000/api/health

# Database health
curl http://localhost:3000/api/health/db

# Security status
curl http://localhost:3000/api/health/security
```

#### 2. Log Management

```bash
# View application logs
sudo journalctl -u zebulon-ai -f

# View system logs
sudo tail -f /var/log/syslog
```

#### 3. Backup Strategy

```bash
#!/bin/bash
# Database backup script
pg_dump zebulon > backup_$(date +%Y%m%d_%H%M%S).sql

# Application backup
tar -czf zebulon_backup_$(date +%Y%m%d_%H%M%S).tar.gz /opt/zebulon
```

### Scaling Options

#### Horizontal Scaling

1. **Load Balancer Setup**: Use nginx or HAProxy
2. **Database Clustering**: PostgreSQL read replicas
3. **Session Management**: Redis for shared sessions
4. **File Storage**: Shared filesystem or object storage

#### Vertical Scaling

1. **CPU**: Increase CPU cores for better concurrency
2. **Memory**: Add RAM for larger cache and better performance
3. **Storage**: Use SSD for faster database operations

### Troubleshooting

#### Common Issues

1. **Port Already in Use**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 <PID>
   ```

2. **Database Connection Failed**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Test connection
   psql -h localhost -U zebulon_user -d zebulon
   ```

3. **High Memory Usage**
   ```bash
   # Monitor memory
   htop
   
   # Restart application
   sudo systemctl restart zebulon-ai
   ```

#### Performance Issues

1. **Slow Database Queries**
   ```sql
   -- Check slow queries
   SELECT query, mean_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC 
   LIMIT 10;
   ```

2. **High CPU Usage**
   ```bash
   # Check process usage
   top -p $(pgrep -f "zebulon")
   ```

### Support

For technical support and issues:

1. Check the application logs
2. Review the security dashboard
3. Monitor system resources
4. Verify database connectivity

### Updates

To update the application:

1. Download the new release
2. Stop the service: `sudo systemctl stop zebulon-ai`
3. Backup current installation
4. Extract new version
5. Run migrations: `npm run db:migrate`
6. Start service: `sudo systemctl start zebulon-ai`
7. Verify health: `curl http://localhost:3000/api/health`