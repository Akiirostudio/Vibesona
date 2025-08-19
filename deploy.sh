#!/bin/bash

echo "🚀 Vibesona Deployment Script for Hostinger"
echo "============================================="

# Build the application
echo "📦 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Create deployment directory
echo "📁 Creating deployment package..."
mkdir -p deployment/vibesona

# Copy necessary files
echo "📋 Copying files..."
cp -r .next deployment/vibesona/
cp -r public deployment/vibesona/
cp -r prisma deployment/vibesona/
cp -r src deployment/vibesona/
cp package.json deployment/vibesona/
cp package-lock.json deployment/vibesona/
cp next.config.ts deployment/vibesona/
cp server.js deployment/vibesona/
cp README.md deployment/vibesona/

# Create .env template
echo "🔧 Creating .env template..."
cat > deployment/vibesona/.env.template << EOF
# Database (SQLite file will be created automatically)
DATABASE_URL="file:./vibesona.db"

# Spotify API (get from Spotify Developer Dashboard)
SPOTIFY_CLIENT_ID="your_spotify_client_id_here"
SPOTIFY_CLIENT_SECRET="your_spotify_client_secret_here"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your_secret_key_here"

# Node Environment
NODE_ENV="production"
EOF

# Create deployment instructions
echo "📝 Creating deployment instructions..."
cat > deployment/DEPLOYMENT_INSTRUCTIONS.txt << EOF
Vibesona Hostinger Deployment Instructions
==========================================

1. Upload the 'vibesona' folder to your Hostinger hosting
2. Rename .env.template to .env and fill in your credentials
3. In Hostinger Node.js panel:
   - Set startup file to: server.js
   - Set Node.js version to 18.x or higher
   - Run: npm install --production
   - Run: npx prisma generate
   - Run: npx prisma db push
   - Run: npm run seed
   - Start the application

4. Your app will be available at your domain!

For detailed instructions, see DEPLOYMENT.md
EOF

echo "✅ Deployment package created in 'deployment' folder!"
echo "📁 Upload the 'vibesona' folder to your Hostinger hosting"
echo "📖 See DEPLOYMENT_INSTRUCTIONS.txt for quick setup"
echo "📚 See DEPLOYMENT.md for detailed instructions"
