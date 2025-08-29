# 🚀 Linux VPS Deployment Guide

This guide provides step-by-step instructions for deploying the Driver Management System on a Linux VPS using GitHub, Node.js 22+, PM2, and Nginx.

## 📋 Prerequisites

- Linux VPS (Ubuntu 20.04+ or CentOS 8+ recommended)
- Root or sudo access
- Domain name (optional but recommended)
- GitHub account with your project repository

## 🔧 Server Setup

### 1. Initial Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip software-properties-common

# Install build essentials for native dependencies
sudo apt install -y build-essential python3 python3-pip
```

### 2. Install Node.js 22+ using NodeSource

```bash
# Add NodeSource repository for Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should be 22.x.x
npm --version   # Should be 10.x.x
```

### 3. Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Set up PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### 4. Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### 5. Configure Firewall

```bash
# Install UFW if not installed
sudo apt install -y ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Check status
sudo ufw status
```

## 📦 Application Deployment

### 1. Clone Repository from GitHub

```bash
# Navigate to web directory
cd /var/www

# Clone your repository (replace with your GitHub repo URL)
sudo git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git driver-management
sudo chown -R $USER:$USER /var/www/driver-management
cd driver-management
```

### 2. Install Dependencies

```bash
# Install all dependencies (root, client, server)
npm run install:all

# Alternative manual installation if needed:
# npm install
# cd client && npm install && cd ..
# cd server && npm install && cd ..
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables for production
nano .env
```

**Production .env Configuration:**
```bash
# Environment Configuration
NODE_ENV=production

# Server Configuration
PORT=3001
HOST=0.0.0.0

# Database Configuration
DATABASE_PATH=/var/www/driver-management/server/database.db

# JWT Configuration - CHANGE THESE IN PRODUCTION!
JWT_SECRET=your-super-strong-random-jwt-secret-key-here
JWT_EXPIRES_IN=7d

# CORS Configuration (update with your domain)
CORS_ORIGIN=https://your-domain.com

# Security
BCRYPT_ROUNDS=12

# API Configuration
API_PREFIX=/api
API_VERSION=v1
```

### 4. Build Application

```bash
# Build both client and server
npm run build

# Verify build files exist
ls -la client/dist/
ls -la server/dist/
```

### 5. Database Setup

```bash
# Navigate to server directory
cd server

# Initialize database (if needed)
npm run db:migrate

# Set proper permissions for database
chmod 666 database.db
```

## 🚀 PM2 Process Management

### 1. Create PM2 Ecosystem File

```bash
# Create PM2 configuration
nano ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'driver-management-api',
    script: './server/dist/index.js',
    cwd: '/var/www/driver-management',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 2. Start Application with PM2

```bash
# Create logs directory
mkdir -p logs

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check application status
pm2 status
pm2 logs driver-management-api
```

## 🌐 Nginx Configuration

### 1. Create Nginx Site Configuration

```bash
# Create site configuration
sudo nano /etc/nginx/sites-available/driver-management
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain

    # Client files (React build)
    location / {
        root /var/www/driver-management/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    }

    # API routes
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        root /var/www/driver-management/client/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

### 2. Enable Site and Restart Nginx

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/driver-management /etc/nginx/sites-enabled/

# Remove default site if exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## 🔒 SSL Certificate (Optional but Recommended)

### 1. Install Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate

```bash
# Get certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## 🔄 Deployment Automation

### 1. Create Deployment Script

```bash
# Create deployment script
nano deploy.sh
chmod +x deploy.sh
```

**deploy.sh:**
```bash
#!/bin/bash

# Driver Management System Deployment Script
set -e

echo "🚀 Starting deployment..."

# Navigate to project directory
cd /var/www/driver-management

# Pull latest changes
echo "📦 Pulling latest changes from GitHub..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Build application
echo "🔨 Building application..."
npm run build

# Restart PM2 application
echo "🔄 Restarting application..."
pm2 restart driver-management-api

# Reload Nginx (if needed)
sudo systemctl reload nginx

echo "✅ Deployment completed successfully!"
echo "📊 Application status:"
pm2 status
```

### 2. Create Update Script for Easy Updates

```bash
# Create update script
nano update.sh
chmod +x update.sh
```

**update.sh:**
```bash
#!/bin/bash

# Quick update script
echo "🔄 Quick update..."
cd /var/www/driver-management
git pull origin main
npm run build
pm2 restart driver-management-api
echo "✅ Update completed!"
```

## 📊 Monitoring and Maintenance

### 1. PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs driver-management-api

# Application info
pm2 info driver-management-api

# Restart if needed
pm2 restart driver-management-api
```

### 2. System Monitoring

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check system load
htop

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 3. Database Backup

```bash
# Create backup script
nano backup-db.sh
chmod +x backup-db.sh
```

**backup-db.sh:**
```bash
#!/bin/bash

# Database backup script
BACKUP_DIR="/var/backups/driver-management"
DATE=$(date +%Y%m%d_%H%M%S)
DB_PATH="/var/www/driver-management/server/database.db"

# Create backup directory if it doesn't exist
sudo mkdir -p $BACKUP_DIR

# Create backup
sudo cp $DB_PATH $BACKUP_DIR/database_backup_$DATE.db

# Keep only last 30 backups
sudo find $BACKUP_DIR -name "database_backup_*.db" -mtime +30 -delete

echo "✅ Database backup completed: database_backup_$DATE.db"
```

### 4. Automated Backups with Cron

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /var/www/driver-management/backup-db.sh
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Application Won't Start
```bash
# Check logs
pm2 logs driver-management-api

# Check Node.js version
node --version

# Check if port is in use
sudo netstat -tlnp | grep :3001

# Restart application
pm2 restart driver-management-api
```

#### 2. Nginx Issues
```bash
# Check Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

#### 3. Database Issues
```bash
# Check database file permissions
ls -la server/database.db

# Fix permissions if needed
chmod 666 server/database.db
chown $USER:$USER server/database.db
```

#### 4. Build Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules client/node_modules server/node_modules
npm run install:all

# Rebuild
npm run build
```

## 📈 Performance Optimization

### 1. Enable Gzip in Nginx (already included in config above)

### 2. PM2 Cluster Mode (for high traffic)
```javascript
// In ecosystem.config.js
module.exports = {
  apps: [{
    name: 'driver-management-api',
    script: './server/dist/index.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    // ... rest of config
  }]
};
```

### 3. Database Optimization
- Regular VACUUM operations
- Proper indexing (already implemented)
- Regular backups

## 🔒 Security Best Practices

1. **Keep system updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Use strong JWT secrets**
   - Generate random JWT secrets
   - Store in environment variables

3. **Regular backups**
   - Database backups
   - Application code backups

4. **Monitor logs**
   - Application logs
   - Nginx logs
   - System logs

5. **Firewall configuration**
   - Only open necessary ports
   - Regular security audits

## 📝 Quick Reference Commands

```bash
# Start application
pm2 start ecosystem.config.js

# Stop application
pm2 stop driver-management-api

# Restart application
pm2 restart driver-management-api

# View logs
pm2 logs driver-management-api

# Update application
./update.sh

# Full deployment
./deploy.sh

# Backup database
./backup-db.sh

# Check application status
pm2 status

# Monitor application
pm2 monit
```

## 🎯 Post-Deployment Checklist

- [ ] Application accessible via domain/IP
- [ ] API endpoints responding correctly
- [ ] Database initialized with default admin user
- [ ] SSL certificate installed (if using domain)
- [ ] Firewall configured properly
- [ ] PM2 process running and saved
- [ ] Nginx serving static files correctly
- [ ] Backup scripts configured
- [ ] Monitoring set up
- [ ] Environment variables configured for production

---

**Need Help?** 
- Check the logs: `pm2 logs driver-management-api`
- Test the API: `curl http://your-domain.com/api/health`
- Verify build files: `ls -la client/dist/ server/dist/`

**Default Admin Login:**
- Username: admin
- Password: admin123 (Change immediately after first login!)

---

**Last Updated**: August 29, 2025
**Node.js Version**: 22.x.x
**Deployment Type**: Production Linux VPS
**Process Manager**: PM2
**Web Server**: Nginx
**Database**: SQLite
