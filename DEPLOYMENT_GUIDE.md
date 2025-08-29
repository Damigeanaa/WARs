# 🚀 VPS Deployment Guide - Driver Management System

This guide will help you deploy the Driver Management System on your own VPS server.

## 📋 Prerequisites

### VPS Requirements
- **OS**: Ubuntu 20.04 LTS or newer (recommended)
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Storage**: Minimum 20GB SSD
- **CPU**: 2+ cores recommended
- **Network**: Public IP address

### Required Software
- Node.js (v22.5.4 LTS or newer)
- npm (v10 or newer)
- PM2 (for process management)
- Nginx (as reverse proxy)
- Git
- SQLite (already included with Node.js)

---

## 🔧 Step 1: Server Setup

### 1.1 Connect to Your VPS
```bash
ssh root@your-vps-ip
# or
ssh username@your-vps-ip
```

### 1.2 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Install Node.js
```bash
# Install Node.js 22.x LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v22.x.x
npm --version   # Should show v10.x.x or newer
```

### 1.4 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 1.5 Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 1.6 Install Git
```bash
sudo apt install git -y
```

---

## 📁 Step 2: Deploy the Application

### 2.1 Create Application Directory
```bash
sudo mkdir -p /var/www/driver-management
sudo chown -R $USER:$USER /var/www/driver-management
cd /var/www/driver-management
```

### 2.2 Clone or Upload Your Code
```bash
# Option A: If using Git (recommended)
git clone https://github.com/yourusername/driver-management.git .

# Option B: Upload files manually via SCP
# From your local machine:
# scp -r /path/to/WAR/* username@your-vps-ip:/var/www/driver-management/
```

### 2.3 Install Backend Dependencies
```bash
cd /var/www/driver-management/server
npm install --production
```

### 2.4 Install Frontend Dependencies and Build
```bash
cd /var/www/driver-management/client
npm install
npm run build
```

---

## ⚙️ Step 3: Configuration

### 3.1 Create Environment Files

#### Backend Environment (.env)
```bash
cd /var/www/driver-management/server
nano .env
```

Add the following content:
```env
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DB_PATH=/var/www/driver-management/server/database.sqlite

# Optional: If using external database
# DATABASE_URL=your-database-connection-string
```

#### Frontend Environment
```bash
cd /var/www/driver-management/client
nano .env.production
```

Add the following content:
```env
VITE_API_URL=http://your-domain.com/api
# or use your IP: VITE_API_URL=http://your-vps-ip/api
```

### 3.2 Rebuild Frontend with Production Config
```bash
cd /var/www/driver-management/client
npm run build
```

---

## 🔄 Step 4: Process Management with PM2

### 4.1 Create PM2 Ecosystem File
```bash
cd /var/www/driver-management
nano ecosystem.config.js
```

Add the following content:
```javascript
module.exports = {
  apps: [
    {
      name: 'driver-management-api',
      script: './server/dist/index.js',
      cwd: '/var/www/driver-management',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true
    }
  ]
}
```

### 4.2 Create Logs Directory
```bash
mkdir -p /var/www/driver-management/logs
```

### 4.3 Build and Start the Application
```bash
cd /var/www/driver-management/server
npm run build

# Start with PM2
cd /var/www/driver-management
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🌐 Step 5: Nginx Configuration

### 5.1 Create Nginx Server Block
```bash
sudo nano /etc/nginx/sites-available/driver-management
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain
    
    # Frontend (React app)
    location / {
        root /var/www/driver-management/client/dist;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
    
    # API Backend
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
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        root /var/www/driver-management/client/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5.2 Enable the Site
```bash
sudo ln -s /etc/nginx/sites-available/driver-management /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

---

## 🔒 Step 6: Security & SSL (Optional but Recommended)

### 6.1 Install Certbot for Let's Encrypt SSL
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 6.2 Obtain SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 6.3 Setup Firewall
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 🗄️ Step 7: Database Setup

### 7.1 Initialize Database
```bash
cd /var/www/driver-management/server
node -e "
const { initDatabase } = require('./dist/database/init.js');
initDatabase().then(() => {
  console.log('Database initialized successfully!');
  process.exit(0);
}).catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});
"
```

### 7.2 Create Default Admin User
```bash
node -e "
const bcrypt = require('bcrypt');
const { dbRun } = require('./dist/database/database.js');

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await dbRun('INSERT OR REPLACE INTO users (username, password, role) VALUES (?, ?, ?)', 
    ['admin', hashedPassword, 'admin']);
  console.log('Admin user created: username=admin, password=admin123');
  console.log('⚠️  IMPORTANT: Change the password after first login!');
}

createAdmin().catch(console.error);
"
```

---

## 🔄 Step 8: Monitoring & Maintenance

### 8.1 PM2 Monitoring
```bash
# View running processes
pm2 status

# View logs
pm2 logs

# Restart application
pm2 restart driver-management-api

# Stop application
pm2 stop driver-management-api
```

### 8.2 Set Up Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 8.3 Backup Script
```bash
nano /var/www/driver-management/backup.sh
```

Add the following content:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/driver-management"
DB_PATH="/var/www/driver-management/server/database.sqlite"
UPLOADS_DIR="/var/www/driver-management/server/uploads"

mkdir -p $BACKUP_DIR

# Backup database
cp $DB_PATH $BACKUP_DIR/database_$DATE.sqlite

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz $UPLOADS_DIR

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sqlite" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make it executable and set up cron job:
```bash
chmod +x /var/www/driver-management/backup.sh

# Add to crontab (daily backup at 2 AM)
crontab -e
# Add this line:
0 2 * * * /var/www/driver-management/backup.sh
```

---

## 🚀 Step 9: Final Steps

### 9.1 Test the Deployment
1. Open your browser and go to `http://your-domain.com` or `http://your-vps-ip`
2. You should see the Driver Management System homepage
3. Try logging in with `admin` / `admin123`
4. Test API endpoints by checking the dashboard

### 9.2 DNS Configuration (If using domain)
Point your domain's A record to your VPS IP address:
```
Type: A
Name: @
Value: your-vps-ip-address
TTL: 3600
```

### 9.3 Update Application
To update the application in the future:
```bash
cd /var/www/driver-management
git pull origin main  # if using git
cd client && npm run build
cd ../server && npm run build
pm2 restart driver-management-api
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check PM2 logs
pm2 logs driver-management-api

# Check if port is in use
sudo netstat -tulpn | grep :3001

# Restart PM2
pm2 restart driver-management-api
```

#### 2. Nginx 502 Bad Gateway
```bash
# Check if backend is running
pm2 status

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test nginx configuration
sudo nginx -t
```

#### 3. Database Issues
```bash
# Check database file permissions
ls -la /var/www/driver-management/server/database.sqlite

# Fix permissions if needed
sudo chown $USER:$USER /var/www/driver-management/server/database.sqlite
```

#### 4. SSL Certificate Issues
```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

---

## 📊 Performance Optimization

### 1. Enable Gzip Compression in Nginx
Add to your nginx configuration:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

### 2. Database Optimization
```bash
# Add database indexes (if needed)
sqlite3 /var/www/driver-management/server/database.sqlite "
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_warnings_driver_id ON warnings(driver_id);
CREATE INDEX IF NOT EXISTS idx_holiday_requests_status ON holiday_requests(status);
"
```

### 3. PM2 Cluster Mode (for multiple CPU cores)
Update ecosystem.config.js:
```javascript
instances: 'max',  // Use all CPU cores
exec_mode: 'cluster'
```

---

## 🛡️ Security Checklist

- [ ] Change default admin password
- [ ] Set up SSL certificate
- [ ] Configure firewall (UFW)
- [ ] Use strong JWT secret
- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Set up fail2ban (optional)
- [ ] Regular backups
- [ ] Use non-root user for application
- [ ] Secure database file permissions

---

## 📞 Support

If you encounter issues during deployment:
1. Check the application logs: `pm2 logs`
2. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify all services are running: `pm2 status` and `sudo systemctl status nginx`
4. Test API endpoints directly: `curl http://localhost:3001/api/drivers`

---

**Last Updated**: August 28, 2025
**Deployment Guide Version**: 1.0
**Compatible with**: Driver Management System v1.0
