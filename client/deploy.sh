#!/bin/bash

# Deploy to Vercel script

echo "🚀 Deploying to Vercel..."

# Build the project
echo "📦 Building project..."
npm run build

# Deploy using Vercel CLI
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
