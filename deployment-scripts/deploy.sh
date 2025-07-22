#!/bin/bash

# Zebulon AI System - Production Deployment Script
# Automated deployment with health checks and rollback capability

set -e

# Configuration
DEPLOY_DIR="/opt/zebulon"
BACKUP_DIR="/opt/zebulon-backups"
SERVICE_NAME="zebulon-ai"
PORT=${PORT:-3000}
NODE_ENV="production"

echo "🚀 Deploying Zebulon AI System..."

# Create deployment directory
echo "📁 Creating deployment directory..."
sudo mkdir -p "$DEPLOY_DIR"
sudo mkdir -p "$BACKUP_DIR"

# Backup existing deployment
if [ -d "$DEPLOY_DIR/current" ]; then
    echo "💾 Backing up current deployment..."
    sudo cp -r "$DEPLOY_DIR/current" "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S)"
fi

# Extract new deployment
echo "📦 Extracting deployment package..."
sudo tar -xzf zebulon-production.tar.gz -C "$DEPLOY_DIR"
sudo mv "$DEPLOY_DIR/current" "$DEPLOY_DIR/previous" 2>/dev/null || true
sudo mv "$DEPLOY_DIR"/* "$DEPLOY_DIR/current/" 2>/dev/null || true

# Set permissions
echo "🔐 Setting permissions..."
sudo chown -R $USER:$USER "$DEPLOY_DIR/current"
sudo chmod +x "$DEPLOY_DIR/current/deployment-scripts"/*.sh

# Install dependencies
echo "📦 Installing production dependencies..."
cd "$DEPLOY_DIR/current"
npm ci --production

# Database migration
echo "🗄️ Running database migrations..."
npm run db:push || {
    echo "❌ Database migration failed"
    echo "🔄 Rolling back..."
    sudo mv "$DEPLOY_DIR/previous" "$DEPLOY_DIR/current" 2>/dev/null || true
    exit 1
}

# Create systemd service
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null <<EOF
[Unit]
Description=Zebulon AI System
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$DEPLOY_DIR/current
Environment=NODE_ENV=production
Environment=PORT=$PORT
EnvironmentFile=-$DEPLOY_DIR/current/.env
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Reload and start service
echo "🔄 Reloading systemd and starting service..."
sudo systemctl daemon-reload
sudo systemctl enable ${SERVICE_NAME}
sudo systemctl restart ${SERVICE_NAME}

# Health check
echo "🏥 Running health checks..."
sleep 10

for i in {1..30}; do
    if curl -f http://localhost:$PORT/api/health >/dev/null 2>&1; then
        echo "✅ Health check passed!"
        break
    elif [ $i -eq 30 ]; then
        echo "❌ Health check failed after 30 attempts"
        echo "🔄 Rolling back..."
        sudo systemctl stop ${SERVICE_NAME}
        sudo mv "$DEPLOY_DIR/previous" "$DEPLOY_DIR/current" 2>/dev/null || true
        sudo systemctl start ${SERVICE_NAME}
        exit 1
    else
        echo "⏳ Waiting for service to start... ($i/30)"
        sleep 2
    fi
done

# Security scan
echo "🔒 Running post-deployment security scan..."
curl -X POST http://localhost:$PORT/api/security/scan >/dev/null 2>&1 || echo "⚠️ Security scan skipped"

# Performance check
echo "⚡ Running performance check..."
response_time=$(curl -w "%{time_total}" -s -o /dev/null http://localhost:$PORT/)
echo "📊 Response time: ${response_time}s"

# Cleanup old backups (keep last 5)
echo "🧹 Cleaning up old backups..."
sudo find "$BACKUP_DIR" -type d -name "backup-*" | sort -r | tail -n +6 | sudo xargs rm -rf

echo "✅ Deployment completed successfully!"
echo "🌐 Service available at: http://localhost:$PORT"
echo "📊 Service status: $(sudo systemctl is-active ${SERVICE_NAME})"
echo "📝 Logs: sudo journalctl -u ${SERVICE_NAME} -f"