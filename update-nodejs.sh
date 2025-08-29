#!/bin/bash

# Node.js Update Script for Driver Management System
# This script updates Node.js to the latest LTS version

echo "🚀 Updating Node.js to latest LTS version..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on Linux/macOS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    print_status "Detected Linux system"
    
    # Method 1: Using NodeSource repository (recommended for Ubuntu/Debian)
    print_status "Installing Node.js 22.x LTS via NodeSource..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    print_status "Detected macOS system"
    
    # Check if Homebrew is installed
    if command -v brew &> /dev/null; then
        print_status "Installing Node.js via Homebrew..."
        brew install node@22
        brew link node@22
    else
        print_warning "Homebrew not found. Please install Node.js manually from https://nodejs.org/"
        exit 1
    fi
    
else
    print_warning "Unsupported operating system. Please install Node.js manually."
    print_warning "Download from: https://nodejs.org/en/download/"
    exit 1
fi

# Verify installation
print_status "Verifying Node.js installation..."
node_version=$(node --version)
npm_version=$(npm --version)

print_status "Node.js version: $node_version"
print_status "npm version: $npm_version"

# Check if version is correct
if [[ $node_version == v22* ]]; then
    print_status "✅ Node.js 22.x successfully installed!"
else
    print_error "❌ Node.js version is not 22.x. Please check the installation."
    exit 1
fi

# Update npm to latest version
print_status "Updating npm to latest version..."
sudo npm install -g npm@latest

# Install or update PM2
print_status "Installing/updating PM2..."
sudo npm install -g pm2@latest

# Update project dependencies
print_status "Updating project dependencies..."

if [ -f "server/package.json" ]; then
    print_status "Updating server dependencies..."
    cd server
    npm update
    cd ..
fi

if [ -f "client/package.json" ]; then
    print_status "Updating client dependencies..."
    cd client
    npm update
    cd ..
fi

print_status "✅ Node.js update completed successfully!"
print_status "Current versions:"
print_status "  Node.js: $(node --version)"
print_status "  npm: $(npm --version)"
print_status "  PM2: $(pm2 --version 2>/dev/null || echo 'Not installed')"

print_warning "⚠️  Remember to:"
print_warning "  1. Rebuild your application: npm run build"
print_warning "  2. Restart PM2 processes: pm2 restart all"
print_warning "  3. Test your application thoroughly"

echo ""
print_status "🎉 Node.js update script completed!"
