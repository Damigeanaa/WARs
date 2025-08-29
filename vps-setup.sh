#!/bin/bash

# 🚀 Driver Management System - Quick VPS Setup Script
# This script automates the initial setup of the application on a Linux VPS

set -e

echo "🚀 Driver Management System - VPS Deployment Script"
echo "=================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Get user input
read -p "Enter your GitHub repository URL (e.g., https://github.com/username/repo.git): " REPO_URL
read -p "Enter your domain name (or press Enter to skip SSL setup): " DOMAIN_NAME

print_status "Starting VPS setup..."

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
sudo apt install -y curl wget git unzip software-properties-common build-essential python3 python3-pip

# Install Node.js 22.x
print_status "Installing Node.js 22.x..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node --version)
print_success "Node.js installed: $NODE_VERSION"

# Install PM2
print_status "Installing PM2 process manager..."
sudo npm install -g pm2

# Install Nginx
print_status "Installing Nginx..."
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Configure firewall
print_status "Configuring firewall..."
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Clone repository
print_status "Cloning repository from GitHub..."
cd /var/www
sudo git clone "$REPO_URL" driver-management
sudo chown -R $USER:$USER /var/www/driver-management
cd driver-management

# Install dependencies
print_status "Installing application dependencies..."
npm run install:all

# Create environment file
print_status "Creating environment configuration..."
cp .env.example .env

# Update environment for production
sed -i 's/NODE_ENV=development/NODE_ENV=production/' .env
sed -i 's/HOST=localhost/HOST=0.0.0.0/' .env
sed -i 's|DATABASE_PATH=./database.db|DATABASE_PATH=/var/www/driver-management/server/database.db|' .env

if [ ! -z "$DOMAIN_NAME" ]; then
    sed -i "s|CORS_ORIGIN=http://localhost:5173|CORS_ORIGIN=https://$DOMAIN_NAME|" .env
else
    sed -i "s|CORS_ORIGIN=http://localhost:5173|CORS_ORIGIN=*|" .env
fi

print_warning "Please update the JWT_SECRET in .env file for production security!"

# Build application
print_status "Building application..."
npm run build

# Create PM2 ecosystem file
print_status "Creating PM2 configuration..."
cat > ecosystem.config.js << EOF
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
EOF

# Create logs directory
mkdir -p logs

# Start application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# Create Nginx configuration
print_status "Configuring Nginx..."
if [ ! -z "$DOMAIN_NAME" ]; then
    SERVER_NAME="$DOMAIN_NAME www.$DOMAIN_NAME"
else
    SERVER_NAME="_"
fi

sudo tee /etc/nginx/sites-available/driver-management > /dev/null << EOF
server {
    listen 80;
    server_name $SERVER_NAME;

    # Client files (React build)
    location / {
        root /var/www/driver-management/client/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
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
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
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
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/driver-management /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx

# Install SSL certificate if domain provided
if [ ! -z "$DOMAIN_NAME" ]; then
    print_status "Installing SSL certificate..."
    sudo apt install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d "$DOMAIN_NAME" -d "www.$DOMAIN_NAME" --non-interactive --agree-tos --register-unsafely-without-email
fi

# Create utility scripts
print_status "Creating utility scripts..."

# Create deployment script
cat > deploy.sh << 'EOF'
#!/bin/bash
set -e
echo "🚀 Starting deployment..."
cd /var/www/driver-management
git pull origin main
npm run install:all
npm run build
pm2 restart driver-management-api
sudo systemctl reload nginx
echo "✅ Deployment completed!"
pm2 status
EOF
chmod +x deploy.sh

# Create update script
cat > update.sh << 'EOF'
#!/bin/bash
echo "🔄 Quick update..."
cd /var/www/driver-management
git pull origin main
npm run build
pm2 restart driver-management-api
echo "✅ Update completed!"
EOF
chmod +x update.sh

# Create backup script
cat > backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/driver-management"
DATE=$(date +%Y%m%d_%H%M%S)
DB_PATH="/var/www/driver-management/server/database.db"
sudo mkdir -p $BACKUP_DIR
sudo cp $DB_PATH $BACKUP_DIR/database_backup_$DATE.db
sudo find $BACKUP_DIR -name "database_backup_*.db" -mtime +30 -delete
echo "✅ Database backup completed: database_backup_$DATE.db"
EOF
chmod +x backup-db.sh

print_success "🎉 VPS setup completed successfully!"
echo ""
echo "=================================================="
echo "📋 DEPLOYMENT SUMMARY"
echo "=================================================="
echo "✅ System packages updated"
echo "✅ Node.js 22.x installed"
echo "✅ PM2 process manager installed"
echo "✅ Nginx web server configured"
echo "✅ Firewall configured"
echo "✅ Application cloned and built"
echo "✅ PM2 application started"
echo "✅ Nginx configured for application"
if [ ! -z "$DOMAIN_NAME" ]; then
    echo "✅ SSL certificate installed"
fi
echo "✅ Utility scripts created"
echo ""
echo "=================================================="
echo "🌐 ACCESS INFORMATION"
echo "=================================================="
if [ ! -z "$DOMAIN_NAME" ]; then
    echo "🔗 Application URL: https://$DOMAIN_NAME"
else
    SERVER_IP=$(curl -s ipinfo.io/ip)
    echo "🔗 Application URL: http://$SERVER_IP"
fi
echo "👤 Default Login: admin / admin123"
echo "⚠️  IMPORTANT: Change default password after first login!"
echo ""
echo "=================================================="
echo "🔧 USEFUL COMMANDS"
echo "=================================================="
echo "📊 Check application: pm2 status"
echo "📝 View logs: pm2 logs driver-management-api"
echo "🔄 Deploy updates: ./deploy.sh"
echo "⚡ Quick update: ./update.sh"
echo "💾 Backup database: ./backup-db.sh"
echo ""
echo "=================================================="
echo "⚠️  NEXT STEPS"
echo "=================================================="
echo "1. Update JWT_SECRET in /var/www/driver-management/.env"
echo "2. Login and change default admin password"
echo "3. Configure domain DNS (if using domain)"
echo "4. Set up automated backups (cron job)"
echo "5. Monitor application logs"
echo ""
print_success "Setup completed! Your Driver Management System is now running!"
