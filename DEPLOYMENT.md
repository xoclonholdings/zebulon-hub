# Zebulon Oracle System - Deployment Guide

## Deploying to xoclon.online

### Prerequisites
- Node.js 18+ installed on your server
- PostgreSQL database (local or managed service)
- SSL certificate for HTTPS
- Domain DNS pointing to your server IP

### Environment Variables Required
Create a `.env` file with:
```
DATABASE_URL="postgresql://username:password@host:5432/database_name"
SESSION_SECRET="your-secure-random-string-here"
NODE_ENV="production"
PORT=5000
```

### Deployment Steps

#### Option 1: Traditional VPS/Server Deployment
```bash
# 1. Clone/upload your project files to server
# 2. Install dependencies
npm install

# 3. Build the application
npm run build

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your database details

# 5. Initialize database
npm run db:push

# 6. Start the application
npm run start
```

#### Option 2: Using PM2 (Recommended for Production)
```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start dist/index.js --name "zebulon-oracle"

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Option 3: Docker Deployment
```bash
# Build Docker image
docker build -t zebulon-oracle .

# Run container
docker run -d \
  --name zebulon-oracle \
  -p 5000:5000 \
  --env-file .env \
  zebulon-oracle
```

### Nginx Configuration (Reverse Proxy)
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name xoclon.online www.xoclon.online;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name xoclon.online www.xoclon.online;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;

    location / {
        proxy_pass http://localhost:5000;
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

### Database Setup Options

#### Option 1: Managed PostgreSQL
- AWS RDS PostgreSQL
- DigitalOcean Managed Databases
- Heroku Postgres
- Neon.tech (serverless)

#### Option 2: Self-hosted PostgreSQL
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE zebulon_oracle;
CREATE USER zebulon_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE zebulon_oracle TO zebulon_user;
\q
```

### SSL Certificate Setup (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d xoclon.online -d www.xoclon.online

# Test automatic renewal
sudo certbot renew --dry-run
```

### Monitoring and Maintenance
- Set up log rotation for application logs
- Configure automated backups for PostgreSQL
- Monitor server resources (CPU, memory, disk)
- Set up uptime monitoring for your domain

### Security Considerations
- Use strong passwords for database and session secrets
- Enable firewall (ufw) with only necessary ports open
- Keep Node.js and system packages updated
- Regular security audits with `npm audit`

### Troubleshooting
- Check application logs: `pm2 logs zebulon-oracle`
- Verify database connection: `npm run db:push`
- Test SSL certificate: `openssl s_client -connect xoclon.online:443`
- Monitor server resources: `htop` or `free -h`

Your Zebulon Oracle system is fully portable and ready for deployment to xoclon.online!