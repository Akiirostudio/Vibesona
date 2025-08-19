#!/bin/bash

echo "🚀 Vibesona Vercel Deployment (With Spotify API)"
echo "================================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "🌐 Deploying to Vercel..."
echo "📝 You'll be prompted to:"
echo "   1. Login to Vercel (if not already logged in)"
echo "   2. Link to existing project or create new one"
echo "   3. Set environment variables"
echo ""

# Deploy to Vercel
vercel --prod

echo ""
echo "🎉 Deployment complete!"
echo "📖 See VERCEL_DEPLOYMENT.md for detailed instructions"
echo "🎵 Don't forget to add your Spotify API credentials in Vercel dashboard!"
