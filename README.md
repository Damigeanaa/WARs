# Driver Management System

A premium, modern web application for managing driver warnings and holiday bookings.

## Features

- 🚗 Driver Warning Management
- 🏖️ Holiday Booking System
- 📊 Analytics Dashboard
- 👥 User Management
- 📱 Responsive Design
- 🎨 Modern UI/UX

## Requirements

- **Node.js**: v22.5.4 LTS or newer
- **npm**: v10.0.0 or newer
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js 22.x, Express, TypeScript
- **Database**: SQLite (upgradeable to PostgreSQL)
- **UI**: shadcn/ui components

## Quick Start

### Prerequisites
Make sure you have Node.js 22.x installed:
```bash
node --version  # Should show v22.x.x
npm --version   # Should show v10.x.x or newer
```

### Installation
1. Install dependencies:
```bash
npm run install:all
```

2. Start development servers:
```bash
# Standard mode
npm run dev

# Quiet mode (suppress warnings)
npm run dev:quiet

# Or use the helper scripts
# Windows: .\dev.bat
# Linux/macOS: ./dev.sh
```

3. Open your browser:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Admin Login**: `admin` / `admin123`

### Available Scripts
```bash
npm run dev          # Start both client and server
npm run dev:quiet    # Start with suppressed warnings
npm run build        # Build for production
npm run start        # Start production server
npm run clean        # Clean all build files
npm run update:deps  # Update all dependencies
```

3. Open your browser to `http://localhost:5173`

## Project Structure

```
├── client/          # React frontend
├── server/          # Node.js backend
├── shared/          # Shared types and utilities
└── docs/           # Documentation
```

## Development

- Frontend runs on `http://localhost:5173`
- Backend API runs on `http://localhost:3001`
- API endpoints available at `http://localhost:3001/api`

## License

MIT
