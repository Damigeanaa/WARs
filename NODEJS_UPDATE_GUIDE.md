# 🚀 Node.js Update Guide

This guide helps you update your Node.js installation to the latest LTS version (22.x) for the Driver Management System.

## Why Update to Node.js 22.x?

- **Performance**: Up to 20% faster execution
- **Security**: Latest security patches and improvements
- **ESM Support**: Better ES Module support
- **New Features**: Built-in test runner, improved fetch API
- **Compatibility**: Full compatibility with modern npm packages

## Current Requirements

- **Node.js**: v22.5.4 LTS or newer
- **npm**: v10.0.0 or newer

## Update Methods

### 🖥️ Windows

#### Method 1: Official Installer (Recommended)
1. Download Node.js 22.x LTS from [nodejs.org](https://nodejs.org/en/download/)
2. Run the installer as Administrator
3. Restart your terminal/PowerShell
4. Verify: `node --version`

#### Method 2: Package Managers
```powershell
# Using Chocolatey
choco install nodejs --version=22.5.4

# Using winget
winget install OpenJS.NodeJS.LTS

# Using scoop
scoop install nodejs-lts
```

#### Method 3: Automated Script
```powershell
# Run the Windows update script
.\update-nodejs.bat
```

### 🐧 Linux (Ubuntu/Debian)

#### Method 1: NodeSource Repository (Recommended)
```bash
# Remove old Node.js
sudo apt-get remove nodejs npm

# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Method 2: Using snap
```bash
sudo snap install node --classic --channel=22/stable
```

#### Method 3: Automated Script
```bash
# Make script executable and run
chmod +x update-nodejs.sh
./update-nodejs.sh
```

### 🍎 macOS

#### Method 1: Official Installer
1. Download from [nodejs.org](https://nodejs.org/en/download/)
2. Run the .pkg installer
3. Restart Terminal
4. Verify: `node --version`

#### Method 2: Homebrew (Recommended)
```bash
# Update Homebrew
brew update

# Install Node.js 22
brew install node@22
brew link node@22

# Verify installation
node --version
npm --version
```

#### Method 3: Using MacPorts
```bash
sudo port install nodejs22
```

### 🔧 Using Node Version Manager (NVM)

#### Install/Update NVM
```bash
# Linux/macOS
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Windows (nvm-windows)
# Download from: https://github.com/coreybutler/nvm-windows/releases
```

#### Use NVM to install Node.js 22
```bash
# Install latest Node.js 22.x
nvm install 22.5.4
nvm use 22.5.4
nvm alias default 22.5.4

# Verify
node --version
```

## Post-Update Steps

### 1. Update Global Packages
```bash
# Update npm to latest
npm install -g npm@latest

# Update PM2 (if used)
npm install -g pm2@latest

# Update other global packages
npm update -g
```

### 2. Update Project Dependencies
```bash
# Navigate to project root
cd /path/to/driver-management

# Update server dependencies
cd server
npm update
npm audit fix

# Update client dependencies
cd ../client
npm update
npm audit fix
```

### 3. Rebuild the Application
```bash
# Build server
cd server
npm run build

# Build client
cd ../client
npm run build
```

### 4. Restart Services (Production)
```bash
# If using PM2
pm2 restart all

# If using systemd
sudo systemctl restart your-app-service

# If using Docker
docker-compose restart
```

## Verification

### Check Versions
```bash
node --version    # Should show v22.x.x
npm --version     # Should show v10.x.x+
```

### Test Application
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

### Run Tests (if available)
```bash
npm test
```

## Troubleshooting

### Common Issues

#### 1. Permission Errors (Linux/macOS)
```bash
# Fix npm permissions
sudo chown -R $USER:$USER ~/.npm
sudo chown -R $USER:$USER /usr/local/lib/node_modules
```

#### 2. Path Issues (Windows)
- Restart Command Prompt/PowerShell as Administrator
- Check PATH environment variable includes Node.js installation directory
- Reinstall Node.js if path issues persist

#### 3. Module Compatibility
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 4. Native Module Rebuild
```bash
# Rebuild native modules after Node.js update
npm rebuild

# Or reinstall packages with native dependencies
npm uninstall sharp sqlite3
npm install sharp sqlite3
```

### Version Conflicts
If you encounter version conflicts:

1. **Check .nvmrc file**: The project includes `.nvmrc` files specifying Node.js 22.5.4
2. **Use correct version**: Run `nvm use` in project directories
3. **Clear caches**: Delete `node_modules` and reinstall dependencies

## Benefits After Update

✅ **Performance**: Faster application startup and execution  
✅ **Security**: Latest security patches applied  
✅ **Compatibility**: Support for latest npm packages  
✅ **Development**: Better debugging and development tools  
✅ **Future-proof**: Ready for upcoming features and improvements  

## Rollback (If Needed)

If you need to rollback to a previous version:

### Using NVM
```bash
nvm install 20.10.0  # Previous LTS
nvm use 20.10.0
nvm alias default 20.10.0
```

### Manual Installation
1. Uninstall current Node.js
2. Download previous version from [nodejs.org](https://nodejs.org/en/download/releases/)
3. Install and verify

## Support

If you encounter issues during the update:

1. **Check logs**: Review error messages carefully
2. **Clear caches**: `npm cache clean --force`
3. **Reinstall dependencies**: Delete `node_modules` and run `npm install`
4. **Check compatibility**: Ensure all packages support Node.js 22.x
5. **Community help**: Search Node.js GitHub issues or Stack Overflow

---

**Last Updated**: August 28, 2025  
**Node.js Version**: 22.5.4 LTS  
**Compatibility**: Driver Management System v1.0+
