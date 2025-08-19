# Vercel Deployment Guide (With Spotify API Support)

This guide shows you how to deploy Vibesona on **Vercel** with full Spotify API functionality - **no VPS required**!

## ✅ **Why Vercel is Perfect for This**

- **Free Serverless Functions** - API routes work automatically
- **Spotify API Support** - Full backend functionality
- **No VPS Required** - Completely serverless
- **Automatic HTTPS** - SSL included
- **Global CDN** - Fast loading worldwide
- **Easy Deployment** - Connect GitHub and deploy

## 🚀 **Quick Deployment (10 Minutes)**

### **Step 1: Push to GitHub**
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial Vibesona commit"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/vibesona.git
git push -u origin main
```

### **Step 2: Deploy on Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your `vibesona` repository
5. Add environment variables (see below)
6. Click "Deploy"

### **Step 3: Environment Variables**
In Vercel dashboard, add these environment variables:

```env
# Database (Vercel uses PostgreSQL)
DATABASE_URL="postgresql://..."

# Spotify API
SPOTIFY_CLIENT_ID="your_spotify_client_id"
SPOTIFY_CLIENT_SECRET="your_spotify_client_secret"

# NextAuth
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your_secret_key"

# Node Environment
NODE_ENV="production"
```

## 🔧 **Alternative: Hostinger with External API**

If you prefer Hostinger, we can use external API services:

### **Option A: Use Supabase for Database**
```env
DATABASE_URL="postgresql://supabase_connection_string"
```

### **Option B: Use External API Proxy**
Create a simple API proxy service (like Cloudflare Workers) for Spotify calls.

## 📁 **Project Structure for Vercel**

```
📁 vibesona/
├── 📁 src/
│   ├── 📁 app/
│   │   ├── 📁 api/           # API routes (Spotify, etc.)
│   │   ├── 📁 submissions/   # Pages
│   │   ├── 📁 login/         # Pages
│   │   └── 📄 page.tsx       # Main page
│   └── 📁 components/        # React components
├── 📁 public/                # Static assets
├── 📄 package.json           # Dependencies
├── 📄 next.config.ts         # Next.js config
└── 📄 vercel.json            # Vercel config (optional)
```

## 🌐 **Vercel Configuration**

Create `vercel.json` for custom settings:

```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

## ✅ **What Works on Vercel**

- ✅ **All Pages** - Landing, Login, Submissions, Studio
- ✅ **Spotify API** - Full integration with serverless functions
- ✅ **Database** - PostgreSQL via Vercel Postgres or external
- ✅ **Authentication** - NextAuth.js with serverless
- ✅ **Form Submissions** - All forms work with API routes
- ✅ **Real-time Data** - Live submissions and updates

## 🎵 **Spotify API Setup**

### **1. Get Spotify Credentials**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Get `CLIENT_ID` and `CLIENT_SECRET`
4. Add redirect URI: `https://your-app.vercel.app/api/auth/callback/spotify`

### **2. Add to Vercel Environment Variables**
```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

## 🚀 **Deployment Commands**

### **Local Testing**
```bash
npm run dev
```

### **Build for Production**
```bash
npm run build
```

### **Deploy to Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or deploy to production
vercel --prod
```

## 📱 **Mobile & Performance**

- ✅ **Responsive Design** - Works on all devices
- ✅ **Fast Loading** - Global CDN
- ✅ **SEO Optimized** - Static generation
- ✅ **PWA Ready** - Can be installed as app

## 🔄 **Automatic Deployments**

Once set up, Vercel automatically deploys when you:
- Push to GitHub main branch
- Create pull requests
- Make changes in Vercel dashboard

## 💰 **Cost**

- **Free Tier**: 100GB bandwidth, 100 serverless function executions
- **Pro Plan**: $20/month for more usage
- **Enterprise**: Custom pricing

## ✅ **Verification Checklist**

After deployment:
- [ ] Main page loads at your Vercel URL
- [ ] Spotify track loading works
- [ ] Submissions dashboard shows data
- [ ] Login/authentication works
- [ ] All API routes respond correctly
- [ ] Mobile responsive design works

## 🎉 **You're Done!**

Your Vibesona application is now live with full Spotify API functionality on Vercel - **no VPS required**!

**Benefits:**
- 🚀 **Serverless** - No server management
- 🎵 **Full Spotify Integration** - API calls work perfectly
- 🌍 **Global CDN** - Fast loading worldwide
- 🔒 **Automatic HTTPS** - Secure by default
- 📱 **Mobile Optimized** - Works on all devices

**Total deployment time: 10 minutes** 🚀
