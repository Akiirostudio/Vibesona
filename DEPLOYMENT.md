# Hostinger Deployment Guide (No VPS Required)

This guide will help you deploy Vibesona on Hostinger's shared hosting without requiring a VPS.

## ✅ **Why This Works on Hostinger Shared Hosting**

- **SQLite Database**: Uses file-based SQLite instead of MySQL/PostgreSQL
- **Static Assets**: All images, CSS, and JS are pre-built and static
- **API Routes**: Next.js API routes work on shared hosting
- **No Server Processes**: No need for PM2, Docker, or complex server management

## 🚀 **Step-by-Step Deployment**

### 1. **Prepare Your Local Build**

```bash
# Build the application for production
npm run build

# This creates the following directories:
# - .next/ (optimized build files)
# - public/ (static assets)
# - prisma/ (database schema)
```

### 2. **Files to Upload to Hostinger**

Upload these files/folders to your Hostinger hosting:

```
📁 vibesona/
├── 📁 .next/           # Production build files
├── 📁 public/          # Static assets (images, etc.)
├── 📁 prisma/          # Database schema
├── 📁 src/             # Source code (for API routes)
├── 📄 package.json     # Dependencies
├── 📄 package-lock.json
├── 📄 next.config.ts   # Next.js configuration
├── 📄 .env             # Environment variables
└── 📄 README.md
```

### 3. **Hostinger Setup**

#### **A. Create a New Domain/Subdomain**
- Go to your Hostinger control panel
- Create a new domain or subdomain (e.g., `vibesona.yourdomain.com`)

#### **B. Set Up Node.js Hosting**
- In Hostinger control panel, go to "Websites" → "Node.js"
- Create a new Node.js project
- Set the Node.js version to **18.x** or higher
- Set the startup file to: `server.js`

### 4. **Create Production Server File**

Create a `server.js` file in your project root:

```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Prepare the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
```

### 5. **Environment Variables**

Create a `.env` file on Hostinger with:

```env
# Database (SQLite file will be created automatically)
DATABASE_URL="file:./vibesona.db"

# Spotify API (get from Spotify Developer Dashboard)
SPOTIFY_CLIENT_ID="your_spotify_client_id"
SPOTIFY_CLIENT_SECRET="your_spotify_client_secret"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your_secret_key_here"

# Node Environment
NODE_ENV="production"
```

### 6. **Install Dependencies on Hostinger**

Via Hostinger's SSH access or file manager:

```bash
# Navigate to your project directory
cd /home/username/public_html/vibesona

# Install production dependencies
npm install --production

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed the database
npm run seed
```

### 7. **Start the Application**

In Hostinger's Node.js panel:
- Set the startup command to: `node server.js`
- Set the Node.js version to 18.x or higher
- Click "Start" to launch your application

## 🔧 **Alternative: Static Export (Even Simpler)**

If you want an even simpler deployment, you can create a static export:

### 1. **Modify next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Disable API routes for static export
  experimental: {
    appDir: true,
  }
};

export default nextConfig;
```

### 2. **Build Static Version**

```bash
npm run build
```

### 3. **Upload to Hostinger**

Upload the `out/` folder contents to your Hostinger public_html directory.

## 📁 **File Structure After Deployment**

```
📁 public_html/
├── 📁 vibesona/
│   ├── 📁 .next/
│   ├── 📁 public/
│   ├── 📁 prisma/
│   ├── 📁 src/
│   ├── 📄 server.js
│   ├── 📄 package.json
│   ├── 📄 .env
│   └── 📄 vibesona.db (created automatically)
└── 📄 index.html (if using static export)
```

## 🌐 **Domain Configuration**

### **Option A: Subdomain**
- Create subdomain: `vibesona.yourdomain.com`
- Point to your Node.js application directory

### **Option B: Subdirectory**
- Access via: `yourdomain.com/vibesona`
- Upload files to `/public_html/vibesona/`

## ✅ **Verification Checklist**

After deployment, verify:

- [ ] Application loads at your domain
- [ ] All pages work (/, /submissions, /login)
- [ ] Database is working (submissions show up)
- [ ] Spotify API integration works (with proper credentials)
- [ ] Authentication works (Firebase)
- [ ] All static assets load (images, CSS, JS)

## 🚨 **Important Notes**

1. **Database**: SQLite file will be created automatically in your project directory
2. **Environment Variables**: Make sure to set all required env vars on Hostinger
3. **Node.js Version**: Use Node.js 18+ for best compatibility
4. **File Permissions**: Ensure the application can read/write the database file
5. **SSL**: Enable SSL certificate for secure HTTPS access

## 🆘 **Troubleshooting**

### **Common Issues:**

1. **"Module not found" errors**
   - Run `npm install` on Hostinger
   - Check Node.js version compatibility

2. **Database errors**
   - Ensure SQLite is supported on your hosting plan
   - Check file permissions for database file

3. **API routes not working**
   - Verify server.js is properly configured
   - Check environment variables

4. **Static assets not loading**
   - Ensure public/ folder is uploaded
   - Check file paths in next.config.ts

## 📞 **Support**

If you encounter issues:
1. Check Hostinger's Node.js hosting documentation
2. Verify all environment variables are set
3. Check the application logs in Hostinger's control panel

Your Vibesona application is now ready for production deployment on Hostinger! 🎵✨
