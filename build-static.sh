#!/bin/bash

echo "🚀 Building Static Vibesona for Hostinger..."
echo "============================================="

# Backup API routes
echo "📦 Backing up API routes..."
mkdir -p api_backup
mv src/app/api api_backup/ 2>/dev/null || true

# Build static version
echo "🔨 Building static export..."
npm run build

# Restore API routes
echo "🔄 Restoring API routes..."
mv api_backup/api src/app/ 2>/dev/null || true

echo ""
echo "✅ Static build complete!"
echo "📁 Upload ALL contents of 'out/' folder to your Hostinger public_html/"
echo "🌐 Your site will be live at your domain!"
echo ""
echo "📖 See STATIC_DEPLOYMENT.md for detailed instructions"
