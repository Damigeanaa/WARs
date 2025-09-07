#!/bin/bash

echo "🔍 VPS Diagnostic Script"
echo "========================"

# Check if PM2 is running
echo "1. PM2 Status:"
pm2 status

echo ""
echo "2. PM2 Logs (last 20 lines):"
pm2 logs --lines 20

echo ""
echo "3. Port Status:"
echo "Port 3001 (API):"
ss -tulpn | grep :3001
echo "Port 80 (HTTP):"
ss -tulpn | grep :80
echo "Port 443 (HTTPS):"
ss -tulpn | grep :443

echo ""
echo "4. Nginx Status:"
sudo systemctl status nginx --no-pager

echo ""
echo "5. Nginx Error Logs:"
sudo tail -10 /var/log/nginx/error.log

echo ""
echo "6. Application Directory:"
ls -la /var/www/driver-management/

echo ""
echo "7. Build Status:"
echo "Client build:"
ls -la /var/www/driver-management/client/dist/ | head -5
echo "Server build:"
ls -la /var/www/driver-management/server/dist/ | head -5

echo ""
echo "8. Environment File:"
if [ -f "/var/www/driver-management/.env" ]; then
    echo "✅ .env exists"
    echo "NODE_ENV: $(grep NODE_ENV /var/www/driver-management/.env)"
else
    echo "❌ .env missing"
fi

echo ""
echo "9. Database Status:"
if [ -f "/var/www/driver-management/server/database.db" ]; then
    echo "✅ Database exists ($(du -h /var/www/driver-management/server/database.db))"
else
    echo "❌ Database missing"
fi

echo ""
echo "10. Server IP:"
curl -s ipinfo.io/ip
