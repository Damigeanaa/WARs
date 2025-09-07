#!/bin/bash

echo "🔧 Quick Fix and Redeploy"
echo "========================="

# Navigate to application directory
cd /var/www/driver-management

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Stop PM2 processes
echo "🛑 Stopping PM2 processes..."
pm2 stop all

# Remove node_modules and reinstall
echo "🧹 Cleaning and reinstalling dependencies..."
cd server
rm -rf node_modules
npm install

# Clean and rebuild
echo "🔨 Rebuilding application..."
npm run build

# Restart PM2 with the correct command
echo "🚀 Starting PM2..."
cd ..
pm2 delete all 2>/dev/null || true
pm2 start server/dist/index.js --name "driver-management-api" --instances 1
pm2 save

# Check status
echo "📊 Final status check..."
sleep 3
pm2 status
echo ""
echo "🌐 Testing API health..."
curl -s http://localhost:3001/api/health || echo "❌ API not responding"

echo ""
echo "✅ Fix deployment complete!"
echo "Check: http://driverconnected.de"
