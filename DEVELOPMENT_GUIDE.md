# Development Scripts and Commands

## 🚀 Quick Commands

### Development
```bash
# Start both client and server in development mode
npm run dev

# Start only client (React)
npm run dev:client

# Start only server (Node.js)
npm run dev:server
```

### Building
```bash
# Build both client and server
npm run build

# Build only client
npm run build:client

# Build only server
npm run build:server
```

### Testing
```bash
# Run all tests
npm test

# Test only client
npm run test:client

# Test only server
npm run test:server
```

### Maintenance
```bash
# Install all dependencies
npm run install:all

# Update all dependencies
npm run update:deps

# Clean all build files and node_modules
npm run clean

# Start production server
npm start
```

## 🔧 Development Tips

### Hot Reloading
- **Client**: Vite provides instant hot reload for React components
- **Server**: tsx watch provides automatic restart on file changes

### Debugging
```bash
# Server with debugging
cd server && npm run dev -- --inspect

# View logs
# Client: Check browser console
# Server: Check terminal output
```

### Port Configuration
- **Client**: http://localhost:5173
- **Server**: http://localhost:3001
- **API**: http://localhost:3001/api

### Environment Variables
Create `.env` files in respective directories:
- `server/.env` - Backend configuration
- `client/.env.local` - Frontend configuration

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill processes on specific ports
npx kill-port 3001 5173

# Or find and kill manually
netstat -ano | findstr :3001
taskkill /PID <process-id> /F
```

#### Dependency Issues
```bash
# Clear cache and reinstall
npm run clean
npm run install:all
```

#### Build Errors
```bash
# Clear build cache
npm run clean
npm run build
```

### Performance Tips

#### Memory Usage
```bash
# Increase Node.js memory limit if needed
set NODE_OPTIONS=--max-old-space-size=4096
npm run dev
```

#### Fast Refresh
The Vite dev server supports fast refresh for React components. Make sure to:
- Use named exports for components
- Avoid anonymous default exports
- Keep state in proper React components

## 📱 Testing on Different Devices

### Local Network Testing
```bash
# Expose Vite dev server to network
npm run dev:client -- --host

# Access from other devices
http://YOUR_LOCAL_IP:5173
```

### Mobile Testing
- Use browser dev tools device simulation
- Access via local network IP
- Test touch interactions and responsive design

## 🔍 Monitoring

### Real-time Logs
```bash
# Server logs
cd server && npm run dev

# Client build logs
cd client && npm run dev
```

### Performance Monitoring
- Use browser DevTools for client performance
- Check Network tab for API calls
- Monitor bundle size with `npm run build`

---

**Last Updated**: August 28, 2025  
**Node.js**: 22.5.4 LTS  
**Development Mode**: Optimized for fast iteration
